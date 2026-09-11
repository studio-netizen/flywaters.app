
CREATE OR REPLACE FUNCTION public.admin_system_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  result jsonb;
  db_size bigint;
  tbl record;
  tables jsonb := '[]'::jsonb;
  buckets jsonb := '[]'::jsonb;
  buck record;
  storage_total bigint := 0;
  storage_count bigint := 0;
  files_today bigint := 0;
  files_week bigint := 0;
  files_month bigint := 0;
  week_ago timestamptz := now() - interval '7 days';
  prior_week timestamptz := now() - interval '14 days';
  tname text;
  rcount bigint;
  rcount_week bigint;
  rcount_prior bigint;
  tnames text[] := ARRAY['profiles','posts','spots','reviews','messages','audit_logs','blog_posts','comments','likes','follows','notifications'];
BEGIN
  SELECT pg_database_size(current_database()) INTO db_size;

  FOREACH tname IN ARRAY tnames LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', tname) INTO rcount;
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE created_at >= $1', tname) INTO rcount_week USING week_ago;
      EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE created_at >= $1 AND created_at < $2', tname) INTO rcount_prior USING prior_week, week_ago;
    EXCEPTION WHEN undefined_column THEN
      rcount_week := 0; rcount_prior := 0;
    END;
    tables := tables || jsonb_build_object(
      'name', tname,
      'rows', rcount,
      'size_bytes', pg_total_relation_size(format('public.%I', tname)::regclass),
      'new_week', rcount_week,
      'prev_week', rcount_prior,
      'growth_pct', CASE WHEN rcount_prior > 0 THEN round(((rcount_week - rcount_prior)::numeric / rcount_prior) * 100, 1) ELSE NULL END
    );
  END LOOP;

  FOR buck IN SELECT id FROM storage.buckets LOOP
    SELECT
      COALESCE(SUM((metadata->>'size')::bigint), 0),
      COUNT(*),
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now())),
      COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days'),
      COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')
    INTO storage_total, storage_count, files_today, files_week, files_month
    FROM storage.objects WHERE bucket_id = buck.id;

    buckets := buckets || jsonb_build_object(
      'name', buck.id,
      'size_bytes', storage_total,
      'files', storage_count,
      'files_today', files_today,
      'files_week', files_week,
      'files_month', files_month
    );
  END LOOP;

  SELECT
    COALESCE(SUM((metadata->>'size')::bigint), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now())),
    COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days'),
    COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')
  INTO storage_total, storage_count, files_today, files_week, files_month
  FROM storage.objects;

  result := jsonb_build_object(
    'db_size_bytes', db_size,
    'tables', tables,
    'storage_total_bytes', storage_total,
    'storage_total_files', storage_count,
    'storage_files_today', files_today,
    'storage_files_week', files_week,
    'storage_files_month', files_month,
    'storage_buckets', buckets,
    'generated_at', now()
  );
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_system_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_system_metrics() TO service_role;
