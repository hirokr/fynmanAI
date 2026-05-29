// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { NextResponse } from "next/server";
import { ourFileRouter } from "./core";

const handlers = createRouteHandler({ router: ourFileRouter });

export const GET = async (request: Request) => {
	try {
		return await handlers.GET(request);
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					"UploadThing route failed. Verify UploadThing environment variables in your frontend runtime.",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
};

export const POST = async (request: Request) => {
	try {
		return await handlers.POST(request);
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					"UploadThing route failed. Verify UploadThing environment variables in your frontend runtime.",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
};
