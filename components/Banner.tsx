"use client";

import { useRouter } from "next/navigation";
import AppActions from "@/components/AppActions";
import UserMenu from "@/components/UserMenu";

type Props = {
  userName: string;
};

export default function Banner({ userName }: Props) {
  const router = useRouter();

  // #region Tailwind utility consts
  const headerCls =
    "w-full h-24 flex-shrink-0 sticky top-0 z-10 bg-surface border-b " +
    "border-neutral-200 flex items-center cursor-pointer";
  const leftColCls = "flex-1 flex items-center pl-6";
  const bannerImgCls = "w-1/2 h-full object-cover";
  const rightColCls = "flex-1 flex items-center justify-end px-6";
  // #endregion

  return (
    <header onClick={() => router.push("/")} className={headerCls}>
      <div className={leftColCls}>
        <AppActions />
      </div>

      <img src="/banner.svg" alt="Sharpener" className={bannerImgCls} />

      <div className={rightColCls}>
        <UserMenu userName={userName} />
      </div>
    </header>
  );
}
