"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AhaToast } from "@/components/AhaToast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  addStudentSchema,
  updateStudentSchema,
  type UpdateStudentValues,
  type Student,
} from "@/lib/schemas/student";
import { addStudent, updateStudent } from "./actions";

interface StudentDialogProps {
  mode: "add" | "edit";
  student?: Student;
  trigger: React.ReactNode;
}

export default function StudentDialog({ mode, student, trigger }: StudentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showAha, setShowAha] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateStudentValues>({
    resolver: zodResolver(mode === "edit" ? updateStudentSchema : addStudentSchema) as never,
    defaultValues: student
      ? {
          fullName: student.full_name,
          email: student.email ?? "",
          phone: student.phone ?? "",
          status: student.status,
          theoryPassed: student.theory_passed,
          testDate: student.test_date ?? "",
          notes: student.notes ?? "",
        }
      : {
          fullName: "",
          email: "",
          phone: "",
          status: "active",
          theoryPassed: false,
          testDate: "",
          notes: "",
        },
  });

  async function onSubmit(data: UpdateStudentValues) {
    setServerError(null);

    const result =
      mode === "edit" && student
        ? await updateStudent(student.id, data)
        : await addStudent(data);

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    setOpen(false);
    reset();
    if (mode === "add") setShowAha(true);
    router.refresh();
  }

  const hideAha = useCallback(() => setShowAha(false), []);

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit student" : "Add student"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update student details."
              : "Add a new student to your list."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name *</Label>
            <Input id="fullName" placeholder="John Smith" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+44 7700 900000" {...register("phone")} />
            </div>
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                {...register("status")}
              >
                <option value="active">Active</option>
                <option value="test_booked">Test Booked</option>
                <option value="passed">Passed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Checkbox
              id="theoryPassed"
              checked={watch("theoryPassed")}
              onCheckedChange={(checked) => setValue("theoryPassed", !!checked)}
            />
            <Label htmlFor="theoryPassed" className="cursor-pointer">
              Theory test passed
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testDate">Driving test date</Label>
            <Input id="testDate" type="date" {...register("testDate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (private)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Any notes about this student..."
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "edit" ? "Saving..." : "Adding..."
                : mode === "edit" ? "Save changes" : "Add student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <AhaToast
      show={showAha}
      title="Student added!"
      message="Share your invite code with them. When they sign up, they'll auto-link to your account and see their own progress dashboard."
      onClose={hideAha}
    />
    </>
  );
}
