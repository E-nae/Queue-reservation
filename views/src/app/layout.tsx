import type { Metadata } from "next";
import { Black_Han_Sans, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import ServerAwakeGuard from '@/components/ServerAwakeGuard';

// 제목·숫자: 공연 포스터 같은 굵은 한글 / 본문: 단정한 산세리프
const hanSans = Black_Han_Sans({
  variable: "--font-hansans",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const plex = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "SUPER CONCERT 2026 예매",
  description: "SUPER CONCERT 2026 대기열 예매",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${hanSans.variable} ${plex.variable} antialiased`}>
        <ServerAwakeGuard>
          {children}
        </ServerAwakeGuard>
      </body>
    </html>
  );
}
