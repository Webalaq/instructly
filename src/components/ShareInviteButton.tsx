"use client";

import { useState } from "react";
import { ShareIcon, CheckIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareInviteButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/signup?code=${inviteCode}`;
  const shareText = `Join me on Instructly for your driving lessons! Sign up here:`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Instructly",
          text: shareText,
          url: inviteUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopyLink();
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={handleShare}
        className="gap-1.5"
      >
        <ShareIcon className="size-4" />
        Share
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleCopyLink}
        className="gap-1.5"
      >
        {copied ? (
          <>
            <CheckIcon className="size-4 text-green-500" />
            Copied
          </>
        ) : (
          <>
            <LinkIcon className="size-4" />
            Copy link
          </>
        )}
      </Button>
    </div>
  );
}
