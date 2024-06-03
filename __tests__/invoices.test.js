const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoiceId;

beforeEach(async () => {
    await db.query("DELETE FROM invoices WHERE comp_code = 'test'");
    await db.query("DELETE FROM companies WHERE code = 'test'");
    await db.query("INSERT INTO companies (code, name, description) VALUES ('test', 'Test Company', 'This is a test company')");
    const result = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ('test', 100) RETURNING id");
    testInvoiceId = result.rows[0].id;
});

afterEach(async () => {
    await db.query("DELETE FROM invoices WHERE comp_code = 'test'");
    await db.query("DELETE FROM companies WHERE code = 'test'");
});

afterAll(async () => {
    await db.end();
});

describe("GET /invoices", () => {
    it("Gets a list of invoices", async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200);
        expect(response.body.invoices).toBeInstanceOf(Array);
        expect(response.body.invoices.length).toBeGreaterThan(0);
    });
});

describe("GET /invoices/:id", () => {
    it("Gets a single invoice", async () => {
        const response = await request(app).get(`/invoices/${testInvoiceId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.invoice).toHaveProperty('id');
        expect(response.body.invoice.id).toBe(testInvoiceId);
    });

    it("Responds with 404 for invalid invoice id", async () => {
        const response = await request(app).get('/invoices/999');
        expect(response.statusCode).toBe(404);
    });
});

describe("POST /invoices", () => {
    it("Creates a new invoice", async () => {
        const response = await request(app)
            .post('/invoices')
            .send({
                comp_code: 'test',
                amt: 200
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.invoice).toHaveProperty('id');
        expect(response.body.invoice.amt).toBe(200);
    });
});

describe("PUT /invoices/:id", () => {
    it("Updates a single invoice", async () => {
        const response = await request(app)
            .put(`/invoices/${testInvoiceId}`)
            .send({
                amt: 300,
                paid: true
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.invoice.amt).toBe(300);
        expect(response.body.invoice.paid).toBe(true);
        expect(response.body.invoice.paid_date).not.toBeNull();
    });

    it("Responds with 404 for invalid invoice id", async () => {
        const response = await request(app)
            .put('/invoices/999')
            .send({
                amt: 300,
                paid: true
            });
        expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /invoices/:id", () => {
    it("Deletes a single invoice", async () => {
        const response = await request(app).delete(`/invoices/${testInvoiceId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "deleted" });
    });

    it("Responds with 404 for invalid invoice id", async () => {
        const response = await request(app).delete('/invoices/999');
        expect(response.statusCode).toBe(404);
    });
});
