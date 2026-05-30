import type { ReactNode } from "react";
import BackgroundEffects from "./_components/BackgroundEffects";

/** Auth routes read query params at runtime; skip static prerender during `next build`. */
export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-[#12131b] text-[#e2e1ee] flex items-center justify-center relative overflow-hidden w-full">
			<BackgroundEffects />
			<main className="w-full max-w-[400px] px-4 relative z-10 flex flex-col items-center justify-center py-10">
				{children}
			</main>
		</div>
	);
}
