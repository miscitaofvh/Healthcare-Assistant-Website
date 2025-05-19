/**
 * Utility file for medications handling in Medical Records
 */
import { Medication } from '../types/medicalRecord';

/**
 * Convert medications string from database to array of medication objects
 * @param medicationsStr The medications string from database (TEXT format)
 * @returns Array of Medication objects
 */
export const parseMedicationsFromString = (medicationsStr: string = ''): Medication[] => {
  if (!medicationsStr || medicationsStr.trim() === '') {
    return [];
  }

  try {
    // Try to parse as JSON first (for new format)
    const parsed = JSON.parse(medicationsStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    // If not JSON, try to parse as our custom format
  }

  // Legacy format: Process as text with line breaks and delimiters
  const rows = medicationsStr.split('\n').filter(row => row.trim() !== '');
  return rows.map(row => {
    const parts = row.split('|').map(part => part.trim());
    return {
      name: parts[0] || '',
      dosage: parts[1] || '',
      instructions: parts[2] || '',
      duration: parts[3] || ''
    };
  });
};

/**
 * Convert array of medication objects to string for storage in database
 * @param medications Array of Medication objects
 * @returns String representation for database storage
 */
export const stringifyMedications = (medications: Medication[]): string => {
  if (!medications || medications.length === 0) {
    return '';
  }

  // Store as JSON for better data integrity
  return JSON.stringify(medications);
};

/**
 * Create a new empty medication object
 * @returns Empty Medication object
 */
export const createEmptyMedication = (): Medication => ({
  name: '',
  dosage: '',
  instructions: '',
  duration: ''
});
