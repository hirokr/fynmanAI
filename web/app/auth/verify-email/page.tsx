"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/constants/constants";

import { AuthPageShell } from "../_components/AuthPageShell";
import { VerificationCodeCard } from "./_components/VerificationCodeCard";
import { VerificationFooterLinks } from "./_components/VerificationFooterLinks";
import { VerificationHeader } from "./_components/VerificationHeader";

export default function EmailVerifyPage() {
	const searchParams = useSearchParams();
	const [code, setCode] = useState(["", "", "", "", "", ""]);
	const inputs = useRef<(HTMLInputElement | null)[]>([]);
	const [storedEmail, setStoredEmail] = useState("");
	const emailFromQuery = searchParams.get("email");
	const tokenFromQuery = searchParams.get("token");
	const userIdFromQuery = searchParams.get("id");
	const router = useRouter();
	const userEmail =
		emailFromQuery && emailFromQuery.trim()
			? emailFromQuery
			: storedEmail || "your email";

	useEffect(() => {
		const sessionEmail = sessionStorage.getItem("authEmail") || "";
		setStoredEmail(sessionEmail);
	}, []);

	useEffect(() => {
		if (!tokenFromQuery) return;

		// attempt to verify email automatically when token present
		(async () => {
			try {
				const res = await fetch(`${BACKEND_URL}/api/user/verify-email`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						token: tokenFromQuery,
						userId: userIdFromQuery || undefined,
					}),
				});

				const payload = await res.json();
				if (res.ok) {
					alert("Email verified successfully");
					router.push("/auth/signin");
				} else {
					console.warn("Email verify failed", payload);
					alert(payload?.message || "Email verification failed");
				}
			} catch (err) {
				console.error("Verify email error", err);
				alert("Email verification failed");
			}
		})();
	}, [tokenFromQuery, userIdFromQuery, router]);

	const handleChange = (val: string, idx: number) => {
		if (!/^\d?$/.test(val)) return;
		const next = [...code];
		next[idx] = val;
		setCode(next);
		if (val && idx < 5) inputs.current[idx + 1]?.focus();
	};

	const handleSubmitToken = async (token: string) => {
		if (!token) return;
		try {
			const res = await fetch(`${BACKEND_URL}/api/user/verify-email`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, userId: userIdFromQuery || undefined }),
			});

			const payload = await res.json();
			if (res.ok) {
				alert("Email verified successfully");
				router.push("/auth/signin");
			} else {
				console.warn("Email verify failed", payload);
				alert(payload?.message || "Email verification failed");
			}
		} catch (err) {
			console.error("Verify email error", err);
			alert("Email verification failed");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
		if (e.key === "Backspace" && !code[idx] && idx > 0)
			inputs.current[idx - 1]?.focus();
	};

	const setInputRef = (element: HTMLInputElement | null, idx: number) => {
		inputs.current[idx] = element;
	};

	return (
		<AuthPageShell>
			<VerificationHeader userEmail={userEmail} />
			<VerificationCodeCard
				code={code}
				onChangeDigit={handleChange}
				onKeyDownDigit={handleKeyDown}
				setInputRef={setInputRef}
			/>
			<VerificationFooterLinks />
		</AuthPageShell>
	);
}
