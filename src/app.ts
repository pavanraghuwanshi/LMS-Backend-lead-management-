import express, { Application } from "express";
import cors from "cors";
import leadRoute from "./modules/lead/lead.routes"

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/lead",leadRoute)
app.use("/api/client",leadRoute)

app.get("/", (_req, res) => {
  return res.send("LMS Backend is Running....... 🚀");
});

export default app;