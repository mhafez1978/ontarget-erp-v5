import Image from "next/image";
import Link from "next/link";
import { BookOpen, Lightbulb, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThemeRendererProps } from "../theme-renderer";
import { BaseThemeRenderer } from "../theme-renderer";

const asText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return "";
};

export function EducationDigitalCampusTheme(props: ThemeRendererProps) {
  const { sections, slug } = props;

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

  const title = asText(content.title) || "Programs that move careers forward";
  const subtitle =
    asText(content.subtitle) ||
    "Live cohorts, self-paced tracks, and mentorship";
  const description =
    asText(content.description) ||
    "Practical curriculum, hands-on projects, and career outcomes supported by real practitioners.";
  const primaryCTA = asText(content.primaryCTA) || "Browse Programs";
  const secondaryCTA = asText(content.secondaryCTA) || "Book a Call";

  const heroImage =
    asText(content.heroImage) ||
    "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80";

  const highlightItems = [
    {
      icon: <BookOpen className="h-6 w-6 text-[#2563EB]" />,
      title: "Structured Curriculum",
      text: "Sprints, projects, and assessments built with industry input.",
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-[#F59E0B]" />,
      title: "Mentor Support",
      text: "Cohort-based guidance, office hours, and feedback loops.",
    },
    {
      icon: <Puzzle className="h-6 w-6 text-[#10B981]" />,
      title: "Career Outcomes",
      text: "Job-search support, interview prep, and alumni networking.",
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_60%),radial-gradient(circle_at_bottom,rgba(248,250,252,0.9),transparent_60%)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4ED8] border border-[#E0ECFF]">
              <span>Digital Campus</span>
              <span className="h-1 w-1 rounded-full bg-[#F59E0B]" />
              <span>Cohort-based learning</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              <span className="block text-[#1F2937]">{title}</span>
              <span className="mt-2 block text-[#2563EB]">{subtitle}</span>
            </h1>

            <p className="max-w-lg text-base text-slate-700 sm:text-lg">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-lg shadow-blue-500/30"
              >
                <Link href={`/store/${slug}/products`}>{primaryCTA}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#2563EB]/60 text-[#2563EB] bg-white hover:bg-[#E0ECFF]"
              >
                <Link href={`/store/${slug}/services`}>{secondaryCTA}</Link>
              </Button>
            </div>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-[#E0ECFF] bg-white shadow-lg">
              <div className="relative h-56 w-full">
                <Image
                  src={heroImage}
                  alt="Digital learning"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {highlightItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#E0ECFF] bg-white/80 p-3 text-left"
                >
                  <div className="mb-2">{item.icon}</div>
                  <p className="text-xs font-semibold text-[#0F172A]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BaseThemeRenderer {...props} sections={remainingSections} />
    </>
  );
}
