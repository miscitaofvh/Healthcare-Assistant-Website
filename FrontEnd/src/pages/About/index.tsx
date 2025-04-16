import React from "react";
import styles from "./About.module.css";
import Navbar from "../../components/Navbar";
import { FaHeartbeat, FaBrain, FaShieldAlt, FaUsers } from "react-icons/fa";

const About: React.FC = () => {
  return (
    <div className={styles.about_page}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>


      <div className={styles.content_container}>
        <div className={styles.text_section}>
          <h2>AMH Healthcare Service</h2>
          <p>
            <strong>Healthcare Service</strong> is an innovative platform offering AI-powered health assistance, smart symptom analysis, and a community forum for personalized well-being management. Our AI Health Assistant provides instant answers, while the Smart Health Checker offers insights into potential conditions.
          </p>
          
          <div className={styles.features_grid}>
            <div className={styles.feature_card}>
              <FaHeartbeat className={styles.feature_icon} />
              <h3>AI Health Assistant</h3>
              <p>24/7 instant answers to your health questions</p>
            </div>
            <div className={styles.feature_card}>
              <FaBrain className={styles.feature_icon} />
              <h3>Smart Analysis</h3>
              <p>Advanced symptom checking with insights</p>
            </div>
            <div className={styles.feature_card}>
              <FaShieldAlt className={styles.feature_icon} />
              <h3>Secure Platform</h3>
              <p>Your data privacy is our priority</p>
            </div>
            <div className={styles.feature_card}>
              <FaUsers className={styles.feature_icon} />
              <h3>Community Support</h3>
              <p>Connect with professionals and peers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;