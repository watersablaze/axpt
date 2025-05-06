import * as React from "react";

export function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
    />
  );
}