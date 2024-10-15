export class InvalidAccountCredentialsError extends Error {
	code = "UNAUTHORIZED";
	status = 401;

	constructor(message?: string) {
		super(message ?? "UNAUTHORIZED");
	}
}

export class NotEnoughPermission extends Error {
	code = "FORBIDDEN";
	status = 403;

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

export class AccountLockOutError extends Error {
	code = "FORBIDDEN";
	status = 403;

	constructor(message?: string) {
		super(message ?? "FORBIDDEN");
	}
}

export class BadRequestError extends Error {
	code = "BAD_REQUEST";
	status = 400;

	constructor(message?: string) {
		super(message ?? "BAD_REQUEST");
	}
}
