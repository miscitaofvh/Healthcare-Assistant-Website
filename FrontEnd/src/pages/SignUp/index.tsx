import React, { useState } from "react";
import { register } from "../../utils/service/auth";
import { requestAPI } from "../../utils/api/request";
import { useNavigate } from "react-router-dom";
import styles from "./SignUp.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faXmark, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useModal } from "../../contexts/ModalContext";
import Image from "../../assets/images/Login/image.jpg";

const BASE_URL = "http://localhost:5000/api/verify";

const validateInput = (name: string, value: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (name === "username" && !usernameRegex.test(value)) return "Username chỉ được chứa chữ cái, số và dấu gạch dưới";
    if (name === "email" && !emailRegex.test(value)) return "Email không hợp lệ";
    if (name === "password" && !passwordRegex.test(value)) return "Password phải có ít nhất 8 ký tự, bao gồm chữ và số";

    return "";
};


const SignUp: React.FC = () => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [errors, setErrors] = useState({ username: "", email: "", password: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { closeModal, openModal } = useModal();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: validateInput(name, value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.values(errors).some((err) => err)) return;
        setIsSubmitting(true);
        const response = await register(formData.username, formData.email, formData.password);
        setIsSubmitting(false);

        if (response.success) {
            requestAPI(BASE_URL, "/verify-pending", "POST", { email: formData.email });
            navigate("/verify-pending");
        } else {
            alert(response.message);
        }
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
                    <h2 className={styles.text}>Sign Up</h2>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <span className={styles.iconLeft}>
                                <FontAwesomeIcon icon={faUser} />
                            </span>
                            <input type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange} required />
                            {errors.username && <small className={styles.error}>{errors.username}</small>}
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
                                onChange={handleChange} required />
                            {errors.email && <small className={styles.error}>{errors.email}</small>}
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
                                required
                            />
                            <span className={styles.iconRight} onClick={() => setShowPassword(!showPassword)}>
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </span>
                            {errors.password && <small className={styles.error}>{errors.password}</small>}
                        </div>
                        <button type="submit" className={styles.btn} disabled={isSubmitting || Object.values(errors).some((err) => err)}>
                            {isSubmitting ? "Signing Up..." : "Sign Up"}
                        </button>
                        <div className={styles.login}>
                            Already have an account? <a href="/login">Log in</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
