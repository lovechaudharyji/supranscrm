"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PageContextType {
  subtitle: string;
  setSubtitle: (subtitle: string) => void;
  onRefresh?: () => void;
  setOnRefresh: (callback: (() => void) | undefined) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [subtitle, setSubtitle] = useState("");
  const [onRefresh, setOnRefresh] = useState<(() => void) | undefined>(undefined);

  return (
    <PageContext.Provider value={{ subtitle, setSubtitle, onRefresh, setOnRefresh }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error("usePageContext must be used within a PageProvider");
  }
  return context;
}

