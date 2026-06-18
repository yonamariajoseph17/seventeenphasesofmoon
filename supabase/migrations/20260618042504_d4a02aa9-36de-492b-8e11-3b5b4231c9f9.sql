-- 1. Prevent enumeration: deny direct table reads. Letters are retrieved only
--    via a security-definer lookup keyed on the exact (unguessable) id.
DROP POLICY IF EXISTS "Anyone can read a moon letter by id" ON public.moon_letters;

CREATE POLICY "No direct reads on moon letters"
  ON public.moon_letters FOR SELECT
  USING (false);

-- 2. Lookup-by-exact-id function. Requires the full random id; cannot list rows.
CREATE OR REPLACE FUNCTION public.get_moon_letter(letter_id text)
RETURNS TABLE (payload jsonb, snapshot jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.payload, m.snapshot
  FROM public.moon_letters m
  WHERE m.id = letter_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_moon_letter(text) TO anon, authenticated;

-- 3. Server-side size limits to prevent storage abuse / oversized blobs.
ALTER TABLE public.moon_letters
  ADD CONSTRAINT moon_letters_payload_size CHECK (pg_column_size(payload) <= 65536),
  ADD CONSTRAINT moon_letters_snapshot_size CHECK (pg_column_size(snapshot) <= 262144);

-- 4. Tighten the INSERT policy with field-length limits (mirrors the app's rules).
DROP POLICY IF EXISTS "Anyone can create a moon letter" ON public.moon_letters;

CREATE POLICY "Anyone can create a moon letter"
  ON public.moon_letters FOR INSERT
  WITH CHECK (
    char_length(id) >= 4 AND char_length(id) <= 32
    AND id ~ '^[a-zA-Z0-9]+$'
    AND char_length(COALESCE(payload->>'name', '')) <= 60
    AND char_length(COALESCE(payload->>'city', '')) <= 80
    AND char_length(COALESCE(payload->>'to', '')) <= 60
    AND char_length(COALESCE(payload->>'from', '')) <= 60
    AND char_length(COALESCE(payload->>'msg', '')) <= 1000
  );