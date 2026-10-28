"use client";

import { useRouter } from "next/navigation";
import AppActions from "@/components/AppActions";
import BannerArt from "@/components/BannerArt";
import { UserMenu, useTheme } from "@parkerburgess/wandering-parker-ui";

type Props = {
  userName: string;
};

export default function Banner({ userName }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme, palette, setPalette } = useTheme();

  // #region Tailwind utility consts
  const headerCls =
    "w-full h-24 flex-shrink-0 sticky top-0 z-10 bg-surface border-b " +
    "border-neutral-200 flex items-center cursor-pointer";
  const leftColCls = "flex-1 flex items-center pl-6";
  const bannerArtCls = "w-1/2 h-full";
  const rightColCls = "flex-1 flex items-center justify-end px-6";
  // #endregion

  function handleHeaderClick() {
    router.push("/");
  }

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header onClick={handleHeaderClick} className={headerCls}>
      <div className={leftColCls}>
        <AppActions />
      </div>

      <BannerArt className={bannerArtCls} />

      <div className={rightColCls}>
        <UserMenu
          userName={userName}
          theme={resolvedTheme}
          onToggleTheme={handleToggleTheme}
          palette={palette}
          onSelectPalette={setPalette}
        />
      </div>
    </header>
  );
}
