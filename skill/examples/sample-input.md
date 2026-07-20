# Sample Input — Product Brief

> A realistic product brief used to exercise the full Requirements
> Intelligence Council pipeline. Paste this into the source-material field
> of any IDE running the skill; the expected output is in
> `sample-output-prd.md`.

## Source type
`text` (free-text product brief — no repo URL attached)

## Source description
A founder's brief for a new habit-tracking mobile app targeting knowledge
workers. The brief is intentionally incomplete: it states the vision and
the primary persona but leaves pricing, monetization, technical
architecture, and most non-functional requirements unspecified. The
council should surface these as gaps and infer standard supporting
requirements (auth, sync, notifications, etc.).

---

## Brief

### Product name
**Streakline**

### One-liner
A calm, frictionless habit tracker that helps busy knowledge workers build
the daily routines that compound into long-term success — without the
guilt, gamification noise, or streak-shaming of existing apps.

### Target user
**Mara**, a 32-year-old product manager at a mid-size SaaS company. She's
tried four habit trackers in the last two years and abandoned all of them
within three weeks. She wants to meditate daily, read 20 pages, do a
10-minute mobility routine, and prepare for tomorrow's meetings the night
before. She has 5-10 minutes between meetings and at bedtime. She is
privacy-conscious and refuses to sign up with social accounts.

### Problem
Existing habit trackers fall into two camps:
1. **Gamified streak apps** that shame users when they miss a day,
   causing abandonment after the first broken streak.
2. **Spreadsheets and journals** that require discipline to maintain and
   don't surface patterns or progress over time.

Neither camp respects the user's limited attention budget or supports
recovery from missed days without guilt.

### Vision
Streakline treats missed days as data, not failure. The app shows
"consistency over time" rather than "current streak", surfaces the
patterns that predict success (e.g. "you complete 80% of habits on days
you meditate before 8am"), and lets users rebuild after a miss with a
single tap. The default experience is calm — no push notifications unless
the user opts in, no streak loss animation, no social leaderboard.

### Key behaviors (founder's notes, unordered)
- Add a habit in under 10 seconds (title, cadence, optional time-of-day
  hint).
- Mark a habit done with a single tap.
- See today's habits as a calm checklist.
- See a 30-day consistency view (not a streak counter) per habit.
- See patterns: "you complete 80% of habits on days when X".
- Rebuild after a miss: one tap restores the consistency view without
  losing history.
- Optional reminders per habit, off by default.
- All data stays on-device first; cloud sync is opt-in and end-to-end
  encrypted.
- No social features. No leaderboards. No streaks-as-currency.
- Free to use; a paid tier unlocks advanced patterns and unlimited habits
  (founder is unsure of pricing — needs the council's input).

### What the founder is unsure about
- **Pricing:** free with paid tier? Subscription or one-time? What price
  point?
- **Platform:** iOS first, Android first, or web first? Founder leans iOS
  first but wants the council's take.
- **Monetization ethics:** is it OK to charge for "patterns" when the
  free tier already shows consistency? Where's the line?
- **Onboarding:** how do you teach a calm, opt-in notification model
  without feeling like you're hiding features?
- **Data portability:** should the app support export/import from other
  habit trackers to ease switching?
- **Accessibility:** the founder has a visually impaired friend and wants
  VoiceOver/TalkBack support from day one — but doesn't know what that
  costs.
- **Growth:** no marketing budget. How does a calm, anti-gamified app
  grow without dark patterns?

### Constraints (founder-stated)
- Solo founder with one contracted iOS engineer, ~$40K runway for 6
  months.
- No backend engineer on the team.
- Strong preference for managed / serverless backend if needed.
- Hard requirement: data never leaves the user's control without explicit
  opt-in.
- Hard requirement: app must work offline; sync when online.
- Soft preference: avoid third-party analytics SDKs that ship user data
  off-device.

### What success looks like (founder's gut feel)
- 1,000 active users in 90 days.
- 40% week-4 retention.
- At least one user testimonial saying "this is the first habit tracker I
  didn't quit".
- A defensible pricing model that doesn't feel like a dark pattern.

---

## Expected pipeline behavior

When this brief is run through the council, the expected outputs include:

1. **Understand:** context map identifies Mara as primary persona, flags
   missing pricing/platform/monetization decisions, infers standard
   supporting needs (auth, sync, notifications, accessibility,
   offline-first storage, E2E encryption).
2. **Debate:** the council should converge on iOS-first, subscription
   pricing at $4.99/mo or $39/yr, free tier with up to 5 habits and
   consistency view, paid tier for patterns and unlimited habits.
   Security Reviewer should challenge the E2E encryption implementation
   given no backend engineer; Solutions Architect should propose a
   serverless managed backend (Firebase / Supabase); UX Reviewer should
   defend the calm, opt-in notification model.
3. **Requirements:** 15-25 functional needs including auth, habit CRUD,
   consistency view, patterns engine, offline-first sync, E2E encrypted
   backup, export/import, accessibility (VoiceOver), reminder
   notifications (opt-in).
4. **Gaps & Risks:** missing_scope (pricing model not finalized),
   missing_apis_or_integrations (no backend engineer → serverless
   selection), missing_validations (founder's "soft preference" on
   analytics needs to be a hard rule), missing_non_functional_requirements
   (no accessibility target), missing_ownership (no marketing owner).
5. **Strategy:** should choose `PRD` (product behavior, user needs,
   features, measurable outcomes).
6. **Generate:** should produce the PRD in `sample-output-prd.md`.
7. **Validate:** should pass completeness and consistency with score
   80-90; one revision pass likely needed to expand the rollout plan and
   traceability table.
