import jwt from "@elysiajs/jwt";
import Elysia, { InternalServerError, NotFoundError, t } from "elysia";
import type { Pool } from "pg";
import {
	createProduct as dbCreateProduct,
	deleteProduct as dbDeleteProduct,
	getProductById as dbGetProductById,
	getProducts as dbGetProducts,
	updateProduct as dbUpdateProduct,
} from "../../database/product";
import { getUserByEmail as dbGetUserByEmail } from "../../database/user";
import type { Product, ProductModel, UserModel } from "../../models";
import { BadRequestError, InvalidAccountCredentialsError, NotEnoughPermission } from "./errors";

const nameDescriptionPattern = /^[a-zA-Z0-9 _-]+$/;

const productSchema = t.Object({
	id: t.Number(),
	name: t.String({
		minLength: 1,
		maxLength: 100,
		pattern: nameDescriptionPattern.source,
		error({ errors }) {
			throw new BadRequestError(errors[0].message);
		},
	}),
	description: t.String({
		minLength: 1,
		maxLength: 1000,
		pattern: nameDescriptionPattern.source,
		error({ errors }) {
			throw new BadRequestError(errors[0].message);
		},
	}),
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
		tags: ["Products"],
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
		tags: ["Products"],
	},
};

const postProductSchema = {
	body: t.Pick(productSchema, ["name", "description"]),
	response: {
		200: productSchema,
		500: t.String(),
	},
	detail: {
		summary: "Create Product",
		description: "Return a created product",
		tags: ["Products"],
		security: [{ CookieAuth: [] }],
	},
};

const updateProductSchema = {
	params: t.Object({
		id: t.Number({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }),
	}),
	body: t.Pick(productSchema, ["name", "description"]),
	response: {
		200: productSchema,
		401: t.String(),
		404: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Update Product By Id",
		tags: ["Products"],
		description: "Return the updated product",
		security: [{ CookieAuth: [] }],
	},
};

const deleteProductSchema = {
	params: t.Object({
		id: t.Number({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }),
	}),
	response: {
		200: productSchema,
		404: t.String(),
		403: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Delete Product By Id",
		tags: ["Products"],
		description: "Return the deleted product",
		security: [{ CookieAuth: [] }],
	},
};

export function productRoute(pool: Pool) {
	return new Elysia({
		name: "product-routes",
		prefix: "/products",
	})
		.decorate("pool", pool)
		.use(
			jwt({
				name: "jwt",
				// biome-ignore lint/style/noNonNullAssertion: we want this to fail if it doesnt exist
				secret: process.env.JWT_SECRET!,
				exp: "2d",
				schema: t.Object({ email: t.String({ format: "email" }) }),
			}),
		)
		.get("/", async ({ pool }) => await getProducts(pool), productsSchema)
		.get(
			"/:id",
			async ({ pool, params: { id }, error }) =>
				(await getProductsById(pool, id)) ?? error(404, "Not Found"),
			productIdSchema,
		)
		.derive(async ({ pool, cookie: { jwt_token }, jwt }) => {
			const profile = await jwt.verify(jwt_token.value);
			if (!profile) {
				throw new InvalidAccountCredentialsError("Unauthorized account!");
			}

			const email = (profile as { email: string }).email;
			const user = await dbGetUserByEmail(pool, email);

			if (!user) {
				throw new InvalidAccountCredentialsError("User does not exist!");
			}

			return { user };
		})
		.post(
			"/",
			async ({ pool, body, user }) => await postProduct(pool, user, body),
			postProductSchema,
		)
		.put(
			"/:id",
			async ({ pool, body, params: { id }, user }) => await updateProductById(pool, user, id, body),
			updateProductSchema,
		)
		.delete(
			"/:id",
			async ({ pool, params: { id }, user }) => await deleteProductById(pool, user, id),
			deleteProductSchema,
		);
}

async function getProducts(pool: Pool): Promise<ProductModel[]> {
	return dbGetProducts(pool);
}

async function getProductsById(pool: Pool, id: number): Promise<ProductModel | null> {
	return dbGetProductById(pool, id);
}

async function postProduct(pool: Pool, user: UserModel, product: Product): Promise<ProductModel> {
	const result = await dbCreateProduct(pool, user?.id, product);

	if (!result) throw new InternalServerError("Something broke!");
	return result;
}

async function updateProductById(
	pool: Pool,
	user: UserModel,
	id: number,
	{ name, description }: Product,
): Promise<ProductModel> {
	// check if object has the same created_by
	// admin can delete anyone product
	const product = await dbGetProductById(pool, id);

	if (!product) throw new NotFoundError("Product Id not found!");

	// can update if they own the resource
	if (product.created_by === user.id) {
		const result = await dbUpdateProduct(pool, user?.id, {
			name,
			description,
			id,
		});

		if (!result) throw new NotFoundError("Product Id not found!");

		return result;
	}

	// can only update if they admin
	if (!user.is_admin) {
		throw new NotEnoughPermission("User is not admin trying to modify resource they don't own!");
	}

	const result = await dbUpdateProduct(pool, user?.id, {
		name,
		description,
		id,
	});

	if (!result) {
		throw new NotFoundError("Product Id not found!");
	}

	return result;
}

async function deleteProductById(pool: Pool, user: UserModel, id: number): Promise<ProductModel> {
	// check if object has the same created_by
	// admin can delete anyone product
	const product = await dbGetProductById(pool, id);

	// dont have to check if resource already deleted or not cos getProductById
	// alr take that into account
	if (!product) {
		throw new NotFoundError("Product Id not found!");
	}

	// can delete if they own the resource
	if (product.created_by === user.id) {
		const result = await dbDeleteProduct(pool, user?.id, id);
		if (!result) {
			throw new NotFoundError("Product Id not found!");
		}
		return result;
	}

	// can only delete if they admin
	if (!user.is_admin) {
		throw new NotEnoughPermission("User is not admin trying to modify resource they don't own!");
	}

	const result = await dbDeleteProduct(pool, user?.id, id);
	if (!result) {
		throw new NotFoundError("Product Id not found!");
	}
	return result;
}
