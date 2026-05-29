"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { respondToReschedule } from "./actions";

export default function StudentRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(status: "accepted" | "declined") {
    setLoading(true);
    await respondToReschedule(requestId, status);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-2 flex gap-2">
      <Button size="sm" className="h-10 flex-1" onClick={() => handle("accepted")} disabled={loading}>
        Accept
      </Button>
      <Button size="sm" variant="outline" className="h-10 flex-1" onClick={() => handle("declined")} disabled={loading}>
        Decline
      </Button>
    </div>
  );
}
