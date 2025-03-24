import React, { useEffect, useState } from "react";
import { requestAPI } from "../../utils/api/request";
export default function VerifyEmail() {
    const [status, setStatus] = useState("Verifying...");
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    const BASE_URL = "http://localhost:5000/api/verify";

    useEffect(() => {
        if (!token) {
            setStatus("Invalid verification link.");
            return;
        }

        (async () => {
            try {
                
                const response = await requestAPI(BASE_URL, `/verify-email?token=${token}`, "GET");

                const { data, status } = response;
                
                if (status === 200 && data.success) {
                    setStatus("✅ Email verified successfully!");
                } else {

                    setStatus("❌ Verification failed or your email is already verified.");
                }
            } catch (error) {
                setStatus("❌ An error occurred while verifying.");
            }
        })();
    }, [token]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold">{status}</h2>
                <a href="/" className="mt-4 inline-block text-blue-500">Go to Home</a>
            </div>
        </div>
    );
}