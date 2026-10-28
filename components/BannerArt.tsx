type Props = {
  className?: string;
};

const keyLetters = ["S", "H", "A", "R", "P", "E", "N", "E", "R"];
const keySize = 135;
const keyStep = 150;

// Inline (not <img src="/banner.svg">) so fills can read the theme's CSS
// variables and follow the user's palette and light/dark choice.
export default function BannerArt({ className }: Props) {
  return (
    <svg
      viewBox="0 0 2400 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Sharpener"
      className={className}
    >
      {/* Background */}
      <rect width="2400" height="900" fill="var(--neutral-600)" />

      {/* Sharpening stone */}
      <rect
        x="120"
        y="220"
        width="2160"
        height="460"
        rx="30"
        ry="30"
        fill="var(--neutral-800)"
        stroke="var(--neutral-900)"
        strokeWidth="45"
      />

      {/* Subtle stone highlight */}
      <rect
        x="150"
        y="245"
        width="2100"
        height="410"
        rx="20"
        ry="20"
        fill="var(--neutral-700)"
        opacity="0.65"
      />

      {/* Keyboard keys - first key is the primary accent */}
      <g transform="translate(520 375)">
        {keyLetters.map(renderKey)}
      </g>
    </svg>
  );
}

function renderKey(letter: string, index: number) {
  const isAccentKey = index === 0;
  const keyX = index * keyStep;

  return (
    <g key={index}>
      <rect
        x={keyX}
        y="0"
        width={keySize}
        height={keySize}
        rx="10"
        ry="10"
        fill={isAccentKey ? "var(--primary-600)" : "var(--neutral-50)"}
        stroke={isAccentKey ? "var(--neutral-50)" : "var(--neutral-900)"}
        strokeWidth="14"
      />
      <text
        x={keyX + 68}
        y="88"
        fontFamily="Arial Black, sans-serif"
        fontSize="82"
        fontWeight="900"
        fill={isAccentKey ? "#FFFFFF" : "var(--neutral-900)"}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {letter}
      </text>
    </g>
  );
}
