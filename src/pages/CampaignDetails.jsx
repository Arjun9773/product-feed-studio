import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  Eye,
  MousePointerClick,
  Percent,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ClientChart } from "@/components/dashboard/ClientChart";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { getAnalytics, getCampaign } from "@/lib/mockCampaign";

const fmtNum = (n) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(2) + "M"
    : n >= 1_000
      ? (n / 1_000).toFixed(1) + "K"
      : String(n);
const fmtMoney = (n) =>
  "$" +
  (n >= 1_000_000
    ? (n / 1_000_000).toFixed(2) + "M"
    : n >= 1_000
      ? (n / 1_000).toFixed(1) + "K"
      : n.toFixed(2));
const fmtPct = (n) => (n * 100).toFixed(2) + "%";

const PIE_COLORS = [
  "hsl(221 83% 53%)",
  "hsl(160 84% 39%)",
  "hsl(38 92% 50%)",
  "hsl(280 70% 55%)",
  "hsl(0 84% 60%)",
];

function statusVariant(status) {
  if (status === "Active") return "default";
  if (status === "Paused") return "secondary";
  return "destructive";
}

function CampaignDetailsPage() {
  const { id } = useParams();
  const [rangeKey, setRangeKey] = useState("last30");
  const [custom, setCustom] = useState();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch campaign details on mount and when id changes
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        const campaignData = await getCampaign(id);
        setCampaign(campaignData);
        
        const analyticsData = await getAnalytics(id, rangeKey, custom);
        setData(analyticsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching campaign data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampaignData();
    }
  }, [id, rangeKey, custom]);

  // Handle range change
  function handleRangeChange(k, c) {
    setLoading(true);
    setRangeKey(k);
    setCustom(c);
  }

  // Loading state
  if (loading || !campaign || !data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="h-8 w-8 bg-primary rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">Failed to load campaign: {error}</p>
          <Link to="/campaign" className="text-primary hover:underline">
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4">
          <Link
            to="/campaign"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={statusVariant(campaign.status)}
                  className="rounded-full px-2.5 py-0.5 text-[11px]"
                >
                  ● {campaign.status}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-[11px]"
                >
                  {campaign.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Daily budget:{" "}
                  <span className="font-semibold text-foreground">
                    ${campaign.budget}
                  </span>
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {campaign.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Campaign ID #{campaign.id} · Live performance from Google Ads &
                GA4
              </p>
            </div>
            <DateRangeFilter
              value={rangeKey}
              custom={custom}
              onChange={handleRangeChange}
            />
          </div>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            label="Impressions"
            value={fmtNum(m.impressions)}
            delta={0.124}
            icon={Eye}
            loading={loading}
          />
          <MetricCard
            label="Clicks"
            value={fmtNum(m.clicks)}
            delta={0.082}
            icon={MousePointerClick}
            loading={loading}
          />
          <MetricCard
            label="CTR"
            value={fmtPct(m.ctr)}
            delta={-0.012}
            icon={Percent}
            loading={loading}
          />
          <MetricCard
            label="Avg. CPC"
            value={fmtMoney(m.cpc)}
            delta={-0.034}
            icon={DollarSign}
            loading={loading}
          />
          <MetricCard
            label="Conversions"
            value={fmtNum(m.conversions)}
            delta={0.211}
            icon={Target}
            loading={loading}
          />
          <MetricCard
            label="ROAS"
            value={m.roas.toFixed(2) + "x"}
            delta={0.094}
            icon={TrendingUp}
            loading={loading}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ads">Ads Performance</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="ecommerce">Ecommerce</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">
                    Impressions & Clicks
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ClientChart>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trend}>
                          <defs>
                            <linearGradient
                              id="gImp"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="hsl(221 83% 53%)"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="100%"
                                stopColor="hsl(221 83% 53%)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="gClk"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="hsl(160 84% 39%)"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="100%"
                                stopColor="hsl(160 84% 39%)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                          />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="impressions"
                            stroke="hsl(221 83% 53%)"
                            fill="url(#gImp)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="hsl(160 84% 39%)"
                            fill="url(#gClk)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ClientChart>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Device Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ClientChart>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.devices}
                            dataKey="clicks"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {data.devices.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ClientChart>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversions Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ClientChart>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.trend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                          />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar
                            dataKey="conversions"
                            fill="hsl(280 70% 55%)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ClientChart>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ClientChart>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.trend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border"
                          />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip formatter={(v) => fmtMoney(v)} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(38 92% 50%)"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ClientChart>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard
                label="Total Spend"
                value={fmtMoney(m.spend)}
                icon={DollarSign}
                loading={loading}
              />
              <MetricCard
                label="Revenue"
                value={fmtMoney(m.revenue)}
                icon={TrendingUp}
                loading={loading}
              />
              <MetricCard
                label="Reach"
                value={fmtNum(m.reach)}
                icon={Users}
                loading={loading}
              />
              <MetricCard
                label="Conv. Rate"
                value={fmtPct(m.convRate)}
                icon={Zap}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* ADS PERFORMANCE */}
          <TabsContent value="ads" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Keyword Performance</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead className="text-right">
                          Impressions
                        </TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">CPC</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.keywords.map((k) => (
                        <TableRow key={k.keyword}>
                          <TableCell className="font-medium">
                            {k.keyword}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtNum(k.impressions)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtNum(k.clicks)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtPct(k.ctr)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtMoney(k.cpc)}
                          </TableCell>
                          <TableCell className="text-right">
                            {k.conversions}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Search Terms</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {loading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Term</TableHead>
                          <TableHead className="text-right">Impr.</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Conv.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.searchTerms.map((t) => (
                          <TableRow key={t.term}>
                            <TableCell className="font-medium">
                              {t.term}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtNum(t.impressions)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtNum(t.clicks)}
                            </TableCell>
                            <TableCell className="text-right">
                              {t.conversions}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ad Group Details</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {loading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ad Group</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">CPC</TableHead>
                          <TableHead className="text-right">Conv.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.adGroups.map((g) => (
                          <TableRow key={g.name}>
                            <TableCell className="font-medium">
                              {g.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  g.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {g.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtNum(g.clicks)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtMoney(g.cpc)}
                            </TableCell>
                            <TableCell className="text-right">
                              {g.conversions}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AUDIENCE */}
          <TabsContent value="audience" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Audience Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Audience Segment</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Conv. Rate</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.audiences.map((a) => (
                        <TableRow key={a.name}>
                          <TableCell className="font-medium">
                            {a.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtNum(a.users)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtPct(a.convRate)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtMoney(a.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ClientChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.trafficSources} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis type="number" className="text-xs" />
                        <YAxis
                          dataKey="source"
                          type="category"
                          className="text-xs"
                          width={120}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="sessions"
                          fill="hsl(221 83% 53%)"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ClientChart>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ECOMMERCE */}
          <TabsContent value="ecommerce" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard
                label="View Item"
                value={fmtNum(m.viewItem)}
                icon={Eye}
                loading={loading}
              />
              <MetricCard
                label="Add to Cart"
                value={fmtNum(m.addToCart)}
                icon={ShoppingCart}
                loading={loading}
              />
              <MetricCard
                label="Begin Checkout"
                value={fmtNum(m.beginCheckout)}
                icon={ShoppingCart}
                loading={loading}
              />
              <MetricCard
                label="Purchases"
                value={fmtNum(m.purchases)}
                icon={Target}
                loading={loading}
              />
              <MetricCard
                label="Revenue"
                value={fmtMoney(m.revenue)}
                icon={DollarSign}
                loading={loading}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Top Performing Products
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">
                          Add to Cart
                        </TableHead>
                        <TableHead className="text-right">Purchases</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.products.map((p) => (
                        <TableRow key={p.sku}>
                          <TableCell className="font-medium">
                            {p.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.sku}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtNum(p.views)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtNum(p.addToCart)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtNum(p.purchases)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtMoney(p.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Funnel Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ClientChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { stage: "View Item", value: m.viewItem },
                          { stage: "Add to Cart", value: m.addToCart },
                          { stage: "Checkout", value: m.beginCheckout },
                          { stage: "Purchase", value: m.purchases },
                        ]}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis dataKey="stage" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="hsl(160 84% 39%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ClientChart>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS (GA4) */}
          <TabsContent value="analytics" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard
                label="Page Views"
                value={fmtNum(m.pageViews)}
                icon={Eye}
                loading={loading}
              />
              <MetricCard
                label="Sessions"
                value={fmtNum(m.sessions)}
                icon={BarChart3}
                loading={loading}
              />
              <MetricCard
                label="Users"
                value={fmtNum(m.users)}
                icon={Users}
                loading={loading}
              />
              <MetricCard
                label="Bounce Rate"
                value={fmtPct(m.bounceRate)}
                icon={Percent}
                loading={loading}
              />
              <MetricCard
                label="Engagement"
                value={fmtPct(m.engagementRate)}
                icon={Zap}
                loading={loading}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions & Users</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ClientChart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.trend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sessions"
                          stroke="hsl(221 83% 53%)"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="hsl(280 70% 55%)"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ClientChart>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  User Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <ol className="relative space-y-4 border-l border-border pl-5">
                    {data.activity.map((a, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {a.event}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.detail}
                            </p>
                          </div>
                          <span className="mt-1 text-xs text-muted-foreground sm:mt-0">
                            {a.time}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex items-center justify-center">
          <Button variant="outline" size="sm" asChild>
            <Link to="/campaign">← Back to all campaigns</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CampaignDetailsPage;
