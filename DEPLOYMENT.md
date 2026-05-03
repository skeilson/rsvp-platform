# Deployment Guide

## Architecture

### Rate Limiting

This application uses **in-memory rate limiting**. This is intentional for the typical use case (single event deployment).

**Rate limiting is applied to:**
- Admin login: 5 attempts per 15 minutes per IP
- RSVP access (password): 5 attempts per 15 minutes per IP
- RSVP access (token): 5 attempts per 15 minutes per IP
- Metrics endpoint: 5 attempts per 15 minutes per IP

**Rate limiting counters are stored in the application process memory.** This means:

✅ **Single replica deployments (recommended):**
- Rate limiting works perfectly
- No external dependencies
- Lower cost
- Suitable for typical event use case (50-500 guests)

❌ **Multiple replica deployments (not supported):**
- Each replica maintains separate counters
- Attackers can make 5 attempts per replica (5 × number of replicas)
- Rate limiting becomes ineffective

### Deployment Model (Recommended)

Each event should have its own dedicated deployment:

## Metrics Endpoint Security

### Setup

1. Generate a strong 32-character hex token:
   `bash openssl rand -hex 32`

## RSVP Access Control

### Overview

The RSVP platform supports three access modes controlled by the `RSVP_ACCESS_TYPE` environment variable:

| Mode | Description | Use Case |
|------|---|---|
| `none` | Public access, no authentication | Internal events or when URL is tightly controlled |
| `password` | Password-gated access | Share password via email or website |
| `token` | Token-gated access | Embed token in URL sent to guests |

### Implementation

- **Access enforcement:** Server-side session validation on all guest-facing API routes (`/api/rsvp/*`)
- **Session storage:** HttpOnly, Secure, SameSite=Strict cookies (7-day expiration)
- **Session validation:** Timing-safe HMAC comparison to prevent timing attacks
- **Rate limiting:** Login and token endpoints limited to 5 attempts per 15 minutes per IP

### Security Model

**Password Mode:**
1. Guest visits `/rsvp` and enters password
2. `/api/rsvp/login` validates password (rate-limited: 5 attempts/15 min)
3. `rsvp_session` cookie set (valid for 7 days)
4. Guest can now access `/api/rsvp/lookup` and other endpoints

**Token Mode:**
1. Guest receives invite with token in URL: `https://yourapp.com/rsvp?token=abc123...`
2. Clicking link calls `/api/rsvp/token` with token (rate-limited: 5 attempts/15 min)
3. `rsvp_session` cookie set (valid for 7 days)
4. Guest can now access `/api/rsvp/lookup` and other endpoints

**None Mode:**
1. Guest visits `/rsvp` without requiring password or token
2. Guest proceeds directly to name lookup
3. No session cookie required

### Guest Lookup Endpoint

The `/api/rsvp/lookup` endpoint searches for guests by first and last name:

**Authentication:** Requires `rsvp_session` cookie (when `RSVP_ACCESS_TYPE` != "none")

**Rate Limiting:** No per-endpoint rate limiting on lookups. Guests can attempt multiple name variations without throttling.

**Behavior:** Case-insensitive search using PostgreSQL `ILIKE`. If guest found:
- Returns solo form for individual guests
- Returns group form if guest belongs to a group
- Returns "already responded" page if guest has responded and `allowChanges` is false
- Returns 404 if guest not found

**Enumeration Risk:** In `none` access mode, attacker can enumerate guest list:
```bash
# Enumerate all guests starting with "A"
for lastName in $(cat last-names.txt); do
  curl -X POST https://yourapp.com/api/rsvp/lookup \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"A\",\"lastName\":\"$lastName\"}"
done


