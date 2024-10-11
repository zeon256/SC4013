import Elysia, { Cookie, t, ValidationError } from "elysia";
import type { Pool } from "pg";
import type { Product, ProductModel } from "../../models";
import {
	getProducts as dbGetProducts,
	getProductById as dbGetProductById,
	createProduct as dbCreateProduct,
	updateProduct as dbUpdateProduct,
	deleteProduct as dbDeleteProduct
} from "../../database/product";
import { getUserByEmail as dbGetUserByEmail } from "../../database/user";
import { Jwt, verifyJWTMiddleware } from "./auth";
import { JWTPayloadSpec } from "@elysiajs/jwt";
import { InvalidAccountCredentialsError, NotEnoughPermission } from "./errors";
import jwt from "@elysiajs/jwt"; 

const productSchema = t.Object({
	id: t.Number(),
	name: t.String({ minLength: 1, maxLength: 100 }),
	description: t.String({ minLength: 1, maxLength: 1000 }),
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
		200: t.Nullable(productSchema),
		500: t.String(),
	},
	detail: {
		summary: "Create Product",
		description: "Return a created product",
	},
	beforeHandle: verifyJWTMiddleware,
};

const updateProductSchema = {
	params: t.Object({
		id: t.Number({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }),
	}),
	body: t.Object({
		name: t.String({ minLength: 1, maxLength: 100 }),
		description: t.String( { minLength: 1, maxLength: 1000 }),
	}),
	response: {
		200: productSchema,
		401: t.String(),
		404: t.String(),
		500: t.String(),
	},
	detail: {
		summary: "Update Product By Id",
		description: "Return the updated product",
	},
	beforeHandle: verifyJWTMiddleware
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
		description: "Return the deleted product",
	},
	beforeHandle: verifyJWTMiddleware
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
		.post(
			"/",
			async ({ jwt, pool, body, cookie: { jwt_token }, error }) => 
				(await postProduct(pool, jwt, jwt_token, body)) ?? error(500, "Internal Server Error"),
			postProductSchema,
		)
		.put(
			"/:id",
			async ({ jwt, pool, body, params: { id }, cookie: { jwt_token }, error }) =>
				(await updateProductById(pool, jwt, jwt_token, id, body)) ?? error(404, "Not Found"),
			updateProductSchema,
		)
		.delete(
			"/:id",
			async ({ jwt, pool, params: { id }, cookie: { jwt_token }, error }) =>
				(await deleteProductById(pool, jwt, jwt_token, id)) ?? error(404, "Not Found"),
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
	jwt: Jwt,
	jwtToken: Cookie<string | undefined>,
	product: Product,
): Promise<ProductModel | null> {
	// idk how to pass the profile from beforeHandle
	const raw = await jwt.verify(jwtToken.value);

	// cfm wont be false since we already check in beforeHandle
	// so this is safe to do
	const email = (raw as {email: string}).email;
	const user = await dbGetUserByEmail(pool, email);

	if (!user) {
		// should not happen, if this happens means something is buggy!
		throw new InvalidAccountCredentialsError("User does not exist!")
	}
	
	return dbCreateProduct(pool, user?.id, product);
}

async function updateProductById(
	pool: Pool,
	jwt: Jwt,
	jwtToken: Cookie<string | undefined>,
	id: number,
	{ name, description }: Product,
): Promise<ProductModel | null> {
	// idk how to pass the profile from beforeHandle
	const raw = await jwt.verify(jwtToken.value);

	// cfm wont be false since we already check in beforeHandle
	// so this is safe to do
	const email = (raw as { email: string }).email;
	const user = await dbGetUserByEmail(pool, email);

	if (!user) {
		// should not happen, if this happens means something is buggy!
		throw new InvalidAccountCredentialsError("User does not exist!")
	}

	// check if object has the same created_by
	// admin can delete anyone product
	const product = await dbGetProductById(pool, id);

	if(!product) return null;

	// can update if they own the resource	
	if(product.created_by == user.id) {
		return dbUpdateProduct(pool, user?.id, { name,description, id });
	}
	
	// can only update if they admin
	if(!user.is_admin) {
		throw new NotEnoughPermission("User is not admin trying to modify resource they don't own!"); 	
	}
	
	return dbUpdateProduct(pool, user?.id, { name,description, id });
}

async function deleteProductById(pool: Pool, 
	jwt: Jwt,
	jwtToken: Cookie<string | undefined>,
	id: number
): Promise<ProductModel | null> {
	// idk how to pass the profile from beforeHandle
	const raw = await jwt.verify(jwtToken.value);

	// cfm wont be false since we already check in beforeHandle
	// so this is safe to do
	const email = (raw as { email: string }).email;
	const user = await dbGetUserByEmail(pool, email);

	if (!user) {
		// should not happen, if this happens means something is buggy!
		throw new InvalidAccountCredentialsError("User does not exist!")
	}

	// check if object has the same created_by
	// admin can delete anyone product
	const product = await dbGetProductById(pool, id);

	// dont have to check if resource already deleted or not cos getProductById
	// alr take that into account

	if (!product) return null;

	// can delete if they own the resource
	if (product.created_by == user.id) {
		return dbDeleteProduct(pool, user?.id, id);
	}
	
	// can only delete if they admin
	if (!user.is_admin) {
		throw new NotEnoughPermission("User is not admin trying to modify resource they don't own!"); 	
	}

	return dbDeleteProduct(pool, user?.id, id);
}
