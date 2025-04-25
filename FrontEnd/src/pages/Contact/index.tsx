// File: src/pages/ContactPage.tsx
import React, { useState, ChangeEvent, FormEvent } from "react";
import Navbar from "../../components/Navbar";
import styles from "./Contact.module.css";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  privacy: boolean;
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    privacy: false,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
      setFormData({ name: "", email: "", phone: "", subject: "", message: "", privacy: false });
    // setStatus("Sending...");
    // try {
    //   await fetch("/api/contact", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(formData),
    //   });
      
    // } catch (err) {
    //   setStatus("❌ Error sending message.");
    // }
  };

  return (
    <>
      <Navbar />
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.left}>
            <h1 className={styles.heading}>Get in Touch</h1>
            <div className={styles.underline} />
            <p className={styles.text}>
              We’d love to hear from you! Fill out the form and our team will get back to you within 24 hours.
            </p>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <span className={styles.iconCircle}><i className="fas fa-phone" /></span>
                <div>
                  <h3 className={styles.itemTitle}>Call Us</h3>
                  <p className={styles.itemText}>0705 666 888</p> 
                </div>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.iconCircle}><i className="fas fa-envelope" /></span>
                <div>
                  <h3 className={styles.itemTitle}>Email Us</h3>
                  <p className={styles.itemText}>support@healthcareservice</p>
                </div>
              </li>
              <li className={styles.contactItem}>
                <span className={styles.iconCircle}><i className="fas fa-map-marker-alt" /></span>
                <div>
                  <h3 className={styles.itemTitle}>Visit Us</h3>
                  <p className={styles.itemText}>27 Nguyễn Thị Minh Khai, Quận 1, TP. HCM </p>
                </div>
              </li>
            </ul>
          </div>

          <div className={styles.right}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Nguyen Van A"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="0705 222 444"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="subject">Subject</label>
                <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required>
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="partnership">Partnership Opportunity</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="How can we help you today?"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn}>Send Message</button>
              <div className={styles.secure}>
                <i className="fas fa-lock" /> <i className="fas fa-check-circle" />
                <span>Your information is secure and encrypted</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
