import express from 'express';
import { getUserHealthTracking, getLatestHealthRecord, createHealthRecord, updateHealthRecord, deleteHealthRecord, getHealthStatistics } from '../controllers/healthTrackingController.js';
import { authenticateUser } from '../security/authMiddleware.js';
import { validateHealthTracking, validateDateRange } from '../middleware/validation/healthTracking.js';

const router = express.Router();

router.get('/records', authenticateUser, getUserHealthTracking);

router.get('/latest', authenticateUser, getLatestHealthRecord);

router.post('/record', 
  authenticateUser, 
  validateHealthTracking, 
  createHealthRecord
);

router.put('/record/:id', 
  authenticateUser, 
  validateHealthTracking, 
  updateHealthRecord
);

router.delete('/record/:id', 
  authenticateUser, 
  deleteHealthRecord
);

router.get('/statistics', 
  authenticateUser, 
  getHealthStatistics
);

export default router;
