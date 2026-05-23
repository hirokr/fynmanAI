import type { ReactNode } from "react";

type AuthPageShellProps = {
	children: ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
	return (
		<div className='relative flex min-h-[calc(100svh-5rem)] w-full items-center justify-center overflow-hidden py-10'>
			<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,_var(--primary)_18%,_transparent)_0,_transparent_38%),radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,_var(--secondary)_16%,_transparent)_0,_transparent_34%)] opacity-80' />
			<main className='relative flex w-full max-w-5xl flex-col items-center justify-center px-4'>
				{children}
			</main>
		</div>
	);
}
