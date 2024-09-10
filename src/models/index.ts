export type DatabaseId = { id: number };

export type DatabaseMetadata = {
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
	created_by: number;
	updated_by: number;
};

export type Product = {
	name: string;
	description: string;
};

export type ProductModel = DatabaseId & Product & DatabaseMetadata;
