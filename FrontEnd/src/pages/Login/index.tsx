import React, { useState } from "react";
import styles from "./Login.module.css";
import { login } from "../../utils/service/auth";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent page refresh
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

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h2 className={styles.text}>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <span className={styles.icon}>🔑</span>
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
                        <span className={styles.icon}>🔒</span>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.forgotPass}>
                        <a href="#">Forgot Password?</a>
                    </div>
                    <button type="submit" className={styles.button}>Login</button>
                    <div className={styles.signUp}>
                        Don't have an account? <a href="/sign-up">Sign up</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
