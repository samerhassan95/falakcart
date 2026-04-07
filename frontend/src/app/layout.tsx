import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import LayoutWrapper from "@/components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "نظام الشركاء - Affiliate System",
  description: "نظام إدارة الشركاء والعمولات - Affiliate Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const locale = localStorage.getItem('NEXT_LOCALE') || 'ar';
                  const dir = locale === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.setAttribute('dir', dir);
                  document.documentElement.setAttribute('lang', locale);
                  document.documentElement.style.visibility = 'visible';
                } catch (e) {
                  document.documentElement.style.visibility = 'visible';
                }
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            html {
              visibility: hidden;
            }
          `
        }} />
      </head>
      <body 
        className="min-h-full flex flex-col" 
        suppressHydrationWarning
      >
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
