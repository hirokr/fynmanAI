"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";
import ActiveSessionCenter from "./_components/ActiveSessionCenter";

export default function SessionActive() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/signin");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null; // or loader
  }

  return <ActiveSessionCenter />;
}