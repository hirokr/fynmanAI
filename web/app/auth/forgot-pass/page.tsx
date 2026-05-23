"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthPageShell } from "../_components/AuthPageShell";
import { ForgotPasswordCard } from "./_components/ForgotPasswordCard";
import { BACKEND_URL } from "@/constants/constants";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmedEmail = email.trim();
		if (!trimmedEmail) return;

		try {
			const res = await fetch(`${BACKEND_URL}/api/user/forgot-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: trimmedEmail }),
			});

			const payload = await res.json();
			// Store email locally so verify page can show it
			sessionStorage.setItem("authEmail", trimmedEmail);

			// On success, navigate to the verify page (same UX as before)
			router.push(
				`/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`,
			);
		} catch (err) {
			console.error("Forgot password request failed:", err);
			alert("Failed to send reset link. Please try again later.");
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
