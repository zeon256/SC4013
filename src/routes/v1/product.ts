import Elysia, { t } from "elysia";
import type { Pool } from "pg";
import type { ProductModel } from "../../models";
import {
	getProducts as dbGetProducts,
	getProductById as dbGetProductById,
} from "../../database/product";

const productsSchema = {
	response: {
		200: t.Array(
			t.Object({
				id: t.Number(),
				name: t.String(),
				description: t.String(),
				created_by: t.Number(),
				updated_by: t.Number(),
				created_at: t.Date(),
				updated_at: t.Date(),
				deleted_at: t.Nullable(t.Date()),
			}),
		),
		500: t.String(),
	},
	detail: {
		summary: "Get Product Models",
		description: "Return an array of product models with metadata",
	},
};

export function productRoute(pool: Pool) {
	return new Elysia({
		name: "product-routes",
		prefix: "/products",
	})
		.state("pool", pool)
		.get(
			"/",
			async ({ store: { pool } }) => await getProducts(pool),
			productsSchema,
		)
		.get("/:id", async ({ store: { pool }, params }) =>
			getProductsById(pool, params),
		);
}

async function getProducts(pool: Pool): Promise<ProductModel[]> {
	return dbGetProducts(pool);
}

async function getProductsById(
	pool: Pool,
	params: { id: string },
): Promise<ProductModel | null> {
	const id = Number.parseInt(params.id);
	if (Number.isNaN(id)) return null;

	return dbGetProductById(pool, Number(id));
}
