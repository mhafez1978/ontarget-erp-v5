import { TestimonialForm } from "@/components/storefront/testimonial-form";
import Image from "next/image";
import dynamic from "next/dynamic";

const Marquee = dynamic(
  () =>
    import("@/components/ui/marquee").then((mod) => ({ default: mod.Marquee })),
  {
    loading: () => (
      <div className="w-full h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="animate-pulse dark:text-gray-200">
          Loading testimonials...
        </div>
      </div>
    ),
  }
);

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

interface ApprovedTestimonialsProps {
  approvedTestimonials: Testimonial[];
  testimonialFormProps: TestimonialFormProps;
}

export function ApprovedTestimonials({
  approvedTestimonials,
  testimonialFormProps,
}: ApprovedTestimonialsProps) {
  return (
    <>
      {approvedTestimonials.length > 0 && (
        <section id="testimonials" className="py-20 skew-3 mt-20">
          <div className="w-screen flex flex-col items-center justify-center">
            <h3 className="text-3xl font-bold text-center text-black mb-14 -skew-3 dark:text-white">
              <span className="italic text-amber-500">What</span> our customers
              say about our platform.
            </h3>
            <div className="flex justify-center items-center">
              {/* full-bleed 8-column vertical marquee — spans viewport with no side padding */}
              <div className="w-screen">
                <div className="w-screen flex items-center justify-center">
                  <div className="w-full relative flex items-center justify-center gap-4 overflow-hidden perspective-near">
                    {(() => {
                      const stacks = 10;
                      type T = {
                        id: string;
                        customerName: string;
                        testimonial: string;
                        customerPhoto?: string | null;
                      };
                      const rows: T[][] = Array.from(
                        { length: stacks },
                        () => []
                      );
                      approvedTestimonials.forEach((t, idx) => {
                        rows[idx % stacks].push(t as T);
                      });

                      // card height used on md+ (md:h-36 -> 144px), gap ~24px -> track height for 3 visible cards
                      const cardHeight = 192; // md:h-48 => 192px
                      const gap = 24;
                      const trackHeight = 4 * cardHeight + 2 * gap; // 3 cards + 2 gaps

                      return (
                        <div
                          key="marquee-group"
                          className="flex flex-row items-center gap-2 mx-auto"
                          style={{
                            transform:
                              "translateX(-50px) translateY(6px) translateZ(-40px) rotateX(2deg) rotateY(2deg) rotateZ(2deg)",
                          }}
                        >
                          {rows.map((col, i) => {
                            // Pattern: alternate per column — 0 -> up (normal), 1 -> down, 2 -> up, 3 -> down, ...
                            // Use a simple parity check so direction alternates each column
                            const shouldRotate = i % 2 === 1;

                            return (
                              <Marquee
                                key={`col-${i}`}
                                pauseOnHover
                                vertical
                                // If shouldRotate, rotate the entire track 180deg to flip direction
                                className={`[--duration:45s] [--gap:1.5rem] flex-none ${
                                  shouldRotate ? "rotate-180" : ""
                                }`}
                                style={{
                                  height: `${trackHeight}px`,
                                  width: `calc(100% / 8)`,
                                }}
                              >
                                {col.map((t) => (
                                  <div
                                    key={t.id}
                                    // When track is rotated, also rotate the content to make it right-side up
                                    className={`w-full h-48 md:h-48 flex flex-col justify-center items-start px-6 py-4 bg-card border rounded-md shadow-md ${
                                      shouldRotate ? "rotate-180" : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 w-full">
                                      {t.customerPhoto ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                                          <Image
                                            src={t.customerPhoto}
                                            alt={t.customerName}
                                            width={48}
                                            height={48}
                                            className="object-cover"
                                            unoptimized
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted-foreground/10 shrink-0">
                                          <Image
                                            src="/images/placeholder-avatar.svg"
                                            alt="placeholder"
                                            width={48}
                                            height={48}
                                            unoptimized
                                          />
                                        </div>
                                      )}

                                      <div className="flex-1 min-w-0">
                                        <p className="italic text-sm dark:text-gray-200 line-clamp-3">
                                          “{t.testimonial}”
                                        </p>
                                        <p className="mt-2 text-sm font-semibold truncate">
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
          </div>
        </section>
      )}

      {testimonialFormProps && (
        <section id="submit-testimonial" className="py-12 skew-3 mt-10">
          <div className="w-screen flex flex-col items-center justify-center">
            <div className="pb-4 px-4 -skew-3">
              <div className="container mx-auto text-center">
                <div className="max-w-2xl mx-auto">
                  <TestimonialForm
                    slug={testimonialFormProps.slug}
                    apiPath={testimonialFormProps.apiPath}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
