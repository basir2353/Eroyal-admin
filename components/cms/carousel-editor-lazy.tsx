"use client";

import dynamic from "next/dynamic";

const HeroCarouselEditor = dynamic(
  () =>
    import("@/components/cms/hero-carousel-editor").then((mod) => ({
      default: mod.HeroCarouselEditor,
    })),
  {
    loading: () => (
      <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Loading carousel editor…
      </div>
    ),
  },
);

export function CarouselEditorLazy() {
  return <HeroCarouselEditor />;
}
