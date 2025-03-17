// Date Format MM/DD/YYYY
export const isDateValid = (date) => {
  return !isNaN(Date.parse(date));
}

//  convert and check valid format date DD/MM/YYYY
export const isDateValidDDMMYYYY = (date) => {
  const dateArray = date.split('/');
    if (dateArray.length !== 3) {
        return false;
    }
    const day = parseInt(dateArray[0]);
    const month = parseInt(dateArray[1]);
    const year = parseInt(dateArray[2]);
    return isDateValid(`${month}/${day}/${year}`);
}

export const isVietnamesePhoneNumber = (number) => {
    if (typeof number !== 'string') {
        return false;
    }
    const vietnamesePhoneRegex = /^(03|05|07|08|09|01[2689])\d{8}$/;
    return vietnamesePhoneRegex.test(number);
}
