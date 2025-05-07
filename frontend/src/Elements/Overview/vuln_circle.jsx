import React, { useState } from "react";
import "./Overview.css";

const severityConfig = {
  Critical: {
    color: "hsl(0, 68%, 75%)",
    onHoverColor: "hsl(0, 68%, 55%)",
    gradient: "linear-gradient(135deg, #FF6B6B, #9B0101)",
  },
  High: {
    color: "hsl(33, 100%, 75%)",
    onHoverColor: "hsl(33, 100%, 55%)",
    gradient: "linear-gradient(135deg, #FF8A65, #FF0606)",
  },
  Medium: {
    color: "hsl(47, 100%, 75%)",
    onHoverColor: "hsl(47, 100%, 55%)",
    gradient: "linear-gradient(135deg, #FFD54F, #F48800)",
  },
  Low: {
    color: "hsl(198, 94%, 75%)",
    onHoverColor: "hsl(198, 94%, 55%)",
    gradient: "linear-gradient(135deg, #4FC3F7, #00ABF7)",
  },
};

function Vuln_circle({ count, severity }) {
  const { color, onHoverColor, gradient } = severityConfig[severity];
  const [currentColor, setCurrentColor] = useState(color);

  return (
    <div
      className="flex flex-col items-center flex-grow vuln-circle"
      onMouseEnter={() => setCurrentColor(onHoverColor)}
      onMouseLeave={() => setCurrentColor(color)}
    >
      <div className="relative w-48 h-48">
        <svg className="w-48 h-48" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={currentColor}
            strokeWidth="10"
            style={{ stroke: `url(#gradient-${severity})` }}
          />
          <defs>
            <linearGradient id={`gradient-${severity}`}>
              <stop
                offset="0%"
                stopColor={gradient
                  .split(",")[0]
                  .replace("linear-gradient(135deg, ", "")}
              />
              <stop
                offset="100%"
                stopColor={gradient.split(",")[1].trim().replace(")", "")}
              />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-5xl font-bold"
            style={{ color: gradient.split(",")[1].trim().replace(")", "") }}
          >
            {count}
          </span>
        </div>
      </div>
      <p className="mt-4 text-center text-sm">{severity}</p>
    </div>
  );
}

export default Vuln_circle;
