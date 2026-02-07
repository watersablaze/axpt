'use client';

type Props = {
  itemId: string;
};

export function UploadButton({ itemId }: Props) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(
      `/api/axpt/items/${itemId}/artifact`,
      {
        method: 'POST',
        body: form,
      }
    );

    if (!res.ok) {
      alert('Upload failed');
    } else {
      alert('Uploaded successfully');
      // later: refresh item state
    }
  }

  return (
    <label className="text-xs cursor-pointer text-blue-400 hover:underline">
      Upload
      <input
        type="file"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
}