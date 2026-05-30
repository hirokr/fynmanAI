import type { ParsedDocumentResponse } from "@/services/upload.service";
import type { SessionResourceContext } from "@/types/session-resource";

export const toSessionResourcesFromParsedDocuments = (
  documents: ParsedDocumentResponse[]
): SessionResourceContext[] => {
  const resources: SessionResourceContext[] = [];

  for (const document of documents) {
    const id = document.resource?.id;
    if (!id) {
      continue;
    }

    const parsedText =
      document.resource.parsedText?.trim() ||
      document.parsedText?.trim() ||
      "";

    if (!parsedText) {
      continue;
    }

    resources.push({
      id,
      title: document.resource.title,
      parsedText,
    });
  }

  return resources;
};
