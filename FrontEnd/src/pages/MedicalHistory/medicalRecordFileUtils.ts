/**
 * Utility functions for processing medical record files
 */

import { MedicalRecordFormData } from '../../types/medicalRecord';

/**
 * Upload a medical record file for OCR processing
 * 
 * @param file File to upload
 * @returns Processed medical record data
 */
export const processMedicalRecordFile = async (file: File): Promise<{
  success: boolean;
  data?: MedicalRecordFormData;
  error?: string;
}> => {
  try {    const formData = new FormData();
    formData.append('file', file);
    formData.append('processMode', 'processed'); // Use enhanced OCR processing
    
    const apiUrl = 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/medical-record-files/upload`, {
      method: 'POST',
      credentials: 'include', // This will include cookies in the request
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.message || result.error || 'Failed to process file'
      };
    }
    
    return {
      success: true,
      data: result.data
    };
    
  } catch (error) {
    console.error('Error processing medical record file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
