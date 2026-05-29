"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className, variant = "ghost", size = "sm" }: {
  className?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default";
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleLogout} className={className}>
      Log out
    </Button>
  );
}
