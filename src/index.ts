import express from "express";
import { userRoutes } from "./controllers/user.route";
import fs from "fs";
// import { prisma } from "./lib/prisma";
import dotenv from "dotenv";
import { blogRoutes } from "./controllers/blog.route";
import { categoryRoutes } from "./controllers/category.route";

import { requestId } from "./middlewares/requestId.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";

dotenv.config();

const PORT = process.env.PORT;
if (PORT === undefined) {
  throw new Error("PORT is not provided");
}
const app = express();
app.use(express.json());


app.use(requestId);
app.use(requestLogger);





app.use("/users", userRoutes);

app.use("/blogs", blogRoutes);

app.use("/categories", categoryRoutes);

app.use("/uploads", express.static("uploads"));



app.listen(PORT, () => {
  console.log(`✅ Express server running at http://localhost:${PORT}`);

});

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

