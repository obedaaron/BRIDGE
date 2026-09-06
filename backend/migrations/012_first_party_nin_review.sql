-- First-party NIN review: BRIDGE stores only private evidence references, never a
-- full NIN value or a biometric template. A human reviewer must make the decision.
alter table vendor_verifications add column if not exists review_note text;
alter table vendor_verifications add column if not exists review_checklist jsonb;
