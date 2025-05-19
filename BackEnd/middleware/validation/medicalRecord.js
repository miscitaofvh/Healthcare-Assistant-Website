import { check } from 'express-validator';

export const validateCreateMedicalRecord = [
  check('record_date')
    .notEmpty().withMessage('Record date is required')
    .isDate().withMessage('Record date must be a valid date'),
    
  check('diagnosis')
    .notEmpty().withMessage('Diagnosis is required')
    .isString().withMessage('Diagnosis must be a string'),
    
  check('symptoms')
    .optional()
    .isString().withMessage('Symptoms must be a string'),
    
  check('treatments')
    .optional()
    .isString().withMessage('Treatments must be a string'),
    
  check('medications')
    .optional()
    .isString().withMessage('Medications must be a string'),
    
  check('doctor_name')
    .optional()
    .isString().withMessage('Doctor name must be a string'),
    
  check('hospital')
    .optional()
    .isString().withMessage('Hospital must be a string'),
    
  check('notes')
    .optional()
    .isString().withMessage('Notes must be a string'),
    
  check('record_type')
    .notEmpty().withMessage('Record type is required')
    .isIn(['checkup', 'hospitalization', 'surgery', 'other']).withMessage('Invalid record type')
];

export const validateUpdateMedicalRecord = [
  check('record_date')
    .optional()
    .isDate().withMessage('Record date must be a valid date'),
    
  check('diagnosis')
    .optional()
    .isString().withMessage('Diagnosis must be a string'),
    
  check('symptoms')
    .optional()
    .isString().withMessage('Symptoms must be a string'),
    
  check('treatments')
    .optional()
    .isString().withMessage('Treatments must be a string'),
    
  check('medications')
    .optional()
    .isString().withMessage('Medications must be a string'),
    
  check('doctor_name')
    .optional()
    .isString().withMessage('Doctor name must be a string'),
    
  check('hospital')
    .optional()
    .isString().withMessage('Hospital must be a string'),
    
  check('notes')
    .optional()
    .isString().withMessage('Notes must be a string'),
    
  check('record_type')
    .optional()
    .isIn(['checkup', 'hospitalization', 'surgery', 'other']).withMessage('Invalid record type')
];
