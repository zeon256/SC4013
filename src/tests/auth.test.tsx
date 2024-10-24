import { describe, expect, test } from "bun:test";
import { authRoute, passwordRegex } from "../routes/v1/auth";
import { Pool } from "pg";

describe("Password Regex Tests", () => {
    test('should match valid passwords', () => {
        const validPasswords = [
            'Test1234567!',
            'HMomg1@@!234',
            "He@!#1234",
            'WHAttHE@!#1234',
            '1234WHAttHE@!#',
            '@!#1234WHAttHE',
        ];

        validPasswords.forEach(pw => {
            passwordRegex.lastIndex = 0;
            expect(passwordRegex.test(pw)).toBe(true);
        });
    });
});

describe("Login Tests", () => {
    const pool = new Pool({
        host: 'localhost',
        user: 'user',
        password: 'password',
        database: 'testdb',
    });
    const auth = authRoute(pool);
    const url = 'http://localhost/auth/login';

    async function testJsonBody(body: any) {
        const response = await auth
        .handle(new Request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }))
        .then((res) => res.text())
        return response;
    }

    test('Empty json body', async () => {
        const response = await testJsonBody({});
        expect(response).toBe('Required property')
    });

    test('Empty email entry', async () => {
        const response = await testJsonBody({
            "email": "",
            "password": ""
        });
        expect(response).toBe("Expected string to match '^[A-Za-z0-9]*@e.ntu.edu.sg$'")
    });

    test('Empty password entry', async () => {
        const response = await testJsonBody({
            "email": "Test@e.ntu.edu.sg",
            "password": ""
        });
        expect(response).toBe('Expected string length greater or equal to 10')
    });

    test('Invalid password format', async () => {
        const response = await testJsonBody({
            "email": "Test@e.ntu.edu.sg",
            "password": "Test123456"
        });
        expect(response).toBe("Expected string to match '^(?=.*[!@#$%^&*(),.?\":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).+$'")
    });
});

describe("Register Tests", () => {
    const pool = new Pool({
        host: 'localhost',
        user: 'user',
        password: 'password',
        database: 'testdb',
    });
    const auth = authRoute(pool);
    const url = 'http://localhost/auth/register';

    async function testJsonBody(body: any) {
        const response = await auth
        .handle(new Request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }))
        .then((res) => res.text())
        return response;
    }

    test('Empty json body', async () => {
        const response = await testJsonBody({});
        expect(response).toBe('Required property')
    });

    test('Empty email entry', async () => {
        const response = await testJsonBody({
            "email": "",
            "confirm_email": "",
            "password": "",
            "confirm_password": ""
        });
        expect(response).toBe("Expected string to match '^[A-Za-z0-9]*@e.ntu.edu.sg$'")
    });

    test('Empty confirm_email entry', async () => {
        const response = await testJsonBody({
            "email": "Test@e.ntu.edu.sg",
            "confirm_email": "",
            "password": "",
            "confirm_password": ""
        });
        expect(response).toBe("Expected string to match '^[A-Za-z0-9]*@e.ntu.edu.sg$'")
    });

    test('Invalid password length', async () => {
        const response = await testJsonBody({
            "email": "Test@e.ntu.edu.sg",
            "confirm_email": "Test@e.ntu.edu.sg",
            "password": "",
            "confirm_password": ""
        });
        expect(response).toBe("Expected string length greater or equal to 10")
    });

    test('Invalid password format', async () => {
        const response = await testJsonBody({
            "email": "Test@e.ntu.edu.sg",
            "confirm_email": "Test@e.ntu.edu.sg",
            "password": "Test1234567",
            "confirm_password": ""
        });
        expect(response).toBe("Expected string to match '^(?=.*[!@#$%^&*(),.?\":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).+$'")
    });

    test('email and confirm_email match', async () => {
        const response = await testJsonBody({
            "email": "Test@e.ntu.edu.sg",
            "confirm_email": "Test2@e.ntu.edu.sg",
            "password": "Test1234567!",
            "confirm_password": "Test1234567!@"
        });
        expect(response).toBe("Email does not match confirm email!")
    });

    test('password and confirm_password match', async () => {
        const response = await testJsonBody({
            "email": "Test@e.ntu.edu.sg",
            "confirm_email": "Test@e.ntu.edu.sg",
            "password": "Test1234567!",
            "confirm_password": "Test1234567!@"
        });
        expect(response).toBe("Password does not match confirm password")
    });
});