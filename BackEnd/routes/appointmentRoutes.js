// routes/appointmentRoutes.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  validateAppointmentBody,
  loadAppointment,
  authorizeAppointmentAccess,
} from "../middleware/appointmentMiddleware.js";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();
router.use(authenticateUser);

router.post("/", validateAppointmentBody, createAppointment);

router.get("/", getAppointments);

router
  .get("/:id", loadAppointment, authorizeAppointmentAccess, getAppointmentById)
  .put(
    "/:id",
    loadAppointment,
    authorizeAppointmentAccess,
    validateAppointmentBody,
    updateAppointment
  )
  .delete(
    "/:id",
    loadAppointment,
    authorizeAppointmentAccess,
    deleteAppointment
  );

export default router;
