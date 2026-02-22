"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import NoticeDialog from "@/components/ui/NoticeDialog";
import { useI18n } from "@/i18n/i18n";

type TabKey = "home";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

function XIcon() {
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
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={[
        "h-5 w-5 transition-transform duration-200",
        open ? "rotate-90" : "rotate-0",
      ].join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["h-6 w-6", active ? "text-black dark:text-white" : ""].join(" ").trim()}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" />
    </svg>
  );
}

function HeadsetIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["h-6 w-6", active ? "text-black dark:text-white" : ""].join(" ").trim()}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-colors",
        active ? "text-zinc-950 dark:text-white" : "text-gray-500 dark:text-gray-400",
      ].join(" ")}
      onClick={onClick}
    >
      <div
        className={[
          "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
          active ? "bg-yellow-500 text-black ring-1 ring-black/10" : "bg-transparent",
        ].join(" ")}
      >
        {icon}
      </div>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const contentId = `faq-${item.id}`;
  return (
    <div className="overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <div className="text-sm font-semibold text-zinc-950 dark:text-white">{item.question}</div>
        <div className="text-zinc-900 dark:text-white/80">
          <ChevronIcon open={open} />
        </div>
      </button>
      {open ? (
        <div id={contentId} className="px-4 pb-4 text-sm leading-relaxed text-gray-600 dark:text-white/70">
          {item.answer}
        </div>
      ) : null}
    </div>
  );
}

async function fetchSupportLink(): Promise<string | null> {
  const res = await fetch("/api/config/support-link", { cache: "no-store" });
  const json = (await res.json().catch(() => null)) as
    | { ok: boolean; supportLink?: string | null; error?: string }
    | null;
  if (!json?.ok) return null;
  const raw = json.supportLink;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export default function SupportPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [tab, setTab] = useState<TabKey>("home");
  const [expandedId, setExpandedId] = useState<string | null>("balance");
  const [query, setQuery] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeLabel, setNoticeLabel] = useState("OK");

  const faqs: FaqItem[] = useMemo(
    () => [
      {
        id: "balance",
        question: t("support.faq.balance.q"),
        answer:
          t("support.faq.balance.a"),
      },
      {
        id: "fees",
        question: t("support.faq.fees.q"),
        answer:
          t("support.faq.fees.a"),
      },
      {
        id: "send",
        question: t("support.faq.send.q"),
        answer:
          t("support.faq.send.a"),
      },
      {
        id: "topup-time",
        question: t("support.faq.time.q"),
        answer:
          t("support.faq.time.a"),
      },
    ],
    [t],
  );

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => {
      const haystack = `${f.question} ${f.answer}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [faqs, query]);

  useEffect(() => {
    if (!filteredFaqs.length) return;
    if (expandedId && filteredFaqs.some((f) => f.id === expandedId)) return;
    setExpandedId(filteredFaqs[0].id);
  }, [expandedId, filteredFaqs]);

  function openNotice(params: { title: string; message: string; confirmLabel: string }) {
    setNoticeTitle(params.title);
    setNoticeMessage(params.message);
    setNoticeLabel(params.confirmLabel);
    setNoticeOpen(true);
  }

  async function onContactAdvisor() {
    const link = await fetchSupportLink().catch(() => null);
    if (!link) {
      openNotice({
        title: t("support.unavailable.title"),
        message: t("support.unavailable.body"),
        confirmLabel: t("common.close"),
      });
      return;
    }

    const wa = window.Telegram?.WebApp;
    if (wa?.openLink) {
      try {
        wa.openLink(link);
        return;
      } catch {}
    }

    window.open(link, "_blank", "noopener,noreferrer");
  }

  function onClose() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/miniapp");
  }

  return (
    <main className="relative min-h-screen bg-[#F4F5F7] px-4 pb-28 pt-10 text-zinc-950 dark:bg-[#0F1115] dark:text-white">
      <div className="mx-auto w-full max-w-[420px]">
        <NoticeDialog
          open={noticeOpen}
          title={noticeTitle}
          message={noticeMessage}
          confirmLabel={noticeLabel}
          onClose={() => setNoticeOpen(false)}
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">{t("support.hero.greeting")}</div>
            <div className="mt-1 text-4xl font-extrabold tracking-tight">
              {t("support.hero.title")}
            </div>
          </div>
          <button
            type="button"
            aria-label={t("common.closeAria")}
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:bg-[#1A1D24] dark:ring-white/10"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>

        <div className="mt-7 space-y-4">
          <div className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-[#1A1D24] dark:ring-white/10">
            <div className="text-sm font-semibold text-zinc-950 dark:text-white">
              {t("support.search.title")}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("support.search.placeholder")}
                className="h-12 w-full rounded-2xl bg-gray-50 px-4 text-sm text-zinc-950 ring-1 ring-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-white/35"
              />
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500 text-black ring-1 ring-black/10">
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
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-[#1A1D24] dark:ring-white/10">
            <div className="text-sm font-semibold text-zinc-950 dark:text-white">{t("support.faq.title")}</div>

            <div className="mt-4 space-y-3">
              {filteredFaqs.length ? (
                filteredFaqs.map((f) => (
                  <FaqRow
                    key={f.id}
                    item={f}
                    open={expandedId === f.id}
                    onToggle={() => setExpandedId((prev) => (prev === f.id ? null : f.id))}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-sm font-semibold text-zinc-500 ring-1 ring-black/5 dark:bg-white/5 dark:text-white/60 dark:ring-white/10">
                  {t("support.search.noResults")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="rounded-3xl bg-white p-2 shadow-lg shadow-black/10 ring-1 ring-black/5 dark:bg-[#1A1D24] dark:ring-white/10">
            <div className="grid grid-cols-2 gap-2">
              <TabButton
                label={t("support.tabs.home")}
                icon={<HomeIcon active={tab === "home"} />}
                active={tab === "home"}
                onClick={() => setTab("home")}
              />
              <TabButton
                label={t("support.tabs.contact")}
                icon={<HeadsetIcon active={false} />}
                active={false}
                onClick={onContactAdvisor}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
