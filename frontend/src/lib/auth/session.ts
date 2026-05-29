"use server";

import { Session } from "@/types/auth";
import { jwtVerify, SignJWT } from "jose";

import { cookies } from "next/headers";

function getEncodedKey() {
	const secretKey = process.env.SESSION_SECRET_KEY;
	if (!secretKey || secretKey.length === 0) {
		throw new Error(
			"SESSION_SECRET_KEY is missing or empty. Set a non-empty secret in your environment.",
		);
	}

	return new TextEncoder().encode(secretKey);
}

export async function createSession(payload: Session) {
	const encodedKey = getEncodedKey();
	const expiredAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days

	const session = await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("15d")
		.sign(encodedKey);

	(await cookies()).set("session", session, {
		httpOnly: true,
		secure: true,
		expires: expiredAt,
		sameSite: "lax",
		path: "/",
	});
}

export async function getSession() {
	const encodedKey = getEncodedKey();
	const cookie = (await cookies()).get("session")?.value;
	if (!cookie) return null;

	try {
		const { payload } = await jwtVerify(cookie, encodedKey, {
			algorithms: ["HS256"],
		});

		return payload as Session;
	} catch {
		// console.error("Failed to verify the session", err);
		// redirect("/auth/signin");
		return null;
	}
}

export async function deleteSession() {
	await (await cookies()).delete("session");
}

export async function updateTokens({
	accessToken,
	refreshToken,
}: {
	accessToken: string;
	refreshToken: string;
}) {
	const encodedKey = getEncodedKey();
	const cookie = (await cookies()).get("session")?.value;
	if (!cookie) return null;

	const { payload } = await jwtVerify<Session>(cookie, encodedKey);

	if (!payload) throw new Error("Session not found");

	const newPayload: Session = {
		user: {
			...payload.user,
		},
		accessToken,
		refreshToken,
	};

	await createSession(newPayload);
}
