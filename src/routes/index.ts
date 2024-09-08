import { t } from "elysia";
import type { Pool } from "pg";

export async function dbHealthHandler(pool: Pool): Promise<string> {
	const result = await pool.query<string[]>(
		"SELECT 'Hello, World!' AS message;",
	);
	return result.rows[0][0];
}

export const dbHealthHandlerSchema = {
	response: {
		200: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Check the health status of the database",
		description:
			"Performs a health check on the database and returns the status. If an error occurs, a 500 status is returned.",
		tags: ["healthcheck", "database"],
	},
};
