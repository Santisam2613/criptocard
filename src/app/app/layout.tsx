import type { ReactNode } from "react";
import Script from "next/script";

import TelegramGate from "@/components/telegram/TelegramGate";
import TelegramProvider from "@/components/telegram/TelegramProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <TelegramProvider>
        <div
          className="min-h-[100vh]"
          style={{ minHeight: "calc(var(--cc-app-vh, 1vh) * 100)" }}
        >
          <TelegramGate>{children}</TelegramGate>
        </div>
      </TelegramProvider>
    </>
  );
}
