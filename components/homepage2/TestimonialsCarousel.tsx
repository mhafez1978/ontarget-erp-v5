"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Testimonial {
  id: string;
  customerName: string;
  testimonial: string;
  customerPhoto: string | null;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  testimonialFormProps: {
    slug?: string;
    apiPath?: string;
  } | null;
}

export function TestimonialsCarousel({
  testimonials,
}: TestimonialsCarouselProps) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Loved by Businesses Worldwide
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See what our customers have to say
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem
                key={testimonial.id}
                className="md:basis-1/2 lg:basis-1/3"
              >
                <Card className="h-full border-2 hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow italic">
                      {testimonial.testimonial}
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={testimonial.customerPhoto || undefined}
                          alt="a77a"
                        />
                        <AvatarFallback className="bg-linear-to-br from-purple-500 to-indigo-600 text-white">
                          {testimonial.customerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {testimonial.customerName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
