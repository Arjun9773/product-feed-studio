import { motion } from "framer-motion";
import { Save, FileText, Calendar, Link2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ManageFeedSetup() {
  const [feedName, setFeedName] = useState("Gmc");
  const [cmsUpload, setCmsUpload] = useState("none");
  const [feedFormat, setFeedFormat] = useState("Json");
  const [importUrl, setImportUrl] = useState("http://13.127.238.26/eprice/admin/cron/cron_run_for_scrap_gmc_feed.php");
  const [schedule, setSchedule] = useState("Daily");
  const [scheduleTime, setScheduleTime] = useState("06:00");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage Feed Setup</h1>
        <p className="text-muted-foreground text-sm mt-1">Please set the format, text encoding and upload product feed file for us to process.</p>
      </div>

      <div className="bg-card rounded-xl p-6 card-shadow border border-border space-y-6">
        {/* Feed Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-foreground">Feed Name:</label>
          <div className="sm:col-span-2">
            <Input value={feedName} onChange={(e) => setFeedName(e.target.value)} className="bg-secondary border-0 font-semibold text-primary" />
          </div>
        </div>

        {/* CMS Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-foreground">Upload CMS products to the website via?</label>
          <div className="sm:col-span-2 flex gap-4">
            {["none", "shopify", "wordpress"].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cmsUpload"
                  value={option}
                  checked={cmsUpload === option}
                  onChange={(e) => setCmsUpload(e.target.value)}
                  className="h-4 w-4 text-primary accent-primary"
                />
                <span className="text-sm text-foreground capitalize">{option === "none" ? "None" : option === "shopify" ? "Shopify" : "WordPress"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Feed Format */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-foreground">Feed Format:</label>
          <div className="sm:col-span-2">
            <select
              className="w-full max-w-[200px] rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={feedFormat}
              onChange={(e) => setFeedFormat(e.target.value)}
            >
              <option>Json</option>
            </select>
          </div>
        </div>

        {/* URL for import */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-foreground">URL for import:</label>
          <div className="sm:col-span-2">
            <Input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} className="bg-secondary border-0 font-mono text-xs" />
          </div>
        </div>

        {/* Import Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-foreground">Import schedule:</label>
          <div className="sm:col-span-2 flex items-center gap-3">
            <select
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
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
              onChange={(e) => setScheduleTime(e.target.value)}
              className="bg-secondary border-0 w-32"
            />
          </div>
        </div>
      </div>

      <Button className="bg-primary text-primary-foreground gap-2">
        <Save className="h-4 w-4" />
        Save
      </Button>
    </motion.div>
  );
}
