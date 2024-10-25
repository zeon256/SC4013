import type { Pool } from "pg";
import type { UserModel } from "../models";

export async function getUserByEmail(pool: Pool, email: string): Promise<UserModel | null> {
	const res = await pool.query<UserModel>('SELECT * from "User" WHERE Email = $1', [email]);
	if (res.rows.length <= 0) return null;
	return res.rows[0];
}

export async function insertUser(
	pool: Pool,
	email: string,
	hash_pw: string,
	salt: string,
): Promise<number> {
	const result = await pool.query<{ id: number }>(
		'INSERT INTO "User" (email, password, salt, last_login) VALUES ($1, $2, $3, NULL) RETURNING id',
		[email, hash_pw, salt],
	);

	return result.rows[0].id;
}

export async function updateUserLastLogin(pool: Pool, email: string): Promise<void> {
	await pool.query(
		'UPDATE "User" SET last_login = NOW(), failed_login_attempt_count = 0 WHERE email = $1',
		[email],
	);
}

export async function updateFailAttempt(pool: Pool, email: string): Promise<void> {
	await pool.query(
		'UPDATE "User" SET failed_login_attempt_count = failed_login_attempt_count + 1 WHERE email = $1',
		[email],
	);
}

export async function LockAccount(pool: Pool, email: string): Promise<void> {
	await pool.query('UPDATE "User" SET lockout = true WHERE email = $1', [email]);
}
