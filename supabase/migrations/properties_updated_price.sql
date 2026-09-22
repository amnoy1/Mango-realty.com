-- Run this in Supabase SQL Editor
--
-- Manually-maintained "the price actually changed" field. Amir already
-- republishes a new marketing price everywhere the moment it's approved
-- (listing boards, brokers, the site) — there is no automated price history
-- here on purpose, this is just one more place he sets the same number.
--
-- When NULL: nothing changed, `price` is the current price everywhere
-- (website, nir-buyers-agent).
-- When set: this IS the current price, and both the public property page
-- and Nir use it in place of `price`. Nir states it plainly if asked whether
-- the price changed ("המחיר השיווק המעודכן הינו: X ₪") and nothing more —
-- see nir-buyers-agent's system prompt.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS updated_price BIGINT;
