// netlify/functions/save-results.js

import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = event.headers["x-api-key"];
  if (!process.env.SAVE_API_KEY || apiKey !== process.env.SAVE_API_KEY) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const record = {
    updatedAt: new Date().toISOString(),
    sites: payload.sites || [],
  };

  try {
    const store = getStore({
      name: "order-dashboard",
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
    await store.setJSON("latest", record);
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e.message || e) }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
