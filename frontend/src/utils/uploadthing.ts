import { OurFileRouter } from "@/app/api/uploadthing/core";
import {
	generateUploadButton,
	generateUploadDropzone,
	generateReactHelpers,
} from "@uploadthing/react";

const { useUploadThing: useUploadThingBase, uploadFiles } =
	generateReactHelpers<OurFileRouter>();

/** Re-exposes uploadProgress for callers; upstream types omit it in v7. */
export function useUploadThing<TEndpoint extends keyof OurFileRouter>(
	...args: Parameters<typeof useUploadThingBase<TEndpoint>>
) {
	const hook = useUploadThingBase(...args);
	const progress =
		(hook as typeof hook & { uploadProgress?: number }).uploadProgress ?? 0;
	return { ...hook, uploadProgress: progress };
}

export { uploadFiles };

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
