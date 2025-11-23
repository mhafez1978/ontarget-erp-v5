"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isStorefront = pathname?.startsWith("/store");

  if (isDashboard || isStorefront) {
    return null;
  }

  return <Navbar />;
}
