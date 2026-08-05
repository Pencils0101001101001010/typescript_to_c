import "dotenv/config";
import { pipeline } from "node:stream/promises";
import { faker } from "@faker-js/faker";
import { spawn } from "node:child_process";

//This commented code is for a physical file in the root directory
// const fileDir = "./books.csv";
// const openFile = await fs.open(fileDir, "w");
// const writeStream = openFile.createWriteStream();

const PARSER_BINARY = "./parser";
const writeAmount = 10;

function sanitizeText(value: string) {
  return value.replace(/\'|,|-|_/g, "");
}

//  The * (Generator Indicator)What it does:
//  It tells JavaScript that this function is a factory for an iterator.How it behaves:
//  When you call generateRows(), it does not execute the code inside the function immediately.
//  Instead, it returns a special iterable object (a Generator) that pipeline() can read from piece by piece.
async function* generateRows() {
  for (let i = 0; i < writeAmount; i++) {
    const book = {
      title: sanitizeText(faker.book.title()),
      author: sanitizeText(faker.book.author()),
      publisher: sanitizeText(faker.book.publisher()),
      genre: sanitizeText(faker.book.genre()),
    };
    // The yield KeywordWhat it does: It acts as a temporary "return" statement that pauses the
    // function.
    // How it behaves: Every time pipeline() asks for data, the function runs until it hits yield.
    // It passes the  value out, pauses its state (saving all loop variables like i), and waits.
    // When pipeline is ready for the next row, the function wakes up right where it left off
    yield `${book.title},${book.author},${book.publisher},${book.genre}\n`;
  }
}

async function runBulkLoad() {
  console.time("Runtime");

  const child = spawn(PARSER_BINARY, {
    //disconnects the child's stdout from terminal and hands it to Node as a stream instead.
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  //Check C parser for any communication cdotenv from "dotenv"oming through
  child.stdout.on("data", (chunk) => process.stdout.write(`[parser] ${chunk}`));
  child.stderr.on("data", (chunk) =>
    process.stderr.write(`[parser:err] ${chunk}`),
  );

  const exitPromise = new Promise((resolve, reject) => {
    (child.on("error", reject),
      //Node's close event gives you code = null so we use "?? -1" to quietly turn that null into -1 because
      child.on("close", (code) => resolve(code ?? -1)));
  });

  try {
    //Pass the generator directly into pipeline once
    await pipeline(generateRows(), child.stdin);
    const exitCode = await exitPromise;
    if (exitCode !== 0) {
      throw new Error(`parser exited with non-zero code: ${exitCode}`);
    }
    console.log("Whoopy you done.");
  } catch (err) {
    console.error("Pipeline failed:", err);
    child.kill();
    throw err;
  } finally {
    // Explicitly close the file handle
    console.timeEnd("Runtime");
    // await openFile.close();
  }
}

runBulkLoad();
