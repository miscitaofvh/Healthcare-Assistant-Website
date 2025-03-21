import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { requestAPI } from "../../utils/api/request";
import "./VerifyPending.css";

const BASE_URL = "http://localhost:5000/api/";

const VerifyPending = ({ email }) => {
    const location = useLocation();
    const email = location.state?.email || "";
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            console.log(`Cooldown: ${cooldown}s`);
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0) return;
        setCooldown(60);
        setLoading(true);

        try {
            const response = await requestAPI(BASE_URL, "/verify-pending", "POST", { email });
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