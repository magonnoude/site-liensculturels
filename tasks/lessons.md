# Lessons

Patterns captured after user corrections or confirmed decisions. Keep entries short: rule,
why, when it applies.

## 2026-08-07 — Repo scaffolding session

- **Don't touch `academy.grouperms.com/` when working on this repo.** Only reference it for
  patterns (CLAUDE.md structure, deploy.yml shape). This repo's changes stay inside
  `www.liensculturels.org/`.
- **DNS for this domain is at Gandi, not Route53.** This AWS account has no hosted zone for
  `liensculturels.org`. Any DNS-validated ACM change needs a manual CNAME added at Gandi by
  the user — cannot be automated end-to-end with AWS CLI alone.
- **RESOLVED 2026-08-07 — the apex domain (`liensculturels.org`, no www) was broken** — not in
  the ACM cert SANs or CloudFront distribution aliases, so it TLS-handshake-failed on HTTPS
  and got a CloudFront 403 on HTTP. Fixed by requesting a new ACM cert with the apex as
  primary domain + `*.liensculturels.org` as SAN, validated via a CNAME the user added at
  Gandi, then adding `liensculturels.org` to the CloudFront distribution's aliases and
  switching to the new cert. The `redirect-root-to-www` CloudFront Function is now reachable.
