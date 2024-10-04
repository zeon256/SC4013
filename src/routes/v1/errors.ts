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
