import React from "react";
import styles from "./About.module.css";
import Navbar from "../../components/Navbar";
import about_image from "./img/about.jpg";

const About: React.FC = () => {
  return (
    <div className={styles.about_page}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.information_container}>
        <div className={styles.image_section}>
          <img src={about_image} alt="About Smart My Service" />
        </div>
        <div className={styles.text_section}>
          <h2>About Smart My Service</h2>
          <p>
            <strong>Smart My Service</strong> is a cutting-edge healthcare platform that combines AI-powered health assistance, smart health tracking, and a community-driven forum to revolutionize the way users manage their well-being.  
            Our AI Health Assistant provides instant answers to health-related questions, while the Smart Health Checker helps users analyze symptoms and gain insights into potential conditions.  
            Through our interactive forum, users can engage with healthcare professionals and a supportive community to share experiences and seek advice.  
            With a focus on accessibility, intelligence, and security, Smart My Service empowers individuals to take control of their health with innovative, user-friendly, and secure digital healthcare solutions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
