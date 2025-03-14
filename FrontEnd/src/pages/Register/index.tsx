import React, { useState } from "react";
import axios from "axios";
import "./Register.css";

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        full_name: "",
        dob: "",
        gender: "",
        phone_number: "",
        address: "",
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:5000/api/auth/register", formData);
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response?.data?.error || "Registration failed");
        }
    };

    return (
        <div className="register-container">
            <h1>Register</h1>
            {message && <p className="message">{message}</p>}
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <input type="text" name="full_name" placeholder="Full Name" onChange={handleChange} />
                <input type="date" name="dob" onChange={handleChange} />
                <select name="gender" onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
                <input type="text" name="phone_number" placeholder="Phone Number" onChange={handleChange} />
                <input type="text" name="address" placeholder="Address" onChange={handleChange} />
                <button type="submit">Register</button>
            </form>
        </div>
    );
};

export default Register;
