import express from "express";
import {verifyPending, getPendingEmail, verifyEmail} from "../controllers/verifyController.js";

const router = express.Router();

router.post("/verify-pending", verifyPending);
router.get("/get-email", getPendingEmail);
router.get("/verify-email", verifyEmail);
export default router;
