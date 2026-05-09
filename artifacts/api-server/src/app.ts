import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;
app.use(cors({ credentials: true, origin: corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/account/me", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deletion — Tropely</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 0 24px; line-height: 1.7; color: #1a1a1a; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    p { margin: 12px 0; }
    ol { padding-left: 20px; }
    li { margin: 8px 0; }
    .note { background: #f5f5f5; border-left: 3px solid #888; padding: 12px 16px; border-radius: 4px; font-size: 0.95rem; }
  </style>
</head>
<body>
  <h1>Account Deletion Request</h1>
  <p>To delete your Tropely account and all associated data, follow these steps:</p>
  <ol>
    <li>Open the <strong>Tropely</strong> app on your device.</li>
    <li>Go to the <strong>Profile</strong> tab.</li>
    <li>Scroll to the bottom and tap <strong>Delete account</strong>.</li>
    <li>Confirm twice when prompted — your account will be permanently removed.</li>
  </ol>
  <p class="note">All user data, including your profile, reading history, journal entries, and chat messages, will be permanently deleted and cannot be recovered.</p>
  <p>If you no longer have access to the app, email us at <a href="mailto:support@tropely.app">support@tropely.app</a> with your registered email address to request manual deletion.</p>
</body>
</html>`);
});

app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  }),
);

app.use("/api", router);

export default app;
