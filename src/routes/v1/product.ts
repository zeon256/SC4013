import Elysia, { t, ValidationError } from "elysia";
import type { Pool } from "pg";
import type { ProductModel } from "../../models";
import {
	getProducts as dbGetProducts,
	getProductById as dbGetProductById,
} from "../../database/product";

const productSchema = t.Object({
	id: t.Number(),
	name: t.String(),
	description: t.String(),
	created_by: t.Number(),
	updated_by: t.Number(),
	created_at: t.Date(),
	updated_at: t.Date(),
	deleted_at: t.Nullable(t.Date()),
});

const productsSchema = {
	response: {
		200: t.Array(productSchema),
		500: t.String(),
	},
	detail: {
		summary: "Get Product Models",
		description: "Return an array of product models with metadata",
	},
};

const productIdSchema = {
	params: t.Object({
		id: t.Number({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }),
	}),
	response: {
		200: productSchema,
		404: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Get Product Model By Id",
		description: "Return a single product",
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
		.get(
			"/:id",
			async ({ store: { pool }, params: { id }, error }) => {
				return (await getProductsById(pool, id)) ?? error(404, "Not Found");
			},
			productIdSchema,
		);
}

async function getProducts(pool: Pool): Promise<ProductModel[]> {
	return dbGetProducts(pool);
}

async function getProductsById(
	pool: Pool,
	id: number,
): Promise<ProductModel | null> {
	return dbGetProductById(pool, id);
}
