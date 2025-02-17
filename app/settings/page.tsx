"use client";

import { useState } from "react";
import styles from "./Settings.module.css";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.sectionTitle}>Settings</h2>

      {/* 🔧 Notifications */}
      <div className={styles.settingOption}>
        <label>Enable Notifications</label>
        <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
      </div>

      {/* 🌙 Dark Mode */}
      <div className={styles.settingOption}>
        <label>Dark Mode</label>
        <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
      </div>

      <button className={styles.saveButton}>Save Changes</button>
    </div>
  );
}