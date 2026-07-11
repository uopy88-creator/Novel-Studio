import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Novel Studio",
  description: "소설 프로젝트를 관리하는 작업실",
};

/** iPhone / iPad 뷰포트 — 가로 확대·잘림 방지 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 테마 FOUC 방지 — LocalStorage 설정을 첫 페인트 전에 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=localStorage.getItem("novel-studio:user-settings");if(!r)return;var s=JSON.parse(r);if(s&&s.theme==="dark")document.documentElement.setAttribute("data-theme","dark");if(s&&s.fontSize==="sm")document.documentElement.style.setProperty("--ns-editor-font-size","0.9375rem");if(s&&s.fontSize==="lg")document.documentElement.style.setProperty("--ns-editor-font-size","1.125rem");}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
