import * as React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  size?: "small" | "medium" | "large"; // Add size support
}

export function Button({
  children,
  onClick,
  className = "",
  disabled = false,
  size = "medium",
}: ButtonProps) {
  const sizeClasses = {
    small: "px-3 py-1 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-5 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all disabled:bg-gray-400 ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}