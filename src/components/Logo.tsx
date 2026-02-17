import React from "react";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-9 h-9" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="CoParenting Logo"
      className={className}
    />
  );
}
