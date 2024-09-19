import type { Pool } from "pg";
import type { ProductModel } from "../models";

export async function getProducts(pool: Pool): Promise<ProductModel[]> {
	const result = await pool.query<ProductModel>(
		"SELECT * FROM Product WHERE deleted_at IS NULL;",
	);

	return result.rows;
}

export async function getProductById(
	pool: Pool,
	id: number,
): Promise<ProductModel | null> {
	const result = await pool.query<ProductModel>({
		text: "SELECT * FROM Product WHERE id = $1 AND deleted_at IS NULL;",
		values: [id],
	});

	if (result.rowCount === 0) return null;
	return result.rows[0];
}
