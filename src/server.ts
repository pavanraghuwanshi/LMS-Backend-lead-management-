import app from "./app";
import dotenv from "dotenv";
dotenv.config();

import dbConnections from "./config/db";




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});