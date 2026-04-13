import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, RefreshCw, Edit, Trash2, FileOutput, Package,
  Globe, AlertCircle, X, Copy, Check, Loader2, ExternalLink,
  ShieldCheck, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TEXT_QUALIFIERS = [
  { label: "None",   value: "none"   },
  { label: "Single", value: "single" },
  { label: "Double", value: "double" },
];

const CURRENCIES = ["INR", "USD", "GBP", "EUR", "AED"];

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status, is_output_setup }) {
  if (!is_output_setup) {
    return (
      <Badge className="bg-warning/10 text-warning border-0 font-medium">
        Not yet built
      </Badge>
    );
  }
  if (status === "building") {
    return (
      <Badge className="bg-info/10 text-info border-0 font-medium flex items-center gap-1 w-fit">
        <Loader2 size={11} className="animate-spin" /> Building...
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge className="bg-destructive/10 text-destructive border-0 font-medium">
        Failed
      </Badge>
    );
  }
  return (
    <Badge className="bg-success/10 text-success border-0 font-medium">
      Active
    </Badge>
  );
}

// ── Copy Button ────────────────────────────────────────────────
function CopyButton({ url }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border bg-secondary hover:bg-accent transition-colors cursor-pointer"
      title="Copy URL"
    >
      {copied ? (
        <>
          <Check size={12} className="text-success" /> Copied!
        </>
      ) : (
        <>
          <Copy size={12} /> Copy URL
        </>
      )}
    </button>
  );
}

// ── 2-Step Feed Modal ──────────────────────────────────────────
function FeedModal({ onClose, onSaved, editFeed }) {
  const { user, currentStoreId } = useAuth();
  const token = user?.token || localStorage.getItem("token");

  const [step, setStep]               = useState(editFeed?.is_output_setup ? 2 : 1);
  const [formats, setFormats]         = useState([]);
  const [loadingFmts, setLoadingFmts] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [building, setBuilding]       = useState(false);
  const [savedFeed, setSavedFeed]     = useState(editFeed || null);
  const [publicUrl, setPublicUrl]     = useState(editFeed?.output_public_url || "");
  const [error, setError]             = useState("");

  const [form, setForm] = useState({
    output_format_id:        editFeed?.output_format_id        ?? "",
    output_feed_name:        editFeed?.output_feed_name        ?? "",
    is_header:               editFeed?.is_header               ?? "1",
    op_text_qualifier:       editFeed?.op_text_qualifier       ?? "none",
    format_subtype_currency: editFeed?.format_subtype_currency ?? "INR",
  });

  const headers = {
    Authorization:  `Bearer ${token}`,
    "x-tenant-id":  currentStoreId,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/output-feeds/formats`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setFormats(d.data);
          if (!editFeed && d.data.length > 0) {
            setForm(prev => ({
              ...prev,
              output_format_id: d.data[0].feed_id,
              output_feed_name: d.data[0].feed_name,
            }));
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingFmts(false));
  }, []);

  const selectedFmt = formats.find(f => f.feed_id === Number(form.output_format_id));
  const isCSV       = selectedFmt?.feed_format === "csv";

  function handleFormatChange(feedId) {
    const fmt = formats.find(f => f.feed_id === Number(feedId));
    if (!fmt) return;
    setForm(prev => ({
      ...prev,
      output_format_id: fmt.feed_id,
      output_feed_name: fmt.feed_name,
    }));
  }

  async function handleSaveAndContinue() {
    if (!form.output_feed_name.trim()) { setError("Feed name is required"); return; }
    if (!form.output_format_id)        { setError("Please select a format"); return; }
    setSaving(true);
    setError("");
    try {
      const url    = editFeed
        ? `${API_BASE}/api/output-feeds/${editFeed._id}`
        : `${API_BASE}/api/output-feeds`;
      const method = editFeed ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!data.success) throw new Error(data.message);
      setSavedFeed(data.data);
      setPublicUrl(data.data.output_public_url || "");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleBuild() {
    if (!savedFeed) return;
    setBuilding(true);
    setError("");
    try {
      const res  = await fetch(
        `${API_BASE}/api/output-feeds/${savedFeed._id}/build`,
        { method: "POST", headers }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSavedFeed(data.data);
      setPublicUrl(data.publicUrl || data.data.output_public_url || "");
      onSaved(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuilding(false);
    }
  }

  const previewFilename = savedFeed?.output_filename
    || `${currentStoreId}_${selectedFmt?.feed_folder || "gb"}_${selectedFmt?.feed_format || "xml"}_output.${selectedFmt?.feed_format || "xml"}`;
  const previewUrl = savedFeed?.output_fileurl
    || `../uploads/output_feeds/${selectedFmt?.feed_folder || "gb"}/${currentStoreId}/.../${previewFilename}`;
  const ext = selectedFmt?.feed_format || "xml";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h2 className="text-base font-semibold text-foreground">New Feed Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent p-1 rounded-md hover:bg-secondary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Section 1: Feed Settings */}
        <div>
          <div className="px-6 py-3 bg-secondary/80 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Feed Settings</p>
          </div>

          {step === 1 ? (
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Give your feed a name and tell us what type of output channel you require.
              </p>

              {/* Feed format */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-foreground w-36 shrink-0">
                  Feed format :
                </label>
                {loadingFmts ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 size={13} className="animate-spin" /> Loading formats...
                  </div>
                ) : (
                  <select
                    value={form.output_format_id}
                    onChange={e => handleFormatChange(e.target.value)}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-secondary text-foreground outline-none focus:border-ring cursor-pointer"
                  >
                    {formats.map(f => (
                      <option key={f.feed_id} value={f.feed_id}>
                        {f.feed_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Feed name */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-foreground w-36 shrink-0">
                  Feed name :
                </label>
                <input
                  type="text"
                  value={form.output_feed_name}
                  onChange={e => setForm(prev => ({ ...prev, output_feed_name: e.target.value }))}
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-secondary text-foreground outline-none focus:border-ring"
                />
              </div>

              {/* Column header — CSV only */}
              {isCSV && (
                <div className="flex items-center gap-4">
                  <label className="text-sm text-foreground w-36 shrink-0">
                    Column header :
                  </label>
                  <select
                    value={form.is_header === "1" ? "Yes" : "No"}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        is_header: e.target.value === "Yes" ? "1" : "0",
                      }))
                    }
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-secondary text-foreground outline-none focus:border-ring cursor-pointer"
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              )}

              {/* Text qualifier — CSV only */}
              {isCSV && (
                <div className="flex items-center gap-4">
                  <label className="text-sm text-foreground w-36 shrink-0">
                    Text qualifier :
                  </label>
                  <select
                    value={form.op_text_qualifier}
                    onChange={e =>
                      setForm(prev => ({ ...prev, op_text_qualifier: e.target.value }))
                    }
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-secondary text-foreground outline-none focus:border-ring cursor-pointer"
                  >
                    {TEXT_QUALIFIERS.map(q => (
                      <option key={q.value} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Currency */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-foreground w-36 shrink-0">
                  Currency :
                </label>
                <select
                  value={form.format_subtype_currency}
                  onChange={e =>
                    setForm(prev => ({ ...prev, format_subtype_currency: e.target.value }))
                  }
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-secondary text-foreground outline-none focus:border-ring cursor-pointer"
                >
                  {CURRENCIES.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  {error}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveAndContinue}
                  disabled={saving || loadingFmts}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-info text-white text-sm font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-3 flex items-center gap-2 text-xs text-success">
              <Check size={14} className="shrink-0" />
              Feed settings saved —
              <span className="font-medium">{savedFeed?.output_feed_name}</span>
              <span className="font-mono text-muted-foreground uppercase text-[10px]">
                ({ext})
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Hosting */}
        <div className="border-t border-border">
          <div className="px-6 py-3 bg-secondary/80 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Hosting</p>
          </div>

          {step === 2 ? (
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Finally, choose how we should host your feed.
              </p>

              {/* Feed filename */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-foreground w-36 shrink-0">
                  Feed filename:
                </label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={previewFilename.replace(`.${ext}`, "")}
                    readOnly
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-secondary/40 text-foreground outline-none cursor-default"
                  />
                  <span className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-2 bg-secondary whitespace-nowrap">
                    .{ext}
                  </span>
                </div>
              </div>

              {/* Feed URL */}
              <div className="flex items-start gap-4">
                <label className="text-sm text-foreground w-36 shrink-0 pt-2">
                  Feed URL:
                </label>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={publicUrl || previewUrl}
                    readOnly
                    className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-secondary/40 text-foreground outline-none font-mono cursor-default"
                  />
                  {publicUrl && (
                    <div className="flex items-center gap-2">
                      <CopyButton url={publicUrl} />
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border bg-secondary hover:bg-accent transition-colors text-foreground"
                      >
                        <ExternalLink size={12} />
                        Open
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  {error}
                </p>
              )}

              {savedFeed?.is_output_setup === 1 && publicUrl && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30 text-xs text-success">
                  <Check size={13} />
                  Feed built! {savedFeed?.products_total} products included.
                </div>
              )}

              {savedFeed?.is_output_setup !== 1 && (
                <div className="flex justify-start">
                  <button
                    onClick={handleBuild}
                    disabled={building}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-info text-white text-sm font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-60 transition-all"
                  >
                    {building && <Loader2 size={14} className="animate-spin" />}
                    {building ? "Building feed..." : "Save feed"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Complete Feed Settings above to configure hosting.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-border bg-card">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium cursor-pointer border-none hover:opacity-90 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function OutputFeed() {
  const { user, currentStoreId, isSuperAdmin, activeShopName } = useAuth();
  const token = user?.token || localStorage.getItem("token");

  const [feeds, setFeeds]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [editFeed, setEditFeed]       = useState(null);
  const [refreshing, setRefreshing]   = useState({});
  const [deleting, setDeleting]       = useState({});
  const [downloading, setDownloading] = useState({});

  const headers = {
    Authorization:  `Bearer ${token}`,
    "x-tenant-id":  currentStoreId,
    "Content-Type": "application/json",
  };

  async function fetchFeeds() {
    if (!currentStoreId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res  = await fetch(`${API_BASE}/api/output-feeds`, { headers });
      const data = await res.json();
      if (data.success) setFeeds(data.data);
      else throw new Error(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFeeds(); }, [currentStoreId]);

  async function handleRefresh(feed) {
    setRefreshing(prev => ({ ...prev, [feed._id]: true }));
    try {
      const res  = await fetch(
        `${API_BASE}/api/output-feeds/${feed._id}/build`,
        { method: "POST", headers }
      );
      const data = await res.json();
      if (data.success) {
        setFeeds(prev => prev.map(f => f._id === feed._id ? data.data : f));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(prev => ({ ...prev, [feed._id]: false }));
    }
  }

 async function handleDownload(feed) {
  if (!feed.output_public_url) return;
  setDownloading(prev => ({ ...prev, [feed._id]: true }));
  try {
    // ✅ Fix - full URL இருந்தா direct use பண்ணு
    const downloadUrl = feed.output_public_url.startsWith("http")
      ? feed.output_public_url
      : `${API_BASE}${feed.output_public_url}`;

    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = feed.output_filename || "feed";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
  } finally {
    setDownloading(prev => ({ ...prev, [feed._id]: false }));
  }
}

  async function handleDelete(feedId) {
    if (!confirm("Are you sure you want to delete this feed?")) return;
    setDeleting(prev => ({ ...prev, [feedId]: true }));
    try {
      await fetch(`${API_BASE}/api/output-feeds/${feedId}`, {
        method: "DELETE", headers,
      });
      setFeeds(prev => prev.filter(f => f._id !== feedId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(prev => ({ ...prev, [feedId]: false }));
    }
  }

  function handleSaved(savedFeed) {
    setFeeds(prev => {
      const exists = prev.find(f => f._id === savedFeed._id);
      return exists
        ? prev.map(f => f._id === savedFeed._id ? savedFeed : f)
        : [savedFeed, ...prev];
    });
  }

  const totalProducts   = feeds.reduce((s, f) => s + (f.products_total || 0), 0);
  const deliveryMethods = [...new Set(feeds.map(f => f.output_delivery_method).filter(Boolean))].join(", ") || "—";
  const pendingBuilds   = feeds.filter(f => !f.is_output_setup).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading feeds...</span>
      </div>
    );
  }

  if (isSuperAdmin && !currentStoreId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 border rounded-xl border-dashed">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm font-medium">
          Please select a store from the top right menu
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={fetchFeeds} variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <FeedModal
            key="feed-modal"
            onClose={() => { setShowModal(false); setEditFeed(null); }}
            onSaved={handleSaved}
            editFeed={editFeed}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Output Feed</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isSuperAdmin
                ? `Viewing: ${activeShopName || currentStoreId}`
                : "All the feeds generated for your account are displayed here."}
            </p>
          </div>
          <Button
            onClick={() => { setEditFeed(null); setShowModal(true); }}
            className="bg-primary text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Feed
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Feeds",      value: feeds.length,    sub: "Generated output feeds",    icon: FileOutput,  color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Products",   value: totalProducts,   sub: "Products across all feeds", icon: Package,     color: "text-info",    bg: "bg-info/10"    },
            { label: "Delivery Methods", value: deliveryMethods, sub: "Feed delivery type",        icon: Globe,       color: "text-success", bg: "bg-success/10" },
            { label: "Pending Builds",   value: pendingBuilds,   sub: "Feeds not yet generated",   icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div
              key={label}
              className={`rounded-xl border border-border p-4 flex items-start gap-4 ${bg}`}
            >
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm text-muted-foreground">
              Showing {feeds.length} of {feeds.length} items
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="p-4 text-left text-muted-foreground font-medium">Feed Name</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Format</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Products</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Delivery</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Feed URL</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Options</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeds.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-muted-foreground text-sm"
                    >
                      No feeds yet. Click "Add New Feed" to create your first feed.
                    </td>
                  </tr>
                ) : (
                  feeds.map(feed => {
                    const isRefreshing  = refreshing[feed._id];
                    const isDeleting    = deleting[feed._id];
                    const isDownloading = downloading[feed._id];

                    return (
                      <tr
                        key={feed._id}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        {/* Feed Name */}
                        <td className="p-4 font-medium text-foreground">
                          {feed.output_feed_name}
                        </td>

                        {/* Format */}
                        <td className="p-4">
                          <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-muted-foreground uppercase">
                            {feed.output_format_id === 1 ? "xml" : "csv"}
                          </span>
                        </td>

                        {/* Products */}
                        <td className="p-4 text-foreground">
                          {feed.products_total || 0}
                        </td>

                        {/* Delivery */}
                        <td className="p-4 text-foreground capitalize">
                          {feed.output_delivery_method || "http"}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <StatusBadge
                            status={feed.status}
                            is_output_setup={feed.is_output_setup}
                          />
                        </td>

                        {/* Feed URL */}
                        <td className="p-4">
                          {feed.is_output_setup && feed.output_public_url ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground max-w-[180px] truncate block">
                                {feed.output_public_url}
                              </span>
                              <CopyButton url={feed.output_public_url} />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Not built yet
                            </span>
                          )}
                        </td>

                        {/* Options — Refresh + Download */}
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => handleRefresh(feed)}
                              className="gap-1 text-primary border-primary/30 hover:bg-primary/5"
                            >
                              {isRefreshing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              {isRefreshing ? "Refreshing..." : "Refresh"}
                            </Button>

                            {feed.is_output_setup === 1 && feed.output_public_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isDownloading}
                                onClick={() => handleDownload(feed)}
                                className="gap-1 text-success border-success/30 hover:bg-success/5"
                              >
                                {isDownloading ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                                {isDownloading ? "Downloading..." : "Download"}
                              </Button>
                            )}
                          </div>
                        </td>

                        {/* Actions — Edit + Delete */}
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-primary text-primary-foreground gap-1 h-8"
                              onClick={() => { setEditFeed(feed); setShowModal(true); }}
                            >
                              <Edit className="h-3 w-3" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isDeleting}
                              className="gap-1 h-8"
                              onClick={() => handleDelete(feed._id)}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </>
  );
}
