import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Visual 360° - Immersive Virtual Tour Creator",
  description:
    "Create, edit, and share immersive 360° virtual tours. Upload panorama images, build interactive floor plans, and connect viewpoints with seamless navigation.",
  keywords: [
    "360°",
    "virtual tour",
    "panorama",
    "immersive",
    "real estate",
    "floor plan",
    "interactive",
    "VR",
    "3D",
  ],
  authors: [{ name: "Visual 360° Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Visual 360° - Immersive Virtual Tour Creator",
    description:
      "Create, edit, and share immersive 360° virtual tours with interactive floor plans and seamless navigation.",
    siteName: "Visual 360°",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual 360° - Immersive Virtual Tour Creator",
    description:
      "Create, edit, and share immersive 360° virtual tours with interactive floor plans and seamless navigation.",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
