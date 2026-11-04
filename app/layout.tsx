import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header, ThemeProvider } from "@parkerburgess/wandering-parker-ui";
import type { SiteNavItem } from "@parkerburgess/wandering-parker-ui";
import { getUserName } from "@parkerburgess/wandering-parker-server";

const navItems: SiteNavItem[] = [];

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
  // h-full (not min-h-full): main's flex-1 needs a bounded ancestor height to
  // cap against, so its own internal overflow-y-auto region actually scrolls
  // instead of the whole page growing past the viewport.
  const bodyCls = "h-full flex flex-col";
  // #endregion

  return (
    <html lang="en" suppressHydrationWarning className={htmlCls}>
      <body className={bodyCls}>
        <ThemeProvider>
          <Header userName={userName} brandText="Sharpener" navItems={navItems} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
