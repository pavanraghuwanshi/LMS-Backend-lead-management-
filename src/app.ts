import express, { Application } from "express";
import cors from "cors";
import leadRoute from "./modules/lead/lead.routes"
import clientRoute from "./modules/ClientsModule/client.route"

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/lead",leadRoute)
app.use("/api/client",clientRoute)

app.get("/", (_req, res) => {
  return res.send("LMS Backend is Running....... 🚀");
});

export default app;