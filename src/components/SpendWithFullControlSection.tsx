import Image from "next/image";

export default function SpendWithFullControlSection() {
  return (
    <section className="bg-transparent text-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 sm:gap-12 sm:py-24 lg:grid-cols-2 lg:px-10">
        <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
          <div className="relative h-[360px] w-full max-w-[520px] sm:h-[480px]">
            <Image
              src="/assets/imagen-4-home.png"
              alt="Criptocard preview"
              fill
              priority
              sizes="(min-width: 1024px) 520px, (min-width: 640px) 520px, 100vw"
              className="cc-holo object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.25)]"
            />
          </div>
        </div>

        <div className="cc-glass cc-neon-outline order-1 rounded-3xl px-7 py-7 sm:px-9 sm:py-9 lg:order-2">
          <h2 className="max-w-xl bg-[linear-gradient(135deg,var(--color-foreground),var(--color-brand),var(--color-neon))] bg-clip-text text-4xl font-extrabold leading-[1.05] tracking-tight text-transparent sm:text-5xl">
            SPEND WITH FULL CONTROL
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted sm:text-xl">
            Shop online, in stores or abroad
            <br />
            and track every transaction in
            <br />
            real time.
          </p>
        </div>
      </div>
    </section>
  );
}
