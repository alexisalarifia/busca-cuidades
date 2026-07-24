import type { Trip } from "@/lib/types";
import { todayInTz } from "@/lib/time";
import { CDMX_TZ } from "@/lib/geocode";

// The app was time-blind: it rendered a bare date even on the eve of a trip.
// Phase drives the Today header so the app always knows where you are in the
// arc of the trip.
export type Phase = "before" | "during" | "after";

export interface TripPhase {
  phase: Phase;
  /** Days until the first day (before only). 1 = tomorrow. */
  daysUntil: number;
  /** 1-indexed day of the trip (during only). */
  dayNumber: number;
  /** Total days in the trip range, inclusive. */
  totalDays: number;
  /** Short line for the header, e.g. "Day 3 of 9". */
  label: string;
}

function daysBetween(a: string, b: string): number {
  const ms =
    new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export function getTripPhase(trip: Trip, tz: string = CDMX_TZ): TripPhase {
  const today = todayInTz(tz);
  const totalDays = daysBetween(trip.starts_on, trip.ends_on) + 1;

  if (today < trip.starts_on) {
    const daysUntil = daysBetween(today, trip.starts_on);
    return {
      phase: "before",
      daysUntil,
      dayNumber: 0,
      totalDays,
      label:
        daysUntil === 1
          ? `${trip.name} is tomorrow`
          : `${trip.name} in ${daysUntil} days`,
    };
  }

  if (today > trip.ends_on) {
    return {
      phase: "after",
      daysUntil: 0,
      dayNumber: totalDays,
      totalDays,
      label: `${trip.name} — that's a wrap`,
    };
  }

  const dayNumber = daysBetween(trip.starts_on, today) + 1;
  return {
    phase: "during",
    daysUntil: 0,
    dayNumber,
    totalDays,
    label: `Day ${dayNumber} of ${totalDays}`,
  };
}
