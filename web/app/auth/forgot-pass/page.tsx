"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthPageShell } from "../_components/AuthPageShell";
import { ForgotPasswordCard } from "./_components/ForgotPasswordCard";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");

	return (
		<AuthPageShell>
			<ForgotPasswordCard
				email={email}
				onEmailChange={setEmail}
				onSubmit={(event) => {
					event.preventDefault();
					const trimmedEmail = email.trim();
					if (trimmedEmail) {
						sessionStorage.setItem("authEmail", trimmedEmail);
					}
					router.push(
						`/auth/email_verify?email=${encodeURIComponent(trimmedEmail)}`,
					);
				}}
			/>
		</AuthPageShell>
	);
}
