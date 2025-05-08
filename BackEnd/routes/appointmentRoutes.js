import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateAppointmentBody } from '../middleware/validateAppointmentBody.js';
import { createAppointment, getAppointments} from '../controllers/appointmentController.js';

const router = express.Router();

router.use(authenticateUser);
router.post('/', validateAppointmentBody, createAppointment);
router.get('/', getAppointments);

export default router;