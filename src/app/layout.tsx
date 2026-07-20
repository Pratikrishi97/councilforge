import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CouncilForge — Provider-aware multi-agent intelligence platform",
  description:
    "A full CouncilForge: provider-aware council debate, autonomous research, knowledge graph, decision journal, cost estimation, sprint planning, architecture simulation, scenario analysis, and an executive dashboard.",
  keywords: [
    "CouncilForge",
    "AI Council",
    "knowledge graph",
    "decision journal",
    "cost estimation",
    "sprint planning",
    "provider routing",
    "multi-agent debate",
    "requirements intelligence",
    "free LLM APIs",
  ],
  authors: [{ name: "CouncilForge" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CouncilForge",
    description:
      "Provider-aware multi-agent intelligence platform with knowledge graph, decision journal, and executive dashboard.",
    siteName: "CouncilForge",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
