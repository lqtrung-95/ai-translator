import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudTranslate - AI 云文档翻译平台",
  description: "专为云服务文档优化的 AI 翻译平台，支持 AWS、GCP、Azure 等技术术语的精准翻译",
  keywords: ["翻译", "云服务", "AWS", "文档", "AI", "技术翻译"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
