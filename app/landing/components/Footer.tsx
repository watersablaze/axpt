"use client";

import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© 2024 AXPT.io | All Rights Reserved</p>
      <div className={styles.socials}>
        <a href="https://twitter.com/axpt" target="_blank">Twitter</a>
        <a href="https://linkedin.com/company/axpt" target="_blank">LinkedIn</a>
      </div>
    </footer>
  );
}