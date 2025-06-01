import React, { useState } from "react";
import { register } from "../../utils/service/auth";
import { requestAPI } from "../../utils/api/request";
import styles from "./SignUp.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faXmark,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import { useModal } from "../../contexts/ModalContext";
import { isUsernameValid, isEmailValid } from "../../utils/validate/identifier";
import {
  PasswordStrength,
  PasswordCheckService,
} from "../../utils/validate/passwd";
import Image from "../../assets/images/Login/image.jpg";
import { getApiUrl } from "../../config/env";

const BASE_URL = getApiUrl("/verify");

const validateInput = (name: string, value: string): string => {
  if (name === "username" && !isUsernameValid(value)) {
    return "Username chỉ được chứa chữ cái, số và dấu gạch dưới";
  }
  if (name === "email" && !isEmailValid(value)) {
    return "Email không hợp lệ";
  }
  if (name === "password") {
    const strength = PasswordCheckService.checkPasswordStrength(value);
    if (strength === PasswordStrength.Short)
      return "Password phải có ít nhất 8 ký tự";
    if (strength === PasswordStrength.Common)
      return "Password quá phổ biến, vui lòng chọn password mạnh hơn";
    if (strength === PasswordStrength.Weak)
      return "Password quá yếu, đảm bảo có ký tự đặc biệt, chữ hoa và số";
  }
  return "";
};

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    general: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const { closeModal, openModal } = useModal();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateInput(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      username: validateInput("username", formData.username),
      email: validateInput("email", formData.email),
      password: validateInput("password", formData.password),
      general: "",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) return;

    const response = await register(
      formData.username,
      formData.email,
      formData.password
    );
    
    if (response.success) {
      closeModal();
      openModal("message", {
        message: "Liên kết xác thực đã được gửi về email của bạn.",
      });
    } else {
      if (typeof response.message === "string") {
        setErrors((prev) => ({ ...prev, general: response.message }));
      } else if (typeof response.message === "object") {
        setErrors((prev) => ({ ...prev, ...response.message }));
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <div className={styles.exit} onClick={closeModal}>
          <FontAwesomeIcon icon={faXmark} />
        </div>
        <div className={styles.image}>
          <img src={Image} alt="Sign up visual" />
        </div>
        <div className={styles.content}>
          <h2 className={styles.text}>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.username && (
                <small className={styles.error}>{errors.username}</small>
              )}
            </div>
            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.email && (
                <small className={styles.error}>{errors.email}</small>
              )}
            </div>
            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <span
                className={styles.iconRight}
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
              {errors.password && (
                <small className={styles.error}>{errors.password}</small>
              )}
            </div>
            {errors.general && (
              <div
                className={styles.error}
                style={{ textAlign: "center", marginBottom: 10 }}
              >
                {errors.general}
              </div>
            )}
            <button type="submit" className={styles.btn}>
              Sign Up
            </button>
            <div className={styles.login}>
              Already have an account?{" "}
              <a
                onClick={(e) => {
                  e.preventDefault();
                  openModal("login");
                }}
              >
                Log in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
