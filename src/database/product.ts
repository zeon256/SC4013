import type { Pool } from "pg";
import type { ProductModel } from "../models";

export async function getProducts(pool: Pool): Promise<ProductModel[]> {
	const result = await pool.query<ProductModel>(
		"SELECT * FROM Product WHERE deleted_at IS NULL;",
	);

	return result.rows;
}
