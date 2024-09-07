import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { Logestic } from "logestic";

const app = new Elysia()
	.use(swagger())
	.use(Logestic.preset("common"))
	.get("/", () => "Hello Elysia")
	.listen(3000);

console.log(
	`[+] 🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

console.log(
	`[+] View documentation at "${app.server?.url}swagger" in your browser`,
);
