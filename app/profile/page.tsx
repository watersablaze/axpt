"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import styles from "./Profile.module.css";

export default function Profile() {
  const [name, setName] = useState<string>("John Doe");
  const [email, setEmail] = useState<string>("johndoe@example.com");
  const [avatar, setAvatar] = useState<string>("/assets/user-avatar.png");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // ✅ Handle avatar file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      setMessage(""); // Clear any previous messages
    }
  };

  // ✅ Upload avatar function (Simulated)
  const uploadAvatar = async (): Promise<void> => {
    if (!selectedFile) {
      setMessage("❌ Please select an image first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulated API request (Replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // ✅ Generate object URL for preview
      setAvatar(URL.createObjectURL(selectedFile));
      setMessage("✅ Avatar updated successfully!");
    } catch (error) {
      console.error("❌ Upload Error:", error);
      setMessage("❌ Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Save profile data
  const handleSave = async (): Promise<void> => {
    setMessage("Saving profile...");

    try {
      // Simulated API request (Replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage("✅ Profile updated successfully!");
    } catch (error) {
      console.error("❌ Save Error:", error);
      setMessage("❌ Error updating profile.");
    }
  };

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.sectionTitle}>Profile</h2>

      {/* 🖼️ Profile Picture */}
      <div className={styles.avatarContainer}>
        <Image
          src={avatar}
          alt="User Avatar"
          width={100}
          height={100}
          className={styles.avatar}
          priority
        />
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={uploadAvatar} disabled={uploading || !selectedFile}>
          {uploading ? "Uploading..." : "Upload Avatar"}
        </button>
      </div>

      {/* ✍️ Editable Fields */}
      <div className={styles.inputGroup}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* 📝 Save Button */}
      <button className={styles.saveButton} onClick={handleSave}>
        Save Changes
      </button>

      {/* 🚀 Message Box */}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}