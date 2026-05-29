"use client";

import { useState } from "react";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { OnboardingValues } from "@/lib/schemas/onboarding";
import { UK_POSTCODE_RE } from "@/lib/schemas/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StepTeachingAreaProps {
  watch: UseFormWatch<OnboardingValues>;
  setValue: UseFormSetValue<OnboardingValues>;
  error?: string;
}

function normalizePostcode(raw: string): string {
  const stripped = raw.replace(/\s+/g, "").toUpperCase();
  if (stripped.length < 4) return stripped;
  return stripped.slice(0, -3) + " " + stripped.slice(-3);
}

export default function StepTeachingArea({
  watch,
  setValue,
  error,
}: StepTeachingAreaProps) {
  const postcodes = watch("postcodes") ?? [];
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  function addPostcode() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const normalized = normalizePostcode(trimmed);

    if (!UK_POSTCODE_RE.test(normalized)) {
      setInputError("Invalid UK postcode format");
      return;
    }

    if (postcodes.includes(normalized)) {
      setInputError("Already added");
      return;
    }

    setValue("postcodes", [...postcodes, normalized], { shouldValidate: true });
    setInput("");
    setInputError(null);
  }

  function removePostcode(index: number) {
    const updated = postcodes.filter((_, i) => i !== index);
    setValue("postcodes", updated, { shouldValidate: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Teaching area</h2>
        <p className="text-sm text-muted-foreground">
          Add postcodes where you offer lessons. Students can find you by area.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="postcode-input">Postcode</Label>
        <div className="flex gap-2">
          <Input
            id="postcode-input"
            placeholder="e.g. SW1A 1AA"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setInputError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPostcode();
              }
            }}
            className="uppercase"
          />
          <Button type="button" variant="outline" onClick={addPostcode}>
            Add
          </Button>
        </div>
        {inputError && (
          <p className="text-sm text-destructive">{inputError}</p>
        )}
        {error && !inputError && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {postcodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {postcodes.map((code, i) => (
            <Badge key={code} variant="secondary" className="gap-1 pr-1">
              {code}
              <button
                type="button"
                onClick={() => removePostcode(i)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
