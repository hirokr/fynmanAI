"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthPageShell } from "../_components/AuthPageShell";
import { ForgotPasswordCard } from "./_components/ForgotPasswordCard";
import { apiFetch } from "@/lib/apiFetch";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmedEmail = email.trim();
		if (!trimmedEmail) return;
		if (isSubmitting) return;

		try {
			setIsSubmitting(true);
			await apiFetch("/api/user/forgot-password", {
				method: "POST",
				body: { email: trimmedEmail },
			});
			// Store email locally so verify page can show it
			sessionStorage.setItem("authEmail", trimmedEmail);

			// On success, navigate to the verify page (same UX as before)
			router.push(
				`/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`,
			);
		} catch (err) {
			console.error("Forgot password request failed:", err);
			alert("Failed to send reset link. Please try again later.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AuthPageShell>
			<ForgotPasswordCard
				email={email}
				onEmailChange={setEmail}
				onSubmit={handleSubmit}
			/>
		</AuthPageShell>
	);
}
