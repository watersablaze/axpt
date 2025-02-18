"use client";

import { useState } from "react";

export default function AvatarUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/user/upload-avatar", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      setAvatarUrl(data.avatar);
    }

    setUploading(false);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={uploadAvatar} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {avatarUrl && <img src={avatarUrl} alt="Avatar Preview" width={100} />}
    </div>
  );
}