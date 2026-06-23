# Skill Registry — electrogestor

Generated: 2026-06-22
Source: User skills (`~/.config/opencode/skills/`)
Resolution: fallback-registry (no project-level skills found)

---

## branch-pr

- **Trigger**: creating, opening, or preparing PRs for review
- **Path**: `~/.config/opencode/skills/branch-pr/SKILL.md`
- **Compact Rules**:
  1. EVERY PR MUST link an approved issue (`status:approved`) — no exceptions.
  2. Branch names MUST match `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`.
  3. PR body MUST contain `Closes #N` / `Fixes #N` / `Resolves #N`.
  4. Add exactly one `type:*` label matching the PR type.
  5. Automated checks must pass before merge.
  6. Conventional commits: `type(scope): description` — types: feat, fix, chore, docs, style, refactor, perf, test, build, ci, revert.
  7. No `Co-Authored-By` trailers in commit messages.

---

## chained-pr

- **Trigger**: PRs over 400 lines, stacked PRs, review slices
- **Path**: `~/.config/opencode/skills/chained-pr/SKILL.md`
- **Compact Rules**:
  1. Split PRs over 400 changed lines unless maintainer accepts `size:exception`.
  2. Keep each PR reviewable in ≤60 minutes.
  3. One deliverable work unit per PR; keep tests/docs with the unit they verify.
  4. State start/end/prior/follow-up/out-of-scope in every chained PR.
  5. Every child PR must include a dependency diagram marking current PR with `📍`.
  6. Feature Branch Chain: draft/no-merge tracker PR; child #1 targets tracker, later children target immediate parent.
  7. Polluted diffs = base bugs: retarget or rebase until only current unit appears.
  8. Do not mix chain strategies after user chooses one.

---

## cognitive-doc-design

- **Trigger**: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs
- **Path**: `~/.config/opencode/skills/cognitive-doc-design/SKILL.md`
- **Compact Rules**:
  1. Lead with the answer — outcome first, context after.
  2. Progressive disclosure: happy path first, then details/edge cases/references.
  3. Chunking: group related info into small sections.
  4. Signposting: headings, labels, callouts, summaries.
  5. Recognition over recall: prefer tables, checklists, examples, templates over prose.
  6. Review empathy: design docs so reviewers verify intent without reconstructing the story.
  7. Use checklist format for acceptance criteria and verification.

---

## comment-writer

- **Trigger**: PR feedback, issue replies, reviews, Slack messages, or GitHub comments
- **Path**: `~/.config/opencode/skills/comment-writer/SKILL.md`
- **Compact Rules**:
  1. Start with the actionable point — no recap before feedback.
  2. Be warm and direct, like a thoughtful teammate.
  3. Keep to 1-3 short paragraphs or a tight bullet list.
  4. Explain WHY when asking for a change.
  5. No pile-ons — comment on highest-value issue only.
  6. Match thread language (Rioplatense Spanish: `podés`, `tenés`, `fijate`).
  7. No em dashes — use commas, periods, or parentheses.

---

## go-testing

- **Trigger**: Go tests, go test coverage, Bubbletea teatest, golden files
- **Path**: `~/.config/opencode/skills/go-testing/SKILL.md`
- **Compact Rules**:
  1. Prefer table-driven tests with `t.Run(tt.name, ...)`.
  2. Test behavior and state transitions, not implementation.
  3. Use `t.TempDir()` for filesystem tests; never rely on real home dir.
  4. Integration tests must be skippable with `testing.Short()`.
  5. Bubbletea: test `Model.Update()` directly; teatest only for interactive flows.
  6. Golden files must be deterministic; update via `-update` then re-run without it.
  7. Small mocks/interfaces around system boundaries.

---

## issue-creation

- **Trigger**: creating GitHub issues, bug reports, or feature requests
- **Path**: `~/.config/opencode/skills/issue-creation/SKILL.md`
- **Compact Rules**:
  1. Blank issues are disabled — MUST use a template (bug_report or feature_request).
  2. Every issue gets `status:needs-review` automatically on creation.
  3. A maintainer MUST add `status:approved` before any PR can be opened.
  4. Questions go to Discussions, NOT issues.
  5. Search existing issues for duplicates first.
  6. Bug labels: `bug`, `status:needs-review`. Feature labels: `enhancement`, `status:needs-review`.
  7. Approval workflow: needs-review → approved by maintainer → PR can be opened.

---

## judgment-day

- **Trigger**: judgment day, dual review, adversarial review, juzgar
- **Path**: `~/.config/opencode/skills/judgment-day/SKILL.md`
- **Compact Rules**:
  1. Launch TWO blind judges in parallel — never review code yourself.
  2. Wait for both judges before synthesis; never accept partial verdict.
  3. Classify warnings as `WARNING (real)` only if normal usage triggers them; else downgrade to INFO.
  4. Ask before fixing Round 1 confirmed issues.
  5. After fix, immediately re-launch both judges in parallel.
  6. Terminal states: only `JUDGMENT: APPROVED` or `JUDGMENT: ESCALATED`.
  7. After 2 fix iterations with remaining issues, ask user whether to continue.
  8. Resolve project skills before launching agents — read registry, match compact rules.

---

## skill-creator

- **Trigger**: new skills, agent instructions, documenting AI usage patterns
- **Path**: `~/.config/opencode/skills/skill-creator/SKILL.md`
- **Compact Rules**:
  1. A skill is a runtime instruction contract for an LLM, not human docs.
  2. description: one physical line, quoted, trigger-first, ≤250 chars.
  3. Frontmatter: name, description, license, metadata.author, metadata.version.
  4. Required sections: Activation Contract → Hard Rules → Decision Gates → Execution Steps → Output Contract → References.
  5. Target 180-450 body tokens; move examples/schemas to `assets/` or `references/`.
  6. References must point to local files.
  7. No `Keywords` section — preserve trigger words in description.
  8. Register in AGENTS.md for project skills.

---

## work-unit-commits

- **Trigger**: implementation, commit splitting, chained PRs, or keeping tests and docs with code
- **Path**: `~/.config/opencode/skills/work-unit-commits/SKILL.md`
- **Compact Rules**:
  1. Commit by work unit — a commit = one deliverable behavior, fix, migration, or docs unit.
  2. Do NOT commit by file type (models, then services, then tests).
  3. Keep tests with the behavior they verify in the same commit.
  4. Keep docs with the user-visible change they explain.
  5. Each commit should tell a story — reviewer understands why from diff + message.
  6. Future PR-ready: each commit should be a candidate chained PR.
  7. If SDD tasks forecast >400 lines, group into chained PR slices before implementation.
  8. Work unit checklist: one purpose, repo works after commit, test/docs included, rollback safe, message explains outcome.

---

## Convention Files

- **AGENTS.md**: not found
- **CLAUDE.md**: not found
- **.cursorrules**: not found
- **GEMINI.md**: not found
- **copilot-instructions.md**: not found
