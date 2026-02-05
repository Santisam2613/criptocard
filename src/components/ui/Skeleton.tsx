"use client";

import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: "full" | "md" | "xl" | "2xl";
};

export default function Skeleton({
  className,
  rounded = "full",
  ...props
}: SkeletonProps) {
  const radius =
    rounded === "md"
      ? "rounded-md"
      : rounded === "xl"
        ? "rounded-xl"
        : rounded === "2xl"
          ? "rounded-2xl"
          : "rounded-full";

  return (
    <div
      aria-hidden="true"
      className={["cc-skeleton", radius, className ?? ""].join(" ").trim()}
      {...props}
    />
  );
}

