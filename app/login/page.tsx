"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Use Next.js Router for navigation
import styles from "./Login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Added loading state

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Reset error on submit
    setLoading(true); // Prevent multiple submissions

    if (!email || !password) {
      setError("❌ Email and password are required.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false, // ✅ Prevent full-page reload
      email,
      password,
    });

    if (result?.error) {
      setError("❌ Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/"); // 🚫 replaced stale /dashboard link); // ✅ Next.js navigation (better UX)
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.title}>Login</h1>

      <form onSubmit={handleSignIn} className={styles.loginForm}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />

        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        {error && <p className={styles.errorMessage}>{error}</p>}

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <p className={styles.signupText}>
        Don’t have an account?{" "}
        <a href="/signup" className={styles.signupLink}>
          Sign Up
        </a>
      </p>
    </div>
  );
}