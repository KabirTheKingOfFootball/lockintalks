import { SetupWarning } from "@/components/setup-warning";

export function AdminGate({ message }: { message: string }) {
  return <SetupWarning title="Admin access unavailable" message={message} />;
}
