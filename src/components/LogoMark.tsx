type Props = {
  size?: number;
  variant?: "default" | "reversed";
  className?: string;
};

const TEAL = "#1BBFA3";

export function LogoMark({ size = 32, variant = "default", className }: Props) {
  const shieldFill = variant === "reversed" ? "#F6F4EF" : "#1B2A41";
  const circleFill = variant === "reversed" ? "#1B2A41" : "#FFFFFF";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20,16 Q20,4 32,4 H68 Q80,4 80,16 V52 Q80,74 62,88 Q56,93 50,98 Q44,93 38,88 Q20,74 20,52 Z"
        fill={shieldFill}
      />
      <circle cx="50" cy="38" r="24" fill={circleFill} />
      <rect x="33" y="38" width="8" height="12" rx="2.5" fill={TEAL} />
      <rect x="46" y="30" width="8" height="20" rx="2.5" fill={TEAL} />
      <rect x="59" y="22" width="8" height="28" rx="2.5" fill={TEAL} />
    </svg>
  );
}
