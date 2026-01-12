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
  ShieldCheck,
  Landmark,
  Briefcase,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label?: string }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-[80px] items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:bg-input/30",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

const WShapeBlockchainVerificationProcess: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core Blockchain Refs
  const customerRef = useRef<HTMLDivElement | null>(null);
  const companyRef = useRef<HTMLDivElement | null>(null);
  const orderRef = useRef<HTMLDivElement | null>(null);
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const contractRef = useRef<HTMLDivElement | null>(null);
  const transactionRef = useRef<HTMLDivElement | null>(null);
  const ledgerRef = useRef<HTMLDivElement | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Verification Entity Refs (Connected to Blockchain)
  const irsRef = useRef<HTMLDivElement | null>(null);
  const ccRef = useRef<HTMLDivElement | null>(null);
  const bankRef = useRef<HTMLDivElement | null>(null);
  const personRef = useRef<HTMLDivElement | null>(null);

  return (
    <section
      className="hidden relative w-full flex flex-col gap-24 items-center justify-center py-24 overflow-hidden md:flex"
      ref={containerRef}
    >
      <div className="container mx-auto flex flex-col items-center justify-center">
        <div className="w-52 px-4 py-2 rounded-full border border-purple-500 text-purple-500 dark:text-[#2bee79] dark:border-[#2bee79] text-xs font-semibold mb-6">
          CHAPTER V: PUBLIC TRUST
        </div>
        <h2 className=" mx-auto text-center text-5xl md:text-6xl font-display font-black tracking-tight mb-8 dark:dark:text-gray-200">
          <span className="text-purple-500 dark:text-[#2bee79]">
            Public Trust
          </span>{" "}
          Built-in
        </h2>
        <p className="w-full px-4 mx-auto text-base md:text-lg text-black dark:text-gray-50 text-center leading-relaxed font-body md:max-w-4xl mb-6">
          If you&apos;ve not yet integrated AI into your business operations,
          you&apos;re missing out on a transformative opportunity. OnTarget ERP
          seamlessly incorporates cutting-edge AI technologies to supercharge
          your productivity, enhance decision-making, and drive unprecedented
          brand growth.
        </p>
        <p className="max-w-4xl  mx-auto text-center text-lg md:text-xl font-display font-black tracking-tight mb-8 dark:dark:text-gray-200">
          Immutable{" "}
          <span className="text-purple-500 dark:text-[#2bee79]">
            Business Records
          </span>{" "}
          Data Flow
        </p>
      </div>
      <div className="container max-w-6xl mx-auto">
        {/* 6 Column Layout: 5 for the W-Shape, 1 for the Verifiers */}
        <div className="w-full grid grid-cols-6 gap-x-32 gap-y-2">
          {/* Row 1 */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Customers
            </span>
            <Circle ref={customerRef}>
              <User className="w-6 h-6 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          <div />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Payment Complete
            </span>
            <Circle ref={paymentRef}>
              <CreditCard className="w-6 h-6 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          <div />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Immutable Blockchain Records
            </span>
            <Circle
              ref={nodeRef}
              className="size-[100px] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              <Network className="w-10 h-10 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          {/* Verifier Column Start */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase ">
              IRS, Other legal
            </span>
            <Circle
              ref={irsRef}
              className="border-red-200 dark:border-red-900/50"
            >
              <ShieldCheck className="w-6 h-6 text-red-500" />
            </Circle>
          </div>

          {/* Row 2 */}
          <div />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Company
            </span>
            <Circle ref={companyRef}>
              <Building2 className="w-6 h-6 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          <div />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Contract Generated
            </span>
            <Circle ref={contractRef}>
              <FileSignature className="w-6 h-6 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          <div />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase">
              Commercial Lenders
            </span>
            <Circle
              ref={ccRef}
              className="border-blue-200 dark:border-blue-900/50"
            >
              <Briefcase className="w-6 h-6 text-blue-500" />
            </Circle>
          </div>

          {/* Row 3 */}
          <div />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Order
            </span>
            <Circle ref={orderRef}>
              <ShoppingCart className="w-6 h-6 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Invoice generated and processed.
            </span>
            <Circle ref={invoiceRef}>
              <Receipt className="w-6 h-6 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase text-foreground">
              Transaction Written to / Read from ledger
            </span>
            <Circle ref={transactionRef}>
              <ArrowRightLeft className="w-8 h-8 text-purple-500 dark:text-primary" />
            </Circle>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase">Ledger</span>
            <Circle ref={ledgerRef}>
              <Database className="w-8 h-8 text-green-500" />
            </Circle>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase">
              TAX Professionals
            </span>
            <Circle
              ref={bankRef}
              className="border-amber-200 dark:border-amber-900/50"
            >
              <Landmark className="w-6 h-6 text-amber-500" />
            </Circle>
          </div>

          {/* Row 4 */}
          <div className="col-span-5" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold uppercase">Public Person</span>
            <Circle
              ref={personRef}
              className="border-slate-200 dark:border-slate-700"
            >
              <Users className="w-6 h-6 text-slate-500" />
            </Circle>
          </div>
        </div>

        {/* --- CORE BLOCKCHAIN BEAMS (Bi-Directional) --- */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={customerRef}
          toRef={companyRef}
          duration={5}
          curvature={20}
          startXOffset={10}
          endXOffset={10}
          delay={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={companyRef}
          toRef={orderRef}
          duration={5}
          delay={10}
          curvature={20}
          startXOffset={10}
          endXOffset={10}
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={orderRef}
          toRef={invoiceRef}
          duration={5}
          delay={18}
          curvature={-20}
          startXOffset={-20}
          endXOffset={20}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={invoiceRef}
          toRef={paymentRef}
          duration={5}
          startXOffset={-20}
          endXOffset={-20}
          gradientStartColor="#cf0f1fff"
          gradientStopColor="#791111ff"
          delay={24}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={paymentRef}
          toRef={contractRef}
          duration={5}
          startYOffset={-20}
          endYOffset={-30}
          delay={29}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={contractRef}
          toRef={transactionRef}
          duration={5}
          startXOffset={20}
          endXOffset={20}
          delay={35}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={transactionRef}
          toRef={ledgerRef}
          duration={5}
          curvature={30}
          startYOffset={-5}
          endYOffset={5}
          startXOffset={5}
          endXOffset={5}
          delay={45}
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={ledgerRef}
          toRef={nodeRef}
          duration={5}
          delay={55}
        />

        {/* Reverse Beams */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={ledgerRef}
          toRef={transactionRef}
          curvature={-40}
          startXOffset={40}
          endXOffset={-20}
          duration={5}
          delay={5}
          reverse
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={transactionRef}
          toRef={contractRef}
          startXOffset={-20}
          endXOffset={-30}
          duration={5}
          delay={15}
          reverse
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={contractRef}
          toRef={paymentRef}
          curvature={30}
          duration={5}
          delay={20}
          reverse
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={paymentRef}
          toRef={invoiceRef}
          duration={5}
          delay={27}
          startXOffset={20}
          endXOffset={20}
          reverse
        />

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={invoiceRef}
          toRef={orderRef}
          curvature={20}
          duration={5}
          delay={35}
          startYOffset={-20}
          endYOffset={-20}
          reverse
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={orderRef}
          toRef={companyRef}
          duration={5}
          delay={45}
          startXOffset={-20}
          endXOffset={-20}
          reverse
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={companyRef}
          toRef={customerRef}
          curvature={-10}
          startXOffset={-5}
          endXOffset={-15}
          duration={5}
          delay={55}
          reverse
        />

        {/* --- VERIFICATION BEAMS (Uni-directional from BLOCKCHAIN) --- */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={nodeRef}
          toRef={irsRef}
          duration={4}
          delay={2}
          curvature={0} // Straight across to top verifier
          gradientStartColor="#a855f7"
          gradientStopColor="#ef4444"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={nodeRef}
          toRef={ccRef}
          duration={4}
          delay={2.5}
          curvature={-20}
          gradientStartColor="#a855f7"
          gradientStopColor="#3b82f6"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={nodeRef}
          toRef={bankRef}
          duration={4}
          delay={3}
          curvature={-40}
          gradientStartColor="#a855f7"
          gradientStopColor="#f59e0b"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={nodeRef}
          toRef={personRef}
          duration={4}
          delay={3.5}
          curvature={-60}
          gradientStartColor="#a855f7"
          gradientStopColor="#64748b"
        />
      </div>
    </section>
  );
};

export default WShapeBlockchainVerificationProcess;
