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
      id SERIAL PRIMARY KEY,
      title VARCHAR(50),
      author VARCHAR(50),
      publisher VARCHAR(50),
      genre VARCHAR(50)
   );
   ```

---

## Running the Project

Follow these steps to compile, generate data, and load it into PostgreSQL.

### Step 1: Compile the C Parser

Compile the C program using `pg_config` to automatically resolve your local PostgreSQL directory maps:

```bash
gcc -I\((pg_config --includedir) -L\)(pg_config --libdir) parser.c -lpq -o parser
```

### Step 2: Generate the CSV File

Run your Node script to create the mock data payload:

```bash
node index.js
```

_(This creates `books.csv` in your root directory)._

### Step 3: Inject Variables & Run the Binary

Inject your `.env` configuration file into the environment profile and execute the parser payload:

```bash
export \$(grep -v '^#' .env | xargs) && ./parser
```

---

## Key Technical Highlights

- **Memory Efficient Generators:** The Node.js data generation uses `yield` statements inside an asynchronous loop generator, letting `pipeline()` stream data to disk chunk-by-chunk without loading millions of rows into RAM.
- **Database Streaming (`COPY`):** Instead of executing thousands of slow `INSERT INTO` statements, the C code opens an optimization stream using PostgreSQL's binary protocol (`PGRES_COPY_IN`) for instant block inserts.
