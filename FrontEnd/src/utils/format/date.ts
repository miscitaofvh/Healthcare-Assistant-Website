function isDateValid(date: string): boolean {
  return !isNaN(Date.parse(date));
}

//  convert and check valid format date DD/MM/YYYY

function isDateValidDDMMYYYY(date: string): boolean {
  const dateArray = date.split('/');
    if (dateArray.length !== 3) {
        return false;
    }
    const day = parseInt(dateArray[0]);
    const month = parseInt(dateArray[1]);
    const year = parseInt(dateArray[2]);
    return isDateValid(`${month}/${day}/${year}`);
}

function validateDate(date: string): string {
  if (!date) {
    return 'Date is required';
  }

  if (!isDateValid(date)) {
    return 'Invalid date';
  }

  return '';
}

function validateDates(dates: string[]): string {
  if (!dates.length) {
    return 'Dates are required';
  }

  for (let i = 0; i < dates.length; i++) {
    if (!isDateValid(dates[i])) {
      return 'Invalid date';
    }
  }

  return '';
}

function validateDatesString(dates: string): string {
  const datesArray = dates.split(',').map((date) => date.trim());
  return validateDates(datesArray);
}


