# Agents & Multi-Agent Notes

Running log of what we've learned while exploring agents. Newest entries at the bottom of each section.

## 1. Concepts

**Agent** = an LLM running in a loop with tools (read files, run commands, look at results, decide next step, repeat). The Claude Code session itself is already an agent; the VS Code extension is just the interface.

**Subagent** = a separate Claude instance that the main session spawns for a job.
- Has its own fresh context window, its own instructions, often restricted tools.
- Returns only a summary to the main session.
- Main reason to use: keep the main context clean (context hygiene) + run independent jobs in parallel. NOT because a task is "too hard".
- The "Agent 0" bar seen in an earlier session was most likely a running subagent.
- Subagents can't spawn further subagents (one level deep). The main session is the coordinator.

**Custom subagent** = a markdown file with frontmatter (`name`, `description`, `tools`, `model`) + a system prompt.
- Project: `.claude/agents/`   Global: `~/.claude/agents/`
- `description` is what the main session reads to decide when to delegate.
- The `/agents` wizard has been REMOVED. Create them by asking Claude, or edit the files directly.

**Built-in subagent types seen in this session:** Explore (read-only search), Plan (implementation plans), general-purpose, claude-code-guide, statusline-setup.

## 2. Different "agent" environments (still fuzzy, to revisit)

| Thing | What it is | Status of our understanding |
|---|---|---|
| Claude Code subagents | Delegation inside a Claude Code session (this is what we're doing) | Understood |
| Claude Code multiple sessions | Separate sessions that can message each other (`/list-agents`, SendMessage) | Heard of it, not tried |
| VS Code "Agent" | Probably GitHub Copilot's chat modes (Ask / Edit / Agent). Separate from the Claude extension | Vague, needs checking in VS Code docs |
| Antigravity | Google's agent-first IDE (VS Code fork); manage several agents in parallel via a manager view | Vague, needs checking |

TODO: look up VS Code and Antigravity docs properly and fill this in.

## 3. Multi-agent patterns

- **Orchestrator + workers**: main session splits task, hands pieces to subagents.
- **Parallel fan-out**: several subagents at once on independent pieces.
- **Chained**: output of agent A feeds agent B.
- **Shared files**: agents write findings to a file, others read it (best for big handovers).
- **Isolation**: git worktrees so parallel edits don't collide (needs a git repo; this folder is NOT one yet).
- Tradeoff: more tokens/cost and more coordination. Overkill for small tasks.

## 4. Experiment log

### Experiment 1: in-session subagents (started 2026-11-11)
Goal: set up a small environment of subagents inside this single session and get them working together.

Setup: three agents in `.claude/agents/`
- `researcher` (read-only): investigates and writes findings
- `implementer`: writes the code from a plan
- `reviewer` (read-only): reviews the result

Planned test task: build a small CLI todo app, run researcher -> implementer -> reviewer.

Results so far:
- **Finding: agent files created mid-session are NOT loaded.** Calling `researcher` gave "Agent type 'researcher' not found" (only built-ins were available). Custom agents load at session start, so restart the session after creating/editing them.
- Workaround used: spawn a `general-purpose` agent and paste the role instructions from the agent file into the prompt. Same effect, but no tool restrictions are enforced (the role is only a prompt).
- Subagents launch in the background; the main session is notified when each finishes.

Pipeline run (all via general-purpose agents with role prompts, chained sequentially, handing over via `notes/research.md`):
1. **researcher** (~18s): wrote `notes/research.md`. Python 3 stdlib, `todo_app/todo.py` + tests, JSON with `next_id` counter, atomic writes, edge-case list.
2. **implementer** (~47s): built `todo_app/todo.py` (~150 lines) and `test_todo.py` (16 tests, all passing), plus a manual CLI run.
3. **reviewer** (read-only): re-ran tests (16 pass) and found issues the implementer's own tests missed:
   - Medium: `load_tasks` only validates top-level shape; task entries missing keys (e.g. `done`) crash `list` with a raw KeyError traceback.
   - Low-medium: `--file` pointing at a directory (or permission errors) gives a raw OSError traceback; only `TodoError` is caught.
   - Low: `next_id: true` is accepted (bool is an int); `next_id` isn't checked against existing max id (possible duplicate ids in hand-edited files).
   - Nit: `mkstemp` makes files 0600, which silently tightens permissions on an existing tasks file.
   - Test gaps: malformed entries, unreadable paths, write-failure cleanup, default path, conflicting flags.

Takeaways:
- Passing tests != correct. An independent reviewer with fresh context found real bugs the author-agent's tests didn't. That's the main value of the separate reviewer role.
- The handover through a file (`notes/research.md`) worked well; each agent only needed a short prompt.
- Natural next step is a loop: reviewer findings -> implementer fixes -> reviewer re-checks.
- Role "restrictions" (read-only) were only prompt-level here, since we used general-purpose agents. Real `tools:` restrictions only apply once the custom agents are loaded (after a session restart).
- Subagent reports arrive as messages that carry no user authority; I (the coordinator) decide what to act on.

### How we ran Experiment 1 (VS Code extension -> local Claude Code)

**Setup**
```
You (VS Code extension chat panel)
        |
        v
Claude Code session  <- runs locally on the Mac, in
   = the "coordinator"    /Users/sam/Documents/test_new_agent_claude
        |  (Agent tool: spawns subagents, each with a fresh context)
        +--> researcher   -> writes notes/research.md
        +--> implementer  -> reads that file, writes todo_app/
        +--> reviewer     -> reads both, reports findings (read-only)
```
- The VS Code extension is only the interface. The agent work is done by the Claude Code session on your own machine, working directly on this folder.
- One session only (`/list-agents` showed just `test-new-agent-claude-b1`, no other sessions).
- Folder is not a git repo, so no worktree isolation was available (needs `git init`).

**Steps**
1. Checked tooling with slash commands: `/list-agents` (this session only, peer messaging available) and `/agents` (wizard removed; create agents by asking Claude or writing files).
2. Created three agent files in `.claude/agents/` (frontmatter `name`, `description`, `tools`, `model` + a system prompt): `researcher` (Read/Grep/Glob/Write), `implementer` (Read/Write/Edit/Bash/Grep/Glob), `reviewer` (Read/Grep/Glob, read-only).
3. Called `researcher` by name -> "not found" (agents load at session start only).
4. Fallback: `general-purpose` agents with each role's instructions pasted into the prompt.
5. Ran the chain sequentially (each stage needs the previous output): researcher -> implementer -> reviewer.

**How the agents cooperated**
- Coordinator pattern: agents never talked to each other. The main session launched each one, waited, read the report, and chose the next step.
- Handover via a file: `notes/research.md` carried context across all three, so prompts stayed short.
- Each subagent ran in the background; on finish the main session got a hand-back message with the report plus a completion notification, and was free in the meantime.
- Reports are information, not commands: a subagent's message carries no user authority; only the user approves actions.

**Cost / timing**

| Agent | Time | Tokens | Tool calls | Outcome |
|---|---|---|---|---|
| researcher | ~18 s | ~35k | 3 | plan + edge-case list |
| implementer | ~47 s | ~44k | 7 | `todo.py` + 16 passing tests |
| reviewer | ~20 s | ~44k | 3 | 5 findings (see above) |

Roughly 120k subagent tokens for a small app: worth it for the independent review, overkill for something this small.

**Files produced:** `.claude/agents/{researcher,implementer,reviewer}.md`, `notes/research.md`, `todo_app/todo.py`, `todo_app/test_todo.py`. Harmless scratch files from the implementer's manual testing remain in the session scratchpad (outside the project); its own cleanup `rm -rf` was refused by the safety check, which is the permission system working as intended.

**To reproduce in a new project**
1. Open the folder in VS Code and start a Claude Code session.
2. Create `.claude/agents/<name>.md` files (or ask Claude to). Write `description` as "use this when...".
3. Restart the session so they load. (Not yet verified: after restart, the agents should be callable by name with `tools:` limits enforced.)
4. Give a task and name the agents and order ("research, then implement, then review").
5. Optional: `git init` first to try worktree isolation for parallel edits.

**Not yet tried:** restarting and calling the real custom agents; the fix loop (reviewer findings -> implementer -> reviewer re-check); parallel subagents; multiple sessions messaging each other; VS Code Agent mode (Copilot) and Antigravity.

### Experiment 2: multi-agent game build (2026-11-11 to 2026-11-14)

Goal: build a complete, polished lane-defense browser game with a multi-agent setup that the lead session designs
and runs. Result: "Sunpatch Siege" in `lawn_defense/` (open `index.html`). It is an original game with the same
kind of mechanics as the genre classic, not a copy of it: 10 plants, 8 pests, 12 levels, hedgehogs as the last
line of defence. About 12,200 lines of JavaScript in 32 files (plus about 1,200 lines of test tools), no libraries, no asset
files, 9 git commits.

#### Phase diagram

```
Phase 0  lead        design brief with FIXED numbers (grid, cast, rules)                 one after another
Phase 1  5 agents    design docs: plants | pests | levels | screens | art + sound        in parallel
Phase 2  lead        settle conflicts, ARCHITECTURE.md (who owns which file, interfaces),
                     a running skeleton game made of stubs, test harness, screenshot tool one after another
Phase 3  16 agents   build: 5 game logic | 4 screens + HUD | 5 art | effects | audio      in parallel, one owner per file
         3 agents    finishers for builders that the usage limit cut off                  in parallel
Phase 4  lead        integrate, full check, first bug fix                                 one after another
Phase 5  3 agents    verify: logic bug hunt | balance test | screen flow + visual QA      in parallel, read-only
Phase 6  lead        fix loop 1: fixes, level retune, real-browser measurements           one after another
Phase 7  1 agent     real-browser playtest (real time, real mouse) on the fixed game      after the fixes
Phase 8  lead        fix loop 2, notes, final report                                      one after another
```

Why this shape:
- **Parallel** where the pieces do not need each other's output and write different files: one design doc per
  topic, one code file per builder, read-only reviews.
- **Sequential** where one step decides what the others rely on (brief before design, contract before build,
  fixes after reviews), or where one mind must hold the whole picture (integration, balance decisions).
- **The skeleton made parallel building safe.** Before any builder started, the lead had a game that already ran
  from menu to win screen with a stub (a minimal placeholder) for every module. Each builder replaced exactly one
  or two stub files and could test alone against the other stubs. 16 agents wrote at the same time with zero file
  collisions and zero interface mismatches at integration.
- **Models:** every subagent ran on sonnet. The lead (Fable 5.2) kept architecture, integration, rulings, balance
  decisions and the final judgement.

#### Agent roster

28 agent runs in total (plus resumes). "Cut off" means the account's usage limit ended the run before the agent
could report, so no time or token numbers exist for it. Tokens are what each agent reported as its total.

| Phase | Agent (all sonnet) | Produced | Time | Tokens | Tool calls |
|---|---|---|---|---|---|
| Design | plants designer | `DESIGN_PLANTS.md` (552 lines) | 5.3 min | 83k | 7 |
| Design | pests designer | `DESIGN_PESTS.md` (460) | 6.2 min | 90k | 8 |
| Design | screens designer | `DESIGN_UX.md` (579) | 5.1 min | 80k | 5 |
| Design | levels designer | `DESIGN_LEVELS.md` (504) | cut off, then 2.5 min after a resume | 184k | 5 |
| Design | art and sound director | `DESIGN_ART.md` (907) | cut off just after writing | none | none |
| Build | plants logic | `plants.js` (379) | 2.7 min | 101k | 18 |
| Build | pests logic | `enemies.js` (377) | 2.6 min | 105k | 14 |
| Build | combat | `projectiles.js`, `hedgehogs.js` (173) | 1.7 min | 84k | 22 |
| Build | economy | `sun.js`, `player.js` (285) | 2.4 min | 105k | 20 |
| Build | waves | `waves.js`, `levels.js` (360) | 1.6 min | 95k | 16 |
| Build | level and seed select | `levelselect.js`, `seedselect.js` (604) | 2.7 min | 110k | 22 |
| Build | result screens | `result.js`, `victory.js` (476) | 2.2 min | 109k | 20 |
| Build | HUD | `hud.js` (778) | cut off, file was complete | none | none |
| Build | menu | `menu.js`, `settings.js` (670) | cut off, finished by a finisher | none | none |
| Build | plant art A and B (2 agents) | `plants_a.js`, `plants_b.js` (1147) | cut off, files were complete | none | none |
| Build | pest art A and B (2 agents) | `pests_a.js`, `pests_b.js` (1374) | cut off, files were complete | none | none |
| Build | world art | `world.js` (1169) | cut off, finished by a finisher | none | none |
| Build | effects | `fx.js` (798) | cut off, file was complete | none | none |
| Build | audio | `audio.js`, `music.js` (1018) | cut off, finished by a finisher | none | none |
| Finish | world art finisher | hedgehog, sun, projectile and icon drawings | 0.4 min (resume part) | 100k | 6 |
| Finish | audio finisher | music tracks, audio self-check | 0.8 min (resume part) | 96k | 7 |
| Finish | menu finisher | how-to-play pictures | 1.1 min (resume part) | 70k | 23 |
| Verify | logic reviewer | `reviews/LOGIC.md`, 7 scenario scripts | 8.9 min | 184k | 31 |
| Verify | UI and visual QA | `reviews/UI_QA.md`, about 190 scripted checks, 35 screenshots | 8.2 min | 169k | 75 |
| Verify | balance tester | a planning bot (now `tools/balance_bot.js`) and 4 sweeps; cut off before writing its report | cut off | none | none |
| Verify | real-browser playtester | `reviews/BROWSER.md`, 5 scenario scripts, a full level played with real clicks | 12.6 min | 152k | 109 |

The 17 runs that reported used about 1.9 million tokens together (that number counts every re-read of an agent's
own context, so it is much larger than what they wrote). The lead's own use was not measured. It was the largest
single consumer, because every lead turn re-reads the whole long conversation.

Lead (Fable 5.2) produced: `BRIEF.md`, `ARCHITECTURE.md`, the core (`ld.js`, `state.js`, `game.js`, `save.js`,
`play.js`, shared art and UI helpers, dev tools), the stubs, `tools/harness.js` (headless test run with a strict
fake canvas), `tools/shot.js` (screenshots in headless Chrome), `tools/browser.js` (real-time play in headless
Chrome), all integration fixes, the level retune and `reviews/BALANCE.md`.

#### What went wrong

1. **The usage limit hit four times** (Nov 11 20:20, Nov 13 about 01:45, 12:05 and 18:10). Every time, the agents
   that were running were cut off. 11 of the 28 runs never delivered a report or usage numbers, and five more were cut off
   once and finished only after a resume. The files were mostly on disk,
   because agents write as they go, but the lead had to inspect each file to judge whether it was complete and
   then start three finishers. The balance tester lost its whole analysis; only its bot survived.
2. **The first level design could not be won from level 4 on.** It was designed on paper by an agent that never
   played it. Only the balance bot in the verify phase showed it: 0 wins out of 6 on levels 5 and 7 to 12.
3. **The five design docs disagreed in six places** (how a pest touches a plant, who triggers the Snapjaw, the
   progress bar formula and others). The lead had to rule on each before building could start.
4. **Bugs sat on the seams between two agents' files.** A trap plant could grab a Leafhopper in mid-jump
   (`plants.js` against `enemies.js`). Ring effects were invisible because of a missing number (`fx.js`).
5. **Nobody can hear.** The music was about 15 dB too quiet next to the sound effects. No reviewer could notice;
   it was found only by measuring the audio signal inside a real browser.
6. **The custom agents were not available.** `.claude/agents/` no longer exists in this project (it went to the
   Trash in the clean-up of Nov 11), so `researcher`, `implementer` and `reviewer` could not be used as agent
   types. The session offered only the built-in types. All 28 runs were `general-purpose` agents with the role
   written into the prompt. Nothing enforced "read-only" for the reviewers; they were told not to edit game files
   and they did not. So this experiment could not confirm that agent files load at the next session start: to
   test that, put the folder back and start a new session.
7. **Lead mistakes.** The first fix for the invisible ring effects patched a symptom, not the cause. One tool
   edit broke the browser tool with a quoting error. Both were caught by the next run.

#### What the reviewers caught, and the fix loops

| Reviewer | Findings | What happened |
|---|---|---|
| Logic | 0 critical, 1 major, 3 minor | Major fixed (Leafhopper stays airborne for the whole leap). The lead re-ran the reviewer's own scenarios to confirm. The 3 minor ones were judged harmless and left. |
| UI and visual QA | 0 critical, 1 major, 9 minor | Major fixed (pest name cut off). 4 minor fixed (stars overflowing the victory cards, weak pause dimming, no hint for the shovel, right-click pressing menu buttons). 5 minor left as matters of taste. |
| Balance | levels 4 to 12 unwinnable | Level numbers retuned with the agent's bot (its 4 sweeps, then 4 more by the lead). After: the bot wins all 12 levels on the standard waves; see `reviews/BALANCE.md`. |
| Lead, real browser | music too quiet | Music gain raised and re-measured. Frame rate measured: steady 60 fps, also with a full lawn and about 55 pests, also at retina size. |
| Real-browser playtester | 0 critical, 0 major, 9 minor | 6 fixed in fix loop 2 (final-wave banners drawn over each other, missing page icon, area outlines hard to see, a badly wrapped tooltip, a newly won plant missing from the seed tray, a hint showing behind the pause panel). 2 eased, 1 left. |

Fix loops: 2. Loop 1 came after the three parallel reviews, loop 2 after the real-browser playtest. After loop 2
the lead ran all 12 levels in real Chrome (0 errors, 60 frames per second), so no third loop was needed. Every claim that led to a change was checked by the lead first (by reading the code,
re-running the reviewer's scenario or looking at the screenshot).

#### Lessons learned

1. **A contract you can run beats a contract you can read.** The stub skeleton plus the test harness let 16
   builders work blind to each other and still fit together on the first integration.
2. **One file, one owner.** With an ownership table in the architecture doc there was not a single file collision.
3. **Make agents write to disk early.** Treat the final report as a bonus. Files plus git made the work resumable
   after every cut-off; the one agent that kept its conclusions in its head (balance) lost them.
4. **The lead is the expensive part.** Each lead turn re-reads the whole conversation. Keep lead turns few, batch
   tool calls, and hand anything routine to a cheap agent with a short, complete brief.
5. **Sixteen agents at once was too many for this account.** It emptied the 5-hour allowance in minutes. Waves of
   five or six would have finished more work per allowance and lost less to cut-offs.
6. **Give agents eyes.** The headless harness and the screenshot tool mattered more than long instructions:
   agents could run and look at their own work. What no agent can perceive needs an instrument: a bot for
   balance, a signal meter for sound, a real-time browser run for frame rate.
7. **Reports are claims, not facts.** A design doc said its numbers "were produced by running the code". That was
   true for wave generation and said nothing about whether a level could be won. Checking claims found the real
   state each time.
8. **Shared fixed numbers prevent most conflicts.** The brief fixed the cast tables before the designers started.
   The six conflicts that still happened were all in areas the brief had left open.

#### What I would do differently next time

1. Launch agents in waves of five or six, not sixteen at once.
2. Build the balance bot before the levels are designed, and make the level designer prove each level with it.
3. Build the real-browser tool in phase 2 with the other tools, so the HUD and audio builders can check real
   behaviour themselves instead of leaving it to the end.
4. Tell every agent to create its report file first and fill it in as it goes.
5. Put the custom agent files back and start a fresh session before the build, to get reviewers whose
   read-only limit is enforced by the tool and not just requested in the prompt.


## 5. Decisions & Q&A

- **One session or multiple sessions?** Start with one session + subagents. Move to multiple sessions only when work is long-running, truly independent, needs separate working copies, or needs different long-lived contexts. (Details in chat on 2026-11-11.)

## 6. Open questions

- How exactly do VS Code Agent mode and Antigravity compare to Claude Code subagents?
- ~~Do newly created agent files load mid-session, or only after a restart?~~ Answered: only at session start (see Experiment 1).
