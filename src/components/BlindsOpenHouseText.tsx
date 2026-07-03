import React from "react";

export default function BlindsOpenHouseText() {
  const chars = ["O", "p", "e", "n", " ", "H", "o", "u", "s", "e"];

  return (
    <span className="blind-wrapper">
      {chars.map((char, index) => {
        if (char === " ") {
          return (
            <span key={`slat-${index}`} className={`blind-slat blind-slat-space blind-slat-${index}`}>
              <span className="blind-slat-inner">
                <span className="blind-face blind-face-front" />
                <span className="blind-face blind-face-back" />
              </span>
            </span>
          );
        }

        return (
          <span key={`slat-${index}`} className={`blind-slat blind-slat-char blind-slat-${index}`}>
            <span className="blind-slat-inner">
              <span className="blind-face blind-face-front" />
              <span className="blind-face blind-face-back">
                <span className="blind-letter-box">
                  <span className="blind-letter">{char}</span>
                </span>
              </span>
            </span>
          </span>
        );
      })}
    </span>
  );
}
