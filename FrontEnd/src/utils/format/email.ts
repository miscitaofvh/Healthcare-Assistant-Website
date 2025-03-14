const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const isEmail = (email: string): boolean => {
  return expression.test(email);
};

export const formatEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const validateEmail = (email: string): string => {
  if (!email) {
    return 'Email is required';
  }

  if (!isEmail(email)) {
    return 'Invalid email';
  }

  return '';
};

export const validateEmails = (emails: string[]): string => {
  if (!emails.length) {
    return 'Emails are required';
  }

  for (let i = 0; i < emails.length; i++) {
    if (!isEmail(emails[i])) {
      return 'Invalid email';
    }
  }

  return '';
};

export const validateEmailsString = (emails: string): string => {
  const emailsArray = emails.split(',').map((email) => email.trim());
  return validateEmails(emailsArray);
};



