import { Dumbbell, Flame, Timer } from "lucide-react";
import Link from "next/link";


;
import { Button } from "@/components/ui/button";
import type { ThemeRendererProps } from "../theme-renderer";
import { BaseThemeRenderer } from "../theme-renderer";

const asText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return "";
};

export function FitnessBoutiqueTheme(props: ThemeRendererProps) {
  const { sections, featuredServices, slug } = props;

  const heroSection = sections.find(
    (section) => section.type === "hero" && section.enabled
  );

  if (!heroSection) {
    return <BaseThemeRenderer {...props} />;
  }

  const remainingSections = sections.filter(
    (section) => section !== heroSection
  );
  const content = (heroSection.content || {}) as Record<string, unknown>;

  const title =
    asText(content.title) || "Train with Intensity. Recover with Intention.";
  const subtitle =
    asText(content.subtitle) ||
    "Small-group sessions, 1:1 coaching, and recovery labs";
  const description =
    asText(content.description) ||
    "Personalized programming, evidence-based coaching, and community accountability.";
  const primaryCTA = asText(content.primaryCTA) || "Start a Trial";
  const secondaryCTA = asText(content.secondaryCTA) || "View Schedule";

  const highlightServices =
    featuredServices && featuredServices.length > 0
      ? featuredServices.slice(0, 3)
      : [
          {
            id: "svc1",
            name: "Strength Lab",
            description: "Heavy lifts, progressive overload, and coaching.",
          },
          {
            id: "svc2",
            name: "Conditioning Crew",
            description: "High-energy conditioning sessions with coaching.",
          },
          {
            id: "svc3",
            name: "Mobility Studio",
            description: "Recovery, mobility, and breath work.",
          },
        ];

  const icons = [
    <Dumbbell key="d" className="h-7 w-7 text-orange-400" />,
    <Flame key="f" className="h-7 w-7 text-orange-400" />,
    <Timer key="t" className="h-7 w-7 text-orange-400" />,
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-[#0B0F1A] text-[#F9FAFB]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,250,251,0.08),transparent_60%),radial-gradient(circle_at_bottom,rgba(248,113,113,0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(135deg,rgba(15,23,42,0.8),rgba(17,24,39,0.9))]" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/50 bg-black/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-orange-300">
              <span>Training Studio</span>
              <span className="h-1 w-1 rounded-full bg-orange-400" />
              <span>Evidence-Based Coaching</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              <span className="block">{title}</span>
              <span className="mt-2 block text-orange-400">{subtitle}</span>
            </h1>

            <p className="max-w-lg text-base text-slate-200 sm:text-lg">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-black font-semibold shadow-lg shadow-orange-700/40"
              >
                <Link href={`/store/${slug}/services`}>{primaryCTA}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-orange-400/70 bg-transparent text-orange-100 hover:bg-orange-500/10"
              >
                <Link href={`/store/${slug}/services`}>{secondaryCTA}</Link>
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300 sm:text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Small-group and 1:1 coaching
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                No long-term contracts
              </span>
            </div>
          </div>

          <div className="w-full max-w-md">
            <div className="grid gap-4 sm:grid-cols-3">
              {highlightServices.map((service, index) => {
                const svc = service as {
                  id?: string;
                  name?: string;
                  description?: string;
                };
                return (
                  <div
                    key={svc.id || index}
                    className="rounded-2xl border border-orange-500/40 bg-black/40 p-4 shadow-lg shadow-black/40"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {icons[index % icons.length]}
                        <h3 className="text-sm font-semibold leading-tight">
                          {svc.name}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300">
                      {svc.description ||
                        "Focused, coached sessions built around your goals."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <BaseThemeRenderer {...props} sections={remainingSections} />
    </>
  );
}
