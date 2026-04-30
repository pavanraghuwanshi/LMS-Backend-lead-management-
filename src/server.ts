import app from "./app";
import dotenv from "dotenv";
dotenv.config();

console.log("ENV CHECK 👉", process.env.MONGO_URI_1);
import dbConnections from "./config/db";




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});