import express from "express";
import {verifyPending, getPendingEmail} from "../controllers/verifyController.js";

const router = express.Router();

router.post("/verify-pending", verifyPending);
router.get("/get-email", getPendingEmail);
export default router;
