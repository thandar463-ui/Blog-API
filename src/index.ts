const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT;
const app = express();
app.use(express.json());

if (PORT === undefined) {
    throw new Error("PORT is not provided");
}

app.listen(PORT, () => {
    console.log(`✅ TODO server running at http://localhost:${PORT}`);

});