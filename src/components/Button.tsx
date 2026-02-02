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
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const styles =
    variant === "primary"
      ? "border border-border bg-surface-2 text-foreground shadow-[0_14px_30px_rgba(0,0,0,0.12)] hover:bg-surface hover:-translate-y-0.5 active:translate-y-0"
      : variant === "lime"
        ? "bg-brand text-black shadow-[0_14px_30px_rgba(0,0,0,0.12)] hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0"
        : "border border-border bg-surface text-foreground hover:bg-surface-2 hover:-translate-y-0.5 active:translate-y-0";

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
