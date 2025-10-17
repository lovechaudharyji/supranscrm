"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ToastSuccess({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

