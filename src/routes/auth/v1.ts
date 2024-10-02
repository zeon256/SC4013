import { Cookie, error, t } from "elysia";
import { Pool } from "pg";
import { randomBytes } from 'crypto';
import argon2 from 'argon2';
import { getUserByEmail, insertUser } from "../../database/user";
import { type ValueError } from '@sinclair/typebox/compiler';
import { verifyJWTMiddleware } from "./jwt";

/*
At least 1 special character
At least 1 uppercase character
At least 1 lowercase character
At least 1 numeric character

TODO: Create unit test for regex
*/
const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/gm;

type LoginResponse = {
	status: number;
	message: string;
};

const LoginResultSchema = t.Object({
	status: t.Number(),
	message: t.String()
});

/*Formatting*/
const emailFormat = t.String({
	format: 'email',
	error({errors} : {errors: ValueError[]}) : LoginResponse {
		return {
			status: 422,
			message: errors[0].message
		} as LoginResponse;
	},
	pattern: '^[A-Za-z0-9]*@e.ntu.edu.sg$'
})

const passwordFormat = t.String({
	minLength: 10,
	maxLength: 64,
	pattern: passwordRegex.source,
	error({errors} : {errors: ValueError[]}) : LoginResponse {
		return {
			status: 422,
			message: errors[0].message
		} as LoginResponse;
	}
})

const CookieSchema = t.Cookie({
	jwt_token: t.String({
		minLength: 10,
		error({errors} : {errors: ValueError[]}) : LoginResponse {
			return {
				status: 422,
				message: errors[0].message
			} as LoginResponse;
		}
	})
})

/*Misc*/
const generateSalt = (length = 16) => {
	return randomBytes(length).toString('hex'); // Convert the random bytes to a hexadecimal string
};

/*Implementation*/
const loginSchema = {
	response: { 
		200: LoginResultSchema, 
		500: t.String(),
		422: LoginResultSchema,
	},
	detail: {
		summary: "Authenticate the user",
		description:
			"Performs a authentication for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
	body: t.Object({
		email: emailFormat,
		password: passwordFormat
	})
};

async function loginHandler(
	pool: Pool, 
	body: any,
	jwt_token: Cookie<string | undefined>,
	jwt_obj: any
): Promise<any> {
	//TODO: implement login logic
	const existing_acc = await getUserByEmail(pool, body.email);
	if (existing_acc === null){
		return error(422, { 
			status: 422,
			message: "Account does not exist"
		} as LoginResponse);
	}
	try {
		const match = await argon2.verify(existing_acc.password, body.password + existing_acc.salt);
		if (!match){
			return { 
				status: 200,
				message: "Invalid email or password"
			} as LoginResponse;
		}
	} catch (errorMsg) {
		return error(500, { 
			status: 500,
			message: errorMsg
		} as LoginResponse);
	}
	jwt_token.set({
		value: await jwt_obj.sign({ email: existing_acc.email }),
		httpOnly: true,
		maxAge: 2 * 24 * 60 * 60, // 2 days
		path: '/',
	});
	return { 
		status: 200,
		message: "Success"
	} as LoginResponse;
}

const registerSchema = {
	response: { 
		200: LoginResultSchema, 
		500: t.String(),
		422: LoginResultSchema,
	},
	detail: {
		summary: "Register an account",
		description:
			"Register an account for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
	body: t.Object({
		email: emailFormat,
		confirm_email: emailFormat,
		password: passwordFormat,
		confirm_password: passwordFormat
	}),
	async beforeHandle({ set, body }: { set: Response, body: any }): Promise<any | void> {
		if (body.email !== body.confirm_email) {
			return error(422, {
				status: 422,
				message: 'Email does not match confirm email'
			} as LoginResponse);
		} else if (body.password !== body.confirm_password) {
			return error(422, {
				status: 422,
				message: 'Password does not match confirm password'
			} as LoginResponse);
		}
	}
};

async function registerHandler(
	pool: Pool, 
	body: any
): Promise<LoginResponse | any> {
	const existing_acc = await getUserByEmail(pool, body.email);
	if (existing_acc !== null)
	{
		return error(422, {
			status: 422,
			message: "Account already exist"
		} as LoginResponse);
	}
	const salt = generateSalt();
	const hash_pw = await argon2.hash(body.password + salt);
	const user_id = await insertUser(pool, body.email, hash_pw, salt);
	return {
		status: 422,
		message:`Success, Account Id ${user_id}`
	} as LoginResponse;
}

const logoutSchema = {
	response: { 
		200: LoginResultSchema, 
		500: t.String() 
	},
	detail: {
		summary: "Logout the user",
		description:
			"Performs a logout for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
	cooke: CookieSchema,
	beforeHandle: verifyJWTMiddleware
};

async function logoutHandler(
	jwt_token: Cookie<string>
): Promise<LoginResponse> {
	jwt_token.set({
		value: "",
		httpOnly: true,
		maxAge: 0,
	})
	return { 
		status: 200,
		message: "Success"
	} as LoginResponse;
}

export const v1 = {
	login: {
		fn: loginHandler,
		schema: loginSchema,
	},
	register: {
		fn: registerHandler,
		schema: registerSchema
	},
	logout: {
		fn: logoutHandler,
		schema: logoutSchema,
	}
} as const;