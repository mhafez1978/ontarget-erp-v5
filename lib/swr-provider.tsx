"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

interface SWRProviderProps {
  children: ReactNode;
}

// Default fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data."
    ) as Error & {
      info: unknown;
      status: number;
    };
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshInterval: 0, // No automatic polling by default
        dedupingInterval: 2000, // Dedupe requests within 2 seconds
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        shouldRetryOnError: true,
        onError: (error) => {
          // Global error handler
          console.error("SWR Error:", error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
