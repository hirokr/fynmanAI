import Link from "next/link";
import type { FormEvent } from "react";

type ForgotPasswordCardProps = {
	email: string;
	onEmailChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ForgotPasswordCard({
	email,
	onEmailChange,
	onSubmit,
}: ForgotPasswordCardProps) {
	return (
		<div className='w-full max-w-[420px] rounded-3xl border border-border bg-card/95 p-7 text-foreground shadow-2xl shadow-primary/10 backdrop-blur'>
			<div className='mb-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary'>
				Password Recovery
			</div>

			<h1 className='mb-3 text-3xl font-bold tracking-tight text-foreground'>
				Forgot Password
			</h1>
			<p className='mb-6 text-sm leading-relaxed text-muted-foreground'>
				Enter your email and we&apos;ll send you a link to reset your password.
			</p>

			<form className='space-y-5' onSubmit={onSubmit}>
				<div>
					<label
						htmlFor='email'
						className='mb-2 block text-sm text-muted-foreground'
					>
						Email Address
					</label>
					<input
						id='email'
						type='email'
						required
						value={email}
						onChange={(event) => onEmailChange(event.target.value)}
						placeholder='alex@example.com'
						className='w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring'
					/>
				</div>

				<button
					type='submit'
					className='flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 hover:opacity-95'
				>
					Send Reset Link
				</button>
			</form>

			<Link
				href='/auth/signin'
				className='mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10'
			>
				Back to Sign In
			</Link>
		</div>
	);
}
