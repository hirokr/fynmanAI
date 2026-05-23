"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
	id: string;
	name: string;
	label: string;
	type?: React.HTMLInputTypeAttribute;
	placeholder?: string;
	autoComplete?: string;
	error?: string;
	leadingIcon?: ReactNode;
	actionSlot?: ReactNode;
	trailingSlot?: ReactNode;
	inputClassName?: string;
};

export function AuthField({
	id,
	name,
	label,
	type = "text",
	placeholder,
	autoComplete,
	error,
	leadingIcon,
	actionSlot,
	trailingSlot,
	inputClassName,
}: AuthFieldProps) {
	const hasLeadingIcon = Boolean(leadingIcon);

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between gap-3'>
				<Label
					htmlFor={id}
					className='font-[Space_Grotesk] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#c9c4d8]'
				>
					{label}
				</Label>
				{actionSlot ? <div className='shrink-0'>{actionSlot}</div> : null}
			</div>
			<div className='relative'>
				{leadingIcon ? (
					<div className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#928ea1]'>
						{leadingIcon}
					</div>
				) : null}
				<Input
					id={id}
					name={name}
					type={type}
					placeholder={placeholder}
					autoComplete={autoComplete}
					className={cn(
						"h-12 rounded-2xl border border-white/10 bg-[#0d0d14] text-sm text-white shadow-none placeholder:text-[#928ea1]/60 transition-colors focus-visible:border-[#c9bfff] focus-visible:ring-[#c9bfff]/30",
						hasLeadingIcon ? "pl-11" : "px-4",
						trailingSlot ? "pr-12" : "pr-4",
						inputClassName,
					)}
				/>
				{trailingSlot ? (
					<div className='absolute right-3 top-1/2 -translate-y-1/2 text-[#928ea1]'>
						{trailingSlot}
					</div>
				) : null}
			</div>
			{error ? <p className='text-sm text-[#ffb4ab]'>{error}</p> : null}
		</div>
	);
}
