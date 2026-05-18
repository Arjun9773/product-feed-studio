require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { connectDB } = require("./config/db");
const cronRoutes = require("./routes/cronRoutes");
const path = require("path");
const aiRoutes = require("./routes/tenant/ai");
const keywordsRouter = require("./routes/tenant/keywords");
const oauthRoutes = require("./routes/oauth");
const campaignsRouter = require("./routes/campaigns");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
app.use(express.json());

// Session Middleware for OAuth
app.use(
  session({
    secret: process.env.JWT_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Static files — 
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth", oauthRoutes);
app.use("/api/campaigns", require("./routes/campaigns"));
app.use("/api/products", require("./routes/tenant/products"));
app.use("/api/feeds", require("./routes/tenant/feeds"));
app.use("/api/audit", require("./routes/tenant/audit"));
app.use("/api/title-rules", require("./routes/tenant/titleRules"));
app.use("/api/custom-labels", require("./routes/tenant/customLabels"));
app.use("/api/output-feeds", require("./routes/tenant/outputFeeds"));
app.use("/api/settings", require("./routes/tenant/settings"));
app.use("/api/google-categories", require("./routes/tenant/googleCategories"));
app.use("/api/cron", cronRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/keywords", keywordsRouter);
app.use("/api/campaigns", campaignsRouter);

app.post("/api/test-signup", (req, res) =>
  res.json({ ok: true, body: req.body }),
);
app.get("/", (req, res) =>
  res.json({ message: "Product Feed Studio API running" }),
);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  const { initAllCrons } = require("./services/cronService");
  await initAllCrons();
});
