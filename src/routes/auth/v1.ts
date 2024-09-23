import { t } from "elysia";
import { Pool } from "pg";
import { randomBytes } from 'crypto';
import argon2 from 'argon2';
import { getUserByEmail, insertUser } from "../../database/user";

/*
At least 1 special character
At least 1 uppercase character
At least 1 lowercase character
At least 1 numeric character

TODO: Create unit test for regex
Note: current regex not working
*/
const passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$";

/*Formatting*/
const emailFormat = t.String({
	format: 'email',
	error: 'Invalid Email',
	pattern: '^[A-Za-z0-9]*@e.ntu.edu.sg$'
})

const passwordFormat = t.String({
	minLength: 10,
	maxLength: 64,
	error: "password requires minimum length of 10"
})

/*Misc*/
const generateSalt = (length = 16) => {
	return randomBytes(length).toString('hex'); // Convert the random bytes to a hexadecimal string
};

/*Implementation*/
const loginSchema = {
	response: { 
		200: t.String(), 
		500: t.String(),
	},
	detail: {
		summary: "Authenticate the user",
		description:
			"Performs a authentication for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
	body: t.Object({
		email: emailFormat,
		password: passwordFormat
	},
	{
		error: "Invalid request"
	})
};

async function loginHandler(pool: Pool, body: any): Promise<string> {
	//TODO: implement login logic
	const existing_acc = await getUserByEmail(pool, body.email);
	if (existing_acc === null){
		return "Account does not exist";
	}
	return "TEST";
}

const logoutSchema = {
	response: { 
		200: t.String(), 
		500: t.String() 
	},
	detail: {
		summary: "Logout the user",
		description:
			"Performs a logout for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
};

async function logoutHandler(): Promise<string> {
	//TODO: implement logout logic
	return "TEST";
}

const registerSchema = {
	response: { 
		200: t.String(), 
		500: t.String(),
		422: t.String(),
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
	async beforeHandle({ set, body }: { set: Response, body: any }) {
		if (body.email !== body.confirm_email) {
			return new Response('email does not match confirm email',
				{ status: 500 });
		} else if (body.password !== body.confirm_password) {
			return new Response('password does not match confirm password',
				{ status: 500 });
		}
	}
};

async function registerHandler(body: any, pool: Pool): Promise<string> {
	const existing_acc = await getUserByEmail(pool, body.email);
	if (existing_acc !== null){
		return "Account already exist";
	}
	const salt = generateSalt();
	const hash_pw = await argon2.hash(body.password + salt);
	const user_id = await insertUser(pool, body.email, hash_pw, salt);
	return String(user_id);
}

export const v1 = {
	login: {
		fn: loginHandler,
		schema: loginSchema,
	},
	logout: {
		fn: logoutHandler,
		schema: logoutSchema,
	},
	register: {
		fn: registerHandler,
		schema: registerSchema
	},
} as const;