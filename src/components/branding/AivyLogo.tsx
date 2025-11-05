import React from 'react';

interface AivyLogoProps {
  height?: number;
  className?: string;
}

/**
 * Aivy Logo - Horizontal Layout with Golden Ratio
 * 
 * Design Principles:
 * - Logomark height: 100 units (base)
 * - Logotype height: 61.8 units (61.8% of logomark - golden ratio)
 * - Spacing: 25 units (25% of logomark height)
 * - Aspect ratio: 1:3 (horizontal)
 * - Baseline aligned
 */
export function AivyLogo({ height = 40, className = '' }: AivyLogoProps) {
  // Calculate proportions based on golden ratio
  const logomarkHeight = 100;
  const logotypeHeight = 61.8; // 61.8% of logomark
  const spacing = 25; // 25% of logomark
  const totalWidth = 300; // 1:3 aspect ratio
  
  return (
    <svg
      width={height * 3}
      height={height}
      viewBox={`0 0 ${totalWidth} ${logomarkHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradient for logomark */}
        <linearGradient id="aivy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      
      {/* Logomark - Stylized "A" symbol */}
      <g id="logomark">
        {/* Modern geometric "A" with gradient */}
        <path
          d="M 50 10 L 70 90 L 55 90 L 52 75 L 28 75 L 25 90 L 10 90 L 30 10 Z M 48 62 L 40 25 L 32 62 Z"
          fill="url(#aivy-gradient)"
        />
        {/* Accent dot */}
        <circle cx="40" cy="15" r="4" fill="url(#aivy-gradient)" opacity="0.8" />
      </g>
      
      {/* Logotype - "Aivy" text */}
      <g id="logotype" transform={`translate(${80 + spacing}, ${logomarkHeight - logotypeHeight})`}>
        {/* Using geometric sans-serif style letterforms */}
        
        {/* A */}
        <path
          d="M 5 61.8 L 15 0 L 25 0 L 35 61.8 L 27 61.8 L 25 48 L 15 48 L 13 61.8 Z M 16 41 L 24 41 L 20 15 Z"
          fill="currentColor"
        />
        
        {/* i */}
        <circle cx="45" cy="5" r="3" fill="currentColor" />
        <rect x="42" y="15" width="6" height="46.8" rx="3" fill="currentColor" />
        
        {/* v */}
        <path
          d="M 58 15 L 68 61.8 L 60 61.8 L 54 30 L 48 61.8 L 40 61.8 L 50 15 Z"
          fill="currentColor"
        />
        
        {/* y */}
        <path
          d="M 78 15 L 88 61.8 L 88 75 Q 88 82 82 82 L 75 82 L 75 76 L 80 76 Q 82 76 82 73 L 82 61.8 L 76 30 L 70 61.8 L 62 61.8 L 72 15 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

/**
 * Compact version for smaller spaces (sidebars, mobile)
 */
export function AivyLogoCompact({ height = 32, className = '' }: AivyLogoProps) {
  return (
    <svg
      width={height}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="aivy-gradient-compact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      
      {/* Logomark only - for compact spaces */}
      <path
        d="M 50 10 L 70 90 L 55 90 L 52 75 L 28 75 L 25 90 L 10 90 L 30 10 Z M 48 62 L 40 25 L 32 62 Z"
        fill="url(#aivy-gradient-compact)"
      />
      <circle cx="40" cy="15" r="4" fill="url(#aivy-gradient-compact)" opacity="0.8" />
    </svg>
  );
}
