import { describe, expect, test } from "bun:test";
import { Pool } from "pg";
import PgMock2, { getPool } from "pgmock2";
import type { ProductModel } from "../models";
import { productRoute } from "../routes/v1/product";

const now: Date = new Date(Date.now());
const products: ProductModel[] = [
	{
		id: 1,
		name: "Test Product 1",
		description: "Test Description 1",
		created_by: 1,
		updated_by: 1,
		created_at: now,
		updated_at: now,
		deleted_at: null,
	},
	{
		id: 2,
		name: "Test Product 2",
		description: "Test Description 2",
		created_by: 1,
		updated_by: 2,
		created_at: now,
		updated_at: now,
		deleted_at: null,
	},
];

const pg = new PgMock2();

pg.add("SELECT * FROM Product WHERE deleted_at IS NULL", [], {
	rowCount: 2,
	rows: products,
});

pg.add("SELECT * FROM Product WHERE id = $1 AND deleted_at IS NULL", ["number"], {
	rowCount: 1,
	rows: [products[0]],
});

describe("GET /products tests", () => {
	const products = productRoute(getPool(pg));
	const url = "http://localhost/products";

	async function testJsonBody(): Promise<ProductModel[]> {
		const response = await products.handle(
			new Request(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}),
		);

		expect(response.status).toBe(200);

		return await response.json();
	}

	test("Products", async () => {
		const response = await testJsonBody();
		expect(response).toEqual([
			{
				id: 1,
				name: "Test Product 1",
				description: "Test Description 1",
				created_by: 1,
				updated_by: 1,
				created_at: now.toISOString(),
				updated_at: now.toISOString(),
				deleted_at: null,
			},
			{
				id: 2,
				name: "Test Product 2",
				description: "Test Description 2",
				created_by: 1,
				updated_by: 2,
				created_at: now.toISOString(),
				updated_at: now.toISOString(),
				deleted_at: null,
			},
		]);
	});
});

describe("GET /products/:id tests", () => {
	const products = productRoute(getPool(pg));
	const url = "http://localhost/products";

	async function testJsonBody(id: number): Promise<ProductModel> {
		const fullUrl = `${url}/${id}`;
		const response = await products.handle(
			new Request(fullUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}),
		);

		expect(response.status).toBe(200);

		return await response.json();
	}

	test("Product Id = 1", async () => {
		const response = await testJsonBody(1);
		expect(response).toEqual({
			id: 1,
			name: "Test Product 1",
			description: "Test Description 1",
			created_by: 1,
			updated_by: 1,
			created_at: now.toISOString(),
			updated_at: now.toISOString(),
			deleted_at: null,
		});
	});
});

describe("Create Products Tests", () => {
	const pool = new Pool({
		host: "localhost",
		user: "user",
		password: "password",
		database: "testdb",
	});
	const products = productRoute(pool);
	const url = "http://localhost/products/";

	type JsonResponse = Record<string, unknown>;
	type ResponseType<M extends "json" | "text"> = M extends "json" ? JsonResponse : string;

	async function testJsonBody<T, M extends "json" | "text" = "text">(
		body: T,
		mode: M,
	): Promise<ResponseType<M>> {
		const response = await products.handle(
			new Request(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			}),
		);

		if (mode === "json") {
			return (await response.json()) as ResponseType<M>;
		}

		return (await response.text()) as ResponseType<M>;
	}

	test("Not logged in", async () => {
		const response = await testJsonBody<Record<string, unknown>>({}, "text");
		expect(response).toBe("Unauthorized account!");
	});
});
