import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestAPI } from "../../utils/api/request";
import "./VerifyPending.css";

const BASE_URL = "http://localhost:5000/api/verify";

const VerifyPending = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [type, setType] = useState("register"); // Default to register type
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(60);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const response = await requestAPI(BASE_URL, "/get-email", "GET", null, null);
                if (response.data?.email && response.data?.type) {
                    setEmail(response.data.email);
                    setType(response.data.type);
                    
                    // Set appropriate message based on type
                    setMessage(
                        response.data.type === "register" 
                            ? "We have sent a verification email to"
                            : "We have sent a password reset link to"
                    );
                } else {
                    alert(response.data.message);
                    navigate("/");
                }
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
            await requestAPI(BASE_URL, "/verify-pending", "POST", { email, type });
            setMessage(
                type === "register" 
                    ? "Verification email resent to"
                    : "Password reset link resent to"
            );
        } catch (error) {
            console.error("Failed to resend email:", error);
            setCooldown(0);
            setMessage("Failed to resend. Please try again.");
        }

        setLoading(false);
    };

    const getHeaderText = () => {
        return type === "register" 
            ? "Please verify your email" 
            : "Check your email for password reset";
    };

    const getButtonText = () => {
        if (loading) return "Sending...";
        if (cooldown > 0) return `Try again in ${cooldown}s`;
        return type === "register" ? "Resend verification" : "Resend reset link";
    };

    return (
        <div className="verify-container">
            <div className="verify-content">
                <div className="verify-field">
                    <h2>{getHeaderText()}</h2>
                    <p>{message} <strong>{email}</strong></p>
                    <p>
                        {type === "register" 
                            ? "Click the link in the email to verify your account"
                            : "Click the link in the email to reset your password"}
                    </p>
                    <button 
                        className="verify-button" 
                        onClick={handleResend} 
                        disabled={loading || cooldown > 0}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyPending;