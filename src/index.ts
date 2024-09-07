import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { Logestic } from "logestic";
import { Pool } from "pg";
import { readJsonConfig } from "./config";
import { dbHealthHandler } from "./routes";

(async () => {
	const cfg = await readJsonConfig();
	const pool = new Pool(cfg.dbConfig);

	console.log("[+] Connected to postgresql database");

	const app = new Elysia()
		.state("pool", pool)
		.use(swagger())
		.use(Logestic.preset("common"))
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
