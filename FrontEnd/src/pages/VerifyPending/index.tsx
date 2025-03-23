import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestAPI } from "../../utils/api/request";
import "./VerifyPending.css";

const BASE_URL = "http://localhost:5000/api/verify";

const VerifyPending = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(60);

    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const response = await requestAPI(BASE_URL, "/get-email", "GET", null, null);
                if (response.data?.email) setEmail(response.data.email);
                else navigate("/");
            } catch (error) {
                console.error("Failed to get email from cookie:", error);
                navigate("/");
            }
        };
        fetchEmail();
    }, [navigate]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0) return;
        setCooldown(60);
        setLoading(true);

        try {
            await requestAPI(BASE_URL, "/verify-pending", "POST", { email });
        } catch (error) {
            console.error("Failed to resend email:", error);
            setCooldown(0);
        }

        setLoading(false);
    };

    return (
        <div className="verify-container">
            <div className="verify-content">
                <div className="verify-field">
                    <h2>Please verify your email</h2>
                    <p>We have sent a verification email to <strong>{email}</strong></p>
                    <p>Click the link in the email to verify your account</p>
                    <button className="verify-button" onClick={handleResend} disabled={loading || cooldown > 0}>
                        {loading ? "Sending..." : cooldown > 0 ? `Try again in ${cooldown}s` : "Send email"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyPending;
