import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { signIn } from "next-auth/react";
import styles from "./HeroSection.module.css";

const HeroSection = () => {
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage("Processing your signup...");

    const form = e.currentTarget;
    const formData = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      industry: (form.elements.namedItem("industry") as HTMLSelectElement).value,
      interests: (form.elements.namedItem("interests") as HTMLSelectElement).value,
    };

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormMessage("Signup successful! Logging you in...");

        const loginResponse = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (loginResponse?.ok) {
          setFormMessage("Welcome! Redirecting to your dashboard...");
          setTimeout(() => {
            window.location.href = "/" // 🚫 replaced stale /dashboard link;
          }, 2000);
        } else {
          setFormMessage("Signup succeeded, but auto-login failed. Please login manually.");
        }

        form.reset();
      } else {
        setFormMessage(data.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Signup Error:", err);
      setFormMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.hero}>
      {/* ✅ AXI Logo with Smooth Slide-in Animation */}
      <motion.div
        className={styles.logoContainer}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <Image
          src="/AXI.png"
          alt="AXI Logo"
          width={120}
          height={120}
          priority
          className={styles.logoTopLeft}
        />
      </motion.div>

      <div className={styles.content}>
        <p className={styles.tagline}>
          The currency exchange portal connecting <br />
          technology, trade, and culture into a <br />
          global symphony of progress.
        </p>
      </div>

      {/* ✅ Background Image with Smooth Fade-in */}
      <motion.div
        className={styles.mapContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <Image
          src="/large-map.png"
          alt="Arrow Map"
          width={700}
          height={500}
          className={styles.LargeMap}
          priority
        />
      </motion.div>

      {/* Signup Form */}
      <div className={styles.signupForm}>
        <h2 className={styles.formTitle}>Register Here</h2>
        <form onSubmit={handleSignup} autoComplete="off">
          <div className={styles.inputGroup}>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Enter your name" required />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" required />
          </div>

          {/* ✅ Password Field */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                aria-label="Toggle password visibility"
              >
                {passwordVisible ? <Visibility /> : <VisibilityOff />}
              </button>
            </div>
          </div>

          {/* ✅ Industry Selection */}
          <div className={styles.inputGroup}>
            <label htmlFor="industry">Industry</label>
            <select id="industry" name="industry" required>
              <option value="">Select your industry</option>
              <option value="finance">Finance</option>
              <option value="technology">Technology</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* ✅ Interests Selection */}
          <div className={styles.inputGroup}>
            <label htmlFor="interests">Core Interests</label>
            <select id="interests" name="interests" required>
              <option value="">Select your interests</option>
              <option value="sustainability">Sustainability</option>
              <option value="blockchain">Blockchain</option>
              <option value="investment">Investment</option>
              <option value="culturalExchange">Cultural Exchange</option>
            </select>
          </div>

          <motion.button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
            whileHover={{
              scale: isSubmitting ? 1 : 1.05,
              background: isSubmitting ? "#ccc" : "linear-gradient(90deg, #175a25, #9db42d)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? "Processing..." : "Access"}
          </motion.button>
        </form>
        {formMessage && <p className={styles.formMessage}>{formMessage}</p>}
      </div>
    </section>
  );
};

export default HeroSection;