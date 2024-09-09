import { Elysia, t } from "elysia";
import type { Pool } from "pg";
import { authRoute } from "./auth";

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

const dbHealth = {
	fn: dbHealthHandler,
	schema: dbHealthHandlerSchema,
}

const statusRoute = (pool: Pool) => new Elysia()
	.state("pool", pool)
	.get(
		"/db-healthz",
		async ({ store: { pool } }) => await dbHealth.fn(pool),
		dbHealth.schema,
	)

export const routes = (pool: Pool) => new Elysia()
	.use(statusRoute(pool))
	.group('/api', (api_grp) =>
		api_grp
		.use(authRoute)
	)
