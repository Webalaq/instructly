"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { onboardingSchema, type OnboardingValues } from "@/lib/schemas/onboarding";
import { completeOnboarding } from "./actions";
import StepLessonPricing from "./StepLessonPricing";
import StepWorkingHours from "./StepWorkingHours";
import StepTeachingArea from "./StepTeachingArea";

const STEPS = ["Pricing", "Hours", "Area"] as const;

const STEP_FIELDS: Record<number, (keyof OnboardingValues)[]> = {
  1: ["hourlyRatePounds", "defaultLessonMinutes"],
  2: ["workingHours"],
  3: ["postcodes"],
};

const DEFAULT_WORKING_HOURS = {
  mon: [{ start: "09:00", end: "17:00" }],
  tue: [{ start: "09:00", end: "17:00" }],
  wed: [{ start: "09:00", end: "17:00" }],
  thu: [{ start: "09:00", end: "17:00" }],
  fri: [{ start: "09:00", end: "17:00" }],
};

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [completedInviteCode, setCompletedInviteCode] = useState<string | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      defaultLessonMinutes: 60,
      workingHours: DEFAULT_WORKING_HOURS,
      postcodes: [],
    },
  });

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
  }

  async function onSubmit(data: OnboardingValues) {
    setServerError(null);
    const result = await completeOnboarding(data);

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    if (result.success && result.inviteCode) {
      setCompletedInviteCode(result.inviteCode);
    }
  }

  async function copyCode() {
    if (!completedInviteCode) return;
    await navigator.clipboard.writeText(completedInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (completedInviteCode) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <span className="text-3xl">🎉</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You&apos;re ready to go!</h1>
          <p className="text-muted-foreground">
            Your professional instructor dashboard is live. Here&apos;s what happens next:
          </p>
        </div>

        <div className="rounded-xl border bg-primary/5 p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <div>
              <div className="text-sm font-medium">Share your invite code</div>
              <div className="text-xs text-muted-foreground">Students sign up and auto-link to your account</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <div>
              <div className="text-sm font-medium">Book your first lesson</div>
              <div className="text-xs text-muted-foreground">WhatsApp reminders send automatically — no chasing</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
            <div>
              <div className="text-sm font-medium">Record lesson notes</div>
              <div className="text-xs text-muted-foreground">Students see their progress — parents love it</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card px-6 py-6">
          <p className="mb-2 text-sm text-muted-foreground">Your invite code</p>
          <p className="font-mono text-3xl font-bold tracking-widest text-primary">
            {completedInviteCode}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={copyCode}
          >
            {copied ? "Copied!" : "Copy code"}
          </Button>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            router.push("/instructor/dashboard");
            router.refresh();
          }}
        >
          Go to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Set up your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {step} of 3 — {STEPS[step - 1]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i + 1 <= step ? "bg-primary" : "bg-muted"
              }`}
            />
            <p
              className={`mt-1 text-center text-xs ${
                i + 1 === step
                  ? "font-medium text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <StepLessonPricing
            register={register}
            errors={errors}
            defaultLessonMinutes={watch("defaultLessonMinutes")}
            onLessonMinutesChange={(v) =>
              setValue("defaultLessonMinutes", v, { shouldValidate: true })
            }
          />
        )}

        {step === 2 && (
          <StepWorkingHours
            watch={watch}
            setValue={setValue}
            error={
              errors.workingHours?.message ||
              (errors.workingHours?.root?.message as string | undefined)
            }
          />
        )}

        {step === 3 && (
          <StepTeachingArea
            watch={watch}
            setValue={setValue}
            error={errors.postcodes?.message || errors.postcodes?.root?.message}
          />
        )}

        {serverError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3)}
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" className="flex-1" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Complete setup"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
