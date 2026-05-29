"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

import { AuthPageShell } from "../_components/AuthPageShell";
import { PasswordInputField } from "./_components/PasswordInputField";
import { PasswordRequirementItem } from "./_components/PasswordRequirementItem";
import BrandHeader from "../_components/BrandHeader";
import AuthCard from "../_components/AuthCard";
import SupportLinks from "../_components/SupportLinks";
import SystemFooter from "../_components/SystemFooter";

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const meetsLengthRequirement = newPassword.length >= 8;
	const meetsSpecialCharRequirement = /[^A-Za-z0-9]/.test(newPassword);

	return (
		<AuthPageShell>
			<BrandHeader />
			<AuthCard>
				<div className="mb-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-label-sm font-semibold uppercase tracking-[0.2em] text-primary w-fit mx-auto self-center">
					Secure reset
				</div>

				<h2 className="mb-3 text-headline-md font-bold tracking-tight text-on-surface text-center">
					Reset Password
				</h2>
				<p className="mb-6 text-body-md leading-relaxed text-on-surface-variant text-center opacity-70">
					Create a new, strong password to secure your account.
				</p>

				<form
					className="flex flex-col gap-4 w-full"
					onSubmit={async (event) => {
						event.preventDefault();

						// require token from querystring
						if (!token) {
							alert("Missing reset token. Use the link from your email.");
							return;
						}
						if (isSubmitting) return;

						try {
							setIsSubmitting(true);
							await apiFetch("/api/user/reset-password", {
								method: "POST",
								body: {
									token,
									newPassword,
									confirmPassword,
								},
							});

							// success: go to sign in
							router.push("/auth/signin");
						} catch (err) {
							console.error("Reset password failed", err);
							alert("Failed to reset password");
						} finally {
							setIsSubmitting(false);
						}
					}}
				>
					<div className="flex flex-col gap-4 w-full">
						<PasswordInputField
							label="New Password"
							value={newPassword}
							onChange={setNewPassword}
							visible={showNew}
							onToggleVisibility={() => setShowNew(!showNew)}
						/>

						<PasswordInputField
							label="Confirm New Password"
							value={confirmPassword}
							onChange={setConfirmPassword}
							visible={showConfirm}
							onToggleVisibility={() => setShowConfirm(!showConfirm)}
						/>

						<div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
							<PasswordRequirementItem
								met={meetsLengthRequirement}
								text="At least 8 characters"
							/>
							<PasswordRequirementItem
								met={meetsSpecialCharRequirement}
								text="One special character"
							/>
						</div>

						<button
							type="submit"
							className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98] bg-primary-container text-on-primary-container hover:brightness-110 py-4 px-6 font-bold cursor-pointer border-0 mt-2"
						>
							Reset Password
						</button>
					</div>
				</form>

				<Link
					href="/auth/signin"
					className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98] border border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface py-4 px-6 no-underline mt-4 cursor-pointer"
				>
					Back to Sign In
				</Link>

				<SupportLinks />
			</AuthCard>
			<SystemFooter />
		</AuthPageShell>
	);
}
