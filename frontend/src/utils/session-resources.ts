import type { ParsedDocumentResponse } from "@/services/upload.service";
import type { SessionResourceContext } from "@/types/session-resource";

export const toSessionResourcesFromParsedDocuments = (
  documents: ParsedDocumentResponse[]
): SessionResourceContext[] =>
  documents
    .map((document) => {
      const id = document.resource?.id;
      if (!id) {
        return null;
      }

      const parsedText =
        document.resource.parsedText?.trim() ||
        document.parsedText?.trim() ||
        "";

      if (!parsedText) {
        return null;
      }

      return {
        id,
        title: document.resource.title,
        parsedText,
      } satisfies SessionResourceContext;
    })
    .filter((resource): resource is SessionResourceContext => Boolean(resource));
