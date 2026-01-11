"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Marquee } from "@/components/ui/marquee";
import { TestimonialForm } from "@/components/storefront/testimonial-form";

type Testimonial = {
  id: string;
  customerName: string;
  testimonial: string;
  customerPhoto?: string | null;
};

type TestimonialFormProps = {
  slug?: string;
  apiPath?: string;
} | null;

type ApprovedTestimonialsProps = {
  testimonialFormProps: TestimonialFormProps;
};

export function ApprovedTestimonials({
  testimonialFormProps,
}: ApprovedTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Responsive number of stacks: 12 on xs, 10 on md and up
  // Responsive number of stacks: default 12, but 10 on xl and 2xl (>=1280px)
  const [stacks, setStacks] = useState<number>(() => {
    if (typeof window === "undefined") return 12;
    return window.matchMedia("(min-width: 1280px)").matches ? 10 : 12;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqXL = window.matchMedia("(min-width: 1280px)");

    // Modern handler receives a MediaQueryListEvent; for legacy listeners we use a no-arg wrapper
    const handleXLChange = (e: MediaQueryListEvent) =>
      setStacks(e.matches ? 10 : 12);
    const legacyXLHandler = () => setStacks(mqXL.matches ? 10 : 12);

    // Attach the appropriate listener depending on browser support
    try {
      mqXL.addEventListener("change", handleXLChange);
    } catch {
      // Fallback for older browsers
      mqXL.addListener(legacyXLHandler);
    }

    // Ensure initial state is correct
    setStacks(mqXL.matches ? 10 : 12);

    return () => {
      try {
        mqXL.removeEventListener("change", handleXLChange);
      } catch {
        mqXL.removeListener(legacyXLHandler);
      }
    };
  }, []);

  useEffect(() => {
    const ac = new AbortController();

    async function fetchTestimonials() {
      try {
        setLoading(true);
        const res = await fetch("/api/homepage/approved-testimonials", {
          signal: ac.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`);
        }

        const data = await res.json();
        setTestimonials(data.testimonials ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to fetch testimonials", err);
        setError("Failed to load testimonials");
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
    return () => ac.abort();
  }, []);

  if (loading) {
    return (
      <section
        id="testimonials"
        className="py-20 min-h-screen flex justify-center items-center bg-background/30 dark:bg-zinc-900/30 backdrop-blur-md border border-border rounded-2xl"
      >
        <div className="text-lime-500 text-6xl">Loading …</div>
      </section>
    );
  }

  if (error || testimonials.length === 0) return null;

  return (
    <>
      <section
        id="testimonials"
        className="flex flex-col items-center justify-center pt-24 bg-background skew-3"
      >
        <h2 className="max-w-2xl mx-auto text-5xl md:text-6xl font-display font-black tracking-tight mb-8 dark:text-gray-200 -skew-3 text-center pl-6 pb-20">
          You&apos;ve Asked,
          <span className="text-purple-500 dark:text-primary ml-4">
            We Listened.
          </span>
        </h2>
        <div className="border-b-2 border-t-2 w-full border-black shadow-2xl overflow-hidden">
          <div className="w-full flex flex-col items-center justify-center">
            {/* Full-bleed marquee */}
            <div className="flex items-center justify-center overflow-hidden">
              <div className="w-full relative flex items-center justify-center perspective-dramatic">
                {(() => {
                  const rows: Testimonial[][] = Array.from(
                    { length: stacks },
                    () => []
                  );

                  testimonials.forEach((t, idx) => {
                    rows[idx % stacks].push(t);
                  });

                  const cardHeight = 192;
                  const gap = 24;
                  const trackHeight = 4 * cardHeight + 2 * gap;

                  return (
                    <div
                      className="flex flex-row items-center mx-auto -skew-3"
                      style={{
                        transform:
                          "translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
                      }}
                    >
                      {rows.map((col, i) => {
                        const shouldRotate = i % 2 === 1;

                        return (
                          <Marquee
                            key={`col-${i}`}
                            pauseOnHover
                            vertical
                            className={`[--duration:45s] [--gap:1.5rem] flex-none -skew-3 ${
                              shouldRotate ? "rotate-180" : ""
                            }`}
                            style={{
                              height: `${trackHeight}px`,
                              width: `calc(100% / ${stacks})`,
                            }}
                          >
                            {col.map((t) => (
                              <div
                                key={t.id}
                                className={`w-full max-w-[380px] h-40 flex items-center px-4 py-4 bg-white border border-purple-500 dark:border-[#2bee79] rounded-md shadow-md dark:bg-gray-200   ${
                                  shouldRotate ? "rotate-180" : ""
                                }`}
                              >
                                <div className="flex items-center gap-4 w-full justify-center text-center">
                                  <div className="w-12 h-12 rounded-full overflow-hidden">
                                    <Image
                                      src={
                                        t.customerPhoto ??
                                        `https://robohash.org/${encodeURIComponent(
                                          t.id
                                        )}?set=robots&size=48x48`
                                      }
                                      alt={t.customerName}
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="italic text-md text-black line-clamp-3">
                                      “{t.testimonial}”
                                    </p>
                                    <p className="mt-2 text-md font-semibold text-black">
                                      {t.customerName}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </Marquee>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit testimonial */}
      {testimonialFormProps && (
        <section id="submit-testimonial" className="py-20">
          <div className="w-screen flex justify-center items-center bg-background">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-4xl md:w-1/2 mx-auto">
                <TestimonialForm
                  slug={testimonialFormProps.slug}
                  apiPath={testimonialFormProps.apiPath}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
