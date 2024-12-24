'use client';

import React, { useState } from 'react';
import styles from './Signup.module.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your form submission logic here
  };

  return (
    <div className={styles.signupContainer}>
      <h1 className={styles.title}>Create Your Account</h1>
      <form onSubmit={handleSubmit} className={styles.signupForm}>
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          className={styles.input}
          onChange={handleChange}
          value={formData.name}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className={styles.input}
          onChange={handleChange}
          value={formData.email}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Create a password"
          className={styles.input}
          onChange={handleChange}
          value={formData.password}
          required
        />
        <button type="submit" className={styles.submitButton}>
          Register
        </button>
      </form>
    </div>
  );
};

export default Signup;