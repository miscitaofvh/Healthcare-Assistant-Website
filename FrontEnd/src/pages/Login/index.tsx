import React, { useState } from "react";
import styles from "./Login.module.css";
import { login } from "../../utils/service/auth";
import { useNavigate } from "react-router-dom";
import Image from "../../assets/images/Login/image.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = login(identifier, password);
    if ((await response).success) {
      alert((await response).message);
      navigate("/");
    } else if ((await response).message) {
      alert((await response).message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <div className={styles.image}>
          <img src={Image} />
        </div>
        <div className={styles.content}>
          <div className={styles.text}>Log In</div>
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or Username"
              />
            </div>

            <div className={styles.field}>
              <span className={styles.iconLeft}>
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <span className={styles.iconRight} onClick={() => setShowPassword(!showPassword)}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>

            <div className={styles.forgotPass}>
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className={styles.button}>Sign in</button>
            <div className={styles.signUp}>
              Not a member? <a href="/sign-up">Sign up now</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
