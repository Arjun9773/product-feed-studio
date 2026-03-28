import { useState, useEffect } from "react";
import API from "@/hooks/useApi";

// ============================================================
// Module-level cache
// — Page navigate பண்ணாலும் refetch இல்லை
// — Admin issue update பண்ணா clearAuditFieldsCache() call பண்ணு
// ============================================================
let _cache = null;

export function clearAuditFieldsCache() {
  _cache = null;
}

const EXCLUDE_FIELDS = ['google_category', 'proper_casing'];

export function useAuditFields() {
  const [fields,  setFields]  = useState(_cache ?? []);
  const [loading, setLoading] = useState(!_cache);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (_cache) return; // already loaded — skip fetch

    API.get('/audit/fields')
      .then(res => {
        // _cache = res.data.data ?? [];   // ← .data.data — actual array இங்க இருக்கு
        // setFields(_cache);
        const all = res.data.data ?? [];
        _cache = all.filter(f => !EXCLUDE_FIELDS.includes(f.field)); // ← இங்கே filter
        setFields(_cache);
      })
      .catch(err => {
        console.error('[useAuditFields] fetch error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { fields, loading, error };
}
