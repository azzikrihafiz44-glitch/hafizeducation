# Hafiz Education Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Room Integrity**: Only a verified Admin (`jikikuki41@gmail.com` with `email_verified == true` or registered in `/admins/{uid}`) may create, update, list, or delete `/rooms/{roomCode}`. Students may only `get` a specific room by exact `roomCode`.
2. **History Permanence**: Quiz completion records in `/history/{recordId}` are append-only for participants (strictly validated on types, bounds, keys, and `createdAt == request.time`). Only a verified Admin may `list`, `update`, or `delete` history records.
3. **Strict Keys & Anti-Shadow Fields**: Every write enforces `hasAll` and `hasOnly` on document keys; updates require `isValid*()` and `affectedKeys().hasOnly(...)`.
4. **No PII Leaks**: `/admins/{uid}` containing admin email is readable strictly by the owning UID or verified admin — never blanket readable.
5. **Path Hardening**: All single-document operations validate document IDs via `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, `<= 128` chars).

## 2. The "Dirty Dozen" Attack Payloads (All Must Be Denied)
1. Unauthenticated user attempts `create` on `/rooms/HACK1`.
2. Non-admin authenticated user attempts `delete` on `/history/rec-1`.
3. Non-admin attempts `list` on `/history` to scrape all student scores.
4. Attacker sends unverified email spoof (`email == 'jikikuki41@gmail.com'`, `email_verified == false`) to modify `/rooms/HF882A`.
5. Shadow field injection on `/history/rec-2` with extra field `isAdmin: true`.
6. Client-spoofed `createdAt` timestamp (not equal to `request.time`) on `/history/rec-3`.
7. Out-of-bounds `grade: 999` or negative `points: -500` on `/history/rec-4`.
8. Oversized `playerName` (> 60 chars) or `quizTitle` (> 200 chars) Denial-of-Wallet payload.
9. Oversized document ID (`> 128` chars or containing spaces/slashes) on `/history/{badId}`.
10. Attacker attempts to `update` an existing `/history/rec-1` to inflate their score after completion.
11. Non-admin attempts to self-register in `/admins/{theirUid}`.
12. Admin updates `/rooms/HF882A` attempting to mutate immutable `createdAt` or `ownerUid`.
