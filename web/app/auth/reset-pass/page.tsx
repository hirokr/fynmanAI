"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "@/constants/constants";
import { useState } from "react";

import { AuthPageShell } from "../_components/AuthPageShell";
import { PasswordInputField } from "./_components/PasswordInputField";
import { PasswordRequirementItem } from "./_components/PasswordRequirementItem";
import { ResetPasswordVisualPanel } from "./_components/ResetPasswordVisualPanel";

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const meetsLengthRequirement = newPassword.length >= 8;
	const meetsSpecialCharRequirement = /[^A-Za-z0-9]/.test(newPassword);

	return (
		<AuthPageShell>
			<div className='w-full max-w-5xl p-2 text-foreground'>
				<div className='grid w-full grid-cols-1 overflow-hidden rounded-[2rem] border border-border bg-card/90 shadow-2xl shadow-primary/10 lg:grid-cols-2'>
					<div className='flex flex-col justify-center p-8 lg:p-12'>
						<div className='mb-8'>
							<div className='mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary'>
								Secure reset
							</div>
							<h2 className='mb-3 text-4xl font-bold tracking-tight text-foreground'>
								Reset Password
							</h2>
							<p className='text-muted-foreground'>
								Create a new, strong password to secure your account.
							</p>
						</div>

						<form
							className='space-y-6'
							onSubmit={async (event) => {
								event.preventDefault();

								// require token from querystring
								if (!token) {
									alert("Missing reset token. Use the link from your email.");
									return;
								}

								try {
									const res = await fetch(
										`${BACKEND_URL}/api/user/reset-password`,
										{
											method: "POST",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({
												token,
												newPassword,
												confirmPassword,
											}),
										},
									);

									const payload = await res.json();
									if (!res.ok) {
										alert(payload?.message || "Failed to reset password");
										return;
									}

									// success: go to sign in
									router.push("/auth/signin");
								} catch (err) {
									console.error("Reset password failed", err);
									alert("Failed to reset password");
								}
							}}
						>
							<PasswordInputField
								label='New Password'
								value={newPassword}
								onChange={setNewPassword}
								visible={showNew}
								onToggleVisibility={() => setShowNew(!showNew)}
							/>

							<PasswordInputField
								label='Confirm New Password'
								value={confirmPassword}
								onChange={setConfirmPassword}
								visible={showConfirm}
								onToggleVisibility={() => setShowConfirm(!showConfirm)}
							/>

							<div className='grid grid-cols-1 gap-3 py-2 sm:grid-cols-2'>
								<PasswordRequirementItem
									met={meetsLengthRequirement}
									text='At least 8 characters'
								/>
								<PasswordRequirementItem
									met={meetsSpecialCharRequirement}
									text='One special character'
								/>
							</div>

							<button
								type='submit'
								className='flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 hover:opacity-95'
							>
								Reset Password
							</button>
						</form>

						<div className='mt-8 text-center'>
							<Link
								href='/auth/signin'
								className='inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10'
							>
								Back to Sign In
							</Link>
						</div>
					</div>

					<ResetPasswordVisualPanel />
				</div>
			</div>
		</AuthPageShell>
	);
}
