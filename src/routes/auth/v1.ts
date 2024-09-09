import { t } from "elysia";

const emailFormat = t.String({
	format: 'email',
	error: 'Invalid Email',
	pattern: '^[A-Za-z0-9]*@e.ntu.edu.sg$'
})

/*
At least 1 special character
At least 1 uppercase character
At least 1 lowercase character
At least 1 numeric character

TODO: Create unit test for regex
Note: current regex not working
*/
const passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$";

const passwordFormat = t.String({
	minLength: 10,
	error: "password requires minimum length of 10"
})

const loginSchema = {
	response: { 200: t.String(), 500: t.String() },
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

async function loginHandler(body: JSON): Promise<string> {
    //TODO: implement login logic
	
    return "TEST";
}

const logoutSchema = {
	response: { 200: t.String(), 500: t.String() },
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
	response: { 200: t.String(), 500: t.String() },
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
	})
};

async function registerHandler(): Promise<string> {
    //TODO: implement register logic

    return "TEST";
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