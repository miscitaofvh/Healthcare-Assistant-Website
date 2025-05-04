import express from "express";
import { getDoctorsList } from "../controllers/doctorController.js";

const router = express.Router();
router.get("/", getDoctorsList);

export default router;
