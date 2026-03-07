

## Summary

The PDF describes 5 implementation prompts. Prompt 1 (Supabase) is already done. The remaining work falls into 4 categories, plus a new admin panel:

1. **Schema changes** -- Add columns: `user_type`, `referral_code`, `referred_by`, `referrals_count`, `waitlist_position` (some overlap with existing `position`). Remove columns no longer needed: `phone`, `business_type`, `country`, `tier`. Add length constraints on text fields (security fix).
2. **Signup form update** -- Replace business type/country/phone fields with a `user_type` pill-toggle (User / Accountant / Both). Remove tier-based flow. Add `?ref=` param detection.
3. **Infographic conversion** -- Convert ~50% of text-heavy sections (ProblemSection, SolutionSection, WhyNowSection, MissionSection) into visual infographic layouts (icon grids, step flows, stat callouts).
4. **Paystack cards** -- Replace the 3-tier pricing with 2 side-by-side Paystack cards (Priority + Founder Circle with "Recommended" badge) that open payment links in new tabs directly (no modal).
5. **Referral system** -- Auto-generate 8-char referral codes on signup, track `?ref=` param, reward referrers (increment count, decrease position), post-signup referral sharing UI with copy/WhatsApp/X/Telegram buttons, milestone tracker.
6. **Admin panel** -- Protected admin dashboard to view/manage waitlist signups, referral stats, and tier counts.

---

## Detailed Plan

### Phase 1: Database Migration

Run a single migration to reshape `waitlist_signups`:

- **Add columns**: `user_type TEXT NOT NULL DEFAULT 'user'`, `referral_code TEXT UNIQUE`, `referred_by TEXT`, `referrals_count INTEGER DEFAULT 0`
- **Rename** `position` to `waitlist_position` (or add `waitlist_position` and drop `position`)
- **Drop columns**: `phone`, `business_type`, `country`, `tier`
- **Add length constraints** via CHECK on `full_name` (<=200), `email` (<=255), `referral_code` (=8), `referred_by` (<=8), UTM fields (<=200)
- **Update trigger** `handle_waitlist_signup` to: generate 8-char referral code, assign waitlist_position, process referral rewards (find referrer by code, increment their `referrals_count`, decrement their `waitlist_position` with min=1)
- **Update RLS**: Restrict anon INSERT, allow anon SELECT of own row by email for post-signup referral display
- Drop `tier_counts` table (no longer needed with the new 2-card Paystack approach)

### Phase 2: Signup Form Overhaul (SignupModal.tsx)

- Remove phone, businessType, country fields
- Add `userType` state with pill-toggle UI (User / Accountant / Both) -- styled segmented buttons
- Capture `?ref=` from URL and include in insert as `referred_by`
- On success: show referral section (personal link, share buttons, milestone tracker) instead of tier-based redirect
- Remove tier prop entirely -- single waitlist form

### Phase 3: Infographic Conversion

Convert these sections to visual layouts while preserving exact messaging:
- **ProblemSection**: Keep icon cards (already visual), but convert the dense paragraph into a visual flow or stat callout
- **SolutionSection**: Convert the auto-actions list into a horizontal step flow diagram
- **WhyNowSection**: Convert to stat callout blocks with large icons
- **MissionSection**: Convert to a milestone/roadmap visual with the three key statements

### Phase 4: Paystack Tier Cards (WaitlistTiersSection.tsx)

- Replace 3-card grid with 2 side-by-side cards
- Card 1: "GegoBooks Priority Waitlist" -- links to `https://paystack.com/pay/gegobooks-priority` (new tab)
- Card 2: "GegoBooks Founder Circle" with "Recommended" badge -- links to `https://paystack.com/pay/gegobooks-founder` (new tab)
- Remove modal-opening behavior from these cards; buttons open Paystack directly via `target="_blank"`

### Phase 5: Referral System

- **useUtmParams.ts**: Extend to also capture `ref` param
- **SignupModal.tsx**: After successful signup, display referral section:
  - Personal referral link: `https://gegobooks.lovable.app?ref=[CODE]`
  - Copy Link button with "Copied!" feedback
  - Share on WhatsApp, Twitter/X, Telegram buttons with pre-filled messages
  - Referral count display
  - Milestone tracker (3 referrals = 10 spots up, 10 = priority, 25 = free 3 months, 50 = founder badge) with locked/unlocked visual states

### Phase 6: Admin Panel

- **New route**: `/admin` with simple password-gate (or Supabase auth)
- **Dashboard page** with:
  - Total signups count, signups by user_type breakdown
  - Sortable/filterable table of all waitlist entries (name, email, user_type, referral_code, referrals_count, waitlist_position, created_at)
  - Export to CSV functionality
  - Referral leaderboard (top referrers)
- **Database**: Create `admin_users` table or use a simple edge function with service role key for auth
- **RLS**: Add policy for authenticated admin access to read all waitlist_signups

### Security Fixes (addressed inline)

- Remove `WITH CHECK (true)` INSERT policy; replace with constrained policy
- Add input length CHECK constraints in migration
- Add tier validation in trigger function
- Server-side referral code validation

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/[new].sql` | New migration for schema changes |
| `src/components/SignupModal.tsx` | Complete rewrite with new form + referral UI |
| `src/hooks/useUtmParams.ts` | Add `ref` param capture |
| `src/pages/Index.tsx` | Remove tier counts, simplify modal props |
| `src/components/WaitlistTiersSection.tsx` | 2-card Paystack layout |
| `src/components/ProblemSection.tsx` | Infographic conversion |
| `src/components/SolutionSection.tsx` | Infographic conversion |
| `src/components/WhyNowSection.tsx` | Infographic conversion |
| `src/components/MissionSection.tsx` | Infographic conversion |
| `src/components/HeroSection.tsx` | Update CTA buttons |
| `src/components/FinalCTASection.tsx` | Update CTA buttons |
| `src/pages/Admin.tsx` | New admin dashboard page |
| `src/components/AdminLogin.tsx` | New admin auth gate |
| `src/App.tsx` | Add `/admin` route |

