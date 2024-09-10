import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { Logestic } from "logestic";
import { Pool } from "pg";
import { type AppConfig, readJsonConfig } from "./config";
import { routes } from "./routes";
import { authRoute } from "./routes/auth";
import { productRoute } from "./routes/product";

async function tryConnectDb(pool: Pool, cfg: Readonly<AppConfig>) {
	try {
		console.log(
			`[+] Trying to connect to ${cfg.dbConfig.host}:${cfg.dbConfig.port}/${cfg.dbConfig.database}`,
		);
		const client = await pool.connect();
		console.log(
			`Successfully connected to database @ ${cfg.dbConfig.host}:${cfg.dbConfig.port}/${cfg.dbConfig.database}`,
		);
		client.release();
	} catch (e) {
		console.error(e);
		process.exit(-1);
	}
}

(async () => {
	const cfg = await readJsonConfig();
	const pool = new Pool(cfg.dbConfig);
	await tryConnectDb(pool, cfg);

	const app = new Elysia()
		.state("pool", pool)
		.use(swagger())
		.use(Logestic.preset("common"))
		.onError(({ code, error, set }) => {
			console.error(error);
			return "Internal Server Error";
		})
		.get("/", () => "Hello Elysia")
		.get(
			"/db-healthz",
			async ({ store: { pool } }) => await routes.dbHealth.fn(pool),
			routes.dbHealth.schema,
		)
		.group("/api/v1", (apiGrp) => apiGrp.use(authRoute).use(productRoute(pool)))
		.listen(cfg.serverConfig.port);

	console.log(
		`[+] 🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	);

	console.log(
		`[+] View documentation at "http://${app.server?.hostname}:${app.server?.port}/swagger" in your browser`,
	);
})();
