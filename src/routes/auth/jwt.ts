import { Elysia, Context, t, Cookie } from "elysia";
import { jwt } from '@elysiajs/jwt'

export const jwt_handler = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
        exp: '2d',
        schema: t.Object({
            email: t.String({
                format: 'email',
                error({ errors }) {
                    return {
                        status: 422,
                        message: errors[0].message
                    }
                }
            }),
        })
    }));

export const verifyJWTMiddleware = async ({ cookie: { jwt_token }, set, jwt }:
    { cookie: { jwt_token: Cookie<string | undefined> }, set: any, jwt: any }) => {
    const profile = await jwt.verify(jwt_token.value)
    if (!profile) {
        set.status = 401
        return 'Unauthorized'
    }
}