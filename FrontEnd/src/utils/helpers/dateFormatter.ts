/**
 * Formats a date string or Date object into a readable format
 * @param date - Can be a Date object, ISO string, or timestamp
 * @param options - Optional formatting configuration
 * @returns Formatted date string
 */
export const formatDate = (
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ): string => {
    // Convert to Date object if it's a string or number
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
  
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate');
      return 'Invalid date';
    }
  
    // Format the date using browser's Intl API
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  };