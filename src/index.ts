import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { Logestic } from "logestic";
import { Pool } from "pg";
import { readJsonConfig } from "./config";
import { dbHealthHandler } from "./routes";

(async () => {
	const cfg = await readJsonConfig();
	const pool = new Pool(cfg.dbConfig);

	const app = new Elysia()
		.state("pool", pool)
		.use(swagger())
		.use(Logestic.preset("common"))
		.onError(({ code, error, set }) => {
			if (code === "INTERNAL_SERVER_ERROR") {
				set.status = 500;
				return "Internal Server Error";
			}

			return "Internal Server Error";
		})
		.get("/", () => "Hello Elysia")
		.get("/db-healthz", async ({ store: { pool } }) => dbHealthHandler(pool))
		.listen(cfg.serverConfig?.port ?? 3000);

	console.log(
		`[+] 🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	);

	console.log(
		`[+] View documentation at "${app.server?.url}swagger" in your browser`,
	);
})();
