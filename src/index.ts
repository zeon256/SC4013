import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { Logestic } from "logestic";
import { Pool } from "pg";
import { type AppConfig, readJsonConfig } from "./config";
import { productRoute } from "./routes/v1/product";
import { authRoute } from "./routes/v1/auth";
import { statusRoute } from "./routes";

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

(async () => {
	const cfg = await readJsonConfig();
	const pool = new Pool(cfg.dbConfig);
	await tryConnectDb(pool, cfg);

	const app = new Elysia()
		.decorate("pool", pool)
		.use(swagger())
		.use(Logestic.preset("common"))
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
		.group("/api/v1", (apiGrp) =>
			apiGrp.use(productRoute(pool)).use(authRoute(pool)),
		)
		.listen(cfg.serverConfig.port);

	console.log(
		`[+] 🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	);

	console.log(
		`[+] View documentation at "http://${app.server?.hostname}:${app.server?.port}/swagger" in your browser`,
	);
})();
