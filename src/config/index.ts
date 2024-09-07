import type { PoolConfig } from "pg";

export type ServerConfig = {
	port: number;
	address: string;
};

export type AppConfig = {
	serverConfig?: ServerConfig;
	dbConfig: PoolConfig;
};

export async function readJsonConfig(
	filePath = "./config.json",
): Promise<AppConfig> {
	const file = Bun.file(filePath);
	const text = await file.text();
	return JSON.parse(text);
}
