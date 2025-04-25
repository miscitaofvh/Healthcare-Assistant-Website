// Password strengths
export enum PasswordStrength {
    Short = 0,  // Mật khẩu quá ngắn
    Common = 1, // Mật khẩu phổ biến
    Weak = 2,   // Mật khẩu yếu
    Ok = 3,     // Mật khẩu trung bình
    Strong = 4, // Mật khẩu mạnh
}

// Object to check password strengths and various properties
export class PasswordCheckService {
    private static readonly MINIMUM_LENGTH = 8;
    private static readonly COMMON_PASSWORD_PATTERNS = /passw.*|12345.*|09876.*|qwert.*|asdfg.*|zxcvb.*|footb.*|baseb.*|drago.*/;

    private static hasLowerCase(password: string): boolean {
        return /.*[a-z].*/.test(password);
    }

    private static hasUpperCase(password: string): boolean {
        return /.*[A-Z].*/.test(password);
    }

    private static hasNumber(password: string): boolean {
        return /.*[0-9].*/.test(password);
    }

    private static hasSpecialChar(password: string): boolean {
        return /[^a-zA-Z0-9]/.test(password);
    }

    private static isPasswordCommon(password: string): boolean {
        return this.COMMON_PASSWORD_PATTERNS.test(password);
    }

    private static countPasswordElements(password: string): number {
        let count = 0;
        if (this.hasLowerCase(password)) count++;
        if (this.hasUpperCase(password)) count++;
        if (this.hasNumber(password)) count++;
        if (this.hasSpecialChar(password)) count++;
        return count;
    }

    public static checkPasswordStrength(password: string | null | undefined): PasswordStrength {
        if (!password || password.length < this.MINIMUM_LENGTH) {
            return PasswordStrength.Short;
        }

        if (this.isPasswordCommon(password)) {
            return PasswordStrength.Common;
        }

        const elementCount = this.countPasswordElements(password);
        
        switch (elementCount) {
            case 0:
            case 1:
            case 2:
                return PasswordStrength.Weak;
            case 3:
                return PasswordStrength.Ok;
            case 4:
                return PasswordStrength.Strong;
            default:
                return PasswordStrength.Weak;
        }
    }
}

export const getPasswordStrength = (password: string | null | undefined): PasswordStrength => {
    return PasswordCheckService.checkPasswordStrength(password);
};