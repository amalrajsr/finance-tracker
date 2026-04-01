import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinTrack",
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/apple-touch-icon/apple-touch-icon-192x192.png", sizes: "192x192" },
      { url: "/apple-touch-icon/apple-touch-icon-512x512.png", sizes: "512x512" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3ED" },
    { media: "(prefers-color-scheme: dark)", color: "#171411" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-text-primary`}
      >
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
