"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import AppActions from "@/components/AppActions";
import { UserMenu } from "@parkerburgess/wandering-parker-ui";

type Props = {
  userName: string;
};

/**
 * next-themes cannot know the theme during server rendering, so the toggle has
 * to stay inert until the client has mounted or the markup mismatches on
 * hydration. useSyncExternalStore gives that "am I on the client yet" signal
 * without an effect — the usual useState/useEffect pair is now a lint error
 * under the React Compiler rules.
 */
function subscribeToNothing(): () => void {
  return function unsubscribe() {};
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

export default function Banner({ userName }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot
  );

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
