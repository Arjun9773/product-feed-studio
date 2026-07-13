# Product Feed Studio

Monorepo with separate **client** (frontend) and **server** (backend) folders.

## Project structure

```
product-feed-studio/
├── client/          # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Express + MongoDB backend
│   ├── routes/
│   ├── models/
│   ├── uploads/
│   └── package.json
└── package.json     # Root scripts to run both apps
```

## Setup

Install dependencies for both apps:

```bash
npm run install:all
```

Or install separately:

```bash
npm install --prefix client
npm install --prefix server
```

Copy `server/.env` and configure your environment variables (MongoDB, JWT, Google OAuth, etc.).

## Development

Run frontend and backend together:

```bash
npm run dev
```

Or run each app separately:

```bash
npm run dev:client   # http://localhost:8080
npm run dev:server   # http://localhost:5000
```

## Build

```bash
npm run build
```

Build output is written to `client/dist`.
