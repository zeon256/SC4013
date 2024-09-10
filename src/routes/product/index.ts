import Elysia from "elysia";
import type { Pool } from "pg";

export function productRoute(pool: Pool) {
	return new Elysia({
		name: "product-routes",
		prefix: "/products",
	})
		.state("pool", pool)
		.get("/", async ({ store: { pool } }) => await getProducts(pool));
}

async function getProducts(pool: Pool) {
	const result = await pool.query<string[]>(
		"SELECT 'Hello, World!' AS message;",
	);
	return result.rows[0][0];
}
