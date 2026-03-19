import Link from "next/link";

interface ButtonProps {
  variant?: "primary" | "primary-dark" | "secondary" | "outline-dark" | "text";
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  href,
  children,
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-bold transition-all duration-300 ease-out font-body";

  const variants = {
    primary:
      "bg-blue-500 text-white px-8 py-3.5 rounded-lg shadow-sm hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]",
    "primary-dark":
      "bg-white text-navy px-8 py-3.5 rounded-lg shadow-sm hover:bg-white/95 hover:shadow-[0_4px_16px_rgba(255,255,255,0.25)]",
    secondary:
      "border-2 border-blue-500 text-blue-500 px-8 py-3.5 rounded-lg hover:bg-blue-500 hover:text-white",
    "outline-dark":
      "border-2 border-white text-white px-8 py-3.5 rounded-lg hover:bg-white hover:text-navy",
    text: "text-blue-500 font-semibold btn-text-link",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <button className={classes}>{children}</button>;
}
