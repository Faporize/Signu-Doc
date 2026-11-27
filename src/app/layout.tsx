import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

// The same three faces as apprvl.io: Inter for text, Fraunces for headlines
// and JetBrains Mono for the small uppercase labels.
const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ui",
});

const fraunces = Fraunces({
  display: "swap",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const jetBrainsMono = JetBrains_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono-label",
});

export const metadata: Metadata = {
  title: "SignuDoc",
  description:
    "Free e-signature software for small businesses. Upload, send, sign — no enterprise circus required.",
  icons: {
    icon: "/icon.svg",
  },
};

// The same page color as --page in globals.css, so the phone's status bar and
// browser chrome blend into the app. resizes-content makes Android shrink the
// layout when the keyboard opens, as iOS already does.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1f23" },
  ],
};

// Runs before the first paint so a saved or system dark theme never flashes
// light. A saved choice wins, then the system setting.
const themeScript = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${fraunces.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
