"use client";
import React from 'react';

export const Logo = ({ className, size = 28 }: { className?: string, size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 28 28" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="28" height="28" rx="8" fill="black"/>
    <text 
      x="14" 
      y="18" 
      textAnchor="middle" 
      fill="white" 
      fontSize="11" 
      fontWeight="900" 
      fontFamily="'Inter', sans-serif"
    >
      air.
    </text>
  </svg>
);
