export const isTagandCategoryValid = (name) => {
    const nameRegex = /^[a-zA-Z0-9_ ]{3,16}$/;
    return nameRegex.test(name);
}