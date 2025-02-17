"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./Profile.module.css";

export default function Profile() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("johndoe@example.com");
  const [avatar, setAvatar] = useState("/assets/user-avatar.png");

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.sectionTitle}>Profile</h2>

      {/* 🖼️ Profile Picture */}
      <div className={styles.avatarContainer}>
        <Image src={avatar} alt="User Avatar" width={80} height={80} className={styles.avatar} />
      </div>

      {/* ✍️ Editable Fields */}
      <div className={styles.inputGroup}>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className={styles.inputGroup}>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <button className={styles.saveButton}>Save Changes</button>
    </div>
  );
}