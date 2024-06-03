const request = require('supertest');
const app = require('../app');
const db = require('../db');
const slugify = require('slugify');

beforeEach(async () => {
    await db.query("DELETE FROM invoices WHERE comp_code = 'test'");
    await db.query("DELETE FROM companies WHERE code = 'test'");
    await db.query("DELETE FROM companies WHERE code = 'new-company'");
    await db.query("DELETE FROM industries WHERE code = 'tech'");
    await db.query("INSERT INTO companies (code, name, description) VALUES ('test', 'Test Company', 'This is a test company')");
    await db.query("INSERT INTO industries (code, industry) VALUES ('tech', 'Technology')");
});

afterEach(async () => {
    await db.query("DELETE FROM invoices WHERE comp_code = 'test'");
    await db.query("DELETE FROM companies WHERE code = 'test'");
    await db.query("DELETE FROM companies WHERE code = 'new-company'");
    await db.query("DELETE FROM industries WHERE code = 'tech'");
    await db.query("DELETE FROM company_industries WHERE comp_code = 'test'");
});

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    it("Gets a list of companies", async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        expect(response.body.companies).toBeInstanceOf(Array);
        expect(response.body.companies.length).toBeGreaterThan(0);
    });
});

describe("GET /companies/:code", () => {
    it("Gets a single company", async () => {
        const response = await request(app).get('/companies/test');
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body.company).toHaveProperty('code');
        expect(response.body.company.code).toBe('test');
    });

    it("Responds with 404 for invalid company code", async () => {
        const response = await request(app).get('/companies/invalid');
        expect(response.statusCode).toBe(404);
    });
});

describe("POST /companies", () => {
    it("Creates a new company", async () => {
        const response = await request(app)
            .post('/companies')
            .send({
                name: 'New Company',
                description: 'This is a new company',
                industries: ['tech']
            });
        console.log(response.body);
        expect(response.statusCode).toBe(201);
        expect(response.body.company).toHaveProperty('code');
        expect(response.body.company.code).toBe(slugify('New Company', { lower: true, strict: true }));
        expect(response.body.company.name).toBe('New Company');
    });

    it("Returns an error if the company name is missing", async () => {
        const response = await request(app)
            .post('/companies')
            .send({
                description: 'This is a new company without a name'
            });
        console.log(response.body);
        expect(response.statusCode).toBe(400);
    });
});

describe("PUT /companies/:code", () => {
    it("Updates a single company", async () => {
        const response = await request(app)
            .put('/companies/test')
            .send({
                name: 'Updated Test Company',
                description: 'This is an updated test company'
            });
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body.company.name).toBe('Updated Test Company');
    });

    it("Responds with 404 for invalid company code", async () => {
        const response = await request(app)
            .put('/companies/invalid')
            .send({
                name: 'Invalid Company',
                description: 'This company does not exist'
            });
        expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /companies/:code", () => {
    it("Deletes a single company", async () => {
        const response = await request(app).delete('/companies/test');
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "deleted" });
    });

    it("Responds with 404 for invalid company code", async () => {
        const response = await request(app).delete('/companies/invalid');
        expect(response.statusCode).toBe(404);
    });
});
