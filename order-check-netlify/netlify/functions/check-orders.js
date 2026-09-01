// netlify/functions/check-orders.js
//
// 매일 KST 15:00(=UTC 06:00)에 자동 실행됩니다.
// 오늘의집 / 토스쇼핑 / 알리익스프레스 주문을 조회해서 이메일로 발송합니다.
//
// 필요한 환경변수 (Netlify 사이트 설정 → Environment variables 에 등록):
//   OHOU_API_KEY
//   TOSS_API_KEY
//   ALI_APP_KEY, ALI_APP_SECRET, ALI_ACCESS_TOKEN
//   MAIL_USER        (네이버 아이디, 예: xxx@naver.com)
//   MAIL_PASS        (네이버 애플리케이션 비밀번호)
//   MAIL_TO          (결과 받을 메일 주소, 콤마로 여러 개 가능)

import { schedule } from "@netlify/functions";
import nodemailer from "nodemailer";

const today = () => new Date().toISOString().slice(0, 10);

// ── 오늘의집 ──────────────────────────────────────────
async function fetchOhouOrders() {
  const apiKey = process.env.OHOU_API_KEY;
  if (!apiKey) return { site: "오늘의집", error: "API 키 없음", orders: [] };
  try {
    // TODO: 실제 발급받은 문서 기준 엔드포인트로 교체
    const res = await fetch(`https://api.ohou.se/scm/v1/orders?date=${today()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const orders = data.orders ?? (Array.isArray(data) ? data : []);
    return { site: "오늘의집", orders };
  } catch (e) {
    return { site: "오늘의집", error: e.message, orders: [] };
  }
}

// ── 토스쇼핑 ──────────────────────────────────────────
async function fetchTossOrders() {
  const apiKey = process.env.TOSS_API_KEY;
  if (!apiKey) return { site: "토스쇼핑", error: "API 키 없음", orders: [] };
  try {
    // TODO: 실제 발급받은 문서 기준 엔드포인트로 교체
    const res = await fetch(`https://apis.shopping.toss.im/v1/orders?date=${today()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const orders = data.orders ?? (Array.isArray(data) ? data : []);
    return { site: "토스쇼핑", orders };
  } catch (e) {
    return { site: "토스쇼핑", error: e.message, orders: [] };
  }
}

// ── 알리익스프레스 ────────────────────────────────────
async function fetchAliOrders() {
  const appKey = process.env.ALI_APP_KEY;
  const accessToken = process.env.ALI_ACCESS_TOKEN;
  if (!appKey || !accessToken) return { site: "알리익스프레스", error: "API 키 없음", orders: [] };
  // 알리 Open API는 요청 파라미터에 서명(sign)이 필요해 별도 확정 후 연결합니다.
  return { site: "알리익스프레스", error: "서명 방식 확정 필요 (수동 확인 중)", orders: [] };
}

function buildEmailBody(results) {
  let total = 0;
  const lines = results.map((r) => {
    if (r.error) return `■ ${r.site}: 확인 실패 — ${r.error}`;
    total += r.orders.length;
    if (!r.orders.length) return `■ ${r.site}: 신규 주문 없음`;
    const detail = r.orders.map((o, i) => `   ${i + 1}. ${JSON.stringify(o)}`).join("\n");
    return `■ ${r.site}: ${r.orders.length}건\n${detail}`;
  });
  return `${today()} 주문내역 확인 결과 (총 ${total}건)\n\n${lines.join("\n\n")}`;
}

async function sendMail(subject, text) {
  const { MAIL_USER, MAIL_PASS, MAIL_TO } = process.env;
  if (!MAIL_USER || !MAIL_PASS || !MAIL_TO) {
    console.log("메일 환경변수 미설정 — 콘솔에만 출력합니다.");
    console.log(text);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: "smtp.naver.com",
    port: 587,
    secure: false,
    auth: { user: MAIL_USER, pass: MAIL_PASS },
  });
  await transporter.sendMail({
    from: MAIL_USER,
    to: MAIL_TO,
    subject,
    text,
  });
}

const checkOrders = async () => {
  const results = await Promise.all([fetchOhouOrders(), fetchTossOrders(), fetchAliOrders()]);
  const body = buildEmailBody(results);
  await sendMail(`[주문확인] ${today()}`, body);
  return { statusCode: 200, body: "done" };
};

// 매일 UTC 06:00 = KST 15:00
export const handler = schedule("0 6 * * *", checkOrders);
