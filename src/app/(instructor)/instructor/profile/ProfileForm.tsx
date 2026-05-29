"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import { updateProfileSchema, type UpdateProfileValues } from "@/lib/schemas/profile";
import { updateProfile } from "./actions";

interface ProfileFormProps {
  initialValues: UpdateProfileValues;
  email: string;
  inviteCode: string;
  postcodes: string[];
}

export default function ProfileForm({ initialValues, email, inviteCode, postcodes }: ProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(data: UpdateProfileValues) {
    setServerError(null);
    setSaved(false);

    const result = await updateProfile(data);

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal info */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h3 className="font-semibold">Personal details</h3>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name *</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+44 7700 900000" {...register("phone")} />
        </div>
      </div>

      {/* Business info */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h3 className="font-semibold">Business details</h3>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" placeholder="Optional" {...register("businessName")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hourlyRatePounds">Hourly rate (£)</Label>
            <Input
              id="hourlyRatePounds"
              type="number"
              min={10}
              max={100}
              {...register("hourlyRatePounds", { valueAsNumber: true })}
            />
            {errors.hourlyRatePounds && (
              <p className="text-sm text-destructive">{errors.hourlyRatePounds.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultLessonMinutes">Lesson duration</Label>
            <select
              id="defaultLessonMinutes"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
              {...register("defaultLessonMinutes", { valueAsNumber: true })}
            >
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>
        </div>
      </div>

      {/* Read-only info */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Account info</h3>

        <div>
          <Label className="text-muted-foreground text-xs">Invite code</Label>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-widest text-primary">
              {inviteCode}
            </span>
            <CopyButton text={inviteCode} />
          </div>
        </div>

        {postcodes.length > 0 && (
          <div>
            <Label className="text-muted-foreground text-xs">Teaching areas</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {postcodes.map((p) => (
                <Badge key={p} variant="outline">{p}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {saved && (
        <div className="rounded-md border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
          Profile updated successfully.
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
