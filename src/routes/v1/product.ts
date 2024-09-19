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

const postProductSchema = {
	body: t.Object({
		name: t.String(),
		description: t.String(),
	}),
	response: {
		200: productSchema,
		500: t.String(),
	},
	detail: {
		summary: "Create Product",
		description: "Return a created product",
	},
};

const updateProductSchema = {
	params: t.Object({
		id: t.Number({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }),
	}),
	body: t.Object({
		name: t.String(),
		description: t.String(),
	}),
	response: {
		200: productSchema,
		404: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Update Product By Id",
		description: "Return the updated product",
	},
};

const deleteProductSchema = {
	params: t.Object({
		id: t.Number({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }),
	}),
	response: {
		200: t.Null(),
		404: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Delete Product By Id",
		description: "Return the deleted product",
	},
};

export function productRoute(pool: Pool) {
	return new Elysia({
		name: "product-routes",
		prefix: "/products",
	})
		.decorate("pool", pool)
		.get("/", async ({ pool }) => await getProducts(pool), productsSchema)
		.get(
			"/:id",
			async ({ pool, params: { id }, error }) =>
				(await getProductsById(pool, id)) ?? error(404, "Not Found"),
			productIdSchema,
		)
		.post(
			"/",
			async ({ pool, body }) => await postProduct(pool, body),
			postProductSchema,
		)
		.put(
			"/:id",
			async ({ pool, body, params: { id }, error }) =>
				(await updateProductById(pool, id, body)) ?? error(404, "Not Found"),
			updateProductSchema,
		)
		.delete(
			"/:id",
			async ({ pool, params: { id }, error }) =>
				(await deleteProductById(pool, id)) ?? error(404, "Not Found"),
			deleteProductSchema,
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

async function postProduct(
	pool: Pool,
	product: Pick<ProductModel, "name" | "description">,
): Promise<ProductModel> {
	// TODO: impl db, requires auth to be done i think
	return {
		id: 9000,
		name: product.name,
		description: product.description,
		created_by: 1,
		updated_by: 1,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: null,
	};
}

async function updateProductById(
	pool: Pool,
	id: number,
	{ name, description }: Pick<ProductModel, "name" | "description">,
): Promise<ProductModel | null> {
	// TODO: impl db, requires auth to be done i think
	return {
		id: id,
		name: name,
		description: description,
		created_by: 1,
		updated_by: 1,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: null,
	};
}

async function deleteProductById(pool: Pool, id: number): Promise<null> {
	// TODO: impl db, requires auth to be done i think
	return null;
}
