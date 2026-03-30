import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinTrack — Privacy-First Expense Tracker",
  description:
    "Track your expenses by uploading bank statements. No bank API access, no credential sharing. Your data stays yours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInit = `
(function(){
  try {
    var k = 'fintrack-theme';
    var t = localStorage.getItem(k);
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = t === 'dark' || (t !== 'light' && dark);
    document.documentElement.classList.toggle('dark', useDark);
  } catch (e) {}
})();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-text-primary`}
      >
        <Script
          id="fintrack-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInit }}
        />
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
