import express from "express";
import verify from "../controllers/verifyController.js";

const router = express.Router();

router.post("/verify", verify);

export default router;
