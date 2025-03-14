import React from "react";
import "./Verify.css";
const Verify = ({ email }) => {
    return (
        <div className="verify-container">
            <div className="verify-content">
                <div className="verify-field">
                    <h2>Please verify your email</h2>
                    <p>We have sent a verification email to <strong>{email}</strong></p>
                    <p>Click the link in the email to verify your account</p>
                    <button className="verify-button">Resend email</button>
                </div>
            </div>
        </div>
    );
};

export default Verify;
// <Verify email="user@example.com" />