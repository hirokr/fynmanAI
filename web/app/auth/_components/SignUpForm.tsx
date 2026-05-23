"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { BACKEND_URL } from "@/constants/constants";
import { signUp } from "@/lib/auth/auth";

import { AuthField } from "./AuthField";
import { AuthSocialButton } from "./AuthSocialButton";
import { AuthSubmitButton } from "./AuthSubmitButton";

const fieldIcon = {
	user: (
		<svg
			width='16'
			height='16'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
			<circle cx='12' cy='7' r='4' />
		</svg>
	),
	email: (
		<svg
			width='16'
			height='16'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<rect width='20' height='16' x='2' y='4' rx='2' />
			<path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
		</svg>
	),
	password: (
		<svg
			width='16'
			height='16'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<rect width='18' height='11' x='3' y='11' rx='2' ry='2' />
			<path d='M7 11V7a5 5 0 0 1 10 0v4' />
		</svg>
	),
};

export default function SignUpForm() {
	const [state, action] = useActionState(signUp, undefined);
	const [showPassword, setShowPassword] = useState(false);

	return (
		<section className='w-full max-w-120 rounded-[28px] border border-white/10 bg-[#1e2020]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10'>
			<div className='text-center'>
				<h1 className='text-3xl font-semibold tracking-tight text-white md:text-[32px] md:leading-10'>
					Create Account
				</h1>
				<p className='mt-2 text-sm leading-6 text-[#c9c4d8]'>
					Start your journey into cognitive focus.
				</p>
			</div>

			<form action={action} className='mt-8 space-y-5'>
				{state?.message ? (
					<p className='rounded-2xl border border-[#ffb4ab]/20 bg-[#ffb4ab]/10 px-4 py-3 text-sm text-[#ffb4ab]'>
						{state.message}
					</p>
				) : null}

				<AuthField
					id='name'
					name='name'
					label='Full Name'
					placeholder='Enter your full name'
					autoComplete='name'
					leadingIcon={fieldIcon.user}
					error={state?.error?.name?.[0]}
				/>

				<AuthField
					id='email'
					name='email'
					label='Email Address'
					placeholder='name@company.com'
					autoComplete='email'
					leadingIcon={fieldIcon.email}
					error={state?.error?.email?.[0]}
				/>

				<AuthField
					id='password'
					name='password'
					label='Password'
					type={showPassword ? "text" : "password"}
					placeholder='••••••••'
					autoComplete='new-password'
					leadingIcon={fieldIcon.password}
					actionSlot={
						<span className='text-[11px] text-[#928ea1] transition-colors hover:text-primary'>
							Strong?
						</span>
					}
					trailingSlot={
						<button
							type='button'
							onClick={() => setShowPassword((prev) => !prev)}
							className='text-[#928ea1] transition-colors hover:text-white'
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							<svg
								width='18'
								height='18'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
								aria-hidden='true'
							>
								{showPassword ? (
									<>
										<path d='M3 3l18 18' />
										<path d='M10.58 10.58a2 2 0 1 0 2.83 2.83' />
										<path d='M9.88 5.09A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a18.15 18.15 0 0 1-3.12 3.88' />
										<path d='M6.61 6.61A17.7 17.7 0 0 0 2 12s4 7 10 7a10.9 10.9 0 0 0 5.39-1.39' />
									</>
								) : (
									<>
										<path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z' />
										<circle cx='12' cy='12' r='3' />
									</>
								)}
							</svg>
						</button>
					}
					error={state?.error?.password?.[0]}
				/>

				<AuthSubmitButton pendingLabel='Creating account...'>
					Create Account
				</AuthSubmitButton>

				<div className='flex items-center gap-4 py-2'>
					<div className='h-px flex-1 bg-white/10' />
					<span className='font-[Space_Grotesk] text-[11px] uppercase tracking-[0.18em] text-[#928ea1]'>
						or
					</span>
					<div className='h-px flex-1 bg-white/10' />
				</div>

				<AuthSocialButton
					href={`${BACKEND_URL}/api/auth/google`}
					label='Sign up with Google'
				/>
			</form>

			<div className='mt-8 text-center'>
				<p className='text-sm text-[#c9c4d8]'>
					Already have an account?{" "}
					<Link
						href='/auth/signin'
						className='ml-1 font-bold text-primary transition-colors hover:underline'
					>
						Sign In
					</Link>
				</p>
			</div>
		</section>
	);
}
