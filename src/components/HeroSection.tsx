import Button from "@/components/Button";
import Header from "@/components/Header";
import Image from "next/image";

function TelegramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M21.9 4.6c.3-1.3-1-2.4-2.2-1.9L2.8 9.2c-1.4.5-1.4 2.5 0 3l4.3 1.5 1.6 5.2c.4 1.2 1.9 1.6 2.9.8l2.8-2.3 4.3 3.2c1 .7 2.4.2 2.7-1l2.7-15zM8.1 12.7l9.8-6.1c.2-.1.4.2.2.4l-8 7.3c-.3.3-.5.7-.5 1.1l-.3 3.1c0 .3-.4.4-.5.1l-1.1-3.7c-.2-.6.1-1.4.7-1.7z" />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-transparent text-foreground">
      <Header />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 sm:gap-12 sm:py-20 lg:grid-cols-2 lg:px-10">
        <div className="cc-glass cc-neon-outline rounded-3xl px-7 py-7 sm:px-9 sm:py-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-4 py-2 text-xs font-semibold text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-neon)] shadow-[0_0_22px_var(--shadow-neon-strong)]" />
            Next-gen crypto card UI
          </div>
          <h1 className="mt-6 max-w-xl bg-[linear-gradient(135deg,var(--color-foreground),var(--color-brand),var(--color-neon))] bg-clip-text text-5xl font-extrabold leading-[0.95] tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            VIRTUAL CARD
            <br />
            INSIDE YOUR
            <br />
            TELEGRAM
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted sm:text-xl">
            Top Up with Crypto.
            <br />
            Spend Anywhere!
          </p>
          <div className="mt-10">
            <Button
              href="https://t.me/CriptocardBot"
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<TelegramIcon />}
              variant="lime"
            >
              Get card with Telegram
            </Button>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="cc-holo absolute right-1/2 top-8 h-[320px] w-[320px] translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--color-neon),transparent_55%),radial-gradient(circle_at_70%_20%,var(--color-brand),transparent_55%),radial-gradient(circle_at_50%_80%,var(--color-neon-2),transparent_60%)] opacity-30 blur-2xl sm:right-8 sm:top-10 sm:translate-x-0 sm:h-[420px] sm:w-[420px] lg:right-12 lg:top-12" />
          <div className="relative h-[380px] w-full max-w-[520px] sm:h-[520px]">
            <Image
              src="/assets/imagen1-home.png"
              alt="Criptocard app preview"
              fill
              priority
              sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 100vw"
              className="cc-holo object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.25)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
