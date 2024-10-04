import { randomBytes } from "crypto";
import Elysia, {
	type Cookie,
	InternalServerError,
	NotFoundError,
	type Static,
	type StatusMap,
	t,
} from "elysia";
import type { Pool } from "pg";
import argon2 from "argon2";
import { getUserByEmail, insertUser } from "../../database/user";
import jwt, { type JWTPayloadSpec } from "@elysiajs/jwt";
import type { HTTPHeaders } from "elysia/dist/types";
import type { ElysiaCookie } from "elysia/dist/cookies";

type Jwt = {
	readonly sign: (
		morePaylad: { email: string } & JWTPayloadSpec,
	) => Promise<string>;
	readonly verify: (
		jwt?: string,
	) => Promise<false | ({ email: string } & JWTPayloadSpec)>;
};

type ElysiaSet = {
	headers: HTTPHeaders;
	status?: number | keyof StatusMap;
	redirect?: string;
	cookie?: Cookie<string | ElysiaCookie>;
};

export async function verifyJWTMiddleware({
	cookie: { jwt_token },
	set,
	jwt,
}: {
	cookie: { jwt_token: Cookie<string | undefined> };
	set: ElysiaSet;
	jwt: Jwt;
}) {
	const profile = await jwt.verify(jwt_token.value);
	if (!profile) {
		set.status = 401;
		return "Unauthorized";
	}
}

export class InvalidAccountCredentialsError extends Error {
	code = "FORBIDDEN";
	status = 401;

	constructor(message?: string) {
		super(message ?? "FORBIDDEN");
	}
}

export class AccountAlreadyExistError extends Error {
	code = "CONFLICT";
	status = 409;

	constructor(message?: string) {
		super(message ?? "CONFLICT");
	}
}

export class BadRequestError extends Error {
	code = "BAD_REQUEST";
	status = 400;

	constructor(message?: string) {
		super(message ?? "BAD_REQUEST");
	}
}

/*
At least 1 special character
At least 1 uppercase character
At least 1 lowercase character
At least 1 numeric character

TODO: Create unit test for regex
*/
const passwordRegex =
	/^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/gm;

type LoginResponse = { message: string };

const LoginResultSchema = t.Object({ message: t.String() });

/*Misc*/
const generateSalt = (length = 16) => {
	return randomBytes(length).toString("hex"); // Convert the random bytes to a hexadecimal string
};

const emailFormat = t.String({
	format: "email",
	pattern: "^[A-Za-z0-9]*@e.ntu.edu.sg$",
});

const passwordFormat = t.String({
	minLength: 10,
	maxLength: 64,
	pattern: passwordRegex.source,
});

const loginBody = t.Object({ email: emailFormat, password: passwordFormat });

const CookieSchema = t.Cookie({
	jwt_token: t.String({ minLength: 10 }),
});

export const loginSchema = {
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
	body: loginBody,
};

const registerBody = t.Object({
	email: emailFormat,
	confirm_email: emailFormat,
	password: passwordFormat,
	confirm_password: passwordFormat,
});

const registerSchema = {
	response: {
		200: LoginResultSchema,
		409: t.String(),
		400: t.String(),
		500: t.String(),
		422: LoginResultSchema,
	},
	detail: {
		summary: "Register an account",
		description:
			"Register an account for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
	body: registerBody,
};

const logoutSchema = {
	response: {
		200: LoginResultSchema,
		401: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Logout the user",
		description:
			"Performs a logout for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
	cookie: CookieSchema,
	beforeHandle: verifyJWTMiddleware,
};

async function loginHandler(
	pool: Pool,
	body: Static<typeof loginBody>,
	jwtToken: Cookie<string | undefined>,
	jwt: Jwt,
): Promise<LoginResponse> {
	//TODO: implement login logic
	const existingAcc = await getUserByEmail(pool, body.email);

	if (existingAcc === null) {
		throw new NotFoundError("Account does not exist!");
	}

	let match = true;

	try {
		match = await argon2.verify(
			existingAcc.password,
			body.password + existingAcc.salt,
		);
	} catch (err) {
		throw new InternalServerError(JSON.stringify(err));
	}

	if (!match) {
		throw new InvalidAccountCredentialsError("Invalid email or password!");
	}

	jwtToken.set({
		value: await jwt.sign({ email: existingAcc.email }),
		httpOnly: true,
		maxAge: 2 * 24 * 60 * 60, // 2 days
		path: "/",
	});

	return { message: "Success" };
}

async function registerHandler(
	pool: Pool,
	body: Static<typeof registerBody>,
): Promise<LoginResponse> {
	if (body.email !== body.confirm_email) {
		throw new BadRequestError("Email does not match confirm email!");
	}

	if (body.password !== body.confirm_password) {
		throw new BadRequestError("Password does not match confirm password");
	}

	const existingAcc = await getUserByEmail(pool, body.email);

	if (existingAcc !== null) {
		throw new AccountAlreadyExistError("Account already exist");
	}

	const salt = generateSalt();
	const hash_pw = await argon2.hash(body.password + salt);
	const user_id = await insertUser(pool, body.email, hash_pw, salt);

	return { message: `Success, Account Id ${user_id}` };
}

async function logoutHandler(
	jwtToken: Cookie<string | undefined>,
): Promise<LoginResponse> {
	jwtToken.set({
		value: "",
		httpOnly: true,
		maxAge: 0,
	});

	return { message: "Success" };
}

export function authRoute(pool: Pool) {
	return new Elysia({
		name: "auth",
		prefix: "/auth",
	})
		.use(
			jwt({
				name: "jwt",
				// biome-ignore lint/style/noNonNullAssertion: we want this to fail if it doesnt exist
				secret: process.env.JWT_SECRET!,
				exp: "2d",
				schema: t.Object({ email: t.String({ format: "email" }) }),
			}),
		)
		.decorate("pool", pool)
		.post(
			"/login",
			async ({ jwt, pool, body, cookie: { jwt_token } }) =>
				await loginHandler(pool, body, jwt_token, jwt),
			loginSchema,
		)
		.post(
			"/register",
			async ({ pool, body }) => await registerHandler(pool, body),
			registerSchema,
		)
		.post(
			"/logout",
			async ({ cookie: { jwt_token } }) => await logoutHandler(jwt_token),
			logoutSchema,
		);
}
