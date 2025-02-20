"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./Profile.module.css";

export default function Profile() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("johndoe@example.com");
  const [avatar, setAvatar] = useState("/assets/user-avatar.png");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Handle avatar file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setMessage(""); // Clear any previous messages
    }
  };

  // ✅ Upload avatar function (Simulated for now)
  const uploadAvatar = async () => {
    if (!selectedFile) return setMessage("Please select an image first.");

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Replace with actual URL from server
      setAvatar(URL.createObjectURL(selectedFile));
      setMessage("✅ Avatar updated successfully!");
    } catch (err) {
      setMessage("❌ Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Save profile data
  const handleSave = async () => {
    setMessage("Saving profile...");

    try {
      // Simulate API request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage("✅ Profile updated successfully!");
    } catch (error) {
      setMessage("❌ Error updating profile.");
    }
  };

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.sectionTitle}>Profile</h2>

      {/* 🖼️ Profile Picture */}
      <div className={styles.avatarContainer}>
        <Image src={avatar} alt="User Avatar" width={100} height={100} className={styles.avatar} />
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={uploadAvatar} disabled={uploading || !selectedFile}>
          {uploading ? "Uploading..." : "Upload Avatar"}
        </button>
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

      {/* 📝 Save Button */}
      <button className={styles.saveButton} onClick={handleSave}>Save Changes</button>

      {/* 🚀 Message Box */}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}