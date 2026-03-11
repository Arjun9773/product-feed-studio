import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { outputFeeds } from "@/data/mockData";

export default function OutputFeed() {
  const [feeds, setFeeds] = useState(outputFeeds);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Output Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All the feeds generated for your account are displayed here. Easily add new feeds or refresh existing ones to keep your data accurate and up-to-date.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Full Refresh
          </Button>
          <Button className="bg-primary text-primary-foreground gap-2">
            <Plus className="h-4 w-4" />
            Add New Feed
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm text-muted-foreground">Showing {feeds.length} of {feeds.length} items</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="p-4 text-left text-muted-foreground font-medium">Feed Name</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Products</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Delivery Method</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Options</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed) => (
                <tr key={feed.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{feed.feedName}</td>
                  <td className="p-4 text-foreground">{feed.products}</td>
                  <td className="p-4 text-foreground">{feed.deliveryMethod}</td>
                  <td className="p-4">
                    <Badge className="bg-warning/10 text-warning border-0 font-medium">{feed.status}</Badge>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/30 hover:bg-primary/5">
                      <RefreshCw className="h-3 w-3" />
                      Refresh now
                    </Button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-primary text-primary-foreground gap-1 h-8">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1 h-8">
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
