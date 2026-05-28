"use client";

import {
	createElement,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { Session } from "@/types/auth";
import { deleteSession } from "@/lib/auth/session";

type AuthUser = Session["user"];

type AuthSessionResponse = {
	isAuthenticated: boolean;
	user: AuthUser | null;
	accessToken?: string;
	error?: string;
};

type ApiEnvelope<T> = {
	success: boolean;
	message?: string;
	data?: T;
	errors?: unknown;
};

type AuthContextValue = {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error?: string;
	refreshSession: () => Promise<void>;
	clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readSession = async (): Promise<AuthSessionResponse> => {
	const response = await fetch("/api/auth/session", {
		method: "GET",
		credentials: "include",
		cache: "no-store",
	});

	if (!response.ok) {
		return {
			isAuthenticated: false,
			user: null,
			error: "Unable to verify session",
		};
	}

	const payload = (await response.json().catch(() => null)) as
		| AuthSessionResponse
		| ApiEnvelope<AuthSessionResponse>
		| null;

	if (payload && typeof payload === "object" && "data" in payload) {
		return {
			isAuthenticated: Boolean(payload.data?.isAuthenticated),
			user: payload.data?.user ?? null,
			accessToken: payload.data?.accessToken,
			error: payload.success
				? payload.message
				: (payload.message ?? "Unable to verify session"),
		};
	}

	return (payload ?? {
		isAuthenticated: false,
		user: null,
		error: "Unable to verify session",
	}) as AuthSessionResponse;
};

export function AuthProvider({
	children,
	initialUser = null,
}: {
	children: React.ReactNode;
	initialUser?: AuthUser | null;
}) {
	const [user, setUser] = useState<AuthUser | null>(initialUser);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();

	const refreshSession = useCallback(async () => {
		setIsLoading(true);
		setError(undefined);

		try {
			const session = await readSession();
			setUser(session.isAuthenticated ? session.user : null);
			setError(session.error);
		} catch {
			setUser(null);
			setError("Unable to verify session");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clearSession = useCallback(() => {
		setUser(null);
		setError(undefined);
		deleteSession();

	}, []);

	useEffect(() => {
		void refreshSession();
	}, [refreshSession]);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			isAuthenticated: Boolean(user),
			isLoading,
			error,
			refreshSession,
			clearSession,
		}),
		[user, isLoading, error, refreshSession, clearSession],
	);

	return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used inside AuthProvider");
	}

	return context;
}
