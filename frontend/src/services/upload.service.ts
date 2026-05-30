import { apiFetch } from "@/lib/apiFetch";

export type ParsedDocumentResponse = {
  resource: {
    id: string;
    title: string;
    sourceType: string;
    mimeType?: string | null;
    parsedText?: string | null;
    subject?: string | null;
    topic?: string | null;
    metadata?: unknown;
    createdAt?: string;
    updatedAt?: string;
  };
  parsedText?: string;
  ingest: unknown;
  parser: {
    metadata?: unknown;
  };
};

export type UploadDocumentResult = {
  data: ParsedDocumentResponse;
};

const SUPPORTED_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "pptx",
  "txt",
  "md",
  "markdown",
  "png",
  "jpg",
  "jpeg",
]);

const getExtension = (name: string) =>
  name.split(".").pop()?.toLowerCase() ?? "";

export const validateUploadFile = (file: File) => {
  const extension = getExtension(file.name);
  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      message: "Unsupported file type",
    };
  }

  return { ok: true };
};

export const uploadDocument = async (params: {
  file: File;
  token: string;
}): Promise<UploadDocumentResult> => {
  const formData = new FormData();
  formData.append("file", params.file);

  return apiFetch<UploadDocumentResult>("/api/parser/parse", {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  });
};
