import express from "express";
import verify from "../controllers/verifyPendingController.js";

const router = express.Router();

router.post("/verify-pending", verify);

export default router;
