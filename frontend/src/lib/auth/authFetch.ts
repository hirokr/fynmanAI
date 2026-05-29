import { BACKEND_URL } from "@/constants/constants";
import { refreshToken } from "./auth";
import { getSession, updateTokens } from "./session";

export interface FetchOptions extends RequestInit {
	headers?: Record<string, string>;
}

export const authFetch = async (
	url: string | URL,
	options: FetchOptions = {},
) => {
	const session = await getSession();
	if (!session?.accessToken) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), {
			status: 401,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	options.headers = {
		...options.headers,
		Authorization: `Bearer ${session?.accessToken}`,
	};

	let response = await fetch(`${BACKEND_URL}${url}`, options);

	if (response.status === 401) {
		if (!session?.refreshToken) {
			return response;
		}

		const refreshedTokens = await refreshToken(session.refreshToken);

		if (refreshedTokens?.accessToken) {
			await updateTokens({
				accessToken: refreshedTokens.accessToken,
				refreshToken: refreshedTokens.refreshToken,
			});

			options.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`;
			response = await fetch(`${BACKEND_URL}${url}`, options);
		}
	}
	return response;
};
