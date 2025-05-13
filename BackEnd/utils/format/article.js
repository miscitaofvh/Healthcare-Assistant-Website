export const isTagandCategoryValid = (name) => {
    const nameRegex = /^[a-zA-Z0-9_ ]{3,50}$/;
    return nameRegex.test(name);
}