export const HeroIllustration = () => (
  <div className="relative w-full max-w-3xl mx-auto">
    <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
    <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
    <svg
      className="relative"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#8B5CF6"
        d="M45.3,-78.2C58.3,-71.3,68.3,-58.4,77.1,-44.3C85.9,-30.2,93.5,-15.1,93.4,-0.1C93.3,15,85.5,30,75.6,42.6C65.7,55.2,53.7,65.4,40.1,73.4C26.5,81.4,13.3,87.2,-0.9,88.7C-15.1,90.2,-30.2,87.4,-44,80.7C-57.8,74,-70.4,63.4,-79.4,49.8C-88.4,36.2,-93.9,18.1,-92.8,0.6C-91.7,-16.9,-84,-33.8,-74.1,-48.4C-64.2,-63,-52.1,-75.3,-38,-81.5C-23.9,-87.7,-11.9,-87.8,2.1,-91.3C16.1,-94.8,32.2,-85.1,45.3,-78.2Z"
        transform="translate(100 100)"
        className="animate-morph"
      />
    </svg>
  </div>
);
