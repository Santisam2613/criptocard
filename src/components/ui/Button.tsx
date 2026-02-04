import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  className?: string;
  leftIcon?: ReactNode;
  variant?: "primary" | "secondary" | "lime";
};

type ButtonAsLinkProps = CommonProps & {
  href: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;

type ButtonAsButtonProps = CommonProps &
  ComponentPropsWithoutRef<"button"> & {
    href?: undefined;
  };

export type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps;

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Button(props: ButtonProps) {
  const {
    children,
    className,
    leftIcon,
    variant = "primary",
    ...rest
  } = props as ButtonProps & Record<string, unknown>;

  const base =
    "cc-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const styles =
    variant === "primary"
      ? "cc-glass-strong cc-neon-outline text-foreground hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(0,0,0,0.14)] active:translate-y-0"
      : variant === "lime"
        ? "cc-gold-cta text-black ring-1 ring-black/10 hover:brightness-[1.06] hover:-translate-y-0.5 hover:shadow-[0_26px_72px_var(--shadow-brand-strong)] active:translate-y-0 active:brightness-[0.98]"
        : "cc-glass border border-border text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(0,0,0,0.14)] active:translate-y-0";

  const content = (
    <>
      {leftIcon ? (
        <span className="inline-flex h-5 w-5 items-center justify-center">
          {leftIcon}
        </span>
      ) : null}
      <span>{children}</span>
    </>
  );

  if ("href" in props) {
    const { href, ...linkProps } = rest as Omit<ButtonAsLinkProps, keyof CommonProps>;
    return (
      <Link href={href} className={cx(base, styles, className)} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cx(base, styles, className)}
      {...(rest as Omit<ButtonAsButtonProps, keyof CommonProps>)}
    >
      {content}
    </button>
  );
}
