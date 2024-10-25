import type { Pool } from "pg";
import type { Product, ProductModel } from "../models";

export async function getProducts(pool: Pool): Promise<ProductModel[]> {
	const result = await pool.query<ProductModel>("SELECT * FROM Product WHERE deleted_at IS NULL;");

	return result.rows;
}

export async function getProductById(pool: Pool, id: number): Promise<ProductModel | null> {
	const result = await pool.query<ProductModel>({
		text: "SELECT * FROM Product WHERE id = $1 AND deleted_at IS NULL;",
		values: [id],
	});

	if (result.rowCount === 0) return null;
	return result.rows[0];
}

export async function createProduct(
	pool: Pool,
	userId: number,
	{ name, description }: Product,
): Promise<ProductModel | null> {
	const result = await pool.query<{ id: number }>(
		"INSERT INTO Product (name, description, created_by, updated_by) VALUES ($1, $2, $3, $4) RETURNING id",
		[name, description, userId, userId],
	);

	if (result.rowCount === 0) return null;

	return {
		id: result.rows[0].id,
		name: name,
		description: description,
		created_by: userId,
		updated_by: userId,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: null,
	};
}

export async function updateProduct(
	pool: Pool,
	userId: number,
	{ id, name, description }: Product & { id: number },
): Promise<ProductModel | null> {
	const result = await pool.query<ProductModel>(
		"UPDATE Product SET name = $1, description = $2, updated_by = $3, updated_at = NOW() WHERE id = $4 RETURNING *;",
		[name, description, userId, id],
	);

	if (result.rowCount === 0) return null;

	return result.rows[0];
}

export async function deleteProduct(pool: Pool, userId: number, id: number): Promise<ProductModel | null> {
	const result = await pool.query<ProductModel>(
		"UPDATE Product SET updated_by = $1, updated_at = NOW(), deleted_at = NOW() WHERE id = $2 RETURNING *;",
		[userId, id],
	);

	if (result.rowCount === 0) return null;

	return result.rows[0];
}
