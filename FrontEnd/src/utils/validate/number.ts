export async function isVietnamesePhoneNumber(number: any) {
    if (typeof number !== 'string') {
        return false;
    }
    const vietnamesePhoneRegex = /^(03|05|07|08|09|01[2689])\d{8}$/;
    return vietnamesePhoneRegex.test(number);
}