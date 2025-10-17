"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  width?: string;
  theme?: "default" | "glass";
}

export default function CustomModal({
  isOpen,
  onClose,
  children,
  headerContent,
  width = "max-w-4xl",
  theme = "default",
}: CustomModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const themeClasses =
    theme === "glass"
      ? "bg-background/95 backdrop-blur-md border border-border"
      : "bg-background border border-border";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`${width} w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-lg ${themeClasses}`}
      >
        {/* Header */}
        {headerContent && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
            {headerContent}
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

