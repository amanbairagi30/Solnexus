export const WaveBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <svg
      className="absolute left-0 top-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 1200 800"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="animate-wave-slow"
        d="M 0 300 Q 300 150 600 300 T 1200 300 V 800 H 0 Z"
        fill="rgba(79, 70, 229, 0.1)"
      />
      <path
        className="animate-wave-fast"
        d="M 0 300 Q 300 200 600 300 T 1200 300 V 800 H 0 Z"
        fill="rgba(99, 102, 241, 0.15)"
      />
    </svg>
  </div>
);
