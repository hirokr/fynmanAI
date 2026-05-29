"use server";

import { redirect } from "next/navigation";
import { BACKEND_URL } from "@/constants/constants";
import { LoginFormSchema, SignupFormSchema } from "@/validation/auth.valid";

import { createSession, deleteSession } from "./session";
import { FormState } from "@/types/auth";

export type AuthTokens = {
	accessToken: string;
	refreshToken: string;
};

const extractTokenFromSetCookie = (
	setCookieHeader: string | null,
	cookieName: string,
) => {
	if (!setCookieHeader) {
		return null;
	}

	const pattern = new RegExp(`${cookieName}=([^;]+)`);
	const match = setCookieHeader.match(pattern);
	return match?.[1] ?? null;
};

const getSetCookieHeader = (response: Response) => {
	const headersWithGetSetCookie = response.headers as Headers & {
		getSetCookie?: () => string[];
	};

	if (typeof headersWithGetSetCookie.getSetCookie === "function") {
		return headersWithGetSetCookie.getSetCookie().join("; ");
	}

	return response.headers.get("set-cookie");
};

const readTokensFromResponse = (
	response: Response,
	body?: {
		accessToken?: string;
		refreshToken?: string;
	},
): AuthTokens | null => {
	const setCookie = getSetCookieHeader(response);
	const payload = body ?? {};

	const accessToken =
		payload.accessToken ?? extractTokenFromSetCookie(setCookie, "accessToken");
	const refreshToken =
		payload.refreshToken ??
		extractTokenFromSetCookie(setCookie, "refreshToken");

	if (!accessToken || !refreshToken) {
		return null;
	}

	return {
		accessToken,
		refreshToken,
	};
};

export async function signUp(
	state: FormState,
	formData: FormData,
): Promise<FormState> {
	const validationFields = SignupFormSchema.safeParse({
		name: formData.get("name"),
		email: formData.get("email"),
		password: formData.get("password"),
	});

	if (!validationFields.success) {
		return {
			error: validationFields.error.flatten().fieldErrors,
		};
	}

	const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(validationFields.data),
	});
	if (response.ok) {
		redirect("/auth/signin");
	} else
		return {
			message:
				response.status === 409
					? "The user is already existed!"
					: response.statusText,
		};
}

export async function signIn(
	state: FormState,
	formData: FormData,
): Promise<FormState> {
	const redirectToRaw = formData.get("redirectTo");
	const redirectTo =
		typeof redirectToRaw === "string" && redirectToRaw.startsWith("/")
			? redirectToRaw
			: "/";

	const validatedFields = LoginFormSchema.safeParse({
		email: formData.get("email"),
		password: formData.get("password"),
	});
	// console.log(validatedFields.data);

	if (!validatedFields.success) {
		return {
			error: validatedFields.error.flatten().fieldErrors,
		};
	}

	const response = await fetch(`${BACKEND_URL}/api/auth/signin`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify(validatedFields.data),
	});

	type SignInResult = {
		message?: string;
		accessToken?: string;
		refreshToken?: string;
		user?: {
			id: string;
			name: string;
			email: string;
			avatar?: string;
			emailVerified?: boolean;
			isActive?: boolean;
		};
	};

	type ApiEnvelope<T> = {
		success: boolean;
		message?: string;
		data?: T;
	};

	const responseBody = (await response.json().catch(() => null)) as
		| SignInResult
		| ApiEnvelope<SignInResult>
		| null;

	const payload: SignInResult | null | undefined =
		responseBody && typeof responseBody === "object" && "data" in responseBody
			? responseBody.data
			: responseBody;
	const message =
		responseBody &&
		typeof responseBody === "object" &&
		"message" in responseBody
			? responseBody.message
			: undefined;

	if (response.ok) {
		const tokens = readTokensFromResponse(response, {
			accessToken: payload?.accessToken,
			refreshToken: payload?.refreshToken,
		});

		if (!tokens || !payload?.user) {
			return {
				message: "Signin succeeded but session initialization failed",
			};
		}

		await createSession({
			user: {
				id: payload.user.id,
				name: payload.user.name,
				email: payload.user.email,
				avatarUrl: payload.user?.avatar || undefined,
				emailVerified: payload.user.emailVerified,
				isActive: payload.user.isActive ?? true,
			},
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		});
		redirect(redirectTo);
	} else {
		return {
			message: message || response.statusText,
		};
	}
}

export const refreshToken = async (
	oldRefreshToken: string,
): Promise<AuthTokens | null> => {
	try {
		if (!oldRefreshToken) {
			return null;
		}

		const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
			method: "GET",
			headers: {
				Cookie: `refreshToken=${encodeURIComponent(oldRefreshToken)}`,
			},
			credentials: "include",
			cache: "no-store",
		});

		if (!response.ok) {
			console.warn(
				"Refresh token request failed",
				response.status,
				response.statusText,
			);
			return null;
		}

		return readTokensFromResponse(response);
	} catch (err) {
		console.warn(
			"Refresh token flow failed",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
};

export async function signOut() {
	try {
		await fetch(`${BACKEND_URL}/api/auth/signout`, {
			method: "GET",
			credentials: "include",
		});
	} catch {
		// Ensure local session is still cleared even when backend is unreachable.
	}

	await deleteSession();
	redirect("/");
}
