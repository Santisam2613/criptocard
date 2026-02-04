"use client";

import { useMemo, useState } from "react";

function PlusIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-6 w-6 items-center justify-center"
    >
      <span className="absolute h-[2px] w-4 rounded-full bg-black dark:bg-brand" />
      <span
        className={[
          "absolute h-4 w-[2px] rounded-full bg-black transition-transform duration-200 dark:bg-brand",
          open ? "scale-y-0" : "scale-y-100",
        ].join(" ")}
      />
    </span>
  );
}

export default function DarkFeaturesFaqSection() {
  const items = useMemo(
    () => [
      {
        q: "What is Criptocard?",
        a: "Criptocard is a Visa card experience inside Telegram, designed for fast top-ups and everyday spending.",
      },
      {
        q: "Are there any fees for registration or getting the card?",
        a: "Any applicable fees are shown before you confirm your card and can vary by region and card type.",
      },
    ],
    [],
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-transparent text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-24 lg:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="cc-glass cc-neon-outline relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_20%_0%,rgba(255,255,255,0.10),transparent_55%)]" />
            <div className="relative">
              <p className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                Use your card in over 150 countries.
                <br />
                Easy KYC.
              </p>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                Verify your identity in minutes with our quick
                <br />
                KYC process, available in most major
                <br />
                regions.
              </p>
            </div>
          </div>

          <div className="cc-glass cc-neon-outline relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_20%_0%,rgba(255,255,255,0.10),transparent_55%)]" />
            <div className="relative">
              <p className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                Visa Signature® benefits
              </p>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                As a Visa partner, Criptocard provides only Visa
                <br />
                Signature® cards. Enjoy premium benefits
                <br />
                like airport lounge access, travel accident
                <br />
                insurance, and emergency medical &amp; dental
                <br />
                coverage.
              </p>
            </div>
          </div>
        </div>

        <div className="cc-glass mt-6 rounded-full px-4 py-4 text-center sm:px-6">
          <p className="text-base font-semibold tracking-tight sm:text-lg">
            All features are available directly in your Telegram
          </p>
        </div>

        <div className="mt-16 sm:mt-20">
          <h2 className="text-center text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-brand sm:text-5xl">
            F.A.Q.
          </h2>
          <div className="mx-auto mt-10 max-w-3xl">
            {items.map((item, index) => {
              const open = openIndex === index;
              const contentId = `faq-${index}`;

              return (
                <div key={item.q} className="border-b border-border py-6">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-6 text-left text-lg font-semibold"
                    aria-expanded={open}
                    aria-controls={contentId}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span>{item.q}</span>
                    <PlusIcon open={open} />
                  </button>

                  <div
                    id={contentId}
                    className={[
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
