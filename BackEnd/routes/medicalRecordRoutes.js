import express from 'express';
import * as medicalRecordController from '../controllers/medicalRecordController.js';
import { validateCreateMedicalRecord, validateUpdateMedicalRecord } from '../middleware/validation/medicalRecord.js';
import * as authMiddleware from '../security/authMiddleware.js';

const router = express.Router();

// Tất cả các routes đều yêu cầu authentication
router.use(authMiddleware.authenticateUser);

router.get('/', medicalRecordController.getMedicalRecords);
router.get('/:recordId', medicalRecordController.getMedicalRecordById);
router.post('/', validateCreateMedicalRecord, medicalRecordController.createMedicalRecord);
router.put('/:recordId', validateUpdateMedicalRecord, medicalRecordController.updateMedicalRecord);

// If anyone tries to send a DELETE request, they will receive a message explaining why the operation is not allowed
router.delete('/:recordId', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Medical records cannot be deleted as per policy. This ensures a complete medical history is maintained.'
  });
});

router.delete('/:userId/:recordId/permanent', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Medical records cannot be deleted as per policy. This ensures a complete medical history is maintained.'
  });
});

export default router;
