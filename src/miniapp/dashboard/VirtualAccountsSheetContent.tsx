import { useI18n } from "@/i18n/i18n";

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 9h10v10H9z" />
      <path d="M5 15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function Field({
  label,
  value,
  copy,
}: {
  label: string;
  value: string;
  copy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-black/35">{label}</div>
        <div className="mt-1 truncate text-base font-semibold text-[#2E6BFF]">
          {value}
        </div>
      </div>
      {copy ? (
        <div className="text-[#2E6BFF]">
          <CopyIcon />
        </div>
      ) : null}
    </div>
  );
}

export default function VirtualAccountsSheetContent() {
  const { t } = useI18n();
  return (
    <div className="px-6 pb-8 pt-6 text-zinc-950 dark:text-white">
      <div className="cc-glass cc-neon-outline overflow-hidden rounded-3xl">
        <div className="relative h-72 overflow-hidden rounded-3xl bg-[radial-gradient(100%_80%_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] px-6 pt-7 dark:bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]">
          <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_0%,rgba(0,0,0,0.10),transparent_60%)] dark:bg-[radial-gradient(70%_80%_at_50%_0%,rgba(0,0,0,0.28),transparent_60%)]" />

          <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-3xl bg-white px-6 py-5 shadow-[0_26px_70px_rgba(0,0,0,0.28)]">
            <Field label={t("sheets.beneficiary")} value={t("sheets.yourName")} copy />
            <Field label={t("sheets.accountNumber")} value="•••••••••1919" copy />
            <Field label={t("sheets.wireRouting")} value="0123456789" copy />
            <Field label={t("sheets.achRouting")} value="9876543210" copy />
          </div>
        </div>

        <div className="px-6 pb-7 pt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold tracking-tight">
              {t("sheets.virtualAccountsTitle")}
            </div>
            <div className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-white/70">
              {t("sheets.virtualAccountsBody")}
            </div>
          </div>

          <div className="mt-7">
            <button
              type="button"
              className="cc-cta cc-gold-cta inline-flex h-14 w-full items-center justify-center rounded-2xl text-base font-semibold text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0"
            >
              {t("sheets.verifyAccount")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
