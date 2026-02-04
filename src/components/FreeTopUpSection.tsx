import Image from "next/image";

export default function FreeTopUpSection() {
  return (
    <section className="bg-transparent text-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 sm:gap-12 sm:py-24 lg:grid-cols-2 lg:px-10">
        <div className="cc-glass cc-neon-outline rounded-3xl px-7 py-7 sm:px-9 sm:py-9">
          <h2 className="max-w-xl bg-[linear-gradient(135deg,var(--color-foreground),var(--color-neon),var(--color-brand))] bg-clip-text text-4xl font-extrabold leading-[1.05] tracking-tight text-transparent sm:text-5xl">
            FREE CRYPTO &amp; FIAT TOP-UP
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted sm:text-xl">
            Easy top up, Fast processing.
            <br />
            0% commission.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative h-[360px] w-full max-w-[520px] sm:h-[480px]">
            <Image
              src="/assets/imagen-3-home.png"
              alt="Criptocard preview"
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
