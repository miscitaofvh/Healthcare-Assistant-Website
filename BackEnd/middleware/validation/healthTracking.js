import { body } from 'express-validator';

// Validation for creating/updating health tracking records
export const validateHealthTracking = [
  body('weight')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Weight must be a valid number between 1 and 500 kg'),
  
  body('height')
    .optional()
    .isFloat({ min: 10, max: 300 })
    .withMessage('Height must be a valid number between 10 and 300 cm'),
  
  body('blood_pressure')
    .optional()
    .matches(/^\d{1,3}\/\d{1,3}$/)
    .withMessage('Blood pressure must be in the format "systolic/diastolic" (e.g., 120/80)'),
  
  body('heart_rate')
    .optional()
    .isInt({ min: 30, max: 250 })
    .withMessage('Heart rate must be a valid number between 30 and 250 bpm'),
  
  body('blood_sugar')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Blood sugar must be a valid number between 1 and 50 mmol/L'),
  
  body('temperature')
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage('Temperature must be a valid number between 30 and 45 °C'),
  
  body('sleep_duration')
    .optional()
    .isInt({ min: 0, max: 24 })
    .withMessage('Sleep duration must be a valid number between 0 and 24 hours'),
  
  body('calories_burned')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Calories burned must be a valid number between 0 and 10000'),
  
  body('exercise_data')
    .optional()
    .isString()
    .withMessage('Exercise data must be a string')
];

// Validation for statistics date range
export const validateDateRange = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isDate()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isDate()
    .withMessage('End date must be a valid date')
];
