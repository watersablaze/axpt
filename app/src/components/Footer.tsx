"use client";

import React from "react";
import styles from "./Footer.module.css";

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.message}>
      <p>
        &copy; 2024 Axis Point. All rights reserved. <br />
        One Platform. Infinite Pathways.
      </p>
    </div>
  </footer>
);

export default Footer;