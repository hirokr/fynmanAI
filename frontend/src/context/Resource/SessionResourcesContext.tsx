"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ResourcesContextType = {
  resources: File[];
  addFiles: (files: File[]) => void;
  removeFile: (name: string) => void;
};

const ResourcesContext = createContext<ResourcesContextType | null>(null);

export function SessionResourcesProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<File[]>([]);

  const addFiles = (files: File[]) => {
    setResources((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...files.filter((f) => !existingNames.has(f.name))];
    });
  };

  const removeFile = (name: string) => {
    setResources((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <ResourcesContext.Provider value={{ resources, addFiles, removeFile }}>
      {children}
    </ResourcesContext.Provider>
  );
}

export function useSessionResources() {
  const ctx = useContext(ResourcesContext);
  if (!ctx) throw new Error("useSessionResources must be used inside SessionResourcesProvider");
  return ctx;
}