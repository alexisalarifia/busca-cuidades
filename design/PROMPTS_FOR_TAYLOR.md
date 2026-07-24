# Working with Claude Design — prompt templates

For Taylor. Copy, fill in the `[BRACKETS]`, paste. Written for someone who
doesn't design for a living — you don't need the vocabulary, you just need to
react honestly and let it do the translating.

**The one habit that matters:** make it work in *small, named steps* and always
ask for **options**. Big vague asks burn tokens and give you mush.

---

## 1. Start of every new session

> Read `design/DESIGN_BRIEF.md` in this repo before anything else — that's your
> starting point and it has my standing requirements. Confirm you've read it by
> telling me in 3 bullets what the visual direction is and what your working
> method should be. Don't design anything yet.

*Why:* re-grounds it every session so you never re-explain the project.

---

## 2. First real task — the token system

> Start with the token system only, nothing else. Propose **3 options** for
> `design/tokens.css` (palette, type scale, spacing, radius, elevation), each
> as a short description plus the actual CSS. Keep them all warm/minimal per
> the brief, but make them meaningfully different from each other. Tell me the
> trade-off of each in one sentence. Don't touch any component files yet.

*Why:* tokens re-skin the entire app at once. This is the highest-leverage,
cheapest thing to get right first.

---

## 3. Design one screen

> Now do **[SCREEN NAME]** only. Show me **2–3 options**. For each: a one-line
> description of the idea, then the code. Before you write anything, save the
> current version to `design/variants/[SCREEN]/` so we can go back. Don't
> change any other screen.

*Screens to work through, in this order (atoms first — they cover the most
ground):* item card → review card (the "+" flow) → map pins → Today →
Itinerary → Ask → Vault → trip gate → landing → trip book.

---

## 4. Pick an option

> Go with **option [N]**. Keep the other options saved in
> `design/variants/` — don't delete them. Then add one line to
> `design/CHANGELOG.md` saying what we picked and why, so we don't re-argue it
> later.

---

## 5. Change ONE thing (your most-used prompt)

> Change only **[THE ONE THING]**. Don't regenerate the screen, don't touch
> anything else, and show me just the lines that changed.

*Why:* this is the token-saver. Without it, Claude tends to rewrite whole
files for a small tweak.

---

## 6. Go back

> Revert **[SCREEN]** to the version from `design/variants/[FOLDER]` (or the
> previous git commit). Don't redesign it — just restore it.

---

## 7. Make it check its own work

> Review what you just designed against `design/DESIGN_BRIEF.md`. Specifically
> check: WCAG AA contrast on the real background, touch targets ≥44pt, tabular
> numerals still on all times/numbers, and the anti-tacky guardrails. List
> anything that fails and fix only those.

*Why:* catches the accessibility and consistency stuff you shouldn't have to
notice yourself.

---

## 8. When you don't like it but can't say why

> I don't like **[SCREEN]** — it feels **[TOO BUSY / TOO PLAIN / CHEAP /
> COLD / CLUTTERED]**. Don't rewrite it yet. First, give me 3 short theories
> about *why* it feels that way and what you'd change for each. I'll pick one.

*Why:* this is the single best novice prompt. You react honestly; it does the
diagnosis. Stops it from thrashing on guesses.

---

## 9. Explain it to me plainly

> Explain that change in plain language — no design jargon. What will I
> actually see differently on my phone?

---

## 10. Make sure it still works

> Run `npm run build` and confirm it passes. If you changed any component
> files (not just tokens), tell me exactly which ones and why it needed more
> than a token change.

*Why:* the app is fully built and working. Design should mostly be tokens.
If it's editing lots of component logic, something's off.

---

## 11. End of session

> Wrap up: update `design/CHANGELOG.md` with what we decided today, make sure
> alternates are saved in `design/variants/`, run `npm run build`, and commit
> and push. Then give me a 3-bullet summary of where we are and what's next.

---

## Guardrails — paste these when it goes off the rails

| Situation | Paste this |
|---|---|
| It's rewriting everything | "Stop. Change only what I asked for. Show me a diff, not whole files." |
| It's burning tokens exploring | "Stop exploring. Give me your single best recommendation and why, in under 150 words." |
| It's changing app behavior | "You're changing functionality. The app is finished and tested — design only. Revert that and restyle instead." |
| It's getting decorative | "Too much. Apply the Rams test: remove, don't add. Show me a simpler version." |
| It forgot the project | "Re-read `design/DESIGN_BRIEF.md` and tell me what you missed." |
| It gave you one option | "Give me 2–3 options with trade-offs instead of one answer." |

---

## Three habits worth having

1. **One screen per request.** "Design the app" gets you mush; "design the item
   card, 3 options" gets you something you can judge.
2. **Always ask for options + keep the losers.** Costs nothing extra, and you'll
   want option 2 back next week. That's what `design/variants/` is for.
3. **React, don't prescribe.** "This feels cold" is more useful to it than a
   guess at a hex code. Let it translate your reaction into design decisions.

---

## If something breaks

The app is deployed and working at https://busca-ciudades.vercel.app. Design
changes are almost all in `design/tokens.css`. If a design session breaks
something, the fastest fix is:

> Something's broken. Run `npm run build`, show me the error, and revert the
> last design change with git. Don't try to fix it by redesigning.

And every version is in git — nothing is ever truly lost.
