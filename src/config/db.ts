import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
// dotenv.config();

type DBConnections = {
  db1: Connection | null;
  db2: Connection | null;
};

const dbConnections: DBConnections = {
  db1: null,
  db2: null,
};

const connectDB = async (): Promise<void> => {
  try {
    if (!dbConnections.db1) {
      dbConnections.db1 = mongoose.createConnection(
        process.env.MONGO_URI_1 as string
      );

      dbConnections.db1.on("connected", () =>
        console.log("Connected to Database 1 ✅")
      );

      dbConnections.db1.on("error", (err) =>
        console.error("DB1 error ❌:", err)
      );
    }

    if (!dbConnections.db2) {
      dbConnections.db2 = mongoose.createConnection(
        process.env.MONGO_URI_2 as string
      );

      dbConnections.db2.on("connected", () =>
        console.log("Connected to Database 2 ✅")
      );

      dbConnections.db2.on("error", (err) =>
        console.error("DB2 error ❌:", err)
      );
    }
  } catch (error) {
    console.error("MongoDB connection failed ❌");
    process.exit(1);
  }
};

// ✅ same tera pattern
connectDB();

export default dbConnections;