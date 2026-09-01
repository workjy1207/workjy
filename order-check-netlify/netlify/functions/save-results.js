// netlify/functions/save-results.js
//
// 로컬 스크립트(check_seller_sites.py 등)가 실행 후 결과를 이 주소로 POST하면
// Netlify Blobs에 저장합니다. 대시보드(get-results)가 이 데이터를 읽어서 보여줍니다.
//
// 요청 예시:
//   POST /.netlify/functions/save-results
//   Header: x-api-key: (SAVE_API_KEY 환경변수와 동일한 값)
//   Body(JSON): { "sites": [ { "name": "기아몰", "count": 3, "status": "ok" }, ... ] }

import { getStore } from "@netlify/blobs";

function orderStore() {
  return getStore({
    name: "order-dashboard",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 아무나 결과를 덮어쓰지 못하도록 간단한 키 확인
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
    const store = orderStore();
    await store.setJSON("latest", record);
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e.message || e) }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
