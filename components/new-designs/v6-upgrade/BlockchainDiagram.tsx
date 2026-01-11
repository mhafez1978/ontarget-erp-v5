"use client";

import React, { forwardRef, useRef } from "react";
import {
  User,
  Building2,
  ShoppingCart,
  Receipt,
  CreditCard,
  FileSignature,
  ArrowRightLeft,
  Database,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

// Keep `Block` for future but comment out heavy UI when switching to circles.
// const Block = forwardRef<HTMLDivElement, BlockProps>(function Block(
//   { icon, label, tooltipTitle, tooltipText, rotate = "", large, stepNumber },
//   ref
// ) {
//   return (
//     <div className="group relative z-20" ref={ref}>
//       {/* Step badge (top center) */}
//       {typeof stepNumber === "number" ? (
//         <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
//           <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-purple-500 text-white dark:bg-primary dark:text-black border border-border">
//             {stepNumber}
//           </div>
//         </div>
//       ) : null}

//       <div
//         className={`bg-card dark:bg-input/30 border border-border ${
//           large ? "w-40 h-40" : "w-32 h-32"
//         } rounded-xl ${rotate} flex flex-col items-center justify-center transition-transform hover:scale-105 px-4 py-3`}
//       >
//         <div className="mb-2 text-purple-500 dark:text-primary">{icon}</div>
//         <span className="text-xs uppercase tracking-widest text-text font-bold">
//           {label}
//         </span>
//       </div>

//       <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-card dark:bg-input/30 p-3 rounded-lg w-44 text-left pointer-events-none -top-16 left-1/2 -translate-x-1/2 border border-border z-30">
//         <p className="text-xs font-bold text-text">{tooltipTitle}</p>
//         <p className="text-[12px] text-text-muted">{tooltipText}</p>
//       </div>
//     </div>
//   );
// });
// Block.displayName = "Block";

// Simple Circle component to mimic Magic UI example
const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label?: string }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-[100px] items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:bg-input/30",
        className
      )}
    >
      {children}
    </div>
  );
});
Circle.displayName = "Circle";

const BlockchainDiagram: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const customerRef = useRef<HTMLDivElement | null>(null);
  const companyRef = useRef<HTMLDivElement | null>(null);
  const orderRef = useRef<HTMLDivElement | null>(null);
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const contractRef = useRef<HTMLDivElement | null>(null);
  const transactionRef = useRef<HTMLDivElement | null>(null);
  const ledgerRef = useRef<HTMLDivElement | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Using official AnimatedBeam component (client-only)

  return (
    <div
      className="relative w-full flex items-center justify-center py-24"
      ref={containerRef as React.Ref<HTMLDivElement>}
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-100 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="neonGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-row items-center justify-center gap-24 relative w-full max-w-6xl mx-auto">
        {/* Circle placeholders (using Magic UI style) */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Customer</span>
          <Circle ref={customerRef as React.Ref<HTMLDivElement>}>
            <User className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Company</span>
          <Circle ref={companyRef as React.Ref<HTMLDivElement>}>
            <Building2 className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Order</span>
          <Circle ref={orderRef as React.Ref<HTMLDivElement>}>
            <ShoppingCart className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Invoice</span>
          <Circle ref={invoiceRef as React.Ref<HTMLDivElement>}>
            <Receipt className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Payment</span>
          <Circle ref={paymentRef as React.Ref<HTMLDivElement>}>
            <CreditCard className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Contract</span>
          <Circle ref={contractRef as React.Ref<HTMLDivElement>}>
            <FileSignature className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Transaction
          </span>
          <Circle ref={transactionRef as React.Ref<HTMLDivElement>}>
            <ArrowRightLeft className="w-10 h-10 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Ledger</span>
          <Circle ref={ledgerRef as React.Ref<HTMLDivElement>}>
            <Database className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Blockchain
          </span>
          <Circle ref={nodeRef as React.Ref<HTMLDivElement>}>
            <Network className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
      </div>
      {/* Beams with animated pulse effect (Magic UI style) */}
      {/* Forward beams with staggered timing (curved up) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={customerRef}
        toRef={companyRef}
        curvature={-20}
        duration={5}
        delay={5}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={companyRef}
        toRef={orderRef}
        curvature={-20}
        duration={5}
        delay={10}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={orderRef}
        toRef={invoiceRef}
        curvature={-20}
        duration={5}
        delay={15}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={invoiceRef}
        toRef={paymentRef}
        curvature={-20}
        duration={5}
        delay={20}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={paymentRef}
        toRef={contractRef}
        curvature={-20}
        duration={5}
        delay={25}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={contractRef}
        toRef={transactionRef}
        curvature={-20}
        duration={5}
        delay={30}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={transactionRef}
        toRef={ledgerRef}
        curvature={-20}
        duration={5}
        delay={35}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={ledgerRef}
        toRef={nodeRef}
        curvature={-20}
        duration={5}
        delay={40}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#a855f7"
        gradientStopColor="#6366f1"
        startYOffset={50}
        endYOffset={50}
      />

      {/* Reverse (bi-directional) beams (curved down) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={customerRef}
        toRef={companyRef}
        curvature={20}
        duration={5}
        delay={45}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={companyRef}
        toRef={orderRef}
        curvature={20}
        duration={5}
        delay={50}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={orderRef}
        toRef={invoiceRef}
        curvature={20}
        duration={5}
        delay={55}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={invoiceRef}
        toRef={paymentRef}
        curvature={20}
        duration={5}
        delay={60}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={paymentRef}
        toRef={contractRef}
        curvature={20}
        duration={5}
        delay={65}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={contractRef}
        toRef={transactionRef}
        curvature={20}
        duration={5}
        delay={70}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={transactionRef}
        toRef={ledgerRef}
        curvature={20}
        duration={5}
        delay={75}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={ledgerRef}
        toRef={nodeRef}
        curvature={20}
        duration={5}
        delay={80}
        pathWidth={2}
        pathOpacity={1}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
        startYOffset={-50}
        endYOffset={-50}
        reverse
      />
    </div>
  );
};

export default BlockchainDiagram;
