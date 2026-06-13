import express from "express";
import { userRoutes } from "./controllers/user.route";
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
  console.log(`✅ Express server running at http://localhost:${PORT}`);

});
app.use("/users", userRoutes);


// async function main() {
//   try {
//     // Create a new user with a post
//     const user = await prisma.user.create({
//       data: {
//         firstName: "Rain",
//         lastName: "June",
//         email: "rain@gmail.com",
//         password: "rain123",
//       }
//     });
//     console.log(user);

//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       console.error("Prisma Error:", error.message);
//     }
//     else {
//       console.error("An Unexpected error occurred", error);
//     }
//   }


// }

