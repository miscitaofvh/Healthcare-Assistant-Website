import React, { useState } from "react";
import "./Login.css";
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
        <div className="login-container">
            <div className="login-content">
                <div className="login-text">Login</div>
                <form onSubmit={handleSubmit}>
                    <div className="login-field">
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                        <span className="fas fa-user"></span>
                        <label>Email or Username</label>
                    </div>
                    <div className="login-field">
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span className="fas fa-lock"></span>
                        <label>Password</label>
                    </div>
                    <div className="login-forgot-pass">
                        <a href="#">Forgot Password?</a>
                    </div>
                    <button type="submit" className="login-button">Sign in</button>
                    <div className="login-sign-up">
                        Not a member? <a href="/sign-up">Sign up now</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
