import { Elysia, t } from "elysia";
import type { Pool } from "pg";

export type RouteErrors = "";

const dbHealthHandlerSchema = {
	response: {
		200: t.Object({ message: t.String() }),
		500: t.String(),
	},
	detail: {
		summary: "Check the health status of the database",
		description:
			"Performs a health check on the database and returns the status. If an error occurs, a 500 status is returned.",
	},
};

type DbHealthMessage = { message: string };

async function dbHealthHandler(pool: Pool): Promise<DbHealthMessage> {
	const result = await pool.query<DbHealthMessage>(
		"SELECT 'Hello, World!' AS message;",
	);

	return result.rows[0];
}

export const statusRoute = (pool: Pool) =>
	new Elysia()
		.decorate("pool", pool)
		.get(
			"/db-healthz",
			async ({ pool }) => await dbHealthHandler(pool),
			dbHealthHandlerSchema,
		);
