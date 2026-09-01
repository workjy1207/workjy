// netlify/functions/get-results.js
// 대시보드 페이지가 최신 결과를 불러올 때 호출합니다.

import { getStore } from "@netlify/blobs";

export const handler = async () => {
  const store = getStore("order-dashboard");
  const record = (await store.get("latest", { type: "json" })) || {
    updatedAt: null,
    sites: [],
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  };
};
