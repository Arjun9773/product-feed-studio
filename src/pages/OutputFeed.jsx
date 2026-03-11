import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { outputFeeds } from "@/data/mockData";

export default function OutputFeed() {
  const [feeds, setFeeds] = useState(outputFeeds);

 return (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4 sm:px-0 pb-10">
    
    {/* Header Section - Responsive Layout */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Output Feed</h1>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
          All the feeds generated for your account are displayed here. Easily add new feeds or refresh existing ones.
        </p>
      </div>
      <div className="flex flex-col xs:flex-row gap-2 w-full md:w-auto">
        <Button variant="outline" className="gap-2 w-full md:w-auto justify-center">
          <RefreshCw className="h-4 w-4" />
          Full Refresh
        </Button>
        <Button className="bg-primary text-primary-foreground gap-2 w-full md:w-auto justify-center">
          <Plus className="h-4 w-4" />
          Add New Feed
        </Button>
      </div>
    </div>

    {/* Table Container */}
    <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Showing {feeds.length} of {feeds.length} items
        </p>
        <span className="text-[10px] text-muted-foreground sm:hidden animate-pulse">
          Swipe left to view more →
        </span>
      </div>

      {/* Responsive Horizontal Scroll Wrapper */}
      <div className="overflow-x-auto w-full">
        {/* min-w-[900px] ensures the table columns don't collapse on mobile */}
        <table className="w-full text-sm min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="p-4 text-left text-muted-foreground font-semibold">Feed Name</th>
              <th className="p-4 text-left text-muted-foreground font-semibold">Products</th>
              <th className="p-4 text-left text-muted-foreground font-semibold">Delivery Method</th>
              <th className="p-4 text-left text-muted-foreground font-semibold">Status</th>
              <th className="p-4 text-left text-muted-foreground font-semibold">Options</th>
              <th className="p-4 text-left text-muted-foreground font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {feeds.map((feed) => (
              <tr key={feed.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-medium text-foreground">{feed.feedName}</td>
                <td className="p-4 text-foreground">{feed.products}</td>
                <td className="p-4 text-foreground">{feed.deliveryMethod}</td>
                <td className="p-4">
                  <Badge className="bg-warning/10 text-warning border-0 font-medium px-2 py-0.5">
                    {feed.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5 h-8">
                    <RefreshCw className="h-3 w-3" />
                    Refresh now
                  </Button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary text-primary-foreground gap-1.5 h-8">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1.5 h-8">
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
      
      {/* Mobile Footer Hint */}
      <div className="sm:hidden p-3 bg-muted/5 border-t border-border text-center">
        <p className="text-[10px] text-muted-foreground italic">
          Tip: Scroll the table sideways to manage feeds.
        </p>
      </div>
    </div>
  </motion.div>
);
}
