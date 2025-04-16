import React, { useState } from "react";
import styles from "./Login.module.css";
import { useAuth } from "../../contexts/AuthContext";
import Image from "../../assets/images/Login/image.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useModal } from "../../contexts/ModalContext";


const Login: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { closeModal, openModal } = useModal();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await login(formData.identifier, formData.password);
      if (response.success) {
        closeModal();
      } else {
        alert(response.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      alert("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <div className={styles.exit} onClick={closeModal}>
          <FontAwesomeIcon icon={faXmark} />
        </div>
        <div className={styles.image}>
          <img src={Image} alt="Login" />
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
            <div className={styles.forgotPass}>
              <a onClick={(e) => { e.preventDefault(); openModal("forgot-password"); }}>Forgot Password?</a>
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
