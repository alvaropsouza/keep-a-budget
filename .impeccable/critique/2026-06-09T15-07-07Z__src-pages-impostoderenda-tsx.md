---
target: src/pages/ImpostoDeRenda.tsx mobile UX
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-06-09T15-07-07Z
slug: src-pages-impostoderenda-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Export button appears enabled when receipts are missing; only fails at tap time via toast |
| 2 | Match System / Real World | 3 | "IR" text button — users can't discover meaning on touch |
| 3 | User Control and Freedom | 2 | Remove-from-IR fires immediately with no confirmation and no undo |
| 4 | Consistency and Standards | 3 | Uppercase tracked section headers violate project absolute ban |
| 5 | Error Prevention | 2 | No confirm guard on remove-from-IR; export blocked state communicated late |
| 6 | Recognition Rather Than Recall | 2 | Ghost icon buttons have no visible labels; "IR" text button meaning opaque |
| 7 | Flexibility and Efficiency | 1 | No swipe actions, no keyboard shortcuts, single tap-path for everything |
| 8 | Aesthetic and Minimalist Design | 3 | Clean surface vocabulary; uppercase eyebrow headers |
| 9 | Error Recovery | 2 | Toasts with raw backend messages; no inline recovery |
| 10 | Help and Documentation | 1 | Minimal empty-state guidance; no explanation of ZIP export |
| **Total** | | **22/40** | **Acceptable — significant mobile improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Solid aesthetic overall. Failure is functional not visual: page designed desktop-first. Uppercase section headers are the one visual tell.

**Deterministic scan**: Clean — []. No automated hits.

## Overall Impression

The page works. Data model is right. But on 375px, every row's right side is an ergonomic failure: amount + three 32×32px ghost buttons packed into ~160px, where two of three have no visible label. Needs rebuilding around the primary mobile action.

## What's Working

1. Skeleton states match real row shape precisely. No layout shift.
2. IrSummaryCard with amber border + AlertCircle gives instant category status.
3. Dual-section architecture reflects actual mental model correctly.

## Priority Issues

**[P1] Touch targets 32×32px — below minimum**
All action buttons in rows are h-8 w-8 (32px). WCAG 2.5.5 and PRODUCT.md require ≥44px. Receipt and remove-from-IR buttons are 8px apart.
Fix: h-11 w-11 for all row action buttons.

**[P1] "IR" remove button: invisible danger**
Ghost button with 10px text "IR". No icon. Fires immediately on tap, no confirmation. Removes deductible expense from IR export silently.
Fix: Replace with icon (BookmarkX), add confirm dialog or undo-toast, add aria-label.

**[P1] Export button falsely enabled when it cannot export**
Button enabled when missing receipts. Tap → toast error. User has to discover block reactively.
Fix: Disable when totalMissingReceipts > 0, or show count inline in button.

**[P2] Row right-side collapses on narrow phones**
Three 32px buttons + amount ~155px of trailing content on 343px content width. Text column gets ~140px — description and date truncated.
Fix: Move actions to swipe-to-reveal or bottom sheet on row tap.

**[P2] Uppercase section headers — absolute ban**
Both section headers use uppercase tracking-wide. Exact "tiny tracked eyebrow" pattern from bans.
Fix: Title-case with weight-contrast, or remove explicit labels.

## Persona Red Flags

**Casey (Mobile)**: Export failure requires re-scrolling to find missing item. Receipt attachment requires tapping 32px amber icon indistinguishable from green by color-blind users.

**Riley (Stress tester)**: Export CTA buried between content sections. No undo for remove-from-IR. No sorting/filtering for 15+ row datasets.

## Minor Observations

- text-[11px] dates too small, use text-xs minimum
- IrSummaryCard amber border redundant — AlertCircle already signals warning
- Empty state for card expenses has no link to the expenses screen where user can mark items
- aria-label missing on icon-only buttons (title only works on desktop hover)
