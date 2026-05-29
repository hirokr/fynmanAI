"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { ParsedDocumentResponse } from "@/services/upload.service";

type ResourcesContextType = {
  resources: File[];
  parsedDocuments: ParsedDocumentResponse[];
  uploadLoading: boolean;
  uploadSuccess: boolean;
  uploadError: string | null;
  addFiles: (files: File[]) => void;
  removeFile: (name: string) => void;
  setUploadLoading: (value: boolean) => void;
  setUploadSuccess: (value: boolean) => void;
  setUploadError: (value: string | null) => void;
  addParsedDocument: (doc: ParsedDocumentResponse) => void;
  resetResources: () => void;
};

const ResourcesContext = createContext<ResourcesContextType | null>(null);

export function SessionResourcesProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<File[]>([]);
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocumentResponse[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addFiles = (files: File[]) => {
    setResources((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...files.filter((f) => !existingNames.has(f.name))];
    });
  };

  const removeFile = (name: string) => {
    setResources((prev) => prev.filter((f) => f.name !== name));
  };

  const addParsedDocument = (doc: ParsedDocumentResponse) => {
    setParsedDocuments((prev) => [...prev, doc]);
  };

  const resetResources = () => {
    setResources([]);
    setParsedDocuments([]);
    setUploadLoading(false);
    setUploadSuccess(false);
    setUploadError(null);
  };

  return (
    <ResourcesContext.Provider
      value={{
        resources,
        parsedDocuments,
        uploadLoading,
        uploadSuccess,
        uploadError,
        addFiles,
        removeFile,
        setUploadLoading,
        setUploadSuccess,
        setUploadError,
        addParsedDocument,
        resetResources,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  );
}

export function useSessionResources() {
  const ctx = useContext(ResourcesContext);
  if (!ctx) throw new Error("useSessionResources must be used inside SessionResourcesProvider");
  return ctx;
}