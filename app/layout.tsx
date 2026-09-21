import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@parkerburgess/wandering-parker-ui";
import Banner from "@/components/Banner";
import { getUserName } from "@parkerburgess/wandering-parker-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skill Training",
  description: "Interactive skill assessment and review",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userName = (await getUserName()) ?? "User";

  // #region Tailwind utility consts
  const htmlCls = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;
  const bodyCls = "min-h-full flex flex-col";
  // #endregion

  return (
    <html lang="en" suppressHydrationWarning className={htmlCls}>
      <body className={bodyCls}>
        <ThemeProvider>
          <Banner userName={userName} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
