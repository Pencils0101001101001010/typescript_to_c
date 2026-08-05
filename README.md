# Book Data Pipeline (TypeScript to C)

This project showcases a high-performance data processing pipeline. It uses a **Node.js** script to generate mock book data efficiently using streams, and a **C** binary to bulk-load that data into a **PostgreSQL** database using the fast `COPY` protocol.

## Project status

**Currently in development**

## Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18+ recommended)
- **GCC Compiler**
- **PostgreSQL** development libraries (`libpq`)

---

## Setup & Installation

1. **Install Node dependencies:**

```bash
   npm install
```

2. **Configure your Environment:**
   Create a `.env` file in the root directory and add your PostgreSQL connection settings:

```env
   PGHOST=localhost
   PGUSER=your_username
   PGPASSWORD=your_password
   PGDATABASE=your_database_name
   PGPORT=5432
```

3. **Initialize the Database Schema:**
   Ensure your database has the following table structure:
   ```sql
   CREATE TABLE books(
   id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   title VARCHAR(50),
   author VARCHAR(50),
   publisher VARCHAR(50),
   genre VARCHAR(50)
   )
   ```

---

## Running the Project

Follow these steps to compile, generate data, and load it into PostgreSQL.

### Step 1: Compile the C Parser

Compile the C program using `pg_config` to automatically resolve your local PostgreSQL directory maps:

```bash
gcc -I$(pg_config --includedir) -L$(pg_config --libdir) parser.c -lpq -o parser
```

### Step 2: Run the Pipeline

Run the Node script — it spawns the compiled `parser` binary and streams generated rows directly into its `stdin`:

```bash
node run-bulk-load.ts
```

---

## Key Technical Highlights

- **Memory Efficient Generators:** The Node.js data generation uses `yield` statements inside an async generator, letting `pipeline()` stream rows directly into the C program's `stdin` via `child_process.spawn` — no intermediate file on disk, and no need to hold all rows in memory at once.
- **Database Streaming (`COPY`):** Instead of executing thousands of slow `INSERT INTO` statements, the C program reads CSV rows from `stdin` as they arrive and streams them into PostgreSQL using the `COPY ... FROM STDIN` protocol (`PGRES_COPY_IN`), enabling fast block inserts.
