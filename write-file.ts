import fs from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { faker } from "@faker-js/faker";

(async () => {
  console.time("Created CSV in");
  const fileDir = "./books.csv";
  const openFile = await fs.open(fileDir, "w");
  const writeStream = openFile.createWriteStream();

  const writeAmount = 10;

  //  The * (Generator Indicator)What it does:
  //  It tells JavaScript that this function is a factory for an iterator.How it behaves:
  //  When you call generateRows(), it does not execute the code inside the function immediately.
  //  Instead, it returns a special iterable object (a Generator) that pipeline() can read from piece by piece.
  async function* generateRows() {
    for (let i = 0; i < writeAmount; i++) {
      const book = {
        id: i,
        title: faker.book.title().replace(/\'|,|-|_/g, ""),
        author: faker.book.author().replace(/\'|,|-|_/g, ""),
        publisher: faker.book.publisher().replace(/\'|,|-|_/g, ""),
        genre: faker.book.genre().replace(/\'|,|-|_/g, ""),
      };
      // The yield KeywordWhat it does: It acts as a temporary "return" statement that pauses the
      // function.
      // How it behaves: Every time pipeline() asks for data, the function runs until it hits yield.
      // It passes the  value out, pauses its state (saving all loop variables like i), and waits.
      // When pipeline is ready for the next row, the function wakes up right where it left off
      yield `${book.id},${book.title},${book.author},${book.author},${book.publisher},${book.genre}\n`;
    }
  }

  try {
    //Pass the generator directly into pipeline once
    await pipeline(generateRows, writeStream);
    console.log("CSV created successfully!");
  } catch (err) {
    console.error("Pipeline failed:", err);
  } finally {
    // Explicitly close the file handle
    console.timeEnd("Created CSV in");
    await openFile.close();
  }
})();
