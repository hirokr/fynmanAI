"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "home", label: "Home", href: "/dashboard" },
  { icon: "auto_stories", label: "Learning Path", href: "#" },
  { icon: "folder_open", label: "Resources", href: "#" },
  { icon: "settings", label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            className={
              isActive
                ? "flex items-center gap-4 p-4 bg-secondary-container text-on-secondary-container rounded-xl cursor-pointer active:scale-95"
                : "flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-xl cursor-pointer active:scale-95"
            }
            href={item.href}
          >
            <span
              className="material-symbols-outlined"
            >
              {item.icon}
            </span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
