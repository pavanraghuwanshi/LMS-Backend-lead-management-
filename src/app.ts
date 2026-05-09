import express, { Application } from "express";
import cors from "cors";
import leadRoute from "./modules/lead/lead.routes"
import clientRoute from "./modules/ClientsModule/client.route"
import FollowUpRoute from "./modules/ClientFollowUp/clientFollowUp.route"
import AppointmentRoute from "./modules/AppointmentModule/Appointment.route"
import ClientConfirmationRoute from "./modules/clientConfermationTrack/clientCofermation.route"
import LeadDashboardStatsRoute from "./modules/DashBoardApis/dashboardCount.route"
import GoogleLeadRoute from "./modules/googleAdsLead/googleLead.route"


// import MetaLeadRoute from "./modules/Meta_Leads/services/metaLead.route"
const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/lead",leadRoute)
app.use("/api/client",clientRoute)
app.use("/api/follow-up",FollowUpRoute)
app.use("/api/appointment",AppointmentRoute)
app.use("/api/client-confirmation",ClientConfirmationRoute)
app.use("/api/dashboard",LeadDashboardStatsRoute)

app.use("/api/google",GoogleLeadRoute)


// app.use("/api/dashboard",MetaLeadRoute)

app.get("/", (_req, res) => {
  return res.send("LMS Backend is Running....... 🚀");
});

export default app;