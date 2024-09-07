import type { Pool } from "pg";

export async function dbHealthHandler(pool: Pool): Promise<string[] | "dead"> {
	try {
		const result = await pool.query<string[]>(
			"SELECT 'Hello, World!' AS message;",
		);
		return result.rows[0];
	} catch (e) {
		console.error("database might not be alive", e);
	}

	return "dead";
}
