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
		pool: Pool,
		jwt_obj: any
	}) => {
	const version = config.version;

	return new Elysia({
		name: 'auth-plugin',
		seed: config.version + config.prefix
	})
	.state("pool", config.pool)
	.decorate("jwt", config.jwt_obj)
		.post(
			`${config.version}/${config.prefix}/login`,
			async ({jwt, body, store: { pool },  cookie: { jwt_token }}) => 
				await (authAPI as any)[version].login.fn(pool, body, jwt_token, jwt),
			(authAPI as any)[version].login.schema,
		)
		.post(
			`${config.version}/${config.prefix}/logout`,
			async ({cookie: { jwt_token }}) => await (authAPI as any)[version].logout.fn(jwt_token),
			(authAPI as any)[version].logout.schema,
		)
		.post(
			`${config.version}/${config.prefix}/register`,
			async ({body, store: { pool }}) => await (authAPI as any)[version].register.fn(pool, body),
			(authAPI as any)[version].register.schema,
		);
};

export const authRoute = (pool: Pool, jwt_obj: any) => authRouteDef({
	version: 'v1',
	prefix: 'auth',
	pool,
	jwt_obj
})