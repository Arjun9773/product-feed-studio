import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your feed management system</p>
      </div>

      {/* Feed Format */}
      <div className="bg-card rounded-xl p-6 card-shadow border border-border space-y-4">
        <h3 className="font-semibold text-foreground">Feed Format Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Default Feed Format</label>
            <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              <option>XML (Google Shopping)</option>
              <option>CSV</option>
              <option>JSON</option>
              <option>TSV</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Feed Language</label>
            <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>German</option>
              <option>French</option>
            </select>
          </div>
        </div>
      </div>

      {/* Import Settings */}
      <div className="bg-card rounded-xl p-6 card-shadow border border-border space-y-4">
        <h3 className="font-semibold text-foreground">Import Product Data</h3>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Product Feed URL</label>
          <Input placeholder="https://yourstore.com/products.xml" className="bg-secondary border-0" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">API Key</label>
          <Input type="password" placeholder="Enter your API key..." className="bg-secondary border-0" />
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-card rounded-xl p-6 card-shadow border border-border space-y-4">
        <h3 className="font-semibold text-foreground">Cron Scheduling</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Auto-generate feeds</p>
            <p className="text-xs text-muted-foreground">Automatically generate feeds on schedule</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Cron Expression</label>
          <Input defaultValue="0 0 * * *" className="bg-secondary border-0 font-mono" />
          <p className="text-xs text-muted-foreground mt-1">Runs daily at midnight</p>
        </div>
      </div>

      <Button className="bg-primary text-primary-foreground gap-2">
        <Save className="h-4 w-4" />
        Save Settings
      </Button>
    </motion.div>
  );
}
