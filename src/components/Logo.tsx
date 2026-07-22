import React from "react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  variant?: "light" | "dark" | "white" | "blue" | "currentColor";
  iconOnly?: boolean;
}

export default function Logo({ className = "", iconClassName = "", variant = "currentColor", iconOnly = false }: LogoProps) {
  // Select color mappings to guarantee high-contrast readability against different background states
  const strokeColor = 
    variant === "white" ? "#ffffff" : 
    variant === "blue" ? "#3b82f6" : 
    variant === "dark" ? "#0f172a" : 
    variant === "light" ? "#38bdf8" : 
    "currentColor";

  const textColorTop = 
    variant === "white" ? "text-white" : 
    variant === "blue" ? "text-blue-500" : 
    variant === "dark" ? "text-slate-800" : 
    "text-white";

  const textColorBottom = 
    variant === "white" ? "text-white" : 
    variant === "blue" ? "text-blue-600 font-extrabold" : 
    variant === "dark" ? "text-slate-950 font-black" : 
    "text-white font-black";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Vector SVG Icon */}
      <svg 
        viewBox="0 0 100 100" 
        className={`h-10 w-10 shrink-0 ${iconClassName}`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* House Outer Frame */}
        <path 
          d="M 15 40 L 15 75 L 43 75 M 57 75 L 85 75 L 85 41 L 50 17 L 15 40" 
          stroke={strokeColor} 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* Left Roof Chimney */}
        <path 
          d="M 28 28 L 28 23 L 33 23 L 33 31.5" 
          stroke={strokeColor} 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Doorway Opening Frame */}
        <path 
          d="M 43 75 L 43 51 L 57 51 L 57 75" 
          stroke={strokeColor} 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Perspective Swinging Door Leaf */}
        <path 
          d="M 43 51 L 28 55 L 28 81 L 43 75 Z" 
          fill={strokeColor} 
          opacity="0.95"
        />

        {/* Upward cursor pointer inside door opening */}
        <path 
          d="M 37 67 L 45 59 L 50 64 L 46 65 L 47 70 L 44 71 L 43 66 Z" 
          fill={variant === "white" ? "#50a2ff" : "#ffffff"} 
        />

        {/* Wireless Radio waves / beacon broadcast */}
        <circle cx="50" cy="44" r="2.5" fill={strokeColor} />
        <path 
          d="M 42 38 A 11 11 0 0 1 58 38" 
          stroke={strokeColor} 
          strokeWidth="4" 
          strokeLinecap="round" 
        />
        <path 
          d="M 36 32 A 20 20 0 0 1 64 32" 
          stroke={strokeColor} 
          strokeWidth="4" 
          strokeLinecap="round" 
        />

        {/* Network connection bus lines and terminals */}
        {/* Left branch node */}
        <path 
          d="M 37 41 L 27 50 L 27 57" 
          stroke={strokeColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <circle cx="27" cy="59.5" r="3.5" fill={strokeColor} />

        {/* Right branch node */}
        <path 
          d="M 63 41 L 73 50 L 73 57" 
          stroke={strokeColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <circle cx="73" cy="59.5" r="3.5" fill={strokeColor} />
      </svg>

      {/* Structured accessible typography set precisely mirroring original branding */}
      {!iconOnly && (
        <div className="flex flex-col leading-none text-left select-none">
          <span className={`text-[12px] md:text-[13px] font-extrabold tracking-tight ${textColorTop}`}>
            AI Open House
          </span>
          <span className={`text-[13.5px] md:text-[14.5px] font-black tracking-[0.08em] uppercase -mt-0.5 ${textColorBottom}`}>
            CONNECT
          </span>
        </div>
      )}
    </div>
  );
}
