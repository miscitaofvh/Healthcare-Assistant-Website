import { body, validationResult } from "express-validator";
import { isUsernameValid, isEmailValid } from "../utils/format/account.js";
import { PasswordCheckStrength, statePassword } from "../utils/format/passwd.js";

const validateRegister = [
    body("username")
        .notEmpty()
        .withMessage("Username là bắt buộc")
        .isLength({ min: 3, max: 30 })
        .withMessage("Username phải từ 3-30 ký tự")
        .trim()
        .custom((value) => {
            if (!isUsernameValid(value)) {
                throw new Error("Username chỉ được chứa chữ cái, số và dấu gạch dưới");
            }
            return true;
        }),
    body("email")
        .notEmpty()
        .withMessage("Email là bắt buộc")
        .isLength({ max: 100 })
        .withMessage("Email không được vượt quá 100 ký tự")
        .trim()
        .toLowerCase()
        .custom((value) => {
            if (!isEmailValid(value)) {
                throw new Error("Email không hợp lệ");
            }
            return true;
        }),
    body("password")
        .notEmpty()
        .withMessage("Password là bắt buộc")
        .isLength({ min: 8, max: 50 })
        .withMessage("Password phải từ 8-50 ký tự")
        .custom((value) => {
            const passwordStrength = statePassword(value);
            if (passwordStrength === PasswordCheckStrength.Short) {
                throw new Error("Password phải có ít nhất 8 ký tự");
            } else if (passwordStrength === PasswordCheckStrength.Common) {
                throw new Error("Password quá phổ biến, vui lòng chọn password mạnh hơn");
            } else if (passwordStrength === PasswordCheckStrength.Weak) {
                throw new Error("Password quá yếu, vui lòng thêm ký tự đặc biệt, chữ hoa và số");
            } 
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errors.array() 
            });
        }
        next();
    }
];

const validateLogin = [
    body("identifier")
        .notEmpty()
        .withMessage("Username hoặc email là bắt buộc")
        .trim()
        .custom((value) => {
            if (value.includes('@')) {
                if (!isEmailValid(value)) {
                    throw new Error("Email không hợp lệ");
                }
            } else {
                if (!isUsernameValid(value)) {
                    throw new Error("Username chỉ được chứa chữ cái, số và dấu gạch dưới");
                }
            }
            return true;
        }),
    body("password")
        .notEmpty()
        .withMessage("Password là bắt buộc")
        .trim(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errors.array() 
            });
        }
        next();
    }
];

const validateArticle = [
    body("title")
        .notEmpty()
        .withMessage("Title là bắt buộc")
        .isLength({ min: 3, max: 100 })
        .withMessage("Title phải từ 3-100 ký tự")
        .trim(),
    body("content")
        .notEmpty()
        .withMessage("Content là bắt buộc")
        .isLength({ min: 10 })
        .withMessage("Content phải có ít nhất 10 ký tự")
        .trim(),
    // body("category_id")
    //     .notEmpty()
    //     .withMessage("Category là bắt buộc")
    //     .isInt()
    //     .withMessage("Category phải là số nguyên")
    //     .trim(),

    // body("publication_date")
    //     .notEmpty()
    //     .withMessage("Publication date là bắt buộc")
    //     .isDate()
    //     .withMessage("Ngày phải là định dạng ngày tháng")
    //     .trim(),
    body("image_url")
        .optional()
        .isURL()
        .withMessage("URL ảnh không hợp lệ")
        .trim(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errors.array()
            });
        }
        next();
    }
];

const validateExist = [
    body("identifier")
        .notEmpty()
        .withMessage("Username hoặc email là bắt buộc")
        .trim()
        .custom((value) => {
            if (value.includes('@')) {
                if (!isEmailValid(value)) {
                    throw new Error("Email không hợp lệ");
                }
            } else {
                if (!isUsernameValid(value)) {
                    throw new Error("Username chỉ được chứa chữ cái, số và dấu gạch dưới");
                }
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errors.array()
            });
        }
        next();
    }
];

export { validateRegister, validateLogin, validateArticle, validateExist };
