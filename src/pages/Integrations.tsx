import { motion } from "framer-motion";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const integrations = [
  { name: "Google Merchant Center", desc: "Sync product feeds to Google Shopping", status: "connected", icon: "🛒" },
  { name: "Shopify", desc: "Import products from your Shopify store", status: "connected", icon: "🏪" },
  { name: "WooCommerce", desc: "Connect to your WooCommerce store", status: "disconnected", icon: "🔌" },
  { name: "Custom Product API", desc: "Import from any REST API endpoint", status: "disconnected", icon: "⚡" },
];

export default function Integrations() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect your stores and platforms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div key={integration.name} className="bg-card rounded-xl p-6 card-shadow border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{integration.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground">{integration.desc}</p>
                </div>
              </div>
              <Badge className={integration.status === "connected" ? "bg-success/10 text-success border-0" : "bg-secondary text-muted-foreground border-0"}>
                {integration.status === "connected" && <Check className="h-3 w-3 mr-1" />}
                {integration.status}
              </Badge>
            </div>
            <Button
              variant={integration.status === "connected" ? "outline" : "default"}
              className={integration.status === "connected" ? "" : "bg-primary text-primary-foreground"}
              size="sm"
            >
              {integration.status === "connected" ? "Configure" : "Connect"}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
