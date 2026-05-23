"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type AuthSubmitButtonProps = {
	children: string;
	className?: string;
	pendingLabel?: string;
};

export function AuthSubmitButton({
	children,
	className,
	pendingLabel,
}: AuthSubmitButtonProps) {
	const { pending } = useFormStatus();

	return (
		<button
			type='submit'
			disabled={pending}
			className={cn(
				"inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#7b61ff] px-5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70",
				className,
			)}
		>
			{pending ? (pendingLabel ?? "Creating account...") : children}
		</button>
	);
}
