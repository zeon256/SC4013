import { Pool } from "pg";

export const UserDB = (pool: Pool) => {
    return {
        async GetUser(email: string) {
            const res = await pool.query<string[]>(
                'SELECT * from "User" WHERE Email = $1',[email]);
            if (res.rows.length <= 0)
                return null;
            return res.rows[0] as any;
        },
        async InsertUser(email: string, hash_pw: string, salt: string){
            const result = await pool.query<string[]>(
                'INSERT INTO "User" (Email, Password, Salt, Last_password_change, \
                Created_time, Last_login, Lockout, IsAdmin)	\
                VALUES ($1, $2, $3, \
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, \
                    NULL, \'N\', \'N\') RETURNING id', [email, hash_pw, salt]);
            return (result.rows[0] as any).id;
        }
    }
}
