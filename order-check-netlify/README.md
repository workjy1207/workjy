# 주문내역 자동 확인 (Netlify Scheduled Functions)

매일 KST 15:00에 오늘의집·토스쇼핑·알리익스프레스 주문을 조회해서
지정한 메일로 결과를 보내주는 서버리스 함수입니다.

## 배포 방법 (드래그 배포 불가 — Git 연결 필요)

예약 함수는 정적 파일 드롭으로는 동작하지 않아, GitHub 저장소를 통해 배포해야 합니다.

1. 이 폴더를 GitHub 새 저장소에 업로드 (비공개 저장소 권장 — API 키가 담긴 코드는 아니지만 만약을 대비)
2. Netlify 대시보드 → "Add new site" → "Import an existing project" → 방금 만든 저장소 선택
3. 빌드 설정은 그대로 두고 배포 (netlify.toml에 이미 설정됨)
4. 배포 완료 후 Netlify 사이트 → Site configuration → Environment variables 에서 아래 값 등록:

   | 이름 | 값 |
   |---|---|
   | OHOU_API_KEY | 오늘의집 SCM에서 발급받은 키 |
   | TOSS_API_KEY | 토스쇼핑 내 연동 키 |
   | ALI_APP_KEY / ALI_APP_SECRET / ALI_ACCESS_TOKEN | 알리 셀러센터에서 발급 |
   | MAIL_USER | 네이버 아이디 (예: xxx@naver.com) |
   | MAIL_PASS | 네이버 애플리케이션 비밀번호 (2단계 인증 계정은 별도 발급) |
   | MAIL_TO | 결과를 받을 메일 주소 |

5. 환경변수 등록 후 "Trigger deploy"로 재배포 (환경변수는 재배포해야 반영됩니다)
6. Netlify 대시보드 → Functions → check-orders 에서 정상 등록되었는지, 예약 시간(cron)이 맞는지 확인

## 테스트

배포된 함수는 Netlify 대시보드의 Functions 탭에서 수동으로 "Trigger" 실행해
메일이 오는지 먼저 확인해보시길 권합니다. 매일 자동 실행을 기다리지 않아도 됩니다.

## 대시보드

`public/index.html`이 대시보드 화면입니다. 배포 주소(`https://YOUR-SITE.netlify.app`)로 접속하면
사이트별 신규 건수를 한 화면에서 볼 수 있습니다.

1. 환경변수에 `SAVE_API_KEY` 추가 (아무 임의의 문자열, 예: 랜덤 32자) — 로컬 스크립트만 결과를 쓸 수 있게 막는 비밀키입니다.
2. 로컬 `.env`의 `DASHBOARD_URL`을 `https://YOUR-SITE.netlify.app/.netlify/functions/save-results`로,
   `DASHBOARD_API_KEY`를 위에서 정한 값과 동일하게 입력
3. 로컬 스크립트(`check_seller_sites.py`)를 한 번 실행하면 대시보드에 결과가 뜹니다.
4. 매일 15시 작업 스케줄러 실행 후 대시보드를 열어 확인하면 됩니다.

## 참고

- `netlify/functions/check-orders.js` 안의 오늘의집·토스 API URL은 실제 발급 문서 기준으로
  다를 수 있어 표시만 해둔 상태입니다. 문서 화면 캡처를 주시면 정확히 맞춰드릴게요.
- 알리익스프레스는 요청마다 서명(sign)이 필요한 방식이라 별도 작업이 더 필요합니다.
- API 키는 절대 코드에 직접 적지 말고 항상 Netlify 환경변수로만 등록하세요.
