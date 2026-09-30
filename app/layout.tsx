import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navbar from "@/components/navbar";
import { SessionProvider } from "next-auth/react";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Projects Status",
  description: "Add your projects and manage them",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased font-sans ${geist.variable}`}
    >
      <body className="min-h-full flex flex-col">
        {/* Navbar */}
        <Navbar />

        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html >
  );
}
