"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signupSchema, type SignupValues } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";
import { linkStudentToInstructor } from "../actions";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCodeFromUrl = searchParams.get("code")?.trim().toUpperCase() || "";
  const isInvited = !!inviteCodeFromUrl;

  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: isInvited ? "student" : "instructor",
      inviteCode: inviteCodeFromUrl,
    },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: SignupValues) {
    setError(null);
    const supabase = createClient();

    // If student, validate invite code
    if (data.role === "student") {
      if (!data.inviteCode?.trim()) {
        setError("Students need an invite code from their instructor.");
        return;
      }

      const { data: settings, error: codeError } = await supabase
        .from("instructor_settings")
        .select("instructor_id")
        .eq("invite_code", data.inviteCode.trim().toUpperCase())
        .single();

      if (codeError || !settings) {
        setError(
          "Invalid invite code. Ask your instructor for the correct code.",
        );
        return;
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: data.role,
          full_name: data.fullName,
          invite_code: data.inviteCode?.trim().toUpperCase(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      const msg =
        authError.message === "User already registered"
          ? "An account with this email already exists. If you haven't confirmed your email yet, check your inbox for the confirmation link."
          : authError.message;
      setError(msg);
      return;
    }

    // No session = email confirmation required
    if (!authData.session) {
      setConfirmEmail(true);
      return;
    }

    // Auto-confirmed: link student and redirect
    if (data.role === "student" && data.inviteCode) {
      await linkStudentToInstructor(data.inviteCode);
    }

    router.push(
      data.role === "instructor"
        ? "/instructor/onboarding"
        : "/student/dashboard",
    );
    router.refresh();
  }

  if (confirmEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to your email. Click it to activate your account and get started.
          </p>
          <Link href="/login" className="inline-block text-sm font-medium text-primary underline">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          {isInvited ? (
            <>
              <h1 className="text-2xl font-bold">Your instructor invited you</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your account to get started with your driving lessons
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started with Instructly
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isInvited && (
            <div className="space-y-2">
              <label className="text-sm font-medium">I am a…</label>
              <div className="flex gap-2">
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedRole === "instructor"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    value="instructor"
                    className="sr-only"
                    {...register("role")}
                  />
                  Driving instructor
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedRole === "student"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    value="student"
                    className="sr-only"
                    {...register("role")}
                  />
                  Learner
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Sarah Johnson"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {selectedRole === "student" && !isInvited && (
            <div className="space-y-2">
              <label htmlFor="inviteCode" className="text-sm font-medium">
                Invite code
              </label>
              <input
                id="inviteCode"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase ring-offset-background placeholder:text-muted-foreground/50 placeholder:normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter code from your instructor"
                {...register("inviteCode")}
              />
              {errors.inviteCode && (
                <p className="text-sm text-destructive">
                  {errors.inviteCode.message}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
