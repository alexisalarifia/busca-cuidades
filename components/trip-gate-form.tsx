"use client";

import { useActionState } from "react";
import { createTrip, type TripGateState } from "@/app/trip-gate/actions";

const initial: TripGateState = {};

const field =
  "radius-token border border-ink/20 bg-white px-3 py-2 text-base outline-accent";

export default function TripGateForm() {
  const [state, action, pending] = useActionState(createTrip, initial);

  return (
    <form action={action} className="flex w-full flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">When</legend>
        <label className="flex flex-col gap-1 text-sm">
          Trip name
          <input name="name" defaultValue="Mexico City" className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            First day
            <input name="starts_on" type="date" required className={`${field} tnum`} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Last day
            <input name="ends_on" type="date" required className={`${field} tnum`} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">Where you&apos;re staying</legend>
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="lodging_name" placeholder="Hotel San Fernando" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            name="lodging_address"
            placeholder="Calle Iturbide 15, Condesa"
            className={field}
          />
        </label>
        <p className="text-xs text-ink/50">
          The address becomes your HTL pin on the map.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">Flight, if you have it</legend>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Flight
            <input name="flight_number" placeholder="AM 19" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            From
            <input name="flight_from" placeholder="JFK" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            To
            <input name="flight_to" placeholder="MEX" className={field} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Departs
          <input name="flight_departs" type="datetime-local" className={`${field} tnum`} />
        </label>
        <p className="text-xs text-ink/50">
          Pasting a whole confirmation email arrives with the next build — these
          quick fields are enough for an alert.
        </p>
      </fieldset>

      {state.error && <p className="text-sm text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="radius-token shadow-hard bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Setting up…" : "Start the trip"}
      </button>
    </form>
  );
}
