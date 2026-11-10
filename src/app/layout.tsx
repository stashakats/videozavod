import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "videozavod",
  description: "Локальная установка генератора коротких видео.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="min-h-full antialiased">
      <body className="min-h-screen bg-white text-neutral-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
