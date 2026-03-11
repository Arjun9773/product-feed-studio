import { motion } from "framer-motion";
import { Download, Upload, Clock, FileSpreadsheet, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const exports = [
  { id: 1, name: "Google Shopping Feed", format: "XML", lastExport: "2024-01-15 14:30", status: "completed", products: 12458 },
  { id: 2, name: "Facebook Catalog Feed", format: "CSV", lastExport: "2024-01-15 14:30", status: "completed", products: 12458 },
  { id: 3, name: "Custom Feed Export", format: "JSON", lastExport: "2024-01-14 09:00", status: "scheduled", products: 8234 },
];

export default function Exports() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exports</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and manage your product feeds</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Play className="h-4 w-4" />
          Generate Feed
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Play, label: "Generate Feed", desc: "Create a new product feed", color: "bg-primary/10 text-primary" },
          { icon: Download, label: "Download CSV", desc: "Export as CSV file", color: "bg-success/10 text-success" },
          { icon: Clock, label: "Schedule Export", desc: "Set automatic exports", color: "bg-warning/10 text-warning" },
          { icon: Upload, label: "Upload to GMC", desc: "Push to Google Merchant", color: "bg-info/10 text-info" },
        ].map((action) => (
          <button key={action.label} className="bg-card rounded-xl p-5 card-shadow border border-border text-left hover:card-shadow-hover transition-shadow">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <p className="font-medium text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Export History */}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Export History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="p-4 text-left text-muted-foreground font-medium">Feed Name</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Format</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Products</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Last Export</th>
              <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
              <th className="p-4 text-right text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exports.map((exp) => (
              <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="p-4 font-medium text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  {exp.name}
                </td>
                <td className="p-4"><Badge variant="outline">{exp.format}</Badge></td>
                <td className="p-4 text-foreground">{exp.products.toLocaleString()}</td>
                <td className="p-4 text-muted-foreground">{exp.lastExport}</td>
                <td className="p-4">
                  <Badge className={exp.status === "completed" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>
                    {exp.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" />Download</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
