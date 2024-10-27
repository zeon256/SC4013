import { Elysia } from "elysia";

export function cloudflareMiddleware() {
	return new Elysia().onRequest(({ request }) => {
		const headers = request.headers;
		const cloudflareHeaders = [
			"CF-Connecting-IP",
			"CF-IPCountry",
			"CF-RAY",
			"CF-Visitor",
			"CF-Worker",
			"CF-Worker-ID",
			"CF-IPCOUNTRY",
			"CF-Request-ID",
		];

		const relevantHeaders: Record<string, string | null> = {};

		for (const header of cloudflareHeaders) {
			const value = headers.get(header);
			if (value) {
				relevantHeaders[header] = value;
			}
		}

		// Only log if there are any Cloudflare headers present
		if (Object.keys(relevantHeaders).length > 0) {
			console.log("[+] Cloudflare headers:", JSON.stringify(relevantHeaders, null, 0));
		}
	});
}
