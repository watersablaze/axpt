'use client';

import React, { useState } from 'react';
import styles from './Contact.module.css';

const ContactPage = () => {
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setMessage('Thank you for reaching out! We will get back to you shortly.');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Contact Us</h1>
      <p className={styles.description}>
        Have questions or feedback? We’d love to hear from you! Please fill out the form below and we’ll get in touch as soon as possible.
      </p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Name"
          className={styles.input}
          required
        />
        <input
          type="email"
          placeholder="Your Email"
          className={styles.input}
          required
        />
        <textarea
          placeholder="Your Message"
          className={styles.textarea}
          required
        />
        <button type="submit" className={styles.submitButton}>
          Submit
        </button>
      </form>
      {isSubmitted && (
        <div className={`${styles.message} ${styles.successMessage}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ContactPage;