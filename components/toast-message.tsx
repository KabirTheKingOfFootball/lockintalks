"use client";

import { CheckCircle2, XCircle } from "lucide-react";

export function ToastMessage({ type = "success", message }: { type?: "success" | "error"; message: string }) {
  const Icon = type === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      role="status"
      className={`mt-4 flex items-start gap-3 rounded-[8px] border p-3 text-sm leading-6 ${
        type === "success" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-red-400/30 bg-red-500/10 text-red-100"
      }`}
    >
      <Icon className="mt-0.5 shrink-0" size={18} />
      <span>{message}</span>
    </div>
  );
}
