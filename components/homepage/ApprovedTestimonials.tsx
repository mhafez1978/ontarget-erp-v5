// import { TestimonialForm } from "@/components/storefront/testimonial-form";
// import Image from "next/image";
// import dynamic from "next/dynamic";

// const Marquee = dynamic(
//   () =>
//     import("@/components/ui/marquee").then((mod) => ({ default: mod.Marquee })),
//   {
//     loading: () => (
//       <div className="w-full h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
//         <div className="animate-pulse text-muted-foreground">
//           Loading testimonials...
//         </div>
//       </div>
//     ),
//   }
// );

// type Testimonial = {
//   id: string;
//   customerName: string;
//   testimonial: string;
//   customerPhoto?: string | null;
// };

// type TestimonialFormProps = {
//   slug?: string;
//   apiPath?: string;
// } | null;

// interface ApprovedTestimonialsProps {
//   approvedTestimonials: Testimonial[];
//   testimonialFormProps: TestimonialFormProps;
// }

// export function ApprovedTestimonials({
//   approvedTestimonials,
//   testimonialFormProps,
// }: ApprovedTestimonialsProps) {
//   return (
//     <>
//       {approvedTestimonials.length > 0 && (
//         <section id="testimonials" className="py-20 skew-3 mt-20">
//           <div className="w-screen flex flex-col items-center justify-center">
//             <h3 className="text-3xl font-bold text-center text-black mb-14 -skew-3 dark:text-white">
//               <span className="italic text-amber-500">What</span> our customers
//               say about our platform.
//             </h3>
//             <div className="flex justify-center items-center">
//               {/* full-bleed 8-column vertical marquee — spans viewport with no side padding */}
//               <div className="w-screen">
//                 <div className="w-screen flex items-center justify-center">
//                   <div className="w-full relative flex items-center justify-center gap-4 overflow-hidden perspective-near">
//                     {(() => {
//                       const stacks = 10;
//                       type T = {
//                         id: string;
//                         customerName: string;
//                         testimonial: string;
//                         customerPhoto?: string | null;
//                       };
//                       const rows: T[][] = Array.from(
//                         { length: stacks },
//                         () => []
//                       );
//                       approvedTestimonials.forEach((t, idx) => {
//                         rows[idx % stacks].push(t as T);
//                       });

//                       // card height used on md+ (md:h-36 -> 144px), gap ~24px -> track height for 3 visible cards
//                       const cardHeight = 192; // md:h-48 => 192px
//                       const gap = 24;
//                       const trackHeight = 4 * cardHeight + 2 * gap; // 3 cards + 2 gaps

//                       return (
//                         <div
//                           key="marquee-group"
//                           className="flex flex-row items-center gap-2 mx-auto"
//                           style={{
//                             transform:
//                               "translateX(-50px) translateY(6px) translateZ(-40px) rotateX(2deg) rotateY(2deg) rotateZ(2deg)",
//                           }}
//                         >
//                           {rows.map((col, i) => {
//                             // Pattern: alternate per column — 0 -> up (normal), 1 -> down, 2 -> up, 3 -> down, ...
//                             // Use a simple parity check so direction alternates each column
//                             const shouldRotate = i % 2 === 1;

//                             return (
//                               <Marquee
//                                 key={`col-${i}`}
//                                 pauseOnHover
//                                 vertical
//                                 // If shouldRotate, rotate the entire track 180deg to flip direction
//                                 className={`[--duration:45s] [--gap:1.5rem] flex-none ${
//                                   shouldRotate ? "rotate-180" : ""
//                                 }`}
//                                 style={{
//                                   height: `${trackHeight}px`,
//                                   width: `calc(100% / 8)`,
//                                 }}
//                               >
//                                 {col.map((t) => (
//                                   <div
//                                     key={t.id}
//                                     // When track is rotated, also rotate the content to make it right-side up
//                                     className={`w-full h-48 md:h-48 flex flex-col justify-center items-start px-6 py-4 bg-card border rounded-md shadow-md ${
//                                       shouldRotate ? "rotate-180" : ""
//                                     }`}
//                                   >
//                                     <div className="flex items-center gap-3 w-full">
//                                       {t.customerPhoto ? (
//                                         <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
//                                           <Image
//                                             src={t.customerPhoto}
//                                             alt={t.customerName}
//                                             width={48}
//                                             height={48}
//                                             className="object-cover"
//                                             unoptimized
//                                           />
//                                         </div>
//                                       ) : (
//                                         <div className="w-12 h-12 rounded-full overflow-hidden bg-muted-foreground/10 shrink-0">
//                                           <Image
//                                             src="/images/placeholder-avatar.svg"
//                                             alt="placeholder"
//                                             width={48}
//                                             height={48}
//                                             unoptimized
//                                           />
//                                         </div>
//                                       )}

//                                       <div className="flex-1 min-w-0">
//                                         <p className="italic text-sm text-muted-foreground line-clamp-3">
//                                           “{t.testimonial}”
//                                         </p>
//                                         <p className="mt-2 text-sm font-semibold truncate">
//                                           {t.customerName}
//                                         </p>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 ))}
//                               </Marquee>
//                             );
//                           })}
//                         </div>
//                       );
//                     })()}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//       )}

//       {testimonialFormProps && (
//         <section id="submit-testimonial" className="py-12 skew-3 mt-10">
//           <div className="w-screen flex flex-col items-center justify-center">
//             <div className="pb-4 px-4 -skew-3">
//               <div className="container mx-auto text-center">
//                 <div className="max-w-2xl mx-auto">
//                   <TestimonialForm
//                     slug={testimonialFormProps.slug}
//                     apiPath={testimonialFormProps.apiPath}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//       )}
//     </>
//   );
// }

import { TestimonialForm } from "@/components/storefront/testimonial-form";
import Image from "next/image";

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
  // Duplicate array 3 times for seamless horizontal scroll feel
  const displayedTestimonials = [
    ...approvedTestimonials,
    ...approvedTestimonials,
    ...approvedTestimonials,
  ];

  return (
    <>
      {approvedTestimonials.length > 0 && (
        <section
          id="testimonials"
          className="py-20 skew-y-3 mt-20 relative overflow-hidden bg-linear-to-b from-slate-950 via-purple-950/40 to-slate-900"
        >
          {/* Lightweight Dramatic Background - No Heavy Images */}
          <div className="absolute inset-0 opacity-50 pointer-events-none">
            <div className="absolute inset-0 bg-linear-to-br from-purple-800/30 via-transparent to-cyan-800/30" />
            <div className="absolute inset-0 bg-linear-to-tr from-indigo-900/20 via-transparent to-purple-900/20 animate-pulse" />
          </div>

          {/* Minimal Floating Glows (CSS only - very light) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-ping duration-15000" />
            <div className="absolute bottom-32 right-1/3 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl animate-ping delay-5000 duration-20000" />
          </div>

          <div className="w-screen flex flex-col items-center justify-center relative z-10">
            <h3 className="text-3xl font-bold text-center text-white mb-14 -skew-y-3 drop-shadow-2xl">
              <span className="italic text-amber-400">What</span> our customers
              say about our platform.
            </h3>

            {/* Lightweight Horizontal Marquee Alternative */}
            <div className="w-full overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap">
                {displayedTestimonials.map((t, idx) => (
                  <div key={`${t.id}-${idx}`} className="mx-6 shrink-0 w-96">
                    <div className="h-64 flex flex-col justify-center items-start px-8 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl hover:bg-white/10 hover:shadow-purple-500/30 hover:-translate-y-2 transition-all duration-500">
                      <div className="flex items-center gap-4 w-full mb-4">
                        {t.customerPhoto ? (
                          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-purple-400/50">
                            <Image
                              src={t.customerPhoto}
                              alt={t.customerName}
                              width={56}
                              height={56}
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/10 shrink-0 ring-2 ring-purple-400/30 flex items-center justify-center">
                            <Image
                              src="/images/placeholder-avatar.svg"
                              alt="placeholder"
                              width={56}
                              height={56}
                              unoptimized
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-lg font-semibold text-white truncate">
                            {t.customerName}
                          </p>
                        </div>
                      </div>

                      <p className="italic text-gray-200 line-clamp-4 leading-relaxed">
                        “{t.testimonial}”
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Duplicate track for seamless loop */}
              <div className="flex animate-marquee2 whitespace-nowrap">
                {displayedTestimonials.map((t, idx) => (
                  <div
                    key={`dup-${t.id}-${idx}`}
                    className="mx-6 shrink-0 w-96"
                  >
                    <div className="h-64 flex flex-col justify-center items-start px-8 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl hover:bg-white/10 hover:shadow-purple-500/30 hover:-translate-y-2 transition-all duration-500">
                      <div className="flex items-center gap-4 w-full mb-4">
                        {t.customerPhoto ? (
                          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-purple-400/50">
                            <Image
                              src={t.customerPhoto}
                              alt={t.customerName}
                              width={56}
                              height={56}
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/10 shrink-0 ring-2 ring-purple-400/30 flex items-center justify-center">
                            <Image
                              src="/images/placeholder-avatar.svg"
                              alt="placeholder"
                              width={56}
                              height={56}
                              unoptimized
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-lg font-semibold text-white truncate">
                            {t.customerName}
                          </p>
                        </div>
                      </div>

                      <p className="italic text-gray-200 line-clamp-4 leading-relaxed">
                        “{t.testimonial}”
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {testimonialFormProps && (
        <section
          id="submit-testimonial"
          className="py-12 skew-y-3 mt-10 relative overflow-hidden bg-linear-to-b from-slate-900 to-purple-950/30"
        >
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute inset-0 bg-linear-to-br from-purple-800/20 via-transparent to-cyan-800/20" />
          </div>

          <div className="w-screen flex flex-col items-center justify-center relative z-10">
            <div className="pb-4 px-4 -skew-y-3">
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

// import { TestimonialForm } from "@/components/storefront/testimonial-form";
// import Image from "next/image";
// import dynamic from "next/dynamic";

// const Marquee = dynamic(
//   () =>
//     import("@/components/ui/marquee").then((mod) => ({ default: mod.Marquee })),
//   {
//     loading: () => (
//       <div className="w-full h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
//         <div className="animate-pulse text-muted-foreground">
//           Loading testimonials...
//         </div>
//       </div>
//     ),
//   }
// );

// type Testimonial = {
//   id: string;
//   customerName: string;
//   testimonial: string;
//   customerPhoto?: string | null;
// };

// type TestimonialFormProps = {
//   slug?: string;
//   apiPath?: string;
// } | null;

// interface ApprovedTestimonialsProps {
//   approvedTestimonials: Testimonial[];
//   testimonialFormProps: TestimonialFormProps;
// }

// export function ApprovedTestimonials({
//   approvedTestimonials,
//   testimonialFormProps,
// }: ApprovedTestimonialsProps) {
//   return (
//     <>
//       {approvedTestimonials.length > 0 && (
//         <section
//           id="testimonials"
//           className="py-20 skew-y-3 mt-20 relative overflow-hidden"
//         >
//           {/* Dramatic Spacey Smokey Background Effects */}
//           <div className="absolute inset-0 opacity-60 pointer-events-none">
//             <div
//               className="absolute inset-0 bg-cover bg-center mix-blend-overlay animate-pulse"
//               style={{
//                 backgroundImage:
//                   "url('https://thumbs.dreamstime.com/b/swirling-purple-smoke-creating-abstract-cosmic-nebula-particles-flowing-cloud-featuring-pink-hues-illuminated-countless-417543571.jpg')",
//               }}
//             />
//             <div
//               className="absolute inset-0 bg-cover bg-center opacity-40"
//               style={{
//                 backgroundImage:
//                   "url('https://thumbs.dreamstime.com/b/cosmic-nebula-galaxy-background-pink-blue-purple-stars-space-388187583.jpg')",
//               }}
//             />
//           </div>

//           {/* Subtle Floating Particles */}
//           <div className="absolute inset-0 pointer-events-none">
//             <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-ping duration-10000" />
//             <div className="absolute bottom-32 right-1/3 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl animate-ping delay-3000 duration-12000" />
//             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600/15 rounded-full blur-2xl animate-pulse" />
//           </div>

//           {/* Optional dark overlay to keep text readable */}
//           <div className="absolute inset-0 bg-linear-to-b from-slate-950/30 via-transparent to-slate-950/40 pointer-events-none" />

//           <div className="w-screen flex flex-col items-center justify-center relative z-10">
//             <h3 className="text-3xl font-bold text-center text-white mb-14 -skew-y-3 drop-shadow-2xl">
//               <span className="italic text-amber-400">What</span> our customers
//               say about our platform.
//             </h3>
//             <div className="flex justify-center items-center">
//               <div className="w-screen">
//                 <div className="w-screen flex items-center justify-center">
//                   <div className="w-full relative flex items-center justify-center gap-4 overflow-hidden perspective-near">
//                     {(() => {
//                       const stacks = 10;
//                       type T = {
//                         id: string;
//                         customerName: string;
//                         testimonial: string;
//                         customerPhoto?: string | null;
//                       };
//                       const rows: T[][] = Array.from(
//                         { length: stacks },
//                         () => []
//                       );
//                       approvedTestimonials.forEach((t, idx) => {
//                         rows[idx % stacks].push(t as T);
//                       });

//                       const cardHeight = 192;
//                       const gap = 24;
//                       const trackHeight = 4 * cardHeight + 2 * gap;

//                       return (
//                         <div
//                           key="marquee-group"
//                           className="flex flex-row items-center gap-2 mx-auto"
//                           style={{
//                             transform:
//                               "translateX(-50px) translateY(6px) translateZ(-40px) rotateX(2deg) rotateY(2deg) rotateZ(2deg)",
//                           }}
//                         >
//                           {rows.map((col, i) => {
//                             const shouldRotate = i % 2 === 1;

//                             return (
//                               <Marquee
//                                 key={`col-${i}`}
//                                 pauseOnHover
//                                 vertical
//                                 className={`[--duration:45s] [--gap:1.5rem] flex-none ${
//                                   shouldRotate ? "rotate-180" : ""
//                                 }`}
//                                 style={{
//                                   height: `${trackHeight}px`,
//                                   width: `calc(100% / 8)`,
//                                 }}
//                               >
//                                 {col.map((t) => (
//                                   <div
//                                     key={t.id}
//                                     className={`w-full h-48 md:h-48 flex flex-col justify-center items-start px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-md shadow-xl ${
//                                       shouldRotate ? "rotate-180" : ""
//                                     } hover:bg-white/10 hover:shadow-purple-500/20 transition-all duration-500`}
//                                   >
//                                     <div className="flex items-center gap-3 w-full">
//                                       {t.customerPhoto ? (
//                                         <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-purple-400/50">
//                                           <Image
//                                             src={t.customerPhoto}
//                                             alt={t.customerName}
//                                             width={48}
//                                             height={48}
//                                             className="object-cover"
//                                             unoptimized
//                                           />
//                                         </div>
//                                       ) : (
//                                         <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 ring-2 ring-purple-400/30">
//                                           <Image
//                                             src="/images/placeholder-avatar.svg"
//                                             alt="placeholder"
//                                             width={48}
//                                             height={48}
//                                             unoptimized
//                                           />
//                                         </div>
//                                       )}

//                                       <div className="flex-1 min-w-0">
//                                         <p className="italic text-sm text-gray-200 line-clamp-3">
//                                           “{t.testimonial}”
//                                         </p>
//                                         <p className="mt-2 text-sm font-semibold text-white truncate">
//                                           {t.customerName}
//                                         </p>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 ))}
//                               </Marquee>
//                             );
//                           })}
//                         </div>
//                       );
//                     })()}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//       )}

//       {testimonialFormProps && (
//         <section
//           id="submit-testimonial"
//           className="py-12 skew-y-3 mt-10 relative overflow-hidden"
//         >
//           {/* Same background effects for consistency */}
//           <div className="absolute inset-0 opacity-50 pointer-events-none">
//             <div
//               className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
//               style={{
//                 backgroundImage:
//                   "url('https://thumbs.dreamstime.com/b/swirling-purple-smoke-creating-abstract-cosmic-nebula-particles-flowing-cloud-featuring-pink-hues-illuminated-countless-417543571.jpg')",
//               }}
//             />
//           </div>
//           <div className="absolute inset-0 bg-linear-to-b from-slate-950/40 via-transparent to-slate-950/50 pointer-events-none" />

//           <div className="w-screen flex flex-col items-center justify-center relative z-10">
//             <div className="pb-4 px-4 -skew-y-3">
//               <div className="container mx-auto text-center">
//                 <div className="max-w-2xl mx-auto">
//                   <TestimonialForm
//                     slug={testimonialFormProps.slug}
//                     apiPath={testimonialFormProps.apiPath}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//       )}
//     </>
//   );
// }
