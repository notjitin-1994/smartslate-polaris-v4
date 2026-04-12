import type { Metadata } from "next";
import { Quicksand, Lato, JetBrains_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import Providers from "./providers";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartSlate Polaris — Agentic Discovery Workspace",
  description: "Human-in-the-loop AI-powered strategy discovery platform",
  icons: {
    icon: "/logo-swirl.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-dvh overflow-hidden">
      <body
        className={`${quicksand.variable} ${lato.variable} ${jetbrainsMono.variable} font-sans h-dvh overflow-hidden antialiased bg-[#020C1B]`}
      >
        <div className="noise-overlay" />
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
