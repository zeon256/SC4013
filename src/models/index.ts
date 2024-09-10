type DatabaseId = { id: number };

type DatabaseTimestamp = {
	created_by: number;
	updated_by: number;
};

type DatabaseUserAction = {
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

export type Product = {
	name: string;
	description: string;
};

export type ProductModel = DatabaseId &
	Product &
	DatabaseUserAction &
	DatabaseTimestamp;
