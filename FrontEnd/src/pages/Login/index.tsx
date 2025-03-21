import React, { useState } from "react";
import styles from "./Login.module.css";
import {login} from "../../utils/service/auth";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = login(identifier, password);
        if((await response).success) {
            alert((await response).message);
            navigate("/");
        } else if((await response).message) {
            alert((await response).message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.text}>Login</div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                        <span className="fas fa-user"></span>
                        <label>Email or Username</label>
                    </div>
                    <div className={styles.field}>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span className="fas fa-lock"></span>
                        <label>Password</label>
                    </div>
                    <div className={styles.forgot_pass}>
                        <a href="#">Forgot Password?</a>
                    </div>
                    <button type="submit" className={styles.button}>Sign in</button>
                    <div className={styles.sign_up}>
                        Not a member? <a href="/sign-up">Sign up now</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
