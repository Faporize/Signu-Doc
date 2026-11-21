import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700", "800"],
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
  themeColor: "#f3f4f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
