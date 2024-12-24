'use client';

import React, { useState } from 'react';
import styles from './Login.module.css';

const LoginPage = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login logic
    setMessage('Login successful!');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Login</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Enter your password"
          className={styles.input}
          required
        />
        <button type="submit" className={styles.submitButton}>
          Login
        </button>
      </form>
      {message && (
        <div className={`${styles.message} ${styles.successMessage}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default LoginPage;