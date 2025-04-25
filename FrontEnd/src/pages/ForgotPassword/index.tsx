import React, { useState } from "react";
import styles from "./ForgotPassword.module.css";
import Image from "../../assets/images/Login/image.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useModal } from "../../contexts/ModalContext";
import { requestAPI } from "../../utils/api/request";

const BASE_URL = "http://localhost:5000/api/auth";

const ForgotPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { closeModal, openModal } = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await requestAPI(BASE_URL, "/exist", "POST", {
        identifier: formData.identifier
      });

      if (response.status === 200 && response.data?.exist) {
        alert("User exists!"); // Or handle next steps here
      } else {
        setError("User not found. Please check your email/username.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user edits the input
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <div className={styles.exit} onClick={closeModal}>
          <FontAwesomeIcon icon={faXmark} />
        </div>
        <div className={styles.image}>
          <img src={Image} alt="Password reset" />
        </div>
        <div className={styles.content}>
          <div className={styles.text}>Reset Password</div>

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                type="text"
                name="identifier"
                placeholder="Email or Username"
                required
                value={formData.identifier}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {error && (
              <div className={styles.error}>
                <div>User not found.</div>
                <div>Please check your email/username.</div>
              </div>
            )}

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              {loading ? "Processing..." : "Continue"}
            </button>

            <div className={styles.signUp}>
              Not a member?{" "}
              <a href="#" onClick={(e) => {
                e.preventDefault();
                openModal("sign-up");
              }}>
                Sign up now
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;