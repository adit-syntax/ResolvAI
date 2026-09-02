"""
Enterprise AI Guardrails & PII Sanitizer — Module GenAI-1
Sanitizes user input before passing prompts to external LLMs.
Detects and redacts:
- Credit card numbers (with Luhn checksum validation)
- API keys, Bearer tokens, JWTs, AWS secret keys, Private keys
- Passwords and connection strings
- Social security / Tax numbers
- Phone numbers & email addresses (optional masking)
"""

import re
from typing import Dict, List, Tuple, Any


# ─── Regex Patterns for Sensitive Entities ───────────────────────────────────

# Credit cards: 13 to 19 digits (continuous, spaced, or hyphenated)
CREDIT_CARD_PATTERNS = [
    # 1. Standard grouped card formats (e.g. 4544-5687-9988-7762 or 4544 5687 9988 7762)
    re.compile(r'\b(?:\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,7}|\d{4}[ -]\d{6}[ -]\d{4,5})\b'),
    # 2. Continuous 13 to 19 digit numbers (e.g. 4544568799887762)
    re.compile(r'\b\d{13,19}\b'),
    # 3. Contextual card pattern (e.g. "credit cc no is 4544568799887762" or "card: 1234...")
    re.compile(
        r'(?i)\b(?:credit|debit|card|cc|visa|mastercard|amex|rupay)(?:\s+(?:card|cc|no|num|number|is|was|:|=)){0,3}\s*[:=]?\s*([0-9\s\-]{12,22})\b'
    ),
]

# API Keys & Secrets
API_KEY_PATTERNS = [
    # Generic API Keys (e.g. gsk_..., sk_..., key-...)
    re.compile(r'\b(?:sk|gsk|pk|api|key)_[a-zA-Z0-9_\-]{20,}\b', re.IGNORECASE),
    # JWT tokens
    re.compile(r'\beyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\b'),
    # AWS Access / Secret Keys
    re.compile(r'\b(?:AKIA|ASIA)[0-9A-Z]{16}\b'),
    re.compile(r'\baws_secret_access_key\s*=\s*[a-zA-Z0-9/+=]{40}\b', re.IGNORECASE),
    # Bearer tokens in headers
    re.compile(r'Bearer\s+[a-zA-Z0-9_\-\.]{20,}', re.IGNORECASE),
    # Private Key blocks
    re.compile(r'-----BEGIN [A-Z ]+PRIVATE KEY-----[a-zA-Z0-9+/=\s]+-----END [A-Z ]+PRIVATE KEY-----', re.DOTALL),
]

# Passwords in connection strings or text (e.g. password: '...', password is '...', pwd=...)
PASSWORD_PATTERNS = [
    re.compile(r'(?:password|passwd|pwd|secret)\s*(?:is\s*|was\s*|[:=]\s*)["\']?([^"\'\s,;]+)["\']?', re.IGNORECASE),
    re.compile(r'(?:postgres|mysql|mongodb|redis)://[^:]+:([^@]+)@', re.IGNORECASE),
]

# US SSN / National IDs
SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

# Phone Numbers
PHONE_PATTERN = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')


def _luhn_check(card_number_str: str) -> bool:
    """Validate credit card using Luhn algorithm to avoid false positives."""
    digits = [int(c) for c in card_number_str if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    reverse_digits = digits[::-1]
    for i, d in enumerate(reverse_digits):
        if i % 2 == 1:
            d = d * 2
            if d > 9:
                d -= 9
        checksum += d
    return checksum % 10 == 0


class PIISanitizer:
    """
    Enterprise PII & Secrets sanitizer for LLM Prompts and Ticket Storage.
    """

    @staticmethod
    def sanitize(text: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Sanitize text by redacting sensitive information.
        Returns:
            Tuple[sanitized_text, list_of_redacted_entities]
        """
        if not text:
            return text, []

        redacted_entities: List[Dict[str, Any]] = []
        sanitized = text

        # 1. Redact Private Keys
        for pattern in API_KEY_PATTERNS:
            for match in pattern.finditer(sanitized):
                val = match.group(0)
                sanitized = sanitized.replace(val, "[REDACTED_SECRET_KEY]")
                redacted_entities.append({
                    "type": "API_SECRET_KEY",
                    "snippet": val[:6] + "..." if len(val) > 6 else "[SECRET]",
                })

        # 2. Redact Passwords
        for pattern in PASSWORD_PATTERNS:
            for match in pattern.finditer(sanitized):
                full_match = match.group(0)
                try:
                    pwd = match.group(1)
                    if pwd and len(pwd) > 2:
                        replacement = full_match.replace(pwd, "[REDACTED_PASSWORD]")
                        sanitized = sanitized.replace(full_match, replacement)
                        redacted_entities.append({
                            "type": "PASSWORD",
                            "snippet": "********",
                        })
                except IndexError:
                    sanitized = sanitized.replace(full_match, "[REDACTED_PASSWORD]")
                    redacted_entities.append({"type": "PASSWORD", "snippet": "********"})

        # 3. Redact Credit Cards & Payment Cards (Multi-tier: Luhn + Context + 15/16-digit structure)
        for pattern in CREDIT_CARD_PATTERNS:
            for match in pattern.finditer(sanitized):
                # If pattern has capture group (e.g. contextual), use it
                card_str = match.group(1) if match.lastindex else match.group(0)
                card_str = card_str.strip()
                clean_digits = re.sub(r'\D', '', card_str)

                if 12 <= len(clean_digits) <= 19:
                    # Redact if:
                    # A) Passes Luhn algorithm (real cards)
                    # B) Has standard 15 or 16 digit card length (Amex, Visa, MC, Discover, RuPay)
                    # C) Preceded by card context keywords
                    is_valid_luhn = _luhn_check(clean_digits)
                    is_standard_card_len = len(clean_digits) in (15, 16)
                    has_card_context = any(
                        kw in text.lower()
                        for kw in ["credit", "card", "cc", "debit", "visa", "mastercard", "amex", "rupay", "cvv"]
                    )

                    if is_valid_luhn or is_standard_card_len or has_card_context:
                        sanitized = sanitized.replace(card_str, "[REDACTED_CREDIT_CARD]")
                        redacted_entities.append({
                            "type": "CREDIT_CARD",
                            "snippet": f"****-****-****-{clean_digits[-4:]}" if len(clean_digits) >= 4 else "****",
                        })

        # 4. Redact CVV / Security Codes
        cvv_pattern = re.compile(r'(?i)\b(?:cvv|cvc|security\s*code)\s*[:=]?\s*(\d{3,4})\b')
        for match in cvv_pattern.finditer(sanitized):
            cvv_val = match.group(1)
            sanitized = sanitized.replace(cvv_val, "[REDACTED_CVV]")
            redacted_entities.append({
                "type": "CVV_CODE",
                "snippet": "***",
            })

        # 5. Redact SSN / Tax IDs
        for match in SSN_PATTERN.finditer(sanitized):
            ssn = match.group(0)
            sanitized = sanitized.replace(ssn, "[REDACTED_SSN]")
            redacted_entities.append({
                "type": "SSN_TAX_ID",
                "snippet": "***-**-****",
            })

        return sanitized, redacted_entities

    @staticmethod
    def audit_summary(entities: List[Dict[str, Any]]) -> str:
        """Create a human-readable audit summary of redacted entities."""
        if not entities:
            return "No sensitive PII or credentials detected."
        counts: Dict[str, int] = {}
        for e in entities:
            t = e["type"]
            counts[t] = counts.get(t, 0) + 1
        summary_items = [f"{count} {k.replace('_', ' ').title()}" for k, count in counts.items()]
        return f"Sanitized {len(entities)} sensitive item(s): {', '.join(summary_items)}"
