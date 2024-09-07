import type { Pool } from "pg";

export async function dbHealthHandler(pool: Pool): Promise<string[] | "dead"> {
	const result = await pool.query<string[]>(
		"SELECT 'Hello, World!' AS message;",
	);
	return result.rows[0];
}
