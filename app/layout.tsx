import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "@/styles/theme-animations.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { Toaster } from "@/components/ui/sonner";
import { SWRProvider } from "@/lib/swr-provider";
import { VisitorTracker } from "@/components/visitor-tracker";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "OnTarget ERP v5 - Transform Your Business",
  description:
    "Streamline operations, boost productivity, and drive growth with our comprehensive enterprise resource planning platform.",
  keywords: [
    "ERP",
    "Enterprise Resource Planning",
    "Business Management",
    "Productivity",
  ],
  authors: [{ name: "OnTarget ERP" }],
  creator: "OnTarget ERP",
  publisher: "OnTarget ERP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "OnTarget ERP v5 - Transform Your Business",
    description:
      "Streamline operations, boost productivity, and drive growth with our comprehensive enterprise resource planning platform.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#0066CC" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body className={`bg-background ${montserrat.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <VisitorTracker />
            <ConditionalNavbar />
            {children}
            <Toaster />
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
