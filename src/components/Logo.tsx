import { LogoMark } from "./LogoMark";

type Props = {
  variant?: "default" | "reversed";
  iconSize?: number;
  textSize?: string;
  className?: string;
};

export function Logo({ variant = "default", iconSize = 28, textSize = "text-xl", className }: Props) {
  const siteColor = variant === "reversed" ? "#F6F4EF" : "#1B2A41";
  const briefColor = "#1BBFA3";

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={iconSize} variant={variant} />
      <span className={`${textSize} font-extrabold leading-none`} style={{ fontFamily: "'Poppins', sans-serif" }}>
        <span style={{ color: siteColor }}>Site</span>
        <span style={{ color: briefColor }}>Brief</span>
      </span>
    </span>
  );
}
