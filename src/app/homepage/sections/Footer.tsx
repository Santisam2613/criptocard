"use client";

import { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import PrivacyPolicyContent from "@/miniapp/dashboard/PrivacyPolicyContent";
import TermsAndConditionsContent from "@/miniapp/dashboard/TermsAndConditionsContent";

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <footer className="mt-12 pb-12 text-center text-xs text-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 lg:px-8">
        <p>&copy; 2026 CriptoCard. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="text-xs text-muted underline decoration-muted/50 underline-offset-4 hover:text-foreground"
          >
            Política de privacidad
          </button>
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-xs text-muted underline decoration-muted/50 underline-offset-4 hover:text-foreground"
          >
            Términos y condiciones
          </button>
        </div>
      </div>

      <BottomSheet
        open={privacyOpen}
        label="Política de privacidad"
        onClose={() => setPrivacyOpen(false)}
      >
        <PrivacyPolicyContent />
      </BottomSheet>

      <BottomSheet
        open={termsOpen}
        label="Términos y condiciones"
        onClose={() => setTermsOpen(false)}
      >
        <TermsAndConditionsContent />
      </BottomSheet>
    </footer>
  );
}
