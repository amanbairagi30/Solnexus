"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function GlowBox() {
  return (
    <div className="relative w-24 h-24 perspective-1000">
      <div className="absolute inset-0 bg-blue-600 rounded-2xl transform rotate-3d(1, 1, 1, 15deg) transition-all duration-300 hover:rotate-3d(1, 1, 1, 20deg) hover:shadow-[0_0_40px_15px_rgba(147,51,234,0.4)]">
        {/* Smooth gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 rounded-2xl overflow-hidden">
          {/* Central spotlight effect */}
          <div className="absolute inset-0 bg-radial-gradient-spotlight opacity-70"></div>

          {/* Subtle edge highlight */}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-blue-300 to-transparent opacity-20"></div>

          {/* Icon container */}
          <div className="relative flex items-center justify-center w-full h-full">
            <Sparkles className="w-10 h-10 text-blue-100 opacity-90 filter " />
          </div>
        </div>
      </div>
    </div>
  );
}
