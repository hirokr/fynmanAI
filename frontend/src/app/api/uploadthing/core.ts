// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
	imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
		.middleware(async () => {
			// Optionally authenticate here and return metadata
			return {};
		})
		.onUploadComplete(async ({ file }) => {
			// Called server-side after upload finishes
			return { url: file.url };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
