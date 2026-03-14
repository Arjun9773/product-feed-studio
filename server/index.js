require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/tenant/products'));
app.use('/api/feeds', require('./routes/tenant/feeds'));
app.use('/api/audit', require('./routes/tenant/audit'));
app.use('/api/title-rules', require('./routes/tenant/titleRules'));
app.use('/api/custom-labels', require('./routes/tenant/customLabels'));
app.use('/api/output-feeds', require('./routes/tenant/outputFeeds'));

app.post('/api/test-signup', (req, res) => res.json({ ok: true, body: req.body }));
app.get('/', (req, res) => res.json({ message: 'Product Feed Studio API running' }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
