import { ElysiaApp } from "..";
import { getIP, IPHeaders } from "elysia-ip";

export const ip =
	(
		config: {
			/**
			 * Customize headers to check for IP address
			 */
			checkHeaders?: IPHeaders[];
		} = {},
	) =>
	(app: ElysiaApp) => {
		return app.onRequest(({ request, store }) => {
			let ip = "";
			if (globalThis.Bun) {
				if (!app.server) throw new Error("Elysia server is not initialized. Make sure to call Elyisa.listen()");
				const clientIP = app.server.requestIP(request);
				ip = clientIP ? clientIP.address : "";
			}
			if (ip === "") {
				const clientIP = getIP(request.headers, config.checkHeaders);
				ip = clientIP ? clientIP : "";
			}
			store.ip = ip;
		});
	};
