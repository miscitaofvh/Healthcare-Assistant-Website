import React, { useState } from "react";
import "./Login.css";
import {requestAPI} from "../../utils/api/request";
import { isEmail } from "../../utils/format/email";

const baseurl_login = "http://localhost:5000/api/auth";

const Login: React.FC = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(isEmail(identifier) === false){
            alert("Please enter a valid email address.");
            return;
        }
        
        const email = identifier;
        
        try {
            const {data} = await requestAPI(baseurl_login, "/login", "POST", {
                email,
                password,
            });

            if(data.success){
                console.log("Login successful:", data);
                alert("Login successful!");
                localStorage.setItem("token", data.token);
            } else {
                console.log("Login failed:", data.error);
                alert(data.error);
            }

        } catch (error: any) {
            console.error("Error:", error.response?.data?.error || "Login failed");
            alert(error.response?.data?.error || "Login failed");
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
                        Not a member? <a href="/register">Sign up now</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
