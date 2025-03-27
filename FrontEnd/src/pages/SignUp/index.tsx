import React, { useState } from "react";
import { register } from "../../utils/service/auth";
import { requestAPI } from "../../utils/api/request";
import { useNavigate } from "react-router-dom";
import styles from "./SignUp.module.css";

const BASE_URL = "http://localhost:5000/api/verify";

const validateInput = (name: string, value: string) => {
    if (name === "username" && value.length < 3) return "Username must be at least 3 characters.";
    if (name === "email" && !/^\S+@\S+\.\S+$/.test(value)) return "Invalid email format.";
    if (name === "password" && value.length < 6) return "Password must be at least 6 characters.";
    return "";
};

const SignUp: React.FC = () => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [errors, setErrors] = useState({ username: "", email: "", password: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
            <div className={styles.content}>
                <h2 className={styles.text}>Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                        {errors.username && <small className={styles.error}>{errors.username}</small>}
                    </div>
                    <div className={styles.field}>
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                        {errors.email && <small className={styles.error}>{errors.email}</small>}
                    </div>
                    <div className={styles.field}>
                        <div className={styles.passwordContainer}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <span className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? "🙈" : "👁"}
                            </span>
                        </div>
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
    );
};

export default SignUp;
