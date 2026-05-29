import { z } from "zod/v3";

export const SKILL_KEYS = [
  "vehicle_control.steering",
  "vehicle_control.clutch",
  "vehicle_control.gears",
  "road_awareness.junctions",
  "road_awareness.roundabouts",
  "road_awareness.lanes",
  "manoeuvres.parallel_park",
  "manoeuvres.bay_park",
  "manoeuvres.emergency_stop",
  "safety.mirrors",
  "safety.speed",
  "safety.hazard_response",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export const SKILL_LABELS: Record<SkillKey, string> = {
  "vehicle_control.steering": "Steering",
  "vehicle_control.clutch": "Clutch control",
  "vehicle_control.gears": "Gear changes",
  "road_awareness.junctions": "Junctions",
  "road_awareness.roundabouts": "Roundabouts",
  "road_awareness.lanes": "Lane discipline",
  "manoeuvres.parallel_park": "Parallel park",
  "manoeuvres.bay_park": "Bay park",
  "manoeuvres.emergency_stop": "Emergency stop",
  "safety.mirrors": "Mirror checks",
  "safety.speed": "Speed management",
  "safety.hazard_response": "Hazard response",
};

export const SKILL_CATEGORIES = [
  { key: "vehicle_control", label: "Vehicle Control", skills: SKILL_KEYS.filter((k) => k.startsWith("vehicle_control.")) },
  { key: "road_awareness", label: "Road Awareness", skills: SKILL_KEYS.filter((k) => k.startsWith("road_awareness.")) },
  { key: "manoeuvres", label: "Manoeuvres", skills: SKILL_KEYS.filter((k) => k.startsWith("manoeuvres.")) },
  { key: "safety", label: "Safety", skills: SKILL_KEYS.filter((k) => k.startsWith("safety.")) },
] as const;

const skillRatingSchema = z.object({
  skillKey: z.enum(SKILL_KEYS),
  rating: z.number().int().min(1).max(5),
});

export const lessonNoteSchema = z.object({
  bookingId: z.string().uuid(),
  summary: z.string().min(1, "Summary is required"),
  homework: z.string().optional().or(z.literal("")),
  instructorPrivateNotes: z.string().optional().or(z.literal("")),
  ratings: z.array(skillRatingSchema).optional(),
});

export type LessonNoteValues = z.infer<typeof lessonNoteSchema>;

export type LessonNote = {
  id: string;
  booking_id: string;
  summary: string;
  homework: string | null;
  instructor_private_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SkillRating = {
  id: string;
  booking_id: string;
  student_id: string;
  skill_key: SkillKey;
  rating: number;
  created_at: string;
  updated_at: string;
};
