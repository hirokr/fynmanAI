"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  onAuthenticatedClick?: () => void;
  redirectTo?: string;
  className?: string;
};

export default function AuthGuardAction({
  children,
  onClick,
  onAuthenticatedClick,
  redirectTo = "/auth/signin",
  className = "",
}: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    onClick?.();

    if (!user) {
      router.push(redirectTo);
      return;
    }

    onAuthenticatedClick?.();
  };

  return (
    <div onClick={handleClick} className={`cursor-pointer ${className}`}>
      {children}
    </div>
  );
}