import { v1 } from "./v1"
import { Elysia, t } from "elysia";
import type { Pool } from "pg";

const authAPI = {
	v1: v1
}

const authRouteDef = <T extends string>(
	config: {
		version: T,
		prefix: T
		pool: Pool
	}) => {
	const version = config.version;

	return new Elysia({
		name: 'auth-plugin',
		seed: config.version + config.prefix
	})
	.state("pool", config.pool)
		.post(
			`${config.version}/${config.prefix}/login`,
			async ({body, store: { pool }}) => await (authAPI as any)[version].login.fn(pool, body),
			(authAPI as any)[version].login.schema,
		)
		.post(
			`${config.version}/${config.prefix}/logout`,
			async () => await (authAPI as any)[version].logout.fn(),
			(authAPI as any)[version].logout.schema,
		)
		.post(
			`${config.version}/${config.prefix}/register`,
			async ({body, store: { pool }}) => await (authAPI as any)[version].register.fn(body, pool),
			(authAPI as any)[version].register.schema,
		);
};

export const authRoute = (pool: Pool) => authRouteDef({
	version: 'v1',
	prefix: 'auth',
	pool
})