type DatabaseId = { id: number };

type DatabaseTimestamp = {
	created_by: number;
	updated_by: number;
};

type DatabaseUserAction = {
	created_at: Date | string;
	updated_at: Date | string;
	deleted_at: Date | string | null;
};

export type Product = {
	name: string;
	description: string;
};

export type ProductModel = DatabaseId & Product & DatabaseUserAction & DatabaseTimestamp;

export type User = {
	email: string;
	password: string;
	salt: string;
	last_password_change: Date;
	last_login: Date;
	failed_login_attempt_count: number;
	lockout: boolean;
	is_admin: boolean;
};

export type UserModel = DatabaseId & User & DatabaseUserAction;
