"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { OnboardingValues } from "@/lib/schemas/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface StepLessonPricingProps {
  register: UseFormRegister<OnboardingValues>;
  errors: FieldErrors<OnboardingValues>;
  defaultLessonMinutes: number;
  onLessonMinutesChange: (value: number) => void;
}

const DURATION_OPTIONS = [
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "2 hours" },
];

export default function StepLessonPricing({
  register,
  errors,
  defaultLessonMinutes,
  onLessonMinutesChange,
}: StepLessonPricingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Lesson pricing</h2>
        <p className="text-sm text-muted-foreground">
          Set your hourly rate and default lesson length.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hourlyRatePounds">Hourly rate</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            £
          </span>
          <Input
            id="hourlyRatePounds"
            type="number"
            min={10}
            max={100}
            step={1}
            className="pl-7"
            placeholder="40"
            {...register("hourlyRatePounds")}
          />
        </div>
        {errors.hourlyRatePounds && (
          <p className="text-sm text-destructive">
            {errors.hourlyRatePounds.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Default lesson length</Label>
        <RadioGroup
          value={String(defaultLessonMinutes)}
          onValueChange={(v) => onLessonMinutesChange(Number(v))}
        >
          {DURATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-input px-4 py-3 hover:bg-accent has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
            >
              <RadioGroupItem value={String(opt.value)} />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
        {errors.defaultLessonMinutes && (
          <p className="text-sm text-destructive">
            {errors.defaultLessonMinutes.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">
          Business name{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="businessName"
          placeholder="e.g. Sarah's Driving School"
          {...register("businessName")}
        />
      </div>
    </div>
  );
}
