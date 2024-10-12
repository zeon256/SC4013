import type { PoolConfig } from "pg";

export type ServerConfig = {
	port: Readonly<number>;
	address: Readonly<string>;
};

export type AppConfig = {
	serverConfig: Readonly<ServerConfig>;
	dbConfig: Readonly<PoolConfig>;
};

export async function readJsonConfig(filePath = "./config.json"): Promise<Readonly<AppConfig>> {
	const file = Bun.file(filePath);
	const text = await file.text();
	const config: AppConfig = JSON.parse(text);
	const defaultServerConfig: ServerConfig = {
		port: 3000,
		address: "localhost",
	};

	const serverConfig: ServerConfig = config.serverConfig || defaultServerConfig;

	return {
		serverConfig,
		dbConfig: config.dbConfig,
	};
}
