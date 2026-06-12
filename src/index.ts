import express from "express";
import fs from "fs";
import { prisma } from "./lib/prisma";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const app = express();
app.use(express.json());

if (PORT === undefined) {
  throw new Error("PORT is not provided");
}

app.listen(PORT, () => {
  console.log(`✅ TODO server running at http://localhost:${PORT}`);
  main()
});

async function main() {
  // Create a new user with a post
  const user = await prisma.user.create({
    data: {
      firstName: "June",
      lastName: "Stella",
      email: "june@gmail.com",
      password: "june123",
    }
  });
  console.log(user);

}

