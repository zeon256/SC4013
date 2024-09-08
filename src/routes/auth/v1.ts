import { t } from "elysia";

const loginSchema = {
	response: { 200: t.String(), 500: t.String() },
	detail: {
		summary: "Authenticate the user",
		description:
			"Performs a authentication for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
};

async function loginHandler(): Promise<string> {
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
		summary: "Register the user",
		description:
			"Register an account for the user and returns the status. If an error occurs, a 500 status is returned.",
	},
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
		schema: registerSchema,
	},
} as const;