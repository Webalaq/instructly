import type { PlanKey } from "./client";

export const PLAN_LIMITS: Record<PlanKey, {
  maxStudents: number;
  progressTracking: boolean;
  whatsappAutomation: boolean;
}> = {
  basic: {
    maxStudents: 20,
    progressTracking: false,
    whatsappAutomation: false,
  },
  standard: {
    maxStudents: Infinity,
    progressTracking: true,
    whatsappAutomation: false,
  },
  premium: {
    maxStudents: Infinity,
    progressTracking: true,
    whatsappAutomation: true,
  },
};

export function getPlanLimits(plan: string | null | undefined) {
  if (plan && plan in PLAN_LIMITS) {
    return PLAN_LIMITS[plan as PlanKey];
  }
  // Default to basic limits for unsubscribed / trialing users
  return PLAN_LIMITS.basic;
}
