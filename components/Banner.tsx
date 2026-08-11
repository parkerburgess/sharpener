"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import AppActions from "@/components/AppActions";
import { UserMenu } from "@parkerburgess/wandering-parker-ui";

type Props = {
  userName: string;
};

export default function Banner({ userName }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // #region Tailwind utility consts
  const headerCls =
    "w-full h-24 flex-shrink-0 sticky top-0 z-10 bg-surface border-b " +
    "border-neutral-200 flex items-center cursor-pointer";
  const leftColCls = "flex-1 flex items-center pl-6";
  const bannerImgCls = "w-1/2 h-full object-cover";
  const rightColCls = "flex-1 flex items-center justify-end px-6";
  // #endregion

  function handleToggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header onClick={() => router.push("/")} className={headerCls}>
      <div className={leftColCls}>
        <AppActions />
      </div>

      <img src="/banner.svg" alt="Sharpener" className={bannerImgCls} />

      <div className={rightColCls}>
        <UserMenu
          userName={userName}
          theme={mounted ? (theme === "dark" ? "dark" : "light") : undefined}
          onToggleTheme={mounted ? handleToggleTheme : undefined}
        />
      </div>
    </header>
  );
}
