import React from "react";

// Original small illustrations keep each starting point recognisable without prose.
export default function FeatureArtwork({ kind, className = "" }) {
  return (
    <svg
      className={`feature-art ${className}`}
      viewBox="0 0 180 110"
      fill="none"
      aria-hidden="true"
    >
      {kind === "activity" ? (
        <>
          <path
            d="M62 21h56a34 34 0 0 1 0 68H62a34 34 0 0 1 0-68Z"
            fill="currentColor"
            fillOpacity=".08"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M62 31h56a24 24 0 0 1 0 48H62a24 24 0 0 1 0-48Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M62 41h56a14 14 0 0 1 0 28H62a14 14 0 0 1 0-28Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M84 21v20M91 21v20M98 21v20"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="51" cy="78" r="8" fill="currentColor" />
          <path
            d="M40 14h12M46 8v12M143 98h12"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      ) : kind === "gaming" ? (
        <>
          <path
            d="M54 35c-13 0-19 12-23 35-4 20 7 24 16 13l11-13h64l11 13c9 11 20 7 16-13-4-23-10-35-23-35H54Z"
            fill="currentColor"
            fillOpacity=".08"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path d="M52 46v22M41 57h22" stroke="currentColor" strokeWidth="5" />
          <circle cx="125" cy="47" r="4" fill="currentColor" />
          <circle cx="137" cy="58" r="4" fill="currentColor" />
          <circle cx="113" cy="58" r="4" fill="currentColor" />
          <circle cx="125" cy="69" r="4" fill="currentColor" />
          <path
            d="M81 54h7M94 54h7M90 35V23c0-8 19-3 19-13M142 14v10M137 19h10"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle cx="73" cy="71" r="5" stroke="currentColor" strokeWidth="2" />
          <circle
            cx="102"
            cy="71"
            r="5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <path
            d="m50 21 104 24-3 14a9 9 0 0 0-4 18l-3 14L40 67l3-14a9 9 0 0 0 4-18l3-14Z"
            fill="currentColor"
            fillOpacity=".09"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="m28 47 104-24 3 14a9 9 0 0 0 4 18l3 14L38 93l-3-14a9 9 0 0 0-4-18l-3-14Z"
            fill="var(--art-surface)"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="m105 30 11 45"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
          <path
            d="m57 51 36-8M60 61l22-5M63 71l31-7"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M35 15v12M29 21h12M153 91v10M148 96h10"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );
}
