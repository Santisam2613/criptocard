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
        <TelegramGate>{children}</TelegramGate>
      </TelegramProvider>
    </>
  );
}

