import React, { useState, useEffect } from "react";
import { requestAPI } from "../../utils/api/request";
import "./Verify.css";
const BASE_URL = "http://localhost:5000/api/";

const Verify = ({ email, onResend }) => {
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            console.log(`Cooldown: ${cooldown}s`);
            const timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (!onResend || cooldown > 0) return;

        setCooldown(60);
        setLoading(true);

        try {
            const requestData: any = { email };
            const response = await requestAPI(BASE_URL, "/verify", "POST", requestData);

            //console.log(data.message);
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
                        {loading ? "Sending..." : cooldown > 0 ? `Try again  ${cooldown}s` : "Resend email"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Verify;