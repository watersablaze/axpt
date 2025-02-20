"use client";

import { useState } from "react";

interface AvatarUploaderProps {
  updateSession: () => void; // Ensures proper type safety
}

export default function AvatarUploader({ updateSession }: AvatarUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      <button onClick={uploadAvatar} disabled={uploading || !selectedFile}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {avatarUrl && (
        <>
          <img src={avatarUrl} alt="Avatar Preview" width={100} />
          <button onClick={removeAvatar} disabled={uploading}>
            Remove Avatar
          </button>
        </>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}