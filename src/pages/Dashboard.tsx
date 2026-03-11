import { motion } from "framer-motion";
import { Package, AlertTriangle, AlertCircle, Heart, FileOutput, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";

const stats = [
  { label: "Total Products", value: "12,458", change: "+12%", up: true, icon: Package, color: "bg-primary/10 text-primary" },
  { label: "Products With Errors", value: "342", change: "-8%", up: false, icon: AlertCircle, color: "bg-destructive/10 text-destructive" },
  { label: "Missing Attributes", value: "1,205", change: "-5%", up: false, icon: AlertTriangle, color: "bg-warning/10 text-warning" },
  { label: "Feed Health Score", value: "72%", change: "+3%", up: true, icon: Heart, color: "bg-success/10 text-success" },
  { label: "Feeds Generated", value: "89", change: "+15%", up: true, icon: FileOutput, color: "bg-info/10 text-info" },
];

const attributeData = [
  { name: "Title", complete: 98 },
  { name: "Brand", complete: 67 },
  { name: "Color", complete: 75 },
  { name: "Material", complete: 82 },
  { name: "GTIN", complete: 50 },
  { name: "Category", complete: 75 },
  { name: "Description", complete: 58 },
  { name: "Images", complete: 100 },
];

const errorDistribution = [
  { name: "Missing Brand", value: 342 },
  { name: "Missing Color", value: 256 },
  { name: "Missing Category", value: 310 },
  { name: "Missing GTIN", value: 498 },
  { name: "Missing Description", value: 421 },
];

const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 45%)", "hsl(199, 89%, 48%)"];

const trendData = [
  { month: "Jan", score: 58 },
  { month: "Feb", score: 62 },
  { month: "Mar", score: 59 },
  { month: "Apr", score: 65 },
  { month: "May", score: 68 },
  { month: "Jun", score: 72 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your product feed health</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="bg-card rounded-xl p-5 card-shadow border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${stat.up ? "text-success" : "text-destructive"}`}>
                {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attribute Completeness */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card rounded-xl p-6 card-shadow border border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">Attribute Completeness</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attributeData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220, 13%, 91%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="complete" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Error Distribution */}
        <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 card-shadow border border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">Error Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={errorDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {errorDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {errorDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Feed Health Trend */}
      <motion.div variants={itemVariants} className="bg-card rounded-xl p-6 card-shadow border border-border">
        <h3 className="text-base font-semibold text-foreground mb-4">Feed Health Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} domain={[0, 100]} />
            <Tooltip />
            <Area type="monotone" dataKey="score" stroke="hsl(217, 91%, 60%)" fill="url(#healthGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
