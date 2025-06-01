import { useEffect, useState } from "react";
import { requestAPI } from "../../utils/api/request";
import { getApiUrl } from "../../config/env";
import styles from "./VerifyEmail.module.css";

const BASE_URL = getApiUrl("/verify");

export default function VerifyEmail() {
  const [status, setStatus] = useState("Đang xác minh email...");
  const [type, setType] = useState<"success" | "error" | "loading">("loading");
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("Liên kết xác minh không hợp lệ.");
      setType("error");
      return;
    }

    (async () => {
      try {
        const response = await requestAPI(
          BASE_URL,
          `/verify-email?token=${token}`,
          "GET"
        );
        const { data, status } = response;

        if (status === 200 && data.success) {
          setStatus("Email của bạn đã được xác minh thành công!");
          setType("success");
        } else {
          setStatus("Xác minh thất bại hoặc email đã được xác minh trước đó.");
          setType("error");
        }
      } catch (error) {
        setStatus("Có lỗi xảy ra trong quá trình xác minh.");
        setType("error");
      }
    })();
  }, [token]);

  const getStatusClass = () => {
    if (type === "success") return styles.verifyTitleSuccess;
    if (type === "error") return styles.verifyTitleError;
    return styles.verifyTitleLoading;
  };

  return (
    <div className={styles.verifyOverlay}>
      <div className={styles.verifyModal}>
        <h1 className={`${styles.verifyTitle} ${getStatusClass()}`}>{status}</h1>
        <p className={styles.verifyMessage}>
          Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
        </p>
        <a href="/" className={styles.verifyButton}>
          Quay về trang chủ
        </a>
      </div>
    </div>
  );
}
