import express from "express";

import { getClientConfermation,createClientConfermation,getClientById,updateClientConfermation,deleteClientConfermation,} from "./clientCofermation.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

// CREATE CLIENT CONFIRMATION
router.post("/", authenticate,createClientConfermation);

// GET ALL CLIENT CONFIRMATIONS
router.get("/",authenticate,getClientConfermation);

// GET CLIENT BY ID
router.get("/client/:id",authenticate,getClientById);

// UPDATE CLIENT CONFIRMATION
router.put("/:id",authenticate,updateClientConfermation);

// DELETE CLIENT CONFIRMATION
router.delete("/:id",authenticate,deleteClientConfermation);

export default router;