# Backend Brief — Active Sessions: one session per device (dedup by deviceId)

## Problem
"Active Sessions" (Profile) lists a separate entry for **every login** instead of per
device. A user on 3 real devices ends up with ~10 entries by end of day. Cause: `Auth/login`
inserts a **new session row on every call**, and there was no stable client identifier to
recognise the same device logging in again (the FE only sent `deviceType: "web"`).

## What the frontend now sends (already shipped)
`POST /api/Auth/login` body now includes two new fields:
```json
{
  "emailOrPhone": "...",
  "password": "...",
  "pushToken": "...",
  "deviceType": "web",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Chrome · Windows"
}
```
- `deviceId` — a **stable** UUID generated once per browser and persisted in localStorage
  (survives logout, sent on every login from that browser). Same browser ⇒ same `deviceId`.
- `deviceName` — human-readable label (browser · OS) for display.

## Required backend change — upsert session by (userId, deviceId)
On `Auth/login`, instead of always inserting:
1. Look up an existing **active** session for `(userId, deviceId)`.
2. If found → **update it in place**: rotate/refresh token, update `lastSeenAt`, IP/location,
   `pushToken`, `deviceName`, `deviceType`. Reuse the same `userSessionId`.
3. If not found → insert a new session carrying `deviceId` + `deviceName`.

Result: repeated logins from the same browser keep **one** session row; 3 devices ⇒ 3 sessions.

> If `deviceId` is missing (old clients), fall back to the current behaviour so nothing breaks.

## GetMyUserSessions
Return `deviceId` and `deviceName` on each session DTO (alongside existing
`userSessionId, deviceType, city, country, lastSeenAt, isCurrent`). Mark `isCurrent: true`
for the session whose `deviceId` matches the caller's (or whose `userSessionId` matches the
caller's token). The FE already prefers `deviceName` for the label and `isCurrent` for the
"this device" badge.

## One-time cleanup (recommended)
Existing pre-`deviceId` duplicate rows won't have a `deviceId`. Optionally prune them: keep the
most recent session per (userId, deviceType+IP) or per (userId, null deviceId) and delete the
rest, and/or expire sessions with no activity for N days. Going forward, the upsert keeps the
list clean.

## Acceptance criteria
1. Logging in repeatedly from the same browser does **not** add new rows — `lastSeenAt` updates
   on the single existing row for that `deviceId`.
2. Three distinct devices ⇒ exactly three sessions, regardless of how many times each logs in.
3. `GetMyUserSessions` returns `deviceId` + `deviceName`; the caller's own device is `isCurrent`.
4. Missing `deviceId` (legacy client) still logs in (insert path), no errors.

## Security note
`deviceId` is a non-PII random identifier for session management only. Don't trust it for auth
decisions — it just groups sessions; the token remains the auth credential.
