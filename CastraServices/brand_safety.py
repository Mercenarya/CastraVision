"""Deterministic content-review warnings. No external calls, persistence or approval."""

import hashlib
import json
import re
import unicodedata

ENGINE_VERSION = "1.0.0"
DEFAULT_RULES = {
    "schemaVersion": 1,
    "bannedTerms": [],
    "requiredTerms": [],
    "warnAbsoluteClaims": True,
    "warnPersonalData": True,
}
FIELDS = frozenset({"hook", "headline", "body", "cta"})


def validate_rules(rules):
    if not isinstance(rules, dict) or set(rules) != set(DEFAULT_RULES):
        raise ValueError("INVALID_BRAND_RULES")
    if type(rules["schemaVersion"]) is not int or rules["schemaVersion"] != 1:
        raise ValueError("INVALID_BRAND_RULES")
    for key in ("warnAbsoluteClaims", "warnPersonalData"):
        if type(rules[key]) is not bool:
            raise ValueError("INVALID_BRAND_RULES")
    for key in ("bannedTerms", "requiredTerms"):
        terms = rules[key]
        if not isinstance(terms, list) or len(terms) > 50:
            raise ValueError("INVALID_BRAND_RULES")
        if any(
            not isinstance(term, str)
            or not 1 <= len(term.strip()) <= 80
            or term != term.strip()
            or any(ord(char) < 32 for char in term)
            for term in terms
        ):
            raise ValueError("INVALID_BRAND_RULES")
        if len({_normalize(term) for term in terms}) != len(terms):
            raise ValueError("INVALID_BRAND_RULES")
    if {_normalize(x) for x in rules["bannedTerms"]} & {
        _normalize(x) for x in rules["requiredTerms"]
    }:
        raise ValueError("INVALID_BRAND_RULES")
    return rules


def _normalize(text):
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def _contains(text, term):
    return re.search(r"(?<!\w)" + re.escape(_normalize(term)) + r"(?!\w)", text) is not None


def check_content(fields, rules):
    validate_rules(rules)
    if (
        not isinstance(fields, dict)
        or not fields
        or set(fields) - FIELDS
        or any(not isinstance(x, str) for x in fields.values())
    ):
        raise ValueError("INVALID_CONTENT")
    if sum(len(x) for x in fields.values()) > 8000 or not any(x.strip() for x in fields.values()):
        raise ValueError("INVALID_CONTENT")
    normalized = {key: _normalize(value) for key, value in fields.items()}
    findings = []
    for field, text in normalized.items():
        for index, term in enumerate(rules["bannedTerms"]):
            if _contains(text, term):
                findings.append(
                    {
                        "code": "BANNED_TERM",
                        "field": field,
                        "termIndex": index,
                        "severity": "review",
                    }
                )
        if rules["warnAbsoluteClaims"] and any(
            _contains(text, phrase)
            for phrase in (
                "guaranteed results",
                "100% guaranteed",
                "risk free",
                "risk-free",
                "zero risk",
                "cam kết 100%",
                "bảo đảm 100%",
                "an toàn tuyệt đối",
                "không rủi ro",
                "chữa khỏi hoàn toàn",
            )
        ):
            findings.append({"code": "ABSOLUTE_CLAIM", "field": field, "severity": "review"})
        if rules["warnPersonalData"] and (
            re.search(r"[\w.+-]+@[\w.-]+\.[a-z]{2,}", text)
            or re.search(r"(?<!\w)(?:\+84|0)(?:[ .()-]*\d){9,10}(?!\d)", text)
        ):
            findings.append({"code": "PERSONAL_DATA", "field": field, "severity": "review"})
    combined = " ".join(normalized.values())
    for index, term in enumerate(rules["requiredTerms"]):
        if not _contains(combined, term):
            findings.append(
                {
                    "code": "MISSING_REQUIRED_TERM",
                    "field": "content",
                    "termIndex": index,
                    "severity": "review",
                }
            )
    return {
        "provider": "internal_rules",
        "engineVersion": ENGINE_VERSION,
        "rulesDigest": hashlib.sha256(
            json.dumps(rules, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest(),
        "status": "needs_review" if findings else "no_findings",
        "findings": findings,
    }
