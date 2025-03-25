import React from "react";
import styles from "./About.module.css";
import Navbar from "../../components/Navbar";
import about_image from "../../assets/images/About/about.jpg";

const About: React.FC = () => {
  return (
    <div className={styles.about_page}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.information_container}>
        <div className={styles.image_section}>
          <img src={about_image} alt="About My Service" />
        </div>
        <div className={styles.text_section}>
          <h2>AMH Healthcare Service</h2> <p> <strong>Healthcare Service</strong> is an innovative platform offering AI-powered health assistance, smart symptom analysis, and a community forum for personalized well-being management. Our AI Health Assistant provides instant answers, while the Smart Health Checker offers insights into potential conditions. Engage with professionals and a supportive community for advice and shared experiences. With a focus on accessibility, intelligence, and security, AMH empowers users to take control of their health through user-friendly, secure digital solutions. </p>
        </div>
      </div>
    </div>
  );
};

export default About;
