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
