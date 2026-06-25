// Load environment variables from .env file
require('dotenv').config();

// Import the database connection pool
const pool = require('./db');
const express = require('express');
const app = express();
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

// Get all expenses
app.get('/expenses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get total spent per category
app.get('/expenses/summary', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT category, SUM(amount) AS total
             FROM expenses
             GROUP BY category
             ORDER BY total DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get expenses summary by period (week, month, year)
app.get('/expenses/summary/:period', async (req, res) => {
    try {
        const { period } = req.params;

        const validPeriods = ['week', 'month', 'year'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                error: 'Invalid period. Use week, month, or year.'
            });
        }

        const result = await pool.query(
            `SELECT category, SUM(amount) AS total
             FROM expenses
             WHERE date >= DATE_TRUNC($1, CURRENT_DATE)
             GROUP BY category
             ORDER BY total DESC`,
            [period]
        );

        res.json({ period, totals: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get a specific expense by ID
app.get('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create a new expense
app.post('/expenses', async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        const result = await pool.query(
            'INSERT INTO expenses (description, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [description, amount, category, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update an expense by ID
app.patch('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, category, date } = req.body;

        const result = await pool.query(
            `UPDATE expenses SET
                description = COALESCE($1, description),
                amount = COALESCE($2, amount),
                category = COALESCE($3, category),
                date = COALESCE($4, date)
             WHERE id = $5 RETURNING *`,
            [description, amount, category, date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete an expense by ID
app.delete('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});