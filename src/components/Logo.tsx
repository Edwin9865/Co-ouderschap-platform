import React from "react";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-9 h-9" }: LogoProps) {
  return (
    <img
      src="/ChatGPT_Image_17_feb_2026,_09_48_08.png"
      alt="CoParenting Logo"
      className={className}
    />
  );
}
