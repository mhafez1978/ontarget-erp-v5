"use client";


import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
;
import { BorderBeam } from "@/components/ui/border-beam";
import { useCart } from "@/contexts/cart-context";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images?: { url: string }[];
  isFeatured: boolean;
}

interface ThemeProductLayoutProps {
  products: Product[];
  themeId: string;
}

export function ThemeProductLayout({
  products,
  themeId,
}: ThemeProductLayoutProps) {
  const { addItem } = useCart();

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      type: "product",
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url,
      description: product.description,
      companyId: "", // Will be set from context
    });
  };

  // Black Friday - Urgent/Flash Sale Grid with Animated Banners
  if (themeId === "black-friday-mega-sale") {
    return (
      <div className="space-y-6">
        {products.slice(0, 3).map((product, idx) => (
          <Card
            key={product.id}
            className="overflow-hidden transform hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl border border-red-500 black-friday-flash animate-in fade-in duration-500 relative"
          >
            <BorderBeam
              size={250}
              duration={12}
              delay={9}
              colorFrom="#3B82F6"
              colorTo="#EF4444"
              borderWidth={1}
            />
            <div className="flex flex-col md:flex-row">
              {product.images && product.images[0]?.url && (
                <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto overflow-hidden bg-muted">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={idx === 0}
                  />
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-lg black-friday-pulse shadow-2xl shadow-red-500/50">
                    🔥 SALE!
                  </div>
                  <div className="absolute top-4 left-4 bg-yellow-400 text-red-900 px-3 py-1 rounded font-bold text-sm animate-pulse">
                    ⚡ LIMITED
                  </div>
                </div>
              )}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    {product.isFeatured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-base">
                    {product.description}
                  </CardDescription>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-3xl font-bold text-red-600">
                    ${Number(product.price).toFixed(2)}
                  </p>
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Buy Now!
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Holiday - Circular/Rounded Cards with Snow Effect
  if (themeId === "holiday-magic") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative holiday-pattern">
        {/* Decorative snowflakes */}
        <div
          className="absolute top-0 left-1/4 text-4xl opacity-20 holiday-snowflake"
          style={{ animationDelay: "0s" }}
        >
          ❄️
        </div>
        <div
          className="absolute top-10 right-1/3 text-3xl opacity-15 holiday-snowflake"
          style={{ animationDelay: "2s" }}
        >
          ❄️
        </div>
        <div
          className="absolute top-5 right-1/4 text-2xl opacity-10 holiday-snowflake"
          style={{ animationDelay: "4s" }}
        >
          ❄️
        </div>
        {products.slice(0, 3).map((product, idx) => (
          <Card
            key={product.id}
            className="overflow-hidden rounded-3xl shadow-2xl border-2 border-green-200 hover:border-yellow-400 transition-all"
          >
            {product.images && product.images[0]?.url && (
              <div className="relative aspect-square overflow-hidden bg-muted rounded-t-3xl">
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={idx === 0}
                />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white/30" />
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="line-clamp-1 text-xl">
                {product.name}
              </CardTitle>
              {product.isFeatured && (
                <Badge
                  variant="secondary"
                  className="mx-auto mt-2 holiday-sparkle"
                >
                  ✨ 🎁 Featured 🎁 ✨
                </Badge>
              )}
              <CardDescription className="line-clamp-2 mt-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl font-bold text-red-600">
                ${Number(product.price).toFixed(2)}
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button
                className="w-full rounded-full bg-green-700 hover:bg-green-800"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add Gift to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Halloween - Asymmetric/Tilted Cards with Spooky Effects
  if (themeId === "spooky-halloween") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
        {/* Spooky floating ghosts */}
        <div
          className="absolute -top-10 left-10 text-5xl opacity-10 halloween-float"
          style={{ animationDelay: "0s" }}
        >
          👻
        </div>
        <div
          className="absolute top-0 right-20 text-4xl opacity-10 halloween-float"
          style={{ animationDelay: "1.5s" }}
        >
          🦇
        </div>
        <div
          className="absolute -top-5 left-1/2 text-3xl opacity-10 halloween-float"
          style={{ animationDelay: "3s" }}
        >
          🕷️
        </div>
        {products.slice(0, 3).map((product, idx) => (
          <Card
            key={product.id}
            className={`relative overflow-hidden hover:rotate-0 transition-all duration-500 shadow-2xl border-2 border-purple-900 hover:shadow-purple-500/50 halloween-glow bg-linear-to-br from-[#0b0412] via-[#12071c] to-[#1a0b26] ${
              idx === 0 ? "-rotate-2" : idx === 1 ? "rotate-1" : "-rotate-1"
            }`}
          >
            <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_20%,rgba(255,140,0,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,69,0,0.12),transparent_32%),radial-gradient(circle_at_60%_80%,rgba(128,90,213,0.15),transparent_40%)]" />
            <div className="pointer-events-none absolute -left-4 top-6 text-5xl opacity-20 halloween-float">
              🎃
            </div>
            <div className="pointer-events-none absolute right-4 bottom-6 text-4xl opacity-20 halloween-float">
              🦇
            </div>
            <div className="pointer-events-none absolute left-8 bottom-10 text-3xl opacity-20 halloween-float">
              🕸️
            </div>
            {product.images && product.images[0]?.url && (
              <div className="relative aspect-square overflow-hidden bg-linear-to-b from-black to-purple-950 border-b border-purple-900/40">
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-110 hover:brightness-75 transition-all duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-purple-900/60 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,165,0,0.12),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,94,0,0.14),transparent_38%)] mix-blend-screen" />
              </div>
            )}
            <CardHeader className="bg-linear-to-br from-purple-950 to-black text-white">
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-1">
                  👻 {product.name}
                </CardTitle>
                {product.isFeatured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2 text-purple-200">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-black text-white pt-4">
              <p className="text-2xl font-bold text-orange-500">
                ${Number(product.price).toFixed(2)}
              </p>
            </CardContent>
            <CardFooter className="bg-black">
              <Button className="w-full bg-purple-700 hover:bg-purple-600">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cauldron
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Veterans Day - Dignified Grid with Patriotic Accents
  if (themeId === "veterans-day-patriotic") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.slice(0, 3).map((product, idx) => (
          <Card
            key={product.id}
            className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow border-l-4 border-blue-700"
          >
            {product.images && product.images[0]?.url && (
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={idx === 0}
                />
                <div className="absolute top-4 left-4 flex gap-1 veterans-wave">
                  <div className="w-2 h-8 bg-red-600" />
                  <div className="w-2 h-8 bg-white" />
                  <div className="w-2 h-8 bg-blue-700" />
                </div>
                <div className="absolute top-4 right-4 bg-blue-700/90 text-white px-2 py-1 rounded text-xs font-bold veterans-fade">
                  🇺🇸 HONOR
                </div>
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-1">
                  🇺🇸 {product.name}
                </CardTitle>
                {product.isFeatured && (
                  <Badge className="bg-blue-700">Featured</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-700">
                ${Number(product.price).toFixed(2)}
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-blue-700 hover:bg-blue-800">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shop Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Summer - Overlapping/Floating Cards with Beach Vibes
  if (themeId === "summer-paradise") {
    return (
      <div className="relative summer-pattern">
        {/* Decorative sun rays */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-8xl opacity-5 summer-glow">
          ☀️
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {products.slice(0, 3).map((product, idx) => (
            <Card
              key={product.id}
              className={`overflow-hidden shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:-translate-y-4 rounded-2xl summer-wave ${
                idx === 1 ? "md:-mt-8 md:mb-8" : ""
              }`}
            >
              {product.images && product.images[0]?.url && (
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold text-sm rotate-12">
                    ☀️ HOT
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-1 text-cyan-700">
                  {product.name}
                </CardTitle>
                {product.isFeatured && (
                  <Badge className="bg-cyan-500 mt-2">Featured</Badge>
                )}
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-600">
                  ${Number(product.price).toFixed(2)}
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Spring - Organic/Flowing Layout with Growth Animation
  if (themeId === "spring-renewal") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
        {/* Floating petals */}
        <div
          className="absolute top-0 left-1/4 text-3xl opacity-20 spring-petal"
          style={{ animationDelay: "0s" }}
        >
          🌸
        </div>
        <div
          className="absolute top-10 right-1/4 text-2xl opacity-15 spring-petal"
          style={{ animationDelay: "3s" }}
        >
          🌺
        </div>
        <div
          className="absolute top-5 left-1/2 text-3xl opacity-10 spring-petal"
          style={{ animationDelay: "5s" }}
        >
          🌼
        </div>
        {products.slice(0, 3).map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden shadow-lg hover:shadow-green-500/30 transition-all duration-500 rounded-3xl border-2 border-green-200 hover:border-green-400 spring-bloom"
          >
            {product.images && product.images[0]?.url && (
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 hover:rotate-1 transition-all duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-green-50 to-transparent" />
              </div>
            )}
            <CardHeader className="bg-linear-to-b from-green-50 to-white">
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-1 text-green-800">
                  🌸 {product.name}
                </CardTitle>
                {product.isFeatured && (
                  <Badge className="bg-green-600">Featured</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2 text-green-700">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white">
              <p className="text-2xl font-bold text-green-700">
                ${Number(product.price).toFixed(2)}
              </p>
            </CardContent>
            <CardFooter className="bg-white">
              <Button className="w-full bg-green-600 hover:bg-green-700 rounded-full">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Tech - Sharp/Angular Grid with Futuristic Effects
  if (themeId === "tech-innovate") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative tech-grid">
        {/* Cyber accents */}
        <div className="absolute -top-10 left-0 w-20 h-20 bg-cyan-500/5 blur-3xl rounded-full animate-pulse" />
        <div
          className="absolute -top-5 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        {products.slice(0, 3).map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 bg-linear-to-br from-slate-900 to-slate-800 text-white border border-cyan-500/30 hover:border-cyan-500 group tech-pulse tech-scan tech-glitch"
          >
            {product.images && product.images[0]?.url && (
              <div className="relative aspect-square overflow-hidden bg-slate-950">
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300 opacity-90"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-all" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-1 text-cyan-400">
                  ⚡ {product.name}
                </CardTitle>
                {product.isFeatured && (
                  <Badge className="bg-cyan-600">Featured</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2 text-slate-300">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-400">
                ${Number(product.price).toFixed(2)}
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Learn More
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Restaurant - Elegant Cards with Sophisticated Layout
  if (themeId === "gourmet-dining") {
    return (
      <div className="space-y-8 relative">
        {/* Ambient candlelight effect */}
        <div
          className="absolute top-0 left-1/4 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full"
          style={{ animation: "candle-flicker 3s ease-in-out infinite" }}
        />
        <div
          className="absolute top-20 right-1/4 w-32 h-32 bg-amber-600/5 blur-3xl rounded-full"
          style={{
            animation: "candle-flicker 2.5s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
        {products.slice(0, 3).map((product, idx) => (
          <Card
            key={product.id}
            className={`overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 restaurant-fade restaurant-glow ${
              idx % 2 === 0 ? "" : "md:ml-auto md:w-5/6"
            }`}
          >
            <div
              className={`flex flex-col ${
                idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {product.images && product.images[0]?.url && (
                <div className="relative w-full md:w-1/2 aspect-video md:aspect-square overflow-hidden bg-muted">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="flex-1 p-8 flex flex-col justify-center bg-linear-to-br from-amber-50 to-white">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <CardTitle className="text-2xl font-serif text-amber-900">
                      {product.name}
                    </CardTitle>
                    {product.isFeatured && (
                      <Badge className="bg-amber-700">Chef&apos;s Choice</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3 text-base text-amber-800">
                    {product.description}
                  </CardDescription>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <p className="text-3xl font-serif font-bold text-amber-900">
                    ${Number(product.price).toFixed(2)}
                  </p>
                  <Button className="bg-amber-700 hover:bg-amber-800">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Order Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Default layout for any other theme
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {products.slice(0, 3).map((product, idx) => (
        <Card
          key={product.id}
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          {product.images && product.images[0]?.url && (
            <div className="relative aspect-square overflow-hidden bg-muted">
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                className="object-cover hover:scale-105 transition-transform"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={idx === 0}
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="line-clamp-1">{product.name}</CardTitle>
              {product.isFeatured && (
                <Badge variant="secondary">Featured</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {product.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${Number(product.price).toFixed(2)}
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleAddToCart(product)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
