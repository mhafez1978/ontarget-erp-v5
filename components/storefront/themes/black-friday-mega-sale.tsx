import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Mail, Phone, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { TestimonialForm } from "@/components/storefront/testimonial-form";
import type { ThemeRendererProps } from "../theme-renderer";
import { BaseThemeRenderer } from "../theme-renderer";

const renderText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return "";
};

export function BlackFridayTheme(props: ThemeRendererProps) {
  const {
    sections,
    slug,
    companyName,
    featuredProducts,
    featuredServices,
    testimonials,
  } = props;

  const heroSection = sections.find(
    (section) => section.type === "hero" && section.enabled
  );

  const filteredSections = sections.filter(
    (section) =>
      section.type !== "hero" &&
      section.type !== "featured-products" &&
      section.type !== "featured-services" &&
      section.type !== "team" &&
      section.type !== "social-proof" &&
      section.type !== "contact" &&
      section.type !== "footer"
  );

  if (!heroSection) {
    return <BaseThemeRenderer {...props} sections={filteredSections} />;
  }
  const content = (heroSection.content || {}) as Record<string, unknown>;
  const styling = heroSection.styling || {};

  const title =
    renderText(content.title) || "BLACK FRIDAY MEGA SALE".toUpperCase();
  const subtitle =
    renderText(content.subtitle) || "The Biggest Sale of the Year";
  const description =
    renderText(content.description) ||
    "Up to 70% off storewide. Limited quantities. Doorbusters while supplies last.";
  const primaryCTA = renderText(content.primaryCTA) || "Shop Doorbusters";
  const secondaryCTA = renderText(content.secondaryCTA) || "View All Deals";
  const showCountdown = content.showCountdown === true;

  const gradient =
    styling.gradient ||
    "linear-gradient(135deg, #000000 0%, #111827 45%, #b91c1c 100%)";

  return (
    <>
      <section
        className="relative overflow-hidden bg-black text-white"
        style={{ backgroundImage: gradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(248,113,113,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_rgba(59,130,246,0.25),transparent_55%)] mix-blend-screen opacity-40" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/60 bg-black/50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-red-300">
              <span>Black Friday</span>
              {showCountdown && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Ends Soon
                </span>
              )}
            </div>

            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              <span className="block text-white">{title}</span>
              <span className="mt-2 block bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-400 to-white">
                {subtitle}
              </span>
            </h1>

            <p className="max-w-lg text-base text-gray-200 sm:text-lg">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-700/40"
              >
                <Link href={`/store/${slug}#products`}>{primaryCTA}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-red-400/70 bg-transparent text-red-100 hover:bg-red-500/20"
              >
                <Link href={`/store/${slug}`}>{secondaryCTA}</Link>
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-300 sm:text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                In-stock items ship fast
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                Free returns on all Black Friday orders
              </span>
            </div>
          </div>

          <div className="mt-8 w-full max-w-md lg:mt-0">
            <div className="rounded-3xl border border-red-500/40 bg-black/60 p-5 shadow-xl shadow-red-900/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Featured Store
                  </p>
                  <p className="text-sm font-semibold">
                    {companyName || "Your Brand"}
                  </p>
                </div>
                {showCountdown && (
                  <div className="rounded-xl bg-red-700/80 px-4 py-2 text-center text-xs font-semibold">
                    <p className="uppercase tracking-wide text-red-100">
                      Ends In
                    </p>
                    <p className="text-lg leading-none text-white">
                      {/* Static for now; real countdown is client-side */}
                      48:00:00
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-200">
                <div className="rounded-xl bg-white/5 px-3 py-3">
                  <p className="text-[11px] text-gray-400">Sitewide Savings</p>
                  <p className="text-lg font-semibold text-white">Up to 70%</p>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-3">
                  <p className="text-[11px] text-gray-400">Doorbusters</p>
                  <p className="text-lg font-semibold text-white">
                    Limited stock
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-3">
                  <p className="text-[11px] text-gray-400">Free Shipping</p>
                  <p className="text-lg font-semibold text-white">
                    Over $75
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-3">
                  <p className="text-[11px] text-gray-400">Returns</p>
                  <p className="text-lg font-semibold text-white">
                    60 days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Render any remaining sections (promo-banner, stats, etc.) above product grid */}
      {filteredSections.length > 0 && (
        <BaseThemeRenderer {...props} sections={filteredSections} />
      )}

      {/* Featured products (doorbusters) */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="bg-[#050509] py-16 text-white">
          <div className="container mx-auto px-4">
            {(() => {
              const section = sections.find(
                (s) => s.type === "featured-products" && s.enabled
              );
              const content =
                (section?.content as Record<string, unknown>) || {};
              const heading =
                renderText(content.title || content.heading) ||
                "⚡ Doorbuster Deals";
              const subheading =
                renderText(content.subtitle || content.description) ||
                "Grab these limited-time offers before they're gone.";

              return (
                <>
                  <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold">
                      {heading}
                    </h2>
                    <p className="mt-3 text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
                      {subheading}
                    </p>
                  </div>
                </>
              );
            })()}

            <div className="grid gap-6 md:grid-cols-3">
              {featuredProducts.slice(0, 3).map((product) => (
                <Card
                  key={product.id}
                  className="relative overflow-hidden border-red-500/60 bg-gradient-to-b from-zinc-950 to-zinc-900 text-white"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400" />
                  {product.images && product.images[0]?.url && (
                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1">
                      {product.name}
                    </CardTitle>
                    {product.description && (
                      <CardDescription className="line-clamp-2 text-gray-300">
                        {product.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-400">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-red-300">
                      Black Friday pricing – limited quantities
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured services */}
      {featuredServices && featuredServices.length > 0 && (
        <section className="bg-[#020308] py-16 text-white">
          <div className="container mx-auto px-4">
            {(() => {
              const section = sections.find(
                (s) => s.type === "featured-services" && s.enabled
              );
              const content =
                (section?.content as Record<string, unknown>) || {};
              const heading =
                renderText(content.heading || content.title) ||
                "⚡ Express Services – Black Friday Special";
              const description =
                renderText(content.description) ||
                "Book now and save big on premium services with limited-time Black Friday pricing.";

              return (
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold">
                    {heading}
                  </h2>
                  <p className="mt-3 text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
                    {description}
                  </p>
                </div>
              );
            })()}

            <div className="grid gap-6 md:grid-cols-3">
              {featuredServices.slice(0, 3).map((service) => (
                <Card
                  key={service.id}
                  className="relative overflow-hidden border border-red-500/50 bg-zinc-950 text-white"
                >
                  {service.images && service.images[0]?.url && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                      <Image
                        src={service.images[0].url}
                        alt={service.name}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1">
                      {service.name}
                    </CardTitle>
                    {service.description && (
                      <CardDescription className="line-clamp-2 text-gray-300">
                        {service.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-400">
                      ${Number(service.price).toFixed(2)}
                    </p>
                    {service.duration && (
                      <p className="mt-1 text-xs text-gray-300">
                        Duration: {service.duration} mins
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full border-red-500/70 text-red-200 hover:bg-red-600/20"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Book service
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Meet the team (after products & services) */}
      {(() => {
        const teamSection = sections.find(
          (s) => s.type === "team" && s.enabled
        );
        if (!teamSection) return null;
        return <BaseThemeRenderer {...props} sections={[teamSection]} />;
      })()}

      {/* Testimonials / social proof – 3D marquee style */}
      {testimonials && testimonials.length > 0 && (
        <section className="bg-black py-16 text-white">
          <div className="container mx-auto px-4 mb-10 text-center">
            {(() => {
              const socialProofSection = sections.find(
                (s) => s.type === "social-proof" && s.enabled
              );
              const content =
                (socialProofSection?.content as Record<string, unknown>) || {};
              const heading =
                renderText(content.heading || content.title) ||
                "What shoppers are saying";
              const description =
                renderText(
                  content.description || content.subheading || content.subtitle
                ) ||
                "Real feedback from customers who scored big on Black Friday.";

              return (
                <>
                  <h2 className="text-3xl md:text-4xl font-extrabold">
                    {heading}
                  </h2>
                  <p className="mt-3 text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
                    {description}
                  </p>
                </>
              );
            })()}
          </div>

          {(() => {
            const list = testimonials;
            const padded =
              list.length >= 4
                ? list
                : [...list, ...list, ...list].slice(
                    0,
                    Math.max(4, list.length)
                  );

            const firstRow = padded.slice(0, Math.ceil(padded.length / 2));
            const secondRow = padded.slice(Math.ceil(padded.length / 2));
            const thirdRow = firstRow;
            const fourthRow = secondRow;

            const ReviewCard = ({
              img,
              name,
              title,
              body,
              rating,
            }: {
              img: string;
              name: string;
              title?: string | null;
              body: string;
              rating: number;
            }) => (
              <figure
                className={cn(
                  "relative h-full w-fit cursor-pointer overflow-hidden rounded-xl border p-4 sm:w-40",
                  "border-red-500/40 bg-zinc-900/80 hover:bg-zinc-800/90"
                )}
              >
                <div className="flex flex-row items-center gap-2">
                  <Image
                    className="rounded-full"
                    width={32}
                    height={32}
                    alt={name}
                    src={
                      img ||
                      `https://avatar.vercel.sh/${encodeURIComponent(
                        name || "customer"
                      )}`
                    }
                    style={{ objectFit: "cover" }}
                    sizes="32px"
                  />
                  <div className="flex flex-col">
                    <figcaption className="text-sm font-medium">
                      {name}
                    </figcaption>
                    {title && (
                      <p className="text-xs text-gray-400">{title}</p>
                    )}
                  </div>
                </div>
                <blockquote className="mt-2 text-xs text-gray-200 line-clamp-4">
                  {body}
                </blockquote>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </figure>
            );

            const renderRow = (row: typeof padded) =>
              row.map((review, idx) => (
                <ReviewCard
                  key={review.id ?? idx}
                  img={
                    review.customerPhoto ||
                    `https://avatar.vercel.sh/${encodeURIComponent(
                      review.customerName || "customer"
                    )}`
                  }
                  name={review.customerName || "Customer"}
                  title={review.customerTitle}
                  body={review.testimonial}
                  rating={review.rating ?? 5}
                />
              ));

            return (
              <div className="relative flex h-96 w-full flex-row items-center justify-center gap-4 overflow-hidden perspective-near">
                <div
                  className="flex flex-row items-center gap-4"
                  style={{
                    transform:
                      "translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)",
                  }}
                >
                  <Marquee pauseOnHover vertical className="[--duration:20s]">
                    {renderRow(firstRow)}
                  </Marquee>
                  <Marquee
                    reverse
                    pauseOnHover
                    vertical
                    className="[--duration:20s]"
                  >
                    {renderRow(secondRow)}
                  </Marquee>
                  <Marquee
                    reverse
                    pauseOnHover
                    vertical
                    className="[--duration:20s]"
                  >
                    {renderRow(thirdRow)}
                  </Marquee>
                  <Marquee pauseOnHover vertical className="[--duration:20s]">
                    {renderRow(fourthRow)}
                  </Marquee>
                </div>

                <div className="from-black pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b" />
                <div className="from-black pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t" />
                <div className="from-black pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r" />
                <div className="from-black pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l" />
              </div>
            );
          })()}

          <div className="mt-10 text-center">
            <TestimonialForm slug={slug} />
          </div>
        </section>
      )}

      {/* Contact section */}
      {(() => {
        const section = sections.find(
          (s) => s.type === "contact" && s.enabled
        );
        if (!section) return null;
        const content = (section.content || {}) as Record<string, unknown>;

        const heading =
          renderText(content.heading || content.title) ||
          "Questions? We're here 24/7";
        const description =
          renderText(content.description) ||
          "Need help with your Black Friday order or discounts? Our team is standing by.";

        const email = renderText(content.email);
        const salesEmail = renderText(content.salesEmail);
        const supportEmail = renderText(content.supportEmail);
        const phone = renderText(content.phone);
        const address = renderText(content.address);

        return (
          <section className="bg-[#050509] py-16 text-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold">
                  {heading}
                </h2>
                <p className="mt-3 text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
                  {description}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {email && (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-5">
                    <Mail className="h-6 w-6 text-red-400" />
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      General
                    </p>
                    <a
                      href={`mailto:${email}`}
                      className="text-sm font-medium text-white hover:underline"
                    >
                      {email}
                    </a>
                  </div>
                )}
                {salesEmail && (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-5">
                    <Mail className="h-6 w-6 text-red-400" />
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Sales
                    </p>
                    <a
                      href={`mailto:${salesEmail}`}
                      className="text-sm font-medium text-white hover:underline"
                    >
                      {salesEmail}
                    </a>
                  </div>
                )}
                {supportEmail && (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-5">
                    <Mail className="h-6 w-6 text-red-400" />
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Support
                    </p>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="text-sm font-medium text-white hover:underline"
                    >
                      {supportEmail}
                    </a>
                  </div>
                )}
                {phone && (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-5">
                    <Phone className="h-6 w-6 text-red-400" />
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Phone
                    </p>
                    <p className="text-sm font-medium">{phone}</p>
                  </div>
                )}
                {address && (
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-5 md:col-span-3">
                    <MapPin className="h-6 w-6 text-red-400" />
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Address
                    </p>
                    <p className="text-sm font-medium text-center max-w-md">
                      {address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Footer */}
      {(() => {
        const section = sections.find(
          (s) => s.type === "footer" && s.enabled
        );
        const content = (section?.content || {}) as Record<string, unknown>;
        const year = new Date().getFullYear();
        const name =
          renderText(content.companyName) || companyName || "Your Brand";
        const description = renderText(content.description);

        return (
          <footer className="border-t border-red-500/30 bg-black py-8 text-center text-sm text-gray-300">
            <div className="container mx-auto px-4">
              <p className="font-semibold text-white">{name}</p>
              {description && (
                <p className="mt-1 text-xs text-gray-400 max-w-md mx-auto">
                  {description}
                </p>
              )}
              <p className="mt-3 text-xs text-gray-500">
                © {year} {name}. All rights reserved.
              </p>
            </div>
          </footer>
        );
      })()}
    </>
  );
}
