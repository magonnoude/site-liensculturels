# CLAUDE.md — www.liensculturels.org

Guidance for Claude Code when working in this repository. This file follows the same
working-rules pattern as `academy.grouperms.com/CLAUDE.md`, adapted to this site's much
smaller scope (static brochure site, no backend codebase, two Lambda functions owned
elsewhere).

## 1. What this project is

Static HTML/CSS/vanilla-JS website for **Association Liens Culturels** (loi 1901,
Nogent-l'Artaud, France) — a cultural-exchange association linking France, the French
Antilles and Bénin (Savè). Single language (French). No build system, no framework,
no test suite. See `README.md` for full architecture and `ROADMAP.md` for planned work.

Repo: https://github.com/magonnoude/site-liensculturels (public, default branch `main`)

## 2. Plan Mode Default

**Enter plan mode when ANY of these criteria are met:**
- More than 2 files need to be modified, OR
- The change touches AWS infrastructure (S3 bucket policy, CloudFront distribution/functions,
  ACM certificates, Lambda, API Gateway) — this site's forms backend is **live** and used by
  real members/donors.

Note: the apex domain `liensculturels.org` (no `www`) was broken (TLS handshake failure /
403 from CloudFront) until 2026-08-07 — fixed by requesting a new ACM cert with the apex as
primary domain + `*.liensculturels.org` as SAN, validated via a CNAME the user added at
**Gandi** (DNS is NOT in Route53 — this AWS account has no hosted zone for this domain), then
adding `liensculturels.org` to the CloudFront distribution's aliases and switching to the new
cert. Any future ACM/DNS work on this domain still needs the user present for the Gandi step
— we have no Gandi API access from this environment.

## 3. Subagent Strategy

- Use subagents/forks to keep the main context window clean for research or multi-file sweeps.
- Do NOT spawn a subagent for tasks estimated under 15 minutes — handle inline.

## 4. Self-Improvement Loop

- After any correction from the user, update `tasks/lessons.md` with the pattern and why.
- At the start of a session touching this repo, skim `tasks/lessons.md` for relevant rules.

## 5. Verification Before Done

- Never mark a task complete without proving it works: for content/HTML changes, open the
  page (or `python3 -m http.server` locally) and check it renders; for deploy changes,
  confirm the GitHub Actions run is green and spot-check the live URL.
- Never claim UI/visual work is "done" without actually looking at it.

## 6. Security & Infrastructure Rules

- Never write credentials in plain text in any file. AWS credentials for the GitHub Actions
  deploy live only in repo secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_REGION`, `CLOUDFRONT_DISTRIBUTION_ID`) — never in the codebase.
- Any IAM, S3 bucket policy, or CloudFront change → explicit justification with the user
  before applying, and confirm which of the two live Lambda functions
  (`liensCulturels-contact-form`, `liensCulturels-adhesion-form`) or the shared API Gateway
  (`liensCulturels-API`, id `8igk1o6vw4`) are affected before touching anything upstream of
  this repo (that backend is not versioned here).
- This repo is **public** on GitHub — never commit anything containing member/donor PII,
  API keys, or internal financial documents (PV, statuts are fine — already public-facing
  legal docs; but exports of membership lists, emails, etc. must never be committed).
- Deploy IAM user: `github-actions-liensculturels` (least-privilege: S3 sync on the site
  bucket + CloudFront invalidation on `E27Z3FWSMEYT5U` only). CloudFront access logs go to
  `www-liensculturels-org-logs` (private, encrypted, 30-day expiry) via CloudWatch Logs
  vended-logs delivery. Security headers come from the Response Headers Policy
  `liensculturels-security-headers` attached to the default cache behavior.

## 8. On the member/admin/secretary/treasurer portals (requested, not yet built)

This site was a pure static brochure with two Lambda contact forms until 2026-08-07, when
the association asked for four new areas: a member space, an admin space (documents, photo
library, video library, agenda, member management, newsletter), a secretary space (meeting
planning, minutes, decisions), and a treasurer space. **Do not build any of this by
improvising an architecture inline.** It requires real authentication, a member database,
and — for the treasurer space — actual financial/accounting data, on a repo that is
currently **public**. Get explicit answers on auth approach (Cognito is the natural AWS-native
fit), where sensitive backend code/data lives (likely needs to NOT be in this public repo, or
the repo's visibility needs to change first), and data model/security review before writing
any code. This is exactly the kind of task this file's Plan Mode criteria (AWS infra, PII,
financial data) were written for — treat it accordingly even under an "auto commit and go"
instruction; that instruction covers execution speed once the plan is agreed, not skipping
the plan.

## 7. Content & File Hygiene

- Every real page must be reachable from the nav in `header`/`footer` markup of at least one
  page and listed in `sitemap.xml` (exceptions: thank-you/confirmation pages, which should
  get `<meta name="robots" content="noindex">` instead).
- Don't leave stray editor/OS duplicate files (e.g. `index - Copie.html`) committed — see
  `.gitignore` for patterns that are now blocked going forward.
- New images dropped into `assets/img/` that aren't yet wired into any page (bureau member
  photos, new logos, favicon sets, etc.) are normal — this site's content gets updated in
  batches. Before a deploy, check `git status` and call out any image that's been sitting
  unused for a while so the user can decide to wire it in or drop it.

---

# Task Management (Execution Workflow)

1. **Plan First**: write non-trivial plans to `tasks/todo.md` with checkable items.
2. **Verify Plan**: check in with the user before starting anything that hits the Plan Mode
   criteria above.
3. **Track Progress**: mark items complete as you go.
4. **Capture Lessons**: update `tasks/lessons.md` after any correction from the user.

---

# Core Principles

- **Simplicity First**: this is a small static site for a volunteer-run association — prefer
  the plain HTML/CSS fix over introducing tooling, frameworks, or build steps.
- **No Laziness**: find root causes (e.g. the apex-domain TLS bug above was tracked to its
  actual cause — missing SAN/alias — not just "it doesn't work").
- **Minimal Impact**: touch only what the task requires.
