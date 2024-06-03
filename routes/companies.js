const express = require('express');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query('SELECT code, name FROM companies');
        return res.json({ companies: result.rows });
    } catch (err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const compResult = await db.query('SELECT code, name, description FROM companies WHERE code = $1', [code]);

        if (compResult.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" });
        }

        const invResult = await db.query('SELECT id FROM invoices WHERE comp_code = $1', [code]);
        const indResult = await db.query(
            'SELECT i.industry FROM company_industries ci JOIN industries i ON ci.industry_code = i.code WHERE ci.comp_code = $1',
            [code]
        );

        const company = compResult.rows[0];
        company.invoices = invResult.rows.map(inv => inv.id);
        company.industries = indResult.rows.map(ind => ind.industry);

        return res.json({ company });
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { name, description, industries } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required." });
        }
        const code = slugify(name, { lower: true, strict: true });
        const result = await db.query(
            'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description',
            [code, name, description]
        );

        if (industries && industries.length > 0) {
            for (let industry of industries) {
                await db.query(
                    'INSERT INTO company_industries (comp_code, industry_code) VALUES ($1, $2)',
                    [code, industry]
                );
            }
        }

        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        console.error(err);
        return next(err);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const result = await db.query(
            'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description',
            [name, description, code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" });
        }

        return res.json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query('DELETE FROM companies WHERE code = $1 RETURNING code', [code]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Company not found" });
        }

        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
