import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring min-h-12 w-full rounded-[8px] border border-white/15 bg-white/[0.07] px-4 text-sm text-white placeholder:text-white/45",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-32 w-full rounded-[8px] border border-white/15 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/45",
        className
      )}
      {...props}
    />
  );
}
