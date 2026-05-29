"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExportButton() {
  function handleExport() {
    window.print();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 print:hidden">
      <DownloadIcon className="size-4" />
      <span className="hidden sm:inline">Export</span>
    </Button>
  );
}
