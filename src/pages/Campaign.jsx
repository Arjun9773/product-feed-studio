import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import {
  Tag,
  Users,
  MousePointerClick,
  Smartphone,
  Volume2,
  MapPin,
  Settings,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Phone,
  Store,
  Info,
  Check,
  ChevronDown,
  X,
  MoreVertical,
  Circle,
  CheckCircle2,
} from "lucide-react";

/**
 * Google Shopping Ads — Campaign creation flow (single-file JSX).
 *
 * Flow:
 *  1) Connect Google Ads account screen  -> "Connect with Google Ads" button
 *  2) Dashboard screen                    -> "Create new campaign" button
 *  3) Wizard (mirrors Google Ads UI for Shopping campaigns):
 *       - Objective (Sales preselected)
 *       - Conversion goals
 *       - Campaign type (Shopping ONLY — others disabled)
 *       - Merchant Center + Campaign name
 *       - Budget & bidding optimization (Budget / Bidding / Customer acquisition / Campaign priority)
 *       - Campaign settings (networks, devices, locations, languages, schedule)
 *       - Ad group (name, default bid, products)
 *       - Summary
 */

export default function Campaign() {
  const { user, currentStoreId } = useAuth();
  const [screen, setScreen] = useState("loading");
  const [connectedData, setConnectedData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is connected to Google Ads
  useEffect(() => {
    const checkConnection = async () => {
      if (!user?.userId) {
        setScreen("connect");
        setLoading(false);
        return;
      }

      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";

        // Always check the database connection (source of truth)
        const response = await fetch(
          `${API_URL}/campaigns/check-connection/${currentStoreId}`,
        );
        const data = await response.json();

        if (data.connected) {
          setConnectedData(data);
          setScreen("dashboard");
          fetchCampaigns();
        } else {
          setScreen("connect");
        }
      } catch (error) {
        console.error("Error checking connection:", error);
        setScreen("connect");
      } finally {
        setLoading(false);

        // Clean up URL params if they exist (from OAuth redirect)
        const params = new URLSearchParams(window.location.search);
        if (params.has("googleConnected") || params.has("email")) {
          window.history.replaceState({}, "", "/campaign");
        }
      }
    };

    checkConnection();
  }, [user?.userId]);

  //   useEffect(() => {
  //   const checkConnection = async () => {
  //     // URL params catch பண்ணு (OAuth redirect ல வருது)
  //     const params = new URLSearchParams(window.location.search);
  //     const googleConnected = params.get("googleConnected");
  //     const emailFromUrl = params.get("email");

  //     if (googleConnected) {
  //       window.history.replaceState({}, "", "/campaign"); // URL clean பண்ணு
  //     }

  //     if (!user?.userId) {
  //       setScreen("connect");
  //       setLoading(false);
  //       return;
  //     }

  //     try {
  //       const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  //       const response = await fetch(`${API_URL}/campaigns/check-connection/${user.userId}`);
  //       const data = await response.json();

  //       if (data.connected || googleConnected) {
  //         setConnectedData(data.connected ? data : { email: emailFromUrl });
  //         setScreen("dashboard");
  //         fetchCampaigns();
  //       } else {
  //         setScreen("connect");
  //       }
  //     } catch (error) {
  //       console.error("Error:", error);
  //       setScreen("connect");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   checkConnection();
  // }, [user?.userId]);

  const fetchCampaigns = async () => {
    if (!user?.userId) return;
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/campaigns/user/${user.userId}`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="h-8 w-8 bg-primary rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

 if (screen === "connect") {
  return (
    <ConnectScreen
      user={user}
      currentStoreId={currentStoreId}
      onConnect={(email) => {
        setConnectedData({ email });
        setScreen("dashboard");
      }}
    />
  );
}

  if (screen === "dashboard") {
    return (
      <Dashboard
        user={user}
        connectedData={connectedData}
        campaigns={campaigns}
        onCreate={() => setScreen("wizard")}
        onCampaignCreated={() => {
          fetchCampaigns();
          setScreen("dashboard");
        }}
        onDisconnect={() => {
          setConnectedData(null);
          setCampaigns([]);
          setScreen("connect");
        }}
      />
    );
  }

  return (
    <CampaignWizard
      user={user}
      connectedData={connectedData}
      onExit={() => setScreen("dashboard")}
      onDone={() => {
        setScreen("dashboard");
        fetchCampaigns();
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Connect with Google Ads                                                 */
/* -------------------------------------------------------------------------- */

function ConnectScreen({ onConnect, user, currentStoreId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Google OAuth Configuration
      const CLIENT_ID =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
      const REDIRECT_URI = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/auth/google/callback`
        : "http://localhost:5000/api/auth/google/callback";
      const SCOPE = [
        "https://www.googleapis.com/auth/adwords",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ].join(" ");

      // Google OAuth Authorization URL
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", SCOPE);
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");
      
     authUrl.searchParams.append("state", `${user.userId}:${currentStoreId}`);

      // Redirect to Google's OAuth consent screen
      window.location.href = authUrl.toString();
    } catch (err) {
      setLoading(false);
      setError("Failed to initiate Google authentication. Please try again.");
      console.error("OAuth Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card rounded-lg shadow-sm border border-border max-w-md w-full p-10 text-center">
        <div className="flex justify-center mb-6">
          <GoogleAdsLogo />
        </div>
        <h1 className="text-2xl font-normal text-foreground mb-2">
          Connect your Google Ads account
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Link your Google Ads account to start creating Shopping campaigns and
          manage your product ads.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleConnect}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-3 bg-card border border-border hover:shadow-md transition-shadow rounded-md py-2.5 px-4 text-sm font-medium text-foreground disabled:opacity-60"
        >
          <GoogleG />
          {loading ? "Redirecting to Google…" : "Connect with Google Ads"}
        </button>
        <p className="text-xs text-muted-foreground mt-6">
          By continuing, you agree to Google's Terms of Service.
        </p>
      </div>
    </div>
  );
}

function Dashboard({
  user,
  connectedData,
  campaigns,
  onCreate,
  onCampaignCreated,
  onDisconnect,
}) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!user?.userId) return;
    setDisconnecting(true);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await fetch(`${API_URL}/auth/google/disconnect/${user.userId}`, {
        method: "POST",
      });
      onDisconnect();
    } catch (error) {
      console.error("Error disconnecting:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-card rounded-lg border border-border p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <GoogleAdsLogo small />
              <div>
                <p className="text-sm text-muted-foreground">Connected as</p>
                <p className="text-sm font-medium text-foreground">
                  {connectedData?.email || connectedData?.name || "Connected"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-sm text-primary hover:underline disabled:opacity-60"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <ShoppingBag
                className="mx-auto text-muted-foreground mb-4"
                size={40}
              />
              <h2 className="text-lg font-medium text-foreground mb-2">
                No campaigns yet
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Get started by creating your first Google Shopping campaign.
              </p>
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md"
              >
                + Create new campaign
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={onCreate}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md"
                >
                  + Create new campaign
                </button>
              </div>
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">
                        {campaign.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {campaign.campaignType} • Status:{" "}
                        <span
                          className={`capitalize ${
                            campaign.status === "active"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Campaign Wizard                                                         */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { id: "objective", label: "Objective" },
  { id: "type", label: "Campaign type" },
  { id: "products", label: "Products" },
  { id: "bidding", label: "Budget and bidding optimization" },
  { id: "settings", label: "Campaign settings" },
  { id: "adgroup", label: "Ad group" },
  { id: "summary", label: "Summary" },
];

function CampaignWizard({ user, connectedData, onExit, onDone }) {
  const [stepIndex, setStepIndex] = useState(0);

  const [data, setData] = useState({
    objective: "sales",
    conversionGoals: [
      { name: "Purchases", source: "Website", actions: 2, default: true },
      { name: "Contacts", source: "Website", actions: 1, default: true },
      {
        name: "Leads from messages",
        source: "Google hosted",
        actions: 1,
        default: true,
        beta: true,
      },
      {
        name: "Phone call leads",
        source: "Call from Ads",
        actions: 4,
        default: true,
      },
      { name: "Store sales", source: "Store", actions: 1, default: true },
    ],
    campaignType: "shopping",
    merchantAccount: "138771066 - Sathya Retail",
    feedLabel: "",
    campaignName: "Sales-Shopping-15",
    budgetType: "daily", // daily | total
    budgetAmount: "",
    startDate: "April 24, 2026",
    endDate: "None",
    bidStrategy: "Manual CPC",
    customerAcquisition: false,
    campaignPriority: "low",
    networks: { search: true, youtube: true, gmail: true, discover: true },
    devices: { computers: true, mobile: true, tablets: true, tv: true },
    locations: "All countries and territories",
    languages: "English",
    adGroupName: "Ad group 1",
    defaultBid: "",
    productScope: "all",
  });

  const setField = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const current = STEPS[stepIndex].id;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-card border-b border-border">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GoogleAdsLogo small />
            <span className="text-sm text-foreground">
              New campaign — Shopping
            </span>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar stepper */}
        <aside className="w-72 bg-card border-r border-border min-h-[calc(100vh-49px)] py-6 px-4">
          <Stepper
            steps={STEPS}
            currentIndex={stepIndex}
            onJump={setStepIndex}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 px-10 py-8">
          <div className="max-w-5xl mx-auto">
            {current === "objective" && (
              <ObjectiveStep data={data} setField={setField} />
            )}
            {current === "type" && <TypeStep data={data} setField={setField} />}
            {current === "products" && (
              <ProductsStep data={data} setField={setField} />
            )}
            {current === "bidding" && (
              <BiddingStep data={data} setField={setField} />
            )}
            {current === "settings" && (
              <SettingsStep data={data} setField={setField} />
            )}
            {current === "adgroup" && (
              <AdGroupStep data={data} setField={setField} />
            )}
            {current === "summary" && (
              <SummaryStep data={data} user={user} onPublish={onDone} />
            )}

            <div className="flex justify-end gap-3 mt-8">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="px-5 py-2 text-sm text-primary hover:bg-primary/5 rounded-md"
                >
                  Back
                </button>
              )}
              {stepIndex < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onDone}
                  className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
                >
                  Publish campaign
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Stepper ---------- */
function Stepper({ steps, currentIndex, onJump }) {
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onJump(i)}
              className={`w-full flex items-start gap-3 text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                active ? "text-primary" : "text-foreground"
              }`}
            >
              <span className="mt-0.5">
                {done ? (
                  <CheckCircle2 size={18} className="text-primary" />
                ) : (
                  <Circle
                    size={18}
                    className={
                      active ? "text-primary" : "text-muted-foreground"
                    }
                  />
                )}
              </span>
              <span
                className={`text-sm leading-snug ${
                  active ? "font-semibold" : ""
                }`}
              >
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Step: Objective ---------- */
function ObjectiveStep({ data, setField }) {
  const objectives = [
    {
      id: "sales",
      icon: <Tag size={22} />,
      title: "Sales",
      desc: "Drive sales online, in app, by phone, or in store",
    },
    {
      id: "leads",
      icon: <Users size={22} />,
      title: "Leads",
      desc: "Get leads and other conversions by encouraging customers to take action",
    },
    {
      id: "traffic",
      icon: <MousePointerClick size={22} />,
      title: "Website traffic",
      desc: "Get the right people to visit your website",
    },
    {
      id: "app",
      icon: <Smartphone size={22} />,
      title: "App promotion",
      desc: "Get more installs, engagement and pre-registration for your app",
    },
    {
      id: "youtube",
      icon: <Volume2 size={22} />,
      title: "YouTube reach, views, and engagements",
      desc: "Drive awareness and consideration of your product or brand",
    },
    {
      id: "store",
      icon: <MapPin size={22} />,
      title: "Local store visits and promotions",
      desc: "Drive visits to local stores, including restaurants and dealerships.",
    },
    {
      id: "none",
      icon: <Settings size={22} />,
      title: "Create a campaign without guidance",
      desc: "You'll choose a campaign next",
    },
  ];

  return (
    <Card>
      <CardHeader title="Choose your objective" />
      <p className="text-sm text-muted-foreground mb-6 px-6">
        Select an objective to tailor your experience to the goals and settings
        that will work best for your campaign
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-6">
        {objectives.map((o) => {
          const selected = data.objective === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setField("objective", o.id)}
              className={`relative text-left border rounded-lg p-5 transition-colors ${
                selected
                  ? "border-primary ring-1 ring-primary bg-primary/5/30"
                  : "border-border hover:border-border"
              }`}
            >
              {selected && (
                <span className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-0.5">
                  <Check size={14} />
                </span>
              )}
              <div
                className={`mb-3 ${selected ? "text-primary" : "text-foreground"}`}
              >
                {o.icon}
              </div>
              <h3
                className={`text-base font-medium mb-1 ${
                  selected ? "text-primary" : "text-foreground"
                }`}
              >
                {o.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-snug">
                {o.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Conversion goals block */}
      {data.objective === "sales" && (
        <div className="border-t border-border mt-2 px-6 py-6">
          <h3 className="text-base font-medium text-foreground mb-4">
            Use these conversion goals to improve Sales
          </h3>
          <div className="border border-border rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">
                Review your goals for this campaign
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Info size={14} className="text-primary" />
                <span className="underline">
                  This change overrides your account goals setup
                </span>
              </span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2 text-xs text-muted-foreground border-b border-border">
              <div className="col-span-5">Conversion Goals</div>
              <div className="col-span-4">Conversion Source</div>
              <div className="col-span-3">Conversion Actions</div>
            </div>
            {data.conversionGoals.map((g, i) => (
              <div
                key={i}
                className="grid grid-cols-12 items-center px-4 py-3 border-b border-border/50 last:border-0"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <GoalIcon name={g.name} />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {g.name}
                    </span>{" "}
                    <span className="text-xs text-muted-foreground">
                      (account default)
                    </span>
                    {g.beta && (
                      <span className="ml-2 inline-block text-[10px] uppercase tracking-wide bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                        Beta
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-4 text-sm text-foreground">
                  {g.source}
                </div>
                <div className="col-span-3 text-sm text-primary underline flex items-center justify-between">
                  {g.actions} action{g.actions > 1 ? "s" : ""}
                  <MoreVertical size={16} className="text-muted-foreground" />
                </div>
              </div>
            ))}
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => alert("Add goal feature coming soon")}
                className="text-sm text-primary hover:underline"
              >
                Add goal
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function GoalIcon({ name }) {
  const map = {
    Purchases: <CreditCard size={18} className="text-muted-foreground" />,
    Contacts: <Users size={18} className="text-muted-foreground" />,
    "Leads from messages": (
      <MessageSquare size={18} className="text-muted-foreground" />
    ),
    "Phone call leads": <Phone size={18} className="text-muted-foreground" />,
    "Store sales": <Store size={18} className="text-muted-foreground" />,
  };
  return map[name] || <Tag size={18} className="text-muted-foreground" />;
}

/* ---------- Step: Campaign type (Shopping locked) ---------- */
function TypeStep({ data, setField }) {
  const types = [
    {
      id: "pmax",
      title: "Performance Max",
      desc: "Drive sales by reaching the right people wherever they're browsing with ads on Google Search, YouTube, Display, and more.",
      disabled: true,
    },
    {
      id: "shopping",
      title: "Shopping",
      desc: "Promote your products from Merchant Center on Google Search with Shopping ads",
      disabled: false,
    },
    {
      id: "demand",
      title: "Demand Gen",
      desc: "Drive demand and conversions on YouTube, Google Display Network, and more with image and video ads",
      disabled: true,
    },
    {
      id: "search",
      title: "Search",
      desc: "Drive sales on Google Search with text ads",
      disabled: true,
    },
    {
      id: "video",
      title: "Video",
      desc: "Drive sales on YouTube with your video ads",
      disabled: true,
    },
    {
      id: "display",
      title: "Display",
      desc: "Reach potential customers across 3 million sites and apps with your creative",
      disabled: true,
    },
  ];
  return (
    <Card>
      <CardHeader title="Select a campaign type" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
        {types.map((t) => {
          const selected = data.campaignType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={t.disabled}
              onClick={() => !t.disabled && setField("campaignType", t.id)}
              className={`text-left border rounded-lg p-5 transition-colors ${
                selected
                  ? "border-primary ring-1 ring-primary bg-primary/5/30"
                  : t.disabled
                    ? "border-border opacity-50 cursor-not-allowed"
                    : "border-border hover:border-border"
              }`}
            >
              <div className="bg-muted rounded h-24 mb-4 flex items-center justify-center">
                <ShoppingBag className="text-muted-foreground" size={28} />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">
                {t.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-snug">
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>
      <p className="px-6 pb-6 text-xs text-muted-foreground">
        Only Shopping campaigns are supported here.
      </p>
    </Card>
  );
}

/* ---------- Step: Products (Merchant Center + name) ---------- */
function ProductsStep({ data, setField }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Add products to this campaign" expandable />
        <div className="px-6 pb-6">
          <Label>Select a Merchant Center account</Label>
          <div className="flex items-center gap-3 border border-border rounded-md px-3 py-2 max-w-md">
            <div className="w-8 h-8 bg-red-100 rounded text-destructive flex items-center justify-center text-xs font-bold">
              S
            </div>
            <input
              type="text"
              value={data.merchantAccount}
              onChange={(e) => setField("merchantAccount", e.target.value)}
              className="flex-1 outline-none text-sm"
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            All products from the selected account will be available to
            advertise in this campaign.{" "}
            <button
              type="button"
              onClick={() => setField("feedLabel", prompt("Enter feed label"))}
              className="text-primary hover:underline"
            >
              Select a feed label
            </button>
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Campaign name" />
        <div className="px-6 pb-6">
          <input
            type="text"
            value={data.campaignName}
            onChange={(e) => setField("campaignName", e.target.value)}
            className="w-full max-w-md border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>
    </div>
  );
}

/* ---------- Step: Budget & Bidding ---------- */
function BiddingStep({ data, setField }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-normal text-foreground">
          Budget and bidding optimization
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select optimization options that work best for your goals
        </p>
      </div>

      {/* Budget */}
      <Card>
        <CardHeader title="Budget" expandable />
        <div className="px-6 pb-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <InfoBanner>
              Your budget type (daily or campaign total) can't be changed once
              this campaign has started. You can change your budget amount at
              any time.
            </InfoBanner>
            <Label className="mt-4">Select budget type</Label>
            <Radio
              checked={data.budgetType === "daily"}
              onChange={() => setField("budgetType", "daily")}
              title="Average daily budget"
              desc="Set your average daily budget for this campaign"
            >
              {data.budgetType === "daily" && (
                <CurrencyInput
                  value={data.budgetAmount}
                  onChange={(v) => setField("budgetAmount", v)}
                />
              )}
            </Radio>
            <Radio
              checked={data.budgetType === "total"}
              onChange={() => setField("budgetType", "total")}
              title="Campaign total budget"
              desc="Set a budget for the duration of your campaign"
            >
              {data.budgetType === "total" && (
                <>
                  <CurrencyInput
                    value={data.budgetAmount}
                    onChange={(v) => setField("budgetAmount", v)}
                  />
                  <div className="mt-3 border border-border rounded-md px-4 py-3 flex items-center justify-between max-w-md">
                    <div className="text-sm text-foreground">
                      <div>Start date: {data.startDate}</div>
                      <div>End date: {data.endDate}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newStart = prompt(
                          "Enter start date",
                          data.startDate,
                        );
                        if (newStart) setField("startDate", newStart);
                        const newEnd = prompt("Enter end date", data.endDate);
                        if (newEnd) setField("endDate", newEnd);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </>
              )}
            </Radio>
          </div>
          <SideHelp>
            {data.budgetType === "daily"
              ? "For the month, you won't pay more than your daily budget times the average number of days in a month. Some days you might spend less than your daily budget, and on others you might spend up to twice as much."
              : "Your campaign total budget is what the campaign should spend over its runtime. To use a campaign total budget, you must add an end date for your campaign."}
            <a className="block text-primary mt-3" href="#">
              Learn more
            </a>
          </SideHelp>
        </div>
      </Card>

      {/* Bidding */}
      <Card>
        <CardHeader title="Bidding" expandable />
        <div className="px-6 pb-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <Label>
              Select your bid strategy{" "}
              <Info size={14} className="inline text-muted-foreground" />
            </Label>
            <Select
              value={data.bidStrategy}
              onChange={(v) => setField("bidStrategy", v)}
              groups={[
                {
                  label: "Automated bid strategies",
                  options: ["Target ROAS", "Maximize clicks"],
                },
                { label: "Manual bid strategies", options: ["Manual CPC"] },
              ]}
            />
          </div>
          <SideHelp>
            With "{data.bidStrategy}" bidding, you set your own maximum
            cost-per-click (CPC) for your ads.
            <a className="block text-primary mt-3" href="#">
              Learn more about determining a bid strategy
            </a>
          </SideHelp>
        </div>
      </Card>

      {/* Customer acquisition */}
      <Card>
        <CardHeader title="Customer acquisition" expandable />
        <div className="px-6 pb-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.customerAcquisition}
                onChange={(e) =>
                  setField("customerAcquisition", e.target.checked)
                }
                className="mt-1"
              />
              <span className="text-sm text-foreground">
                Adjust your bidding to help acquire new customers
              </span>
            </label>
          </div>
          <SideHelp>
            By default, your campaign bids equally for new and existing
            customers. However, you can configure your customer acquisition
            settings to optimize for acquiring new customers.
            <a className="block text-primary mt-3" href="#">
              Learn more about customer acquisition
            </a>
          </SideHelp>
        </div>
      </Card>

      {/* Campaign priority */}
      <Card>
        <CardHeader title="Campaign priority" expandable />
        <div className="px-6 pb-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <Label>
              Select a campaign priority{" "}
              <Info size={14} className="inline text-muted-foreground" />
            </Label>
            <Radio
              checked={data.campaignPriority === "low"}
              onChange={() => setField("campaignPriority", "low")}
              title="Low (default) — Recommended if you only have one Shopping campaign"
            />
            <Radio
              checked={data.campaignPriority === "medium"}
              onChange={() => setField("campaignPriority", "medium")}
              title="Medium"
            />
            <Radio
              checked={data.campaignPriority === "high"}
              onChange={() => setField("campaignPriority", "high")}
              title="High"
            />
          </div>
          <SideHelp>
            <strong className="block mb-1 text-foreground">
              When to use it
            </strong>
            If you have multiple campaigns with one product, use campaign
            priority to decide which campaign's bid will be used. If campaigns
            have the same priority, the campaign with the higher bid will serve.
          </SideHelp>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Step: Campaign Settings ---------- */
function SettingsStep({ data, setField }) {
  const toggle = (key, sub) =>
    setField(key, { ...data[key], [sub]: !data[key][sub] });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-normal text-foreground">
        Campaign settings
      </h2>

      <Card>
        <CardHeader title="Networks" expandable />
        <div className="px-6 pb-6 space-y-2">
          {[
            ["search", "Google Search Network"],
            ["youtube", "YouTube"],
            ["gmail", "Gmail"],
            ["discover", "Discover feed"],
          ].map(([k, label]) => (
            <Checkbox
              key={k}
              checked={data.networks[k]}
              onChange={() => toggle("networks", k)}
              label={label}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Devices" expandable />
        <div className="px-6 pb-6 space-y-2">
          {[
            ["computers", "Computers"],
            ["mobile", "Mobile phones"],
            ["tablets", "Tablets"],
            ["tv", "TV screens"],
          ].map(([k, label]) => (
            <Checkbox
              key={k}
              checked={data.devices[k]}
              onChange={() => toggle("devices", k)}
              label={label}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Locations" expandable />
        <div className="px-6 pb-6">
          <Label>Target locations</Label>
          <input
            type="text"
            value={data.locations}
            onChange={(e) => setField("locations", e.target.value)}
            className="w-full max-w-md border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Languages" expandable />
        <div className="px-6 pb-6">
          <Label>Target languages</Label>
          <input
            type="text"
            value={data.languages}
            onChange={(e) => setField("languages", e.target.value)}
            className="w-full max-w-md border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Start and end dates" expandable />
        <div className="px-6 pb-6 grid grid-cols-2 gap-4 max-w-md">
          <div>
            <Label>Start date</Label>
            <input
              type="text"
              value={data.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <Label>End date</Label>
            <input
              type="text"
              value={data.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Step: Ad group ---------- */
function AdGroupStep({ data, setField }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-normal text-foreground">Ad group</h2>

      <Card>
        <CardHeader title="Ad group name" />
        <div className="px-6 pb-6">
          <input
            type="text"
            value={data.adGroupName}
            onChange={(e) => setField("adGroupName", e.target.value)}
            className="w-full max-w-md border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Default bid" />
        <div className="px-6 pb-6">
          <Label>Maximum CPC bid</Label>
          <CurrencyInput
            value={data.defaultBid}
            onChange={(v) => setField("defaultBid", v)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Products" />
        <div className="px-6 pb-6 space-y-2">
          <Radio
            checked={data.productScope === "all"}
            onChange={() => setField("productScope", "all")}
            title="All products"
            desc="Advertise all products from the selected Merchant Center account"
          />
          <Radio
            checked={data.productScope === "filtered"}
            onChange={() => setField("productScope", "filtered")}
            title="Use a filter"
            desc="Choose a subset of products by attribute"
          />
        </div>
      </Card>
    </div>
  );
}

/* ---------- Step: Summary ---------- */
function SummaryStep({ data, user, onPublish }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Convert networks object to array
      const networksList = Object.entries(data.networks)
        .filter(([, v]) => v)
        .map(([k]) => k);

      // Convert devices object to array
      const devicesList = Object.entries(data.devices)
        .filter(([, v]) => v)
        .map(([k]) => k);

      // Parse dates
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr === "None") return null;
        const date = new Date(dateStr);
        return isNaN(date) ? null : date;
      };

      const campaignPayload = {
        name: data.campaignName,
        objective: data.objective,
        campaignType: data.campaignType,
        merchantCenterId: data.merchantAccount?.split(" ")?.[0],
        merchantCenterName: data.merchantAccount,
        budget: parseFloat(data.budgetAmount) || 0,
        budgetType: data.budgetType,
        biddingStrategy: data.bidStrategy,
        networks:
          networksList.length > 0
            ? networksList
            : ["Google Search", "Google Shopping"],
        devices: devicesList.length > 0 ? devicesList : ["mobile", "desktop"],
        locations:
          typeof data.locations === "string"
            ? [data.locations]
            : data.locations || [],
        languages:
          typeof data.languages === "string"
            ? [data.languages]
            : data.languages || [],
        schedule: {
          startDate: parseDate(data.startDate),
          endDate: parseDate(data.endDate),
          adSchedules: [],
        },
        priority:
          data.campaignPriority === "low"
            ? 0
            : data.campaignPriority === "medium"
              ? 1
              : 2,
        customerAcquisitionCost: data.customerAcquisition ? null : null,
        adGroups: [
          {
            name: data.adGroupName,
            defaultBid: parseFloat(data.defaultBid) || 0,
            productPartition: data.productScope,
          },
        ],
        conversionGoals: data.conversionGoals
          .filter((g) => g.default)
          .map((g) => g.name),
        companyId: user?.companyId,
        userId: user?.userId,
        status: "draft",
        notes: `Created on ${new Date().toLocaleDateString()}`,
      };

      const response = await fetch(`${API_URL}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to publish campaign: ${response.statusText}`);
      }

      const result = await response.json();

      // Show success message
      setSuccess(true);
      toast({
        title: "Success",
        description: `Campaign "${data.campaignName}" created successfully!`,
      });

      // Redirect after a short delay
      setTimeout(() => {
        onPublish();
      }, 1500);
    } catch (err) {
      const errorMsg = err.message || "Failed to publish campaign";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      console.error("Error publishing campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    ["Campaign type", "Shopping"],
    ["Objective", titleCase(data.objective)],
    ["Merchant Center", data.merchantAccount],
    ["Campaign name", data.campaignName],
    [
      "Budget",
      `${data.budgetType === "daily" ? "Daily" : "Total"} ${data.budgetAmount ? "₹" + data.budgetAmount : "—"}`,
    ],
    ["Bid strategy", data.bidStrategy],
    ["Customer acquisition", data.customerAcquisition ? "Enabled" : "Disabled"],
    ["Campaign priority", titleCase(data.campaignPriority)],
    [
      "Networks",
      Object.entries(data.networks)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", "),
    ],
    [
      "Devices",
      Object.entries(data.devices)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", "),
    ],
    ["Locations", data.locations],
    ["Languages", data.languages],
    ["Start date", data.startDate],
    ["End date", data.endDate],
    ["Ad group", data.adGroupName],
    ["Default bid", data.defaultBid ? "₹" + data.defaultBid : "—"],
    ["Products", data.productScope === "all" ? "All products" : "Filtered"],
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-normal text-foreground">
        Review and publish
      </h2>
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">
            Campaign summary
          </h3>
        </div>
        <dl className="divide-y divide-gray-100">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-12 px-6 py-3 text-sm">
              <dt className="col-span-4 text-muted-foreground">{k}</dt>
              <dd className="col-span-8 text-foreground">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handlePublish}
          disabled={loading}
          className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Publishing..." : "Publish campaign"}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable bits                                                              */
/* -------------------------------------------------------------------------- */

function Card({ children }) {
  return (
    <section className="bg-card border border-border rounded-lg">
      {children}
    </section>
  );
}

function CardHeader({ title, expandable }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {expandable && (
        <ChevronDown size={18} className="text-muted-foreground" />
      )}
    </div>
  );
}

function Label({ children, className = "" }) {
  return (
    <div className={`text-sm font-medium text-foreground mb-2 ${className}`}>
      {children}
    </div>
  );
}

function InfoBanner({ children }) {
  return (
    <div className="flex items-start gap-3 bg-primary/5 border border-blue-100 rounded-md px-4 py-3 text-sm text-foreground">
      <Info size={18} className="text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Radio({ checked, onChange, title, desc, children }) {
  return (
    <div className="py-2">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          className="mt-1 accent-primary"
        />
        <div>
          <div className="text-sm font-medium text-foreground">{title}</div>
          {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
        </div>
      </label>
      {children && <div className="ml-7 mt-2">{children}</div>}
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-primary"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

function CurrencyInput({ value, onChange }) {
  return (
    <div className="flex items-center border border-border rounded-md px-3 py-2 max-w-[180px] focus-within:border-primary">
      <span className="text-muted-foreground text-sm mr-2">₹</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full outline-none text-sm"
      />
    </div>
  );
}

function Select({ value, onChange, groups }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative max-w-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-border rounded-md px-3 py-2 text-sm bg-card focus:border-primary"
      >
        <span>{value}</span>
        <ChevronDown size={16} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg py-2">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 py-1 text-xs text-muted-foreground">
                {g.label}
              </div>
              {g.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-primary/5 ${
                    value === opt
                      ? "bg-primary/5 text-blue-700"
                      : "text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SideHelp({ children }) {
  return (
    <aside className="col-span-12 lg:col-span-4 text-sm text-muted-foreground lg:border-l lg:border-border lg:pl-6">
      {children}
    </aside>
  );
}

function GoogleAdsLogo({ small }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={small ? 22 : 28}
        height={small ? 22 : 28}
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path fill="#FBBC04" d="M7 3l7 12-3.5 6L3 9z" />
        <path fill="#4285F4" d="M14 3l7 12-3.5 6L10 9z" />
        <circle cx="6.5" cy="19.5" r="2.5" fill="#34A853" />
      </svg>
      <span
        className={`font-medium text-foreground ${small ? "text-sm" : "text-base"}`}
      >
        Google Ads
      </span>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.1l6.6 4.8C14.6 15.3 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5c-7.5 0-14 4.3-17.7 10.6z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.5 34.4 26.9 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.2 16.4 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3c-.4.4 6.7-4.9 6.7-15 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function titleCase(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}
