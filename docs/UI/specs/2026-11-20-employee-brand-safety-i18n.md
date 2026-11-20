# Employee Brand Safety and EN/VI

User approved internal rules first (no paid AI) and an exception for Employee API + business_profiles.brand_safety_rules + local SQL tests. Hosted approval remains separate. Preserve prior changes, no Git mutation/env/dependencies.

Use a versioned deterministic provider: custom literal banned/required phrases, optional absolute-claim and personal-data warnings. Unicode casefold/normalization and word boundaries; no arbitrary user regex. Findings identify field, rule and severity, never echo detected personal data. No legal certification, scoring or automatic approval. Content is checked in memory, not saved to logs/database. Rule configuration alone persists, via user JWT and existing MM-only profile RLS/audit. Optimistic concurrency uses profile updated_at; no service-role CRUD.

Add narrow GET/PATCH rules and POST check endpoints before the existing Employee wildcard route. Employee/Leader can read/check their workspace; only verified workspace admin (Marketing Manager) writes rules. Missing profile/schema must return an explicit error; no fake saved configuration or silent provider fallback. UI invalidates stale results when content/rules change; provider/version and rule revision are shown. MM editor lives in existing Business Profile settings; Employee sees read-only config and can check in composer.

Use existing LanguageProvider/dictionaries for tasks, campaigns, references, composer, proposals, notifications and Settings. Keep payload enums and user-authored text unchanged. Locale controls dates/labels; errors use stable codes when available. No second i18n runtime.

Verify engine boundaries/Unicode/redaction, actual save/reload and stale revision, Employee/foreign workspace/Inactive negatives, SQL authenticated RLS, UI EN/VI and local HTTP integration. Run lint/build/full suites/Ruff/diff/secret scan. Keep hosted deployment pending and document remaining coverage limits.
