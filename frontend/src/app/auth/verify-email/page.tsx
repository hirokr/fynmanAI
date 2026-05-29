"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

import { AuthPageShell } from "../_components/AuthPageShell";
import { VerificationCodeCard } from "./_components/VerificationCodeCard";
import { VerificationHeader } from "./_components/VerificationHeader";
import BrandHeader from "../_components/BrandHeader";
import AuthCard from "../_components/AuthCard";
import SupportLinks from "../_components/SupportLinks";
import SystemFooter from "../_components/SystemFooter";

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
	const [isVerifying, setIsVerifying] = useState(false);

	useEffect(() => {
		const sessionEmail = sessionStorage.getItem("authEmail") || "";
		setStoredEmail(sessionEmail);
	}, []);

	useEffect(() => {
		if (!tokenFromQuery) return;

		// attempt to verify email automatically when token present
		(async () => {
			try {
				setIsVerifying(true);
				await apiFetch("/api/user/verify-email", {
					method: "POST",
					body: {
						token: tokenFromQuery,
						userId: userIdFromQuery || undefined,
					},
				});
				alert("Email verified successfully");
				router.push("/auth/signin");
			} catch (err) {
				console.error("Verify email error", err);
				alert("Email verification failed");
			} finally {
				setIsVerifying(false);
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
		if (isVerifying) return;
		try {
			setIsVerifying(true);
			await apiFetch("/api/user/verify-email", {
				method: "POST",
				body: { token, userId: userIdFromQuery || undefined },
			});
			alert("Email verified successfully");
			router.push("/auth/signin");
		} catch (err) {
			console.error("Verify email error", err);
			alert("Email verification failed");
		} finally {
			setIsVerifying(false);
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
			<BrandHeader />
			<AuthCard>
				<VerificationHeader userEmail={userEmail} />
				<VerificationCodeCard
					code={code}
					onChangeDigit={handleChange}
					onKeyDownDigit={handleKeyDown}
					setInputRef={setInputRef}
					onSubmit={handleSubmitToken}
				/>
				<SupportLinks />
			</AuthCard>
			<SystemFooter />
		</AuthPageShell>
	);
}
