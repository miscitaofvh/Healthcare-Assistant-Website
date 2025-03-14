function isVietnamesePhoneNumber(number) {
    if (typeof number !== 'string') {
        return false;
    }
    const vietnamesePhoneRegex = /^(03|05|07|08|09|01[2689])\d{8}$/;
    return vietnamesePhoneRegex.test(number);
}

function formatPhoneNumber(number) {
    return number.trim();
}

function validatePhoneNumber(number) {
    if (!number) {
        return 'Phone number is required';
    }

    if (!isVietnamesePhoneNumber(number)) {
        return 'Invalid phone number';
    }

    return '';
}

function validatePhoneNumbers(numbers) {
    if (!numbers.length) {
        return 'Phone numbers are required';
    }

    for (let i = 0; i < numbers.length; i++) {
        if (!isVietnamesePhoneNumber(numbers[i])) {
            return 'Invalid phone number';
        }
    }

    return '';
}