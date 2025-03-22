import React from "react";
import styles from "./Contact.module.css";
import Navbar from "../../components/Navbar";
import contact_image from "./img/undraw-contact.svg";

const Contact: React.FC = () => {
  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.container}>
        <div className={styles.form_section}>
          <div className={styles.overlay}></div>
          <div className={styles.form_container}>
            <div className={styles.text_section}>
              <h2>Contact Us</h2>
              <p>
                If you have any questions, feedback, or concerns, please feel free to reach out to us.
                You can contact us by email.
              </p>
              <img src={contact_image} alt="Contact us" />
            </div>

            <div className={styles.form_control}>
              <form>
                <div className={styles.form_group}>
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" />
                </div>

                <div className={styles.form_group}>
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" />
                </div>

                <div className={styles.form_group}>
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message"></textarea>
                </div>

                <button type="submit">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;