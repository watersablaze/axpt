"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface AvatarUploaderProps {
  updateSession: () => void; // Ensures proper type safety
}

export default function AvatarUploader({ updateSession }: AvatarUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch existing avatar on mount
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch("/api/user/avatar");
        const data = await res.json();
        if (res.ok && data.avatar) {
          setAvatarUrl(data.avatar);
        }
      } catch (err) {
        console.error("Failed to fetch avatar:", err);
      }
    };
    fetchAvatar();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null); // Clear error when user selects a file
    }
  };

  const uploadAvatar = async () => {
    if (!selectedFile) {
      setError("Please select an image to upload.");
      return;
    }

    setUploading(true);
    setError(null); // Reset error state

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to upload avatar.");

      setAvatarUrl(data.avatar);
      updateSession(); // ✅ Refresh session to reflect new avatar
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      const response = await fetch("/api/user/remove-avatar", { method: "DELETE" });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to remove avatar.");

      setAvatarUrl(null);
      updateSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        disabled={uploading} 
      />
      <button 
        onClick={uploadAvatar} 
        disabled={uploading || !selectedFile}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {avatarUrl && (
        <>
          <Image 
            src={avatarUrl} 
            alt="Avatar Preview" 
            width={100} 
            height={100} 
            priority
            style={{ borderRadius: "50%" }}
          />
          <button onClick={removeAvatar}>Remove Avatar</button>
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}