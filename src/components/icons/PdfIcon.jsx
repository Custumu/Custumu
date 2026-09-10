import React from 'react';

/**
 * Premium SVG PDF Document Icon
 * Features authentic PDF red gradient, folded page corner, decorative document lines,
 * and razor-sharp vector-cut PDF typography.
 */
export default function PdfIcon({ className = 'w-3.5 h-3.5', ...props }) {
  const uniqueId = React.useId();
  const bgGradId = `pdf-bg-grad-${uniqueId}`;
  const foldGradId = `pdf-fold-grad-${uniqueId}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PDF Document"
      {...props}
    >
      <defs>
        {/* Rich vibrant red PDF gradient */}
        <linearGradient id={bgGradId} x1="4.5" y1="1" x2="20.5" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="45%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>

        {/* Translucent corner fold */}
        <linearGradient id={foldGradId} x1="14.5" y1="1" x2="20.5" y2="7" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Main Document Body */}
      <path
        d="M4.5 3C4.5 1.89543 5.39543 1 6.5 1H14.5L20.5 7V21C20.5 22.1046 19.6046 23 18.5 23H6.5C5.39543 23 4.5 22.1046 4.5 21V3Z"
        fill={`url(#${bgGradId})`}
      />

      {/* Corner Fold Drop Shadow */}
      <path
        d="M14.5 1V6C14.5 6.55228 14.9477 7 15.5 7H20.5"
        stroke="#000000"
        strokeOpacity="0.18"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Corner Fold Flap */}
      <path
        d="M14.5 1V5.8C14.5 6.46274 15.0373 7 15.7 7H20.5L14.5 1Z"
        fill={`url(#${foldGradId})`}
      />

      {/* Subtle Document Structure Lines */}
      <rect x="7.5" y="5.2" width="5" height="1.2" rx="0.6" fill="#FFFFFF" fillOpacity="0.6" />
      <rect x="7.5" y="7.7" width="8" height="1.2" rx="0.6" fill="#FFFFFF" fillOpacity="0.6" />

      {/* Vector PDF Letters (fillRule="evenodd" for crisp inner cutouts) */}
      <g fill="#FFFFFF" fillRule="evenodd">
        {/* Letter P */}
        <path d="M5.5 11.5h2.3c.9 0 1.4.6 1.4 1.5s-.5 1.5-1.4 1.5H6.9V18H5.5v-6.5zm1.4 1.2v.6h.8c.3 0 .4-.1.4-.3s-.1-.3-.4-.3h-.8z" />

        {/* Letter D */}
        <path d="M10.15 11.5h2c1.1 0 1.7.8 1.7 2v2.5c0 1.2-.6 2-1.7 2h-2v-6.5zm1.4 1.2v4.1h.5c.6 0 .8-.5.8-1.1v-1.9c0-.6-.2-1.1-.8-1.1h-.5z" />

        {/* Letter F */}
        <path d="M14.8 11.5h3.7v1.2h-2.3v1.4h1.9v1.2h-1.9V18h-1.4v-6.5z" />
      </g>
    </svg>
  );
}
