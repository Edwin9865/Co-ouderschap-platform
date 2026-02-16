import React from "react";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-9 h-9" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left parent figure */}
      <path
        d="M16 18C16 15.7909 17.7909 14 20 14C22.2091 14 24 15.7909 24 18C24 20.2091 22.2091 22 20 22C17.7909 22 16 20.2091 16 18Z"
        fill="#2563EB"
        opacity="0.9"
      />
      <path
        d="M14 26C14 24.8954 14.8954 24 16 24H24C25.1046 24 26 24.8954 26 26V34C26 35.1046 25.1046 36 24 36H16C14.8954 36 14 35.1046 14 34V26Z"
        fill="#2563EB"
        opacity="0.9"
      />

      {/* Right parent figure */}
      <path
        d="M24 18C24 15.7909 25.7909 14 28 14C30.2091 14 32 15.7909 32 18C32 20.2091 30.2091 22 28 22C25.7909 22 24 20.2091 24 18Z"
        fill="#3B82F6"
        opacity="0.9"
      />
      <path
        d="M22 26C22 24.8954 22.8954 24 24 24H32C33.1046 24 34 24.8954 34 26V34C34 35.1046 33.1046 36 32 36H24C22.8954 36 22 35.1046 22 34V26Z"
        fill="#3B82F6"
        opacity="0.9"
      />

      {/* Child figure (center, smaller) */}
      <circle
        cx="24"
        cy="30"
        r="3"
        fill="#60A5FA"
      />
      <path
        d="M20 34C20 33.4477 20.4477 33 21 33H27C27.5523 33 28 33.4477 28 34V38C28 38.5523 27.5523 39 27 39H21C20.4477 39 20 38.5523 20 38V34Z"
        fill="#60A5FA"
      />

      {/* Connecting heart shape overlay */}
      <path
        d="M24 12C24 12 18 8 14 12C10 16 14 24 24 32C34 24 38 16 34 12C30 8 24 12 24 12Z"
        fill="none"
        stroke="#2563EB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  );
}
