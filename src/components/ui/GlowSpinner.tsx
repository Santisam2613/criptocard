"use client";

type GlowSpinnerProps = {
  size?: "sm" | "md" | "lg";
};

export default function GlowSpinner({ size = "md" }: GlowSpinnerProps) {
  const dimension =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";

  return (
    <div className="inline-flex items-center justify-center">
      <div
        className={[
          "relative rounded-full border border-glass-border/60 bg-black/5 dark:bg-white/5",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_32px_var(--shadow-neon-strong)]",
          dimension,
        ].join(" ")}
      >
        <div
          className={[
            "absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-neon)] border-r-[var(--color-neon-2)]",
            "animate-[spin_900ms_linear_infinite]",
          ].join(" ")}
        />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[rgba(55,231,255,0.14)] to-[rgba(139,92,255,0.14)] blur-[6px]" />
      </div>
    </div>
  );
}

