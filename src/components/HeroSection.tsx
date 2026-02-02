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
    <section className="relative overflow-hidden bg-background text-foreground">
      <Header />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 sm:gap-12 sm:py-20 lg:grid-cols-2 lg:px-10">
        <div>
          <h1 className="max-w-xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            VIRTUAL CARD
            <br />
            INSIDE YOUR
            <br />
            TELEGRAM
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-white/70 sm:text-xl">
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
            >
              Get card with Telegram
            </Button>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute right-1/2 top-8 h-[320px] w-[320px] translate-x-1/2 rounded-full bg-brand sm:right-8 sm:top-10 sm:translate-x-0 sm:h-[420px] sm:w-[420px] lg:right-12 lg:top-12" />
          <div className="relative h-[380px] w-full max-w-[520px] sm:h-[520px]">
            <Image
              src="/assets/imagen1-home.png"
              alt="Criptocard app preview"
              fill
              priority
              sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 100vw"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
