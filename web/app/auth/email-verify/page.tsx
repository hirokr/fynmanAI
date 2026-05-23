"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

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
	const userEmail =
		emailFromQuery && emailFromQuery.trim()
			? emailFromQuery
			: storedEmail || "your email";

	useEffect(() => {
		const sessionEmail = sessionStorage.getItem("authEmail") || "";
		setStoredEmail(sessionEmail);
	}, []);

	const handleChange = (val: string, idx: number) => {
		if (!/^\d?$/.test(val)) return;
		const next = [...code];
		next[idx] = val;
		setCode(next);
		if (val && idx < 5) inputs.current[idx + 1]?.focus();
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
