# Expense Tracker API

A REST API built with Node.js, Express, and PostgreSQL — containerized with Docker.

## Purpose

Built to reinforce REST API concepts from the Todo API and introduce more realistic
data complexity — decimal amounts, dates, categories, and aggregation queries.
The summary endpoints demonstrate SQL `GROUP BY` and `DATE_TRUNC` for period-based
financial reporting.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /expenses | Get all expenses (ordered by date, newest first) |
| GET | /expenses/summary | Get total spent per category (all time) |
| GET | /expenses/summary/:period | Get total spent per category for a period (week, month, year) |
| GET | /expenses/:id | Get a single expense |
| POST | /expenses | Create a new expense |
| PATCH | /expenses/:id | Update an expense (partial update) |
| DELETE | /expenses/:id | Delete an expense |

## Tech Stack

- Node.js 18
- Express — HTTP routing and middleware
- PostgreSQL 15 — persistent relational database
- `pg` (node-postgres) — PostgreSQL client for Node.js
- `dotenv` — loads environment variables from `.env`
- Docker & docker-compose — containerization and local dev setup

## Prerequisites

Before running this project, make sure you have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) — required to run the containers
- [Postman](https://www.postman.com/downloads) — or any HTTP client to test the API
- Git — to clone the repository

You do **not** need Node.js or PostgreSQL installed locally — Docker handles both.

## Run Locally

**1. Clone the repository:**

```bash
git clone https://github.com/Xolani44/expense-tracker.git
cd expense-tracker
```

**2. Set up environment variables:**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows (if `cp` doesn't work), manually duplicate `.env.example` and rename
it to `.env`. Open it and fill in your credentials — see `.env.example` for all
required variables and what they mean.

**3. Start the containers:**

```bash
docker compose up --build
```

This will:
- Build the Node.js API image
- Pull and start a PostgreSQL 15 container
- Automatically create the `expenses` table via `init.sql`
- Start the API server

**4. Confirm it's running:**

Visit `http://127.0.0.1:3000` in your browser — you should see:

```
Expense Tracker API is running
```

**5. Test the endpoints:**

Use [Postman](https://www.postman.com/downloads) or any HTTP client.
Set the base URL to `http://127.0.0.1:3000`.

## Example Requests

**Create an expense:**

```json
POST /expenses
Content-Type: application/json

{
  "description": "Lunch at Nando's",
  "amount": 150.00,
  "category": "Food",
  "date": "2026-06-25"
}
```

Expected response (`201 Created`):

```json
{
  "id": 1,
  "description": "Lunch at Nando's",
  "amount": "150.00",
  "category": "Food",
  "date": "2026-06-25T00:00:00.000Z",
  "created_at": "2026-06-25T10:00:00.000Z"
}
```

**Get all expenses:**

```json
GET /expenses
```

**Get a single expense:**

```json
GET /expenses/1
```

**Get total spent per category (all time):**

```json
GET /expenses/summary
```

Expected response:

```json
[
  { "category": "Food", "total": "150.00" },
  { "category": "Transport", "total": "85.00" }
]
```

**Get total spent per category for a period:**

```json
GET /expenses/summary/month
```

Valid periods: `week`, `month`, `year`

Expected response:

```json
{
  "period": "month",
  "totals": [
    { "category": "Food", "total": "150.00" },
    { "category": "Transport", "total": "85.00" }
  ]
}
```

**Update an expense (partial update — only send fields you want to change):**

```json
PATCH /expenses/1
Content-Type: application/json

{
  "amount": 175.00
}
```

**Delete an expense:**

```json
DELETE /expenses/1
```

Returns `204 No Content` on success.

## Project Structure

```
expense-tracker/
├── index.js           # Express server and route handlers
├── db.js              # PostgreSQL connection pool
├── init.sql           # Database schema — runs on first container start
├── Dockerfile         # Builds the Node.js app image
├── docker-compose.yml # Defines API and database containers
├── .env.example       # Environment variable template
└── package.json       # Project dependencies and scripts
```

## Decisions & Trade-offs

- Used `NUMERIC(10, 2)` for amounts instead of `FLOAT` — avoids floating point
  rounding errors which matter for financial data
- Used `DATE` type for the expense date instead of `TIMESTAMP` — expenses are
  recorded by day, not by exact time
- Summary routes use SQL `GROUP BY` and `DATE_TRUNC` — aggregation logic lives
  in the database where it belongs, not in application code
- Named volume for PostgreSQL data — data persists across `docker compose down`,
  unlike the Todo API
- Input validation on the period parameter — invalid values return `400 Bad Request`
  instead of passing bad input to the database
- Route order is deliberate — `/expenses/summary` and `/expenses/summary/:period`
  are defined before `/expenses/:id` to prevent Express matching "summary" as an ID

## What I'd Improve

- Add input validation on POST and PATCH (reject missing or invalid fields)
- Add error handling middleware to remove repeated try/catch boilerplate
- Write automated tests
- Add pagination to `GET /expenses` for large datasets
- Add date range filtering to `GET /expenses`a