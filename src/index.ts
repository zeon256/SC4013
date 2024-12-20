import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { Logestic } from "logestic";
import { Pool } from "pg";
import { type AppConfig, readJsonConfig } from "./config";
import { productRoute } from "./routes/v1/product";
import { authRoute } from "./routes/v1/auth";
import { statusRoute } from "./routes";
import { ip } from "./plugin/elysia_ip";
import { cloudflareMiddleware } from "./cloudflare";

async function tryConnectDb(pool: Pool, cfg: Readonly<AppConfig>) {
	try {
		console.log(
			`[+] Trying to connect to ${cfg.dbConfig.host}:${cfg.dbConfig.port}/${cfg.dbConfig.database}`,
		);
		const client = await pool.connect();
		console.log(
			`[+] Successfully connected to database @ ${cfg.dbConfig.host}:${cfg.dbConfig.port}/${cfg.dbConfig.database}`,
		);
		client.release();
	} catch (e) {
		console.error(e);
		process.exit(-1);
	}
}

export const app = new Elysia({
	serve: {
		tls: {
			cert: Bun.file("iac/rsa_key.pub.pem"),
			key: Bun.file("iac/rsa_key.pem"),
		},
	},
}).state("ip", "");

(async () => {
	if (process.env.NODE_ENV === "test") {
		return;
	}

	const cfgPath = process.argv[2] ?? "./config.json";
	console.log(`[+] Got configFilePath: ${cfgPath}`);

	const cfg = await readJsonConfig(cfgPath);
	const pool = new Pool(cfg.dbConfig);
	await tryConnectDb(pool, cfg);

	app
		.decorate("pool", pool)
		.use(
			swagger({
				documentation: {
					info: {
						title: "SecureAPI",
						version: "1.0.0",
					},
					components: {
						securitySchemes: {
							CookieAuth: {
								type: "apiKey",
								in: "cookie",
								name: "jwt_token",
							},
						},
					},
				},
			}),
		)
		.use(Logestic.preset("common"))
		.use(cloudflareMiddleware())
		.onError(({ code, error }) => {
			switch (code) {
				case "VALIDATION":
					return JSON.parse(error.message);
				case "NOT_FOUND":
					return error.message;
				case "INTERNAL_SERVER_ERROR":
					return "Internal Server Error";
				case "UNKNOWN":
					return "Internal Server Error";
			}
		})
		.use(statusRoute(pool))
		.use(ip())
		.group("/api/v1", (apiGrp) => apiGrp.use(productRoute(pool)).use(authRoute(pool)))
		.listen(cfg.serverConfig.port);

	console.log(`[+] 🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

	console.log(
		`[+] View documentation at "http://${app.server?.hostname}:${app.server?.port}/swagger" in your browser`,
	);
})();

export type ElysiaApp = typeof app;
