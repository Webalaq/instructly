# Daily Workflow with Claude Code (Max Plan)

## The Reality of Max Limits

Your usage is shared between Claude Code and Claude.ai chat, and resets on a
5-hour rolling window. You also have a weekly active-hours cap. Burn it on
exploratory chat and you'll hit limits mid-feature.

This workflow gets the most out of one Max 5x or 20x plan.

---

## The Two-Brain Method

You have **two Claudes** working for you:

**Claude.ai (web)** = the architect.
Use it for planning, design discussions, debugging conversations, writing prompts.
Free of file system pressure. Better for thinking.

**Claude Code (terminal)** = the builder.
Use it only for executing well-scoped tasks. Don't think out loud here.

**Rule**: Never plan in Claude Code. Never code in Claude.ai. Each tool has one job.

---

## Daily Rhythm

### Morning (no Claude needed)

1. Open `docs/PRD.md` — what's next?
2. Pick ONE feature you can finish today.
3. Write a 3-sentence spec in a notes file: what it does, what tables it touches, what's the acceptance criteria.

### Mid-morning (Claude.ai web)

4. Paste your 3-sentence spec into Claude.ai and ask: _"Turn this into a Claude Code prompt that follows my CLAUDE.md conventions. Output a single prompt I can paste."_
5. Review the prompt. Edit if it's missing context.

### Build window (Claude Code, 2-3 hour focused block)

6. `/clear` to reset context.
7. Paste the prompt. Let Claude Code work.
8. Review each diff carefully. Push back on anything that smells off.
9. Run `pnpm typecheck && pnpm lint && pnpm test` before declaring done.
10. Commit with a `feat:` or `fix:` message.

### Afternoon (no Claude)

11. Manually test the feature in the browser.
12. Note any bugs in a `todos.md` file.

### Evening (Claude.ai web)

13. Recap the day in Claude.ai. Ask it to update `docs/DECISIONS.md` if you made architectural calls.

This rhythm gives you ~3 hours of intense Code use per day — well within Max 5x limits.

---

## Token-Saving Tactics

**Be specific with file references**
Bad: _"Update the booking page"_
Good: _"In `src/app/(instructor)/calendar/page.tsx`, change the week view to default to Monday-Sunday instead of Sunday-Saturday"_

**Show, don't describe**
Bad: _"The dropdown looks weird"_
Good: _"This dropdown should match the one in `src/components/student-status-filter.tsx`"_

**Cap the work**
Bad: _"Build the entire calendar feature"_
Good: _"Build just the week view component, no interactions yet — just rendering 7 columns with the time grid. Show me before adding bookings."_

**Use `/clear` between unrelated tasks**
Old context costs tokens on every message. If you're done with auth and moving to calendar, clear.

**Don't ask "is this a good idea?"**
That's a Claude.ai question. In Claude Code, decide first, then instruct.

**Reuse prompts**
Keep a `prompts/` folder in your notes app. Successful prompts become templates.

---

## What to Do When You Hit Limits

1. **Don't panic-pay for more.** Limits reset every 5 hours.
2. **Switch to manual mode.** You can code review — fix small things by hand.
3. **Plan the next session in Claude.ai** (separate bucket... wait, it's the same bucket on Max. Switch to GPT or Gemini for non-Anthropic-specific planning chats.)
4. **Use the wait time productively**: customer research, design mockups in Figma, marketing copy, manual testing.

---

## Red Flags (Stop and Think)

If Claude Code is doing any of these, stop it:

- Creating 5+ files for what should be a small change
- Adding new dependencies without confirming
- Editing files outside what you asked it to touch
- Generating tests that mock the thing being tested into uselessness
- Writing comments that explain _what_ code does instead of _why_
- Telling you something works without running the typecheck

When in doubt: `git diff` and review every change yourself. You're the senior dev, Claude is the very fast junior.

---

## The One Habit That Matters Most

**Commit at the end of every Claude Code session.**

Working code → `git commit`. Broken? → `git reset --hard HEAD`. Free undo.

If you let Claude Code work for 2 hours without committing, you're playing without a safety net. Don't.
