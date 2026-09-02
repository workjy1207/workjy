// netlify/functions/get-results.js
//
// save-results.js가 저장해둔 최신 결과를 조회합니다.
// 연차 앱의 "주문현황" 탭이 이 주소를 호출해서 데이터를 받아갑니다.
//
// 요청 예시:
//   GET /.netlify/functions/get-results

import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const store = getStore({
      name: "order-dashboard",
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });

    const record = await store.get("latest", { type: "json" });

    if (!record) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, updatedAt: null, sites: [] }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, ...record }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(e.message || e) }),
    };
  }
};
