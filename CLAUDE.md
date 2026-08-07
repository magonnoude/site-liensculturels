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

Known live-infra caveat: the apex domain `liensculturels.org` (no `www`) is currently
**broken** (TLS handshake failure / 403 from CloudFront — it's not in the ACM cert SANs or
the distribution aliases). Fixing this requires an ACM cert update + CloudFront alias change
+ a DNS validation CNAME at Gandi (DNS is NOT in Route53 — this AWS account has no hosted
zone for this domain). Do not attempt this without the user present to add the Gandi DNS
record and confirm the change window.

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
