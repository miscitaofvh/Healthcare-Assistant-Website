import React, { useState } from "react";
import styles from "./Login.module.css";
import { login } from "../../utils/service/auth";
import { useNavigate } from "react-router-dom";
import Image from "../../assets/images/Login/image.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useModal } from "../../contexts/ModalContext";

const validateInput = (name: string, value: string) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(name === "identifier") {
    if(value.includes("@")) {
      if(!emailRegex.test(value)) return "Email không hợp lệ";
    } else {
      if(!usernameRegex.test(value)) return "Username chỉ được chứa chữ cái, số và dấu gạch dưới";
    }
  }
  if(name === "password") {
    if(value.length < 6) return "Password phải có ít nhất 6 ký tự";
  }
  return "";
};


const Login: React.FC = () => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { closeModal, openModal } = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(errors).some((err) => err)) return;
    const response = login(formData.identifier, formData.password);
    if ((await response).success) {
      alert((await response).message);
      navigate("/");
    } else if ((await response).message) {
      alert((await response).message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateInput(name, value) }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <div className={styles.exit} onClick={closeModal}>
          <FontAwesomeIcon icon={faXmark} />
        </div>
        <div className={styles.image}>
          <img src={Image} />
        </div>
        <div className={styles.content}>
          <div className={styles.text}>Log In</div>
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                type="text"
                name="identifier"
                placeholder="Email or Username"
                required
                value={formData.identifier}
                onChange={handleChange}
              />
            </div>
            {errors.identifier && <small className={styles.error}>{errors.identifier}</small>}
            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                name="password"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}      
              />
              <span className={styles.iconRight} onClick={() => setShowPassword(!showPassword)}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>
            {errors.password && <small className={styles.error}>{errors.password}</small>}
            <div className={styles.forgotPass}>
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className={styles.button}>Sign in</button>
            <div className={styles.signUp}>
              Not a member? <a onClick={(e) => { e.preventDefault(); openModal("sign-up"); }}>Sign up now</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
