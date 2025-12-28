import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LoadingProvider } from "@/components/LoadingBar";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Portfolio Tracker",
  description: "Track your stock portfolio and dividends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider>
          <LoadingProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8 page-transition">
              {children}
            </main>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
