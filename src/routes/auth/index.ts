import { v1 } from "./v1"
import { Elysia, t } from "elysia";

const authAPI = {
	v1: v1
}

const authRouteDef = <T extends string>(
	config: {
		version: T,
		prefix: T
	}) => {
	const version = config.version;

	return new Elysia({
		name: 'auth-plugin',
		seed: config
	})
		.post(
			`${config.version}/${config.prefix}/login`,
			async () => await (authAPI as any)[version].login.fn(),
			(authAPI as any)[version].login.schema,
		)
		.post(
			`${config.version}/${config.prefix}/logout`,
			async () => await (authAPI as any)[version].logout.fn(),
			(authAPI as any)[version].logout.schema,
		)
		.post(
			`${config.version}/${config.prefix}/register`,
			async () => await (authAPI as any)[version].register.fn(),
			(authAPI as any)[version].register.schema,
		);
};

export const authRoute = authRouteDef({
	version: 'v1',
	prefix: 'auth'
})