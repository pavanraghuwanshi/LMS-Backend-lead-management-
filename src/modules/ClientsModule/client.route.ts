import express from "express";
import {createClient,getClients,getClientById,updateClient,deleteClient,} from "./client.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

router.post("/", authenticate, createClient);
router.get("/", authenticate, getClients);
router.get("/:id", authenticate, getClientById);
router.put("/:id", authenticate, updateClient);
router.delete("/:id", authenticate, deleteClient);

export default router;