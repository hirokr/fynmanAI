"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  icon: string;
  label: string;
  filled?: boolean;
  disabled?: boolean;
} & (
  | { href: string; onPress?: never }
  | { onPress: () => void; href?: never }
);

type MobileNavProps = {
  leftItems: NavItem[];
  rightItems: NavItem[];
  centerButton: {
    icon: string;
    href?: string;
    onPress?: () => void;
    className?: string;
    disabled?: boolean;
  };
};

export default function MobileNav({ leftItems, rightItems, centerButton }: MobileNavProps) {
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const isActive = "href" in item && item.href ? pathname === item.href : false;
    const className = `flex flex-col items-center justify-center gap-0.5 flex-1 ${
      item.disabled
        ? "text-on-surface-variant/40 opacity-40 cursor-not-allowed pointer-events-none"
        : isActive
          ? "text-primary"
          : "text-on-surface-variant"
    }`;
    const content = (
      <>
        <span
          className="material-symbols-outlined text-[22px]"
          style={item.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {item.icon}
        </span>
        <span className="text-[9px] font-medium">{item.label}</span>
      </>
    );

    if (item.onPress) {
      return (
        <button
          key={item.label}
          onClick={item.disabled ? undefined : item.onPress}
          className={className}
          disabled={item.disabled}
        >
          {content}
        </button>
      );
    }

    if (item.disabled) {
      return (
        <span key={item.label} className={className}>
          {content}
        </span>
      );
    }

    return (
      <Link key={item.label} href={item.href!} className={className}>
        {content}
      </Link>
    );
  };

  const centerClass = `w-12 h-12 rounded-full flex items-center justify-center -mt-8 shadow-lg border-4 border-background ${
    centerButton.disabled
      ? "bg-neutral-500/40 text-neutral-300 opacity-40 cursor-not-allowed pointer-events-none"
      : `bg-primary ${centerButton.className ?? ""}`
  }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container flex items-center z-50">
      {leftItems.map(renderItem)}

      <div className="flex flex-col items-center justify-center flex-1">
        {centerButton.onPress ? (
          <button
            onClick={centerButton.disabled ? undefined : centerButton.onPress}
            className={centerClass}
            disabled={centerButton.disabled}
          >
            <span
              className={`material-symbols-outlined ${
                centerButton.disabled ? "text-neutral-300" : "text-on-primary"
              } ${centerButton.className ?? ""}`}
            >
              {centerButton.icon}
            </span>
          </button>
        ) : (
          <Link href={centerButton.href!} className={centerClass}>
            <span className="material-symbols-outlined text-on-primary">{centerButton.icon}</span>
          </Link>
        )}
      </div>

      {rightItems.map(renderItem)}
    </nav>
  );
}