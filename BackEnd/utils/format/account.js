export const isUsernameValid = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    return usernameRegex.test(username);
}

export const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}