# Backend Brief — 21-Day Free Trial License (QR + TV)

## Goal
Give every new customer a **21-day free trial** made of a **QR Menu** license and a **TV Menu**
license, so they can use the product immediately without payment.

## Trigger (confirmed)
Grant the trial **when the account creates its FIRST restaurant**. Licenses are per-restaurant
and a fresh account has no restaurant until one is added in the panel ("Restoran Ekle"), so the
restaurant-create handler is the natural place.

In the restaurant-create flow:
- If this is the account's **first** restaurant **AND** the account has **not already consumed
  its trial** → create the trial licenses on the new restaurant.

## What to grant
- Two license records on the new restaurant:
  - type **`QRLicensePackage`**
  - type **`TVLicensePackage`**
- Duration: **21 days** → `startDate = utcNow`, `endDate = utcNow + 21 days`.
- Status: **active** immediately.
- **Kiosk is NOT included.**
- Make the duration (`21`) and the trial package set **configurable constants** so marketing can
  tweak them without a deploy.

These must be the **same license records** the rest of the system already reads — so they appear
on the restaurant card (each with its own "Bitiş Tarihi" + active badge) and gate QR/TV features
exactly like a paid license, with **no special-casing on the client**.

## One-time per account (anti-abuse) — important
Persist a flag at the **account/user** level, e.g. `trialGranted: bool` (or `trialGrantedAt`).
- Set it when the trial is granted.
- Never grant again — even if the user deletes that restaurant and creates a new one, or creates
  additional restaurants. The trial is **per account**, not per restaurant.

## Interaction with paid licenses
- Grant only on first-restaurant creation when no QR/TV license exists yet for it.
- Later purchases/extensions go through the existing AddLicense / Extend flow and supersede or
  extend as usual. The one-time account flag prevents any later re-grant from shortening a paid
  license.

## Idempotency
Guard against double-grant on retries / rapid double create calls using the account-level flag
inside the same transaction as restaurant creation.

## Visibility / Frontend
No FE change is required for provisioning: `Restaurants/GetmyRestaurants` already returns the
per-type license end dates and the restaurant card renders them, so the trial dates show up
automatically once the backend writes them.

**Optional:** add an `isTrial: true` (or `source: "trial"`) marker on the trial license records
if you want the panel to show a small "Deneme" (Trial) badge — say the word and we'll add it
client-side.

## Summary of changes
- Restaurant-create handler: detect first restaurant + un-consumed trial → create QR + TV license
  records (21 days, active) and set `trialGranted`.
- Account/user model: add `trialGranted` (or `trialGrantedAt`).
- Config: trial length (`21` days) + trial package set (`QRLicensePackage`, `TVLicensePackage`).
