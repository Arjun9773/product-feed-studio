import { motion } from "framer-motion";
import { Save, Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import API from "@/hooks/useApi";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function ManageFeedSetup() {
  const { currentStoreId, canEdit } = useAuth();  // ← canEdit from AuthContext

  const [feedName,     setFeedName]     = useState("");
  const [cmsUpload,    setCmsUpload]    = useState("none");
  const [feedFormat,   setFeedFormat]   = useState("Json");
  const [importUrl,    setImportUrl]    = useState("");
  const [schedule,     setSchedule]     = useState("Daily");
  const [scheduleTime, setScheduleTime] = useState("06:00");

  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [hasExisting, setHasExisting] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors,  setErrors]  = useState({});

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (field, value) => {
    switch (field) {
      case 'feedName':
        if (!value.trim()) return 'Feed name is required';
        if (value.trim().length < 2) return 'Minimum 2 characters';
        return '';
      case 'importUrl':
        if (!value.trim()) return 'Feed URL is required';
        try { new URL(value.trim()); return ''; }
        catch { return 'Enter a valid URL (e.g. https://...)'; }
      case 'scheduleTime':
        if (!value) return 'Import time is required';
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const fields = { feedName, importUrl, scheduleTime };
    const newErrors = {};
    Object.entries(fields).forEach(([k, v]) => { newErrors[k] = validate(k, v); });
    setErrors(newErrors);
    setTouched({ feedName: true, importUrl: true, scheduleTime: true });
    return !Object.values(newErrors).some(Boolean);
  };

  const handleBlur = (field, value) => {
    if (!canEdit) return;  // ← ignore blur events for read-only users
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
  };

  const handleChange = (field, value) => {
    if (!canEdit) return;  // ← block all changes for read-only users
    const setters = { feedName: setFeedName, importUrl: setImportUrl, scheduleTime: setScheduleTime };
    if (setters[field]) setters[field](value);
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  // ── Input border class ───────────────────────────────────────────────────────
  const inputClass = (field) => {
    const base = canEdit ? '' : 'cursor-not-allowed opacity-70';
    if (!touched[field]) return `bg-secondary border-0 ${base}`;
    if (errors[field])   return `border-red-400 focus-visible:ring-red-300 bg-red-50 dark:bg-red-900/10 ${base}`;
    return `border-green-400 focus-visible:ring-green-300 bg-green-50 dark:bg-green-900/10 ${base}`;
  };

  // ── Load existing config ─────────────────────────────────────────────────────
  useEffect(() => {
    setFetching(true);
    const loadFeed = async () => {
      try {
        const res  = await API.get("/feeds");
        const feed = res.data;
        if (feed && feed.feed_url) {
          setFeedName(feed.feed_name        || "");
          setCmsUpload(feed.cms_upload_type || "none");
          setFeedFormat(feed.feed_type      || "Json");
          setImportUrl(feed.feed_url        || "");
          setSchedule(feed.schedule_info    || "Daily");
          setScheduleTime(feed.import_time  || "06:00");
          setHasExisting(true);
        }
      } catch (error) {
        console.error("Failed to load feed config:", error);
      } finally {
        setFetching(false);
      }
    };
    loadFeed();
  }, [currentStoreId]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canEdit) return;  // ← extra safety — should never reach here for store_admin
    if (!validateAll()) {
      toast.error("Please fix the errors before saving");
      return;
    }
    setLoading(true);
    try {
      await API.put("/feeds", { feedName, cmsUpload, feedFormat, importUrl, schedule, scheduleTime });
      setHasExisting(true);
      toast.success(hasExisting ? "Feed configuration updated!" : "Feed configuration saved!");
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="space-y-6 max-w-7xl px-4 sm:px-0">
        <div className="h-8 w-56 bg-secondary rounded animate-pulse" />
        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 items-center">
              <div className="h-4 bg-secondary rounded animate-pulse" />
              <div className="col-span-2 h-10 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl px-4 sm:px-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Manage Feed Setup
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Please set the format, text encoding and upload product feed file for us to process.
          </p>
        </div>
        {/* Read-only badge for store_admin */}
        {!canEdit && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
            <Lock className="w-3 h-3" />
            Read only
          </div>
        )}
      </div>

      {/* Read-only info banner for store_admin */}
      {!canEdit && (
        <div className="text-sm text-muted-foreground bg-secondary border border-border rounded-lg px-4 py-3 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          This configuration is managed by your administrator. Contact your admin to make changes.
        </div>
      )}

      {/* Form card */}
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow border border-border space-y-6">

        {/* Feed Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-foreground">
            Feed Name {canEdit && <span className="text-red-500">*</span>}
          </label>
          <div className="sm:col-span-2 sm:max-w-[350px] space-y-1">
            <Input
              value={feedName}
              onChange={(e) => handleChange('feedName', e.target.value)}
              onBlur={(e)  => handleBlur('feedName', e.target.value)}
              placeholder="Enter feed name"
              disabled={!canEdit}
              className={`w-full font-semibold text-primary ${inputClass('feedName')}`}
            />
            {touched.feedName && errors.feedName && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span>✕</span>{errors.feedName}
              </p>
            )}
            {touched.feedName && !errors.feedName && feedName && canEdit && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span> Looks good!
              </p>
            )}
          </div>
        </div>

        {/* CMS Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-foreground">
            Upload CMS products via?
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-4">
            {["none", "shopify", "wordpress"].map((option) => {
              const isDisabled = !canEdit || option === "shopify" || option === "wordpress";
              return (
                <label
                  key={option}
                  className={`flex items-center gap-2 ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="cmsUpload"
                    value={option}
                    checked={cmsUpload === option}
                    onChange={(e) => canEdit && setCmsUpload(e.target.value)}
                    disabled={isDisabled}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-foreground capitalize">
                    {option === "none" ? "None" : option}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Feed Format */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-foreground">Feed Format:</label>
          <div className="sm:col-span-2">
            <select
              value={feedFormat}
              onChange={(e) => canEdit && setFeedFormat(e.target.value)}
              disabled={!canEdit}
              className={`w-full sm:max-w-[200px] rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <option>Json</option>
              <option>Shopify</option>
            </select>
          </div>
        </div>

        {/* URL for import */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-foreground">
            URL for import {canEdit && <span className="text-red-500">*</span>}
          </label>
          <div className="sm:col-span-2 space-y-1">
            <Input
              value={importUrl}
              onChange={(e) => handleChange('importUrl', e.target.value)}
              onBlur={(e)  => handleBlur('importUrl', e.target.value)}
              placeholder="https://your-feed-url.com/products.json"
              disabled={!canEdit}
              className={`font-mono text-[11px] sm:text-xs w-full ${inputClass('importUrl')}`}
            />
            {touched.importUrl && errors.importUrl && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span>✕</span>{errors.importUrl}
              </p>
            )}
            {touched.importUrl && !errors.importUrl && importUrl && canEdit && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span> Valid URL
              </p>
            )}
          </div>
        </div>

        {/* Import Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-foreground">
            Import schedule {canEdit && <span className="text-red-500">*</span>}
          </label>
          <div className="sm:col-span-2 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={schedule}
                onChange={(e) => canEdit && setSchedule(e.target.value)}
                disabled={!canEdit}
                className={`flex-1 sm:flex-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground min-w-[120px] ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <option>Daily</option>
                <option>Hourly</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
              <span className="text-sm text-muted-foreground">At:</span>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => handleChange('scheduleTime', e.target.value)}
                onBlur={(e)  => handleBlur('scheduleTime', e.target.value)}
                disabled={!canEdit}
                className={`w-full sm:w-32 ${inputClass('scheduleTime')}`}
              />
            </div>
            {touched.scheduleTime && errors.scheduleTime && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span>✕</span>{errors.scheduleTime}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Save/Edit button — only visible to super_admin */}
      {canEdit && (
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full sm:w-auto bg-primary text-primary-foreground gap-2 h-11 sm:h-10"
        >
          {hasExisting ? <Pencil className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {loading ? "Saving..." : hasExisting ? "Edit Configuration" : "Save Configuration"}
        </Button>
      )}
    </motion.div>
  );
}
