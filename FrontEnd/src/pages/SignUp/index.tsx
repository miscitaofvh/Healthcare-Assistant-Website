import React, { useState } from "react";
import axios from "axios";
import "./SignUp.css";

const SignUp = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:5000/api/auth/register", formData);
            alert(response.data.message);
        } catch (error) {
            alert(error.response?.data?.error || "Registration failed");
        }
    };

    return (
        <div className="sign-up-container">
            <div className="sign-up-content">
                <div className="sign-up-text">Sign Up</div>
                <form onSubmit={handleSubmit}>
                    <div className="sign-up-field">
                        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                    </div>
                    <div className="sign-up-field">
                        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                    </div>
                    <div className="sign-up-field">
                        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                    </div>
                    <button type="submit" className="sign-up-btn">Sign Up</button>
                    <div className="sign-up-login">
                        Already have an account? <a href="/login">Log in</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
