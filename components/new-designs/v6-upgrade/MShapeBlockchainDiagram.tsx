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

const MShapeBlockchainDiagram: React.FC = () => {
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

  return (
    <div
      className="relative w-full flex items-center justify-center py-24"
      ref={containerRef}
    >
      {/* 5 Column Grid to form the 'M' path */}
      <div className="grid grid-cols-5 gap-x-12 gap-y-12 max-w-5xl mx-auto">
        {/* Row 1: Top of the M */}
        <div /> {/* col 1 empty */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Company</span>
          <Circle ref={companyRef}>
            <Building2 className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        <div /> {/* col 3 empty */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Transaction
          </span>
          <Circle ref={transactionRef}>
            <ArrowRightLeft className="w-10 h-10 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        <div /> {/* col 5 empty */}
        {/* Row 2: Middle of the M */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Customer</span>
          <Circle ref={customerRef}>
            <User className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        <div />
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Payment</span>
          <Circle ref={paymentRef}>
            <CreditCard className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        <div />
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Blockchain
          </span>
          <Circle ref={nodeRef}>
            <Network className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        {/* Row 3: Bottom of the M */}
        <div />
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Order</span>
          <Circle ref={orderRef}>
            <ShoppingCart className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Invoice</span>
          <Circle ref={invoiceRef}>
            <Receipt className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Contract</span>
          <Circle ref={contractRef}>
            <FileSignature className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-foreground">Ledger</span>
          <Circle ref={ledgerRef}>
            <Database className="w-8 h-8 text-purple-500 dark:text-primary" />
          </Circle>
        </div>
      </div>

      {/* Beams - Original logic, curvature, and offsets preserved */}
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

export default MShapeBlockchainDiagram;
