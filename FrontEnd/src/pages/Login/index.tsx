import React from "react";
import { useState } from "react";
import "./Login.css";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        //console.log("Email or Phone:", email);
        //console.log("Password:", password);
        try {
            const { data } = await axios.post("http://localhost:5000/api/login", {
                username: email,
                password,
            });

            if (data.success) {
                console.log("Login successful:", data);
            } else {
                console.log("Login failed:", data.message);
            }
        }
        catch (error: any) {
            console.error("Error:", error.response?.data || error.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-text">Login Form</div>
                <form onSubmit={handleSubmit}>
                    <div className="login-field">
                        <input
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <span className="fas fa-user"></span>
                        <label>Email or Phone</label>
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
                        Not a member? <a href="#">Sign up now</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
