"use client";

import { Wifi } from "lucide-react";

interface CreditCardDisplayProps {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export function CreditCardDisplay({
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
}: CreditCardDisplayProps) {
  // Format card number with spaces
  const formatCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || "";
    return formatted.padEnd(19, "•").substring(0, 19);
  };

  // Detect card type
  const getCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    if (cleaned.startsWith("4")) return "visa";
    if (cleaned.startsWith("5")) return "mastercard";
    if (cleaned.startsWith("3")) return "amex";
    return "generic";
  };

  const cardType = getCardType(cardNumber);

  return (
    <div className="relative w-full max-w-sm mx-auto perspective-1000">
      {/* Card Container with 3D effect */}
      <div className="relative transform-gpu transition-all duration-500 hover:scale-105">
        {/* Main Card */}
        <div className="relative w-full h-56 rounded-2xl overflow-hidden shadow-2xl">
          {/* Glassmorphic gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-pink-600/90 to-blue-600/90 backdrop-blur-xl">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-50" />

            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          </div>

          {/* Card Content */}
          <div className="relative h-full p-6 flex flex-col justify-between text-white">
            {/* Top Section */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-12 h-8 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-80 shadow-lg" />
                <Wifi className="h-5 w-5 rotate-90 opacity-60" />
              </div>
              <div className="text-right">
                {cardType === "visa" && (
                  <div className="text-2xl font-bold tracking-wider">VISA</div>
                )}
                {cardType === "mastercard" && (
                  <div className="flex gap-1">
                    <div className="w-8 h-8 rounded-full bg-red-500/80" />
                    <div className="w-8 h-8 rounded-full bg-orange-400/80 -ml-4" />
                  </div>
                )}
                {cardType === "amex" && (
                  <div className="text-xl font-bold">AMEX</div>
                )}
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-6">
              <div className="font-mono text-2xl tracking-wider font-medium">
                {formatCardNumber(cardNumber)}
              </div>

              {/* Card Holder and Expiry */}
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-xs opacity-70 uppercase tracking-wide">
                    Card Holder
                  </div>
                  <div className="font-medium text-sm uppercase tracking-wide">
                    {cardHolder || "YOUR NAME"}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-xs opacity-70 uppercase tracking-wide">
                    Expires
                  </div>
                  <div className="font-medium text-sm tracking-wide">
                    {expiryDate || "MM/YY"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Holographic effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30 pointer-events-none" />
        </div>

        {/* Card Shadow */}
        <div className="absolute inset-0 -z-10 translate-y-2 rounded-2xl bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 blur-xl" />
      </div>

      {/* CVV Display (back of card preview) */}
      {cvv && (
        <div className="mt-4 w-24 h-12 ml-auto rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-mono text-sm shadow-lg">
          CVV: {cvv}
        </div>
      )}
    </div>
  );
}
