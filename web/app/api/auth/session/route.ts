import { NextRequest, NextResponse } from "next/server";

import { refreshToken } from "@/lib/auth/auth";
import { getSession, updateTokens } from "@/lib/auth/session";
import { Session } from "@/types/auth";
import { sendApiError, sendApiSuccess } from "@/lib/api-response";

type SessionApiResponse = {
	isAuthenticated: boolean;
	user: Session["user"] | null;
	accessToken?: string;
};

const createUnauthResponse = (error?: string) => {
	return sendApiSuccess({
		message: error || "No active session",
		data: {
			isAuthenticated: false,
			user: null,
		},
	});
};

export async function GET(request: NextRequest) {
	try {
		const shouldRefresh =
			request.nextUrl.searchParams.get("refresh") === "true";
		let session = await getSession();

		if (!session) {
			return createUnauthResponse("No active session");
		}

		if (shouldRefresh && session.refreshToken) {
			const refreshedTokens = await refreshToken(session.refreshToken);

			if (!refreshedTokens) {
				return createUnauthResponse("Unable to refresh session");
			}

			await updateTokens({
				accessToken: refreshedTokens.accessToken,
				refreshToken: refreshedTokens.refreshToken,
			});

			session = {
				...session,
				accessToken: refreshedTokens.accessToken,
				refreshToken: refreshedTokens.refreshToken,
			};
		}

		const payload: SessionApiResponse = {
			isAuthenticated: Boolean(session.user),
			user: session.user,
			accessToken: session.accessToken,
		};

		return sendApiSuccess({
			data: payload,
		});
	} catch {
		return sendApiError({
			status: 500,
			message: "Unable to verify session",
		});
	}
}
