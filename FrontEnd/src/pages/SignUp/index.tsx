import React, { useState } from "react";
import {register} from "../../utils/service/auth";
import styles from "./SignUp.module.css";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await register(formData.username, formData.email, formData.password);
        if (response.success) {
            alert(response.message);
            navigate("/verify-pending", { state: { email: formData.email } });
        } else if (response.message) {
            alert(response.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.text}>Sign Up</div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                    </div>
                    <div className={styles.field}>
                        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                    </div>
                    <div className={styles.field}>
                        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                    </div>
                    <button type="submit" className={styles.btn}>Sign Up</button>
                    <div className={styles.login}>
                        Already have an account? <a href="/login">Log in</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
