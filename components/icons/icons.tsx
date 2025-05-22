import React from "react";

// Chart type icons
export const AreaChartIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M3 15h4l3-6 4 11 3-7 4 2" />
    <path d="M3 21 21 3" opacity="0" />
    <path d="M3 9c0 0 4.5-1 6-1s4.5 1 6 1 4.5-1 6-1" opacity="0" />
    <path d="M3 15L7 9l3 3l4-1l3 2l4 2" opacity="0" />
    <path d="M21 15V8" opacity="0" />
    <path d="M3 15C9 7 14 9 21 15" opacity="0" />
    <path fill="currentColor" fillOpacity="0.3" d="M3 15h4l3-6 4 11 3-7 4 2v6H3z" />
  </svg>
);

export const LineChartIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M3 15h4l3-6 4 11 3-7 4 2" />
  </svg>
);

export const CandleChartIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 3v18h18" />
    <rect x="5" y="8" width="2" height="6" />
    <line x1="6" y1="6" x2="6" y2="8" />
    <line x1="6" y1="14" x2="6" y2="16" />
    <rect x="9" y="10" width="2" height="8" fill="currentColor" />
    <line x1="10" y1="7" x2="10" y2="10" />
    <line x1="10" y1="18" x2="10" y2="20" />
    <rect x="13" y="5" width="2" height="7" />
    <line x1="14" y1="3" x2="14" y2="5" />
    <line x1="14" y1="12" x2="14" y2="14" />
    <rect x="17" y="6" width="2" height="5" fill="currentColor" />
    <line x1="18" y1="4" x2="18" y2="6" />
    <line x1="18" y1="11" x2="18" y2="13" />
  </svg>
);

export const BarChartIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M7 16v-3" />
    <path d="M11 16v-8" />
    <path d="M15 16v-5" />
    <path d="M19 16v-2" />
  </svg>
); 