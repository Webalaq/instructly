"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { respondToRequest } from "./actions";

export default function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(status: "accepted" | "declined") {
    setLoading(true);
    await respondToRequest(requestId, status);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2 border-t pt-3">
      <Button size="sm" onClick={() => handle("accepted")} disabled={loading}>
        Accept
      </Button>
      <Button size="sm" variant="outline" onClick={() => handle("declined")} disabled={loading}>
        Decline
      </Button>
    </div>
  );
}
