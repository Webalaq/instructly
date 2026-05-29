"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AhaToast } from "@/components/AhaToast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SKILL_CATEGORIES,
  SKILL_LABELS,
  type SkillKey,
  type LessonNote,
  type SkillRating,
} from "@/lib/schemas/lesson-notes";
import { saveLessonNote, getLessonNote } from "./lesson-actions";

interface LessonNoteDialogProps {
  bookingId: string;
  trigger: React.ReactNode;
}

export default function LessonNoteDialog({ bookingId, trigger }: LessonNoteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showAha, setShowAha] = useState(false);

  const [summary, setSummary] = useState("");
  const [homework, setHomework] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [studentFeedback, setStudentFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const { note, ratings: existingRatings } = await getLessonNote(bookingId);
      if (note) {
        const n = note as LessonNote & { student_feedback?: string | null };
        setSummary(n.summary);
        setHomework(n.homework ?? "");
        setPrivateNotes(n.instructor_private_notes ?? "");
        setStudentFeedback(n.student_feedback ?? null);
      }
      if (existingRatings.length > 0) {
        const map: Record<string, number> = {};
        for (const r of existingRatings as SkillRating[]) {
          map[r.skill_key] = r.rating;
        }
        setRatings(map);
      }
    });
  }, [open, bookingId]);

  async function handleSave() {
    setSaving(true);
    setServerError(null);

    const ratingsList = Object.entries(ratings)
      .filter(([, v]) => v > 0)
      .map(([skillKey, rating]) => ({ skillKey, rating }));

    const result = await saveLessonNote({
      bookingId,
      summary,
      homework,
      instructorPrivateNotes: privateNotes,
      ratings: ratingsList,
    });

    if ("error" in result && result.error) {
      setServerError(result.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpen(false);
    setShowAha(true);
    router.refresh();
  }

  const hideAha = useCallback(() => setShowAha(false), []);

  function setRating(skillKey: SkillKey, value: number) {
    setRatings((prev) => ({ ...prev, [skillKey]: value }));
  }

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lesson notes</DialogTitle>
          <DialogDescription>
            Record what was covered and rate skill progress.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                rows={3}
                placeholder="What was covered in this lesson..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homework">Homework for student</Label>
              <Textarea
                id="homework"
                rows={2}
                placeholder="Practice exercises, things to review..."
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateNotes">Private notes (not visible to student)</Label>
              <Textarea
                id="privateNotes"
                rows={2}
                placeholder="Your private observations..."
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
              />
            </div>

            {/* Student feedback (read-only) */}
            {studentFeedback && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Label className="text-xs text-muted-foreground">Student feedback</Label>
                <p className="mt-1 text-sm">{studentFeedback}</p>
              </div>
            )}

            {/* Skill ratings */}
            <div className="space-y-4">
              <Label className="text-base">Skill ratings (1–5)</Label>
              {SKILL_CATEGORIES.map((cat) => (
                <div key={cat.key} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{cat.label}</h4>
                  <div className="grid gap-2">
                    {cat.skills.map((skillKey) => (
                      <div key={skillKey} className="flex items-center justify-between">
                        <span className="text-sm">{SKILL_LABELS[skillKey]}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setRating(skillKey, n)}
                              className={`size-8 rounded text-xs font-medium transition-colors ${
                                ratings[skillKey] === n
                                  ? "bg-primary text-primary-foreground"
                                  : ratings[skillKey] && ratings[skillKey] >= n
                                    ? "bg-primary/20 text-primary"
                                    : "border border-input hover:bg-accent"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
              <Button onClick={handleSave} disabled={saving || !summary.trim()}>
                {saving ? "Saving..." : "Save notes"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <AhaToast
      show={showAha}
      title="Notes saved!"
      message="Your student can now see their lesson summary and skill progress on their dashboard. This is what keeps them coming back."
      onClose={hideAha}
    />
    </>
  );
}
