CREATE TABLE public.moon_letters (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  snapshot jsonb NOT NULL
);

GRANT SELECT, INSERT ON public.moon_letters TO anon;
GRANT SELECT, INSERT ON public.moon_letters TO authenticated;
GRANT ALL ON public.moon_letters TO service_role;

ALTER TABLE public.moon_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read a moon letter by id"
  ON public.moon_letters FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create a moon letter"
  ON public.moon_letters FOR INSERT
  WITH CHECK (
    char_length(id) BETWEEN 4 AND 32
    AND id ~ '^[a-zA-Z0-9]+$'
  );