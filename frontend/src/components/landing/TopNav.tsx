"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/auth/AuthContext";

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, clearSession } = useAuth();

  const navItems = useMemo(() => {
    const items = [
      { label: "Platform", href: "/platform" },
      { label: "Session", href: "/session" },
      { label: "Docs", href: "/docs" },
    ];

    if (user) {
      items.splice(2, 0, { label: "Dashboard", href: "/dashboard" });
    }

    return items;
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [user]);

  const handleLogout = () => {
    clearSession();        // clears frontend state
    setIsOpen(false);      // close mobile menu
  };

  const userName = user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div>
      <nav className="fixed top-0 w-full h-14 z-[100] bg-[#15121b]/80 backdrop-blur-md border-b border-[#464554]/10">
        <div className="relative flex items-center justify-between px-4 md:px-12 w-full max-w-360 mx-auto h-full">

          {/* Logo */}
          <Link
            href="/"
            className="font-headline-md text-headline-md font-bold text-[#e7e0ed] tracking-tighter"
          >
            FymenAI
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-6">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  index === 0
                    ? "font-body-sm text-body-sm text-[#c0c1ff] font-bold border-b border-[#c0c1ff] py-1"
                    : "font-body-sm text-body-sm text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors py-1"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">

            <div className="hidden md:flex items-center gap-4">

              {user ? (
                <div className="flex items-center gap-2">

                  {/* User */}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2a2a3a] flex items-center justify-center text-[#c0c1ff] font-bold text-sm">
                      {userInitial}
                    </div>

                    <span className="text-[#e7e0ed] text-sm font-medium">
                      {userName}
                    </span>
                  </Link>

                  {/* 🔥 Sign out */}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-400 hover:text-red-300 transition px-2"
                  >
                    Sign out
                  </button>

                </div>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="font-body-sm text-body-sm text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors"
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/auth/signup"
                    className="bg-[#8083ff] text-[#0d0096] font-body-sm text-body-sm px-6 py-2 rounded-lg font-bold hover:opacity-80 transition-all"
                  >
                    Get Access
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] relative z-[200]"
            >
              <span className={`block h-[2px] w-6 bg-[#e7e0ed] rounded-full transition-all duration-300 ${isOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`block h-[2px] w-6 bg-[#e7e0ed] rounded-full transition-all duration-300 ${isOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-[2px] w-6 bg-[#e7e0ed] rounded-full transition-all duration-300 ${isOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-3/4 z-[60] bg-[#15121b] border-l border-[#464554]/20 flex flex-col pt-20 px-6 pb-8 transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-1">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`py-3 px-2 text-base rounded-lg transition-colors border-b border-[#464554]/30 ${
                index === 0
                  ? "text-[#c0c1ff] font-bold"
                  : "text-[#c7c4d7] hover:text-[#c0c1ff] hover:bg-[#c0c1ff]/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Auth */}
        <div className="mt-auto flex flex-col gap-3">

          {user ? (
            <div className="flex flex-col gap-3">

              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full py-3 px-3 rounded-lg bg-white/5"
              >
                <div className="w-9 h-9 rounded-full bg-[#2a2a3a] flex items-center justify-center text-[#c0c1ff] font-bold">
                  {userInitial}
                </div>

                <span className="text-[#e7e0ed] text-sm">
                  {userName}
                </span>
              </Link>

              {/* 🔥 Mobile Sign out */}
              <button
                onClick={handleLogout}
                className="w-full text-center py-3 text-red-400 border border-red-400/30 rounded-lg"
              >
                Sign out
              </button>

            </div>
          ) : (
            <>
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 text-[#c7c4d7] border border-[#464554]/40 rounded-lg"
              >
                Sign in
              </Link>

              <Link
                href="/auth/signup"
                onClick={() => setIsOpen(false)}
                className="w-full text-center bg-[#8083ff] text-[#0d0096] py-3 rounded-lg font-bold"
              >
                Get Access
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}