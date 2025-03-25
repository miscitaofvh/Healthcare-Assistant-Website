import React, { useState, useEffect } from "react";
import styles from "./Login.module.css";
import { login } from "../../utils/service/auth";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const Login: React.FC = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showNavbar, setShowNavbar] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await login(identifier, password);
            if (response.success) {
                alert(response.message);
                navigate("/");
            } else {
                alert(response.message || "Login failed, please try again.");
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Show navbar if mouse is near the top of the page (within 10 pixels)
            if (e.clientY <= 10) {
                setShowNavbar(true);
            } else {
                setShowNavbar(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div>
            <div>
                {/* Invisible hover area to trigger navbar */}
                <div className={styles.navbar_hover_area}></div>
                {/* Navbar visibility controlled by state */}
                <div className={`${styles.main_navbar} ${showNavbar ? styles.visible : styles.hidden}`}>
                    <Navbar />
                </div>
            </div>

            <div className={styles.login_page}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <h2 className={styles.text}>Login</h2>
                        <h3 className={styles.text}>Have an account?</h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.field}>
                                {/* <span className={styles.icon}>🔑</span> */}
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                {/* <span className={styles.icon}>🔒</span> */}
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={styles.input}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {/* Toggle Password Visibility */}
                                <span
                                    className={styles.toggleIcon}
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? "👁️‍🗨️" : "👁️"}
                                </span>
                            </div>
                            <div className={styles.forgotPass}>
                                <a href="/">Forgot Password?</a>
                            </div>
                            <button type="submit" className={styles.button}>Sign in</button>
                            <div className={styles.signUp}>
                                Don't have an account? <a href="/sign-up">Sign up</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default Login;
