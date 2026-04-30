# Product Understanding & API Contract Report

เอกสารนี้ทำหน้าที่คืน product ownership ให้เจ้าของโปรเจกต์ โดยอธิบายโปรเจกต์ Lottery Intelligence Dashboard / LottoLens-style product จาก code จริงใน repository นี้ ไม่ใช่จากความจำหรือไอเดียลอย ๆ

แนวคิดหลักของ product คือ:

> ผู้ใช้มีเลขที่สนใจอยู่แล้ว แล้วเอาเลขนั้นมาให้ระบบช่วยดูจากข้อมูลย้อนหลังว่าเลขนี้มีสัญญาณอะไรบ้าง เช่น เคยออกบ่อยไหม หายไปนานไหม มี pattern แบบไหน คะแนนมาจากอะไร และควรเก็บไว้ดูต่อไหม โดยไม่ claim ว่าทำนายหวยได้แน่นอน

ข้อควรจำตลอดเอกสาร:

- ระบบนี้ไม่ใช่เครื่องทำนายผลหวยแน่นอน
- ระบบนี้เป็นเครื่องมือช่วยวิเคราะห์เลขย้อนหลัง
- UI ใหม่ควรทำให้คนทั่วไปเข้าใจว่า "เลขนี้น่าสนใจเพราะอะไร" ไม่ใช่ทำให้เหมือน dashboard สำหรับทีม data
- เลขหวยต้องเก็บเป็น string เสมอ เพราะเลขอย่าง `09`, `001234` ห้ามหาย leading zero

---

# 0. Executive Summary

## โปรเจกต์นี้คืออะไร

โปรเจกต์นี้คือเว็บ product สำหรับดูผลหวยย้อนหลัง วิเคราะห์เลขจากสถิติย้อนหลัง ทดลองสร้าง candidate numbers และเก็บเลขที่สนใจไว้ใน watchlist

จาก `README.md`:

```md
# Lottery Intelligence Dashboard

Production-oriented MVP for a user-facing lottery analytics dashboard.
```

อธิบายทีละบรรทัด:

- `Lottery Intelligence Dashboard` คือชื่อ product ปัจจุบัน ยังสะท้อน dashboard mindset อยู่
- `Production-oriented MVP` แปลว่าไม่ใช่แค่ mock แล้ว มี API, DB, service จริง
- `user-facing lottery analytics dashboard` แปลว่า user ทั่วไปเป็นคนใช้ แต่คำว่า dashboard อาจทำให้ UI หนักไปทาง data team

## User คือใคร

User หลักไม่ใช่นัก data และไม่ใช่ admin แต่เป็นคนทั่วไปที่มีเลขในใจ เช่น:

- เห็นเลขจากความฝัน
- มีเลขทะเบียน
- มีเลขวันเกิด
- มีเลขที่ชอบ
- มีเลขจาก social แล้วอยากตรวจว่ามีสัญญาณย้อนหลังไหม

เขาไม่ได้อยากอ่าน schema หรือ raw stat เขาอยากรู้ว่า:

- เลขนี้เคยออกไหม
- ออกบ่อยแค่ไหน
- หายไปนานหรือยัง
- มี pattern อะไร
- เลขนี้ควรเก็บไว้ดูต่อไหม
- มีเหตุผลอะไรที่ระบบให้คะแนน

## User ต้องการอะไร

User ต้องการ "ความมั่นใจแบบมีเหตุผล" และ "ความสนุกแบบไม่หลอกตัวเอง"

Product ต้องตอบคำถามหลัก:

> เลขนี้มีสัญญาณอะไรจากอดีต และระบบตีความให้ฉันเข้าใจง่าย ๆ ได้ไหม

## Core Loop

Core loop ที่ควรเป็นแกน UI ใหม่:

1. ได้เลข
2. ใส่เลข
3. ระบบวิเคราะห์ย้อนหลัง
4. ได้เหตุผลและ score
5. save/share
6. กลับมาดูเลขเดิมหรือเปรียบเทียบเลขใหม่

## จุดที่ต้อง focus ตอน redesign UI

UI ใหม่ควรลด dashboard-heavy pages แล้วดัน core loop ขึ้นเป็นหน้าแรก:

- input เลขเด่นชัด
- result card อธิบายภาษาคน
- signal card อ่านง่าย
- save to watchlist ง่าย
- compare เลขหลายตัวแบบเข้าใจทันที
- chart เป็นรอง ไม่ใช่สิ่งแรกที่ user ต้องเจอ

## ข้อจำกัด repo ที่กระทบ product ownership

Source: `AGENTS.md`

```md
Lottery Intelligence Dashboard is a user-facing lottery statistics and prediction MVP. The current scope is scaffold-first: keep architecture modular, preserve boundaries, and avoid implementing feature behavior unless explicitly requested.
```

อธิบายทีละบรรทัด:

- `user-facing` แปลว่า product นี้ควรออกแบบเพื่อคนใช้จริง ไม่ใช่ internal admin
- `lottery statistics and prediction MVP` แปลว่ามีทั้งข้อมูลย้อนหลัง สถิติ และการเสนอ candidate
- `scaffold-first` คือช่วงเริ่มต้นเคยเน้นโครงสร้างก่อน ทำให้ UI หลายส่วนยังมีร่องรอย dashboard/contract mindset
- `keep architecture modular` ทำให้ code แยกชั้นดี แต่ owner ต้องเข้าใจว่าแต่ละชั้นมีหน้าที่ต่างกัน
- `avoid implementing feature behavior unless explicitly requested` คือเดิมตั้งใจไม่ให้ AI เติม behavior เอง แต่หลาย phase ล่าสุด AI ได้ช่วยต่อ feature จริงแล้ว เอกสารนี้จึงจำเป็นเพื่อคืน ownership

ผลต่อ UI:

- redesign ต้องเริ่มจาก product goal ไม่ใช่จากจำนวน page/module ที่มี
- owner ควรเลือกเองว่า feature ไหนเป็น core, feature ไหนเป็น advanced

---

# 1. Product Brain

## Product 1 ประโยค

LottoLens-style product คือเครื่องมือช่วยให้ผู้ใช้ใส่เลขที่สนใจ แล้วระบบอธิบายจากข้อมูลหวยย้อนหลังว่าเลขนั้นมีความถี่ ความห่าง pattern และเหตุผลสนับสนุนอะไรบ้าง เพื่อช่วยตัดสินใจอย่างสนุกและมีสติ

## User Journey

1. User เข้ามาพร้อมเลข เช่น `09`
2. User พิมพ์เลขลง search หรือ compare
3. ระบบหาเลขนั้นในผลย้อนหลังและ stats
4. ระบบแสดง:
   - เคยออกกี่ครั้ง
   - คิดเป็นกี่ %
   - หายไปกี่งวด
   - ล่าสุดออกเมื่อไร
   - มี pattern เช่น odd/even/high/low/double หรือไม่
5. User กด save เข้า watchlist
6. User กลับมาดู watchlist เพื่อ track เลขที่สนใจ
7. ถ้าอยากทดลองต่อ ใช้ Prediction Lab หรือ Compare

## Pain / Desire

Pain:

- ข้อมูลหวยย้อนหลังหาได้ แต่ตีความยาก
- เว็บหวยส่วนใหญ่เน้น hype หรือ claim เกินจริง
- คนทั่วไปไม่เข้าใจศัพท์ stat
- ไม่มีที่เก็บเลขพร้อมเหตุผลว่าทำไมถึงสนใจ

Desire:

- อยากเห็น "เหตุผล"
- อยากเปรียบเทียบเลข
- อยากเก็บเลข
- อยากรู้ว่าเลขนี้ร้อน เย็น หรือหายไปนาน
- อยากมั่นใจขึ้นโดยไม่ถูกหลอกว่าแม่นแน่นอน

## Core Loop แบบ Product

> ได้เลข -> ใส่ -> วิเคราะห์ -> ได้เหตุผล -> save/share -> กลับมา

Feature ทุกตัวควรผูกกลับมาที่ loop นี้:

- Results = ฐานข้อมูลย้อนหลัง
- Analytics = เครื่องคิดสถิติ
- Compare = user เอาเลขมาเทียบ
- Prediction Lab = ระบบเสนอ candidate จากสัญญาณ
- Watchlist = ที่เก็บเลขของ user
- Search = ทางลัดค้นเลข
- Dashboard = ควรลดบทบาทเป็น overview หรือ redirect เข้า core action

---

# 2. Page Inventory

Source ของ route หลักอยู่ที่ `README.md` และ `src/lib/app/navigation.ts`

Snippet จาก `README.md`:

```md
## App Routes

- `/`
- `/dashboard`
- `/results`
- `/analytics`
- `/patterns`
- `/prediction-lab`
- `/backtest`
- `/watchlist`
- `/compare`
- `/calendar`
- `/methodology`
```

อธิบายทีละบรรทัด:

- แต่ละบรรทัดคือหน้า user-facing ที่มี route จริง
- route เหล่านี้คือ inventory ปัจจุบันของ product
- สำหรับ redesign ควรจัดลำดับใหม่ตาม user journey ไม่ใช่ตาม technical module

Snippet จาก `src/lib/app/navigation.ts`:

```ts
export const userNavigation = [
  { href: "/dashboard", label: "เธ เธฒเธเธฃเธงเธก" },
  { href: "/results", label: "เธเธฅเธขเนเธญเธเธซเธฅเธฑเธ" },
  { href: "/analytics", label: "เธงเธดเน€เธเธฃเธฒเธฐเธซเน" },
  { href: "/patterns", label: "เนเธเธ•เน€เธ—เธดเธฃเนเธ" },
  { href: "/prediction-lab", label: "เธซเนเธญเธเธ—เธ”เธฅเธญเธเธ—เธณเธเธฒเธข" },
  { href: "/backtest", label: "เธ—เธ”เธชเธญเธเธขเนเธญเธเธซเธฅเธฑเธ" },
  { href: "/watchlist", label: "เธฃเธฒเธขเธเธฒเธฃเน€เธเนเธฒเธ”เธน" },
  { href: "/compare", label: "เน€เธเธฃเธตเธขเธเน€เธ—เธตเธขเธ" },
  { href: "/calendar", label: "เธเธเธดเธ—เธดเธ" },
  { href: "/methodology", label: "เธงเธดเธเธตเธเธณเธเธงเธ“" }
] as const;
```

อธิบายทีละบรรทัด:

- `userNavigation` คือ source ของเมนู user-facing
- `href` คือ path ที่ user ไปได้
- `label` ตอนนี้เป็น mojibake หรือ Thai encoding เสีย อ่านไม่ออก
- `as const` ทำให้ TypeScript มอง list นี้เป็นค่าคงที่

ผลต่อ UI:

- Navigation ตอนนี้สะท้อนโครงระบบ แต่ label เสีย ทำให้ user ใช้งานไม่ได้จริงถ้าแสดง label ชุดนี้
- UI redesign ควรแก้ navigation language ใหม่ด้วยภาษาคน เช่น "วิเคราะห์เลข", "เปรียบเทียบ", "เลขที่บันทึก", "ผลย้อนหลัง"

ถ้าตัด logic นี้ออก:

- Sidebar/menu จะไม่มี source กลาง
- User จะหลงทางระหว่างหน้า

## ตาราง Page Inventory

| หน้า | route | user เปิดมาดูอะไร | ได้อะไร | API | MVP | ควร redesign ยังไง |
|---|---|---|---|---|---|---|
| Home | `/` | product intro | ยังเป็นหน้าแนะนำ | ไม่มีหลัก | ควรมี | เปลี่ยนเป็น input เลขทันที |
| Dashboard | `/dashboard` | ภาพรวมล่าสุด | latest draw, signals, prediction summary | `GET /api/dashboard` | advanced overview | ลดความเป็น control room, ดัน CTA "ใส่เลข" |
| Results | `/results` | ผลย้อนหลัง | draw list, prize records, filters | `GET /api/draws` | must have | ทำเป็นฐานข้อมูลค้นเลข |
| Result Detail | `/results/:id` | รายละเอียดงวด | prizes ของงวดเดียว | `GET /api/draws/:id` | must have | card ผลงวดเดียวอ่านง่าย |
| Analytics | `/analytics` | สถิติเชิงลึก | digit/number stats, pattern summary | `GET /api/analytics` | should have | ซ่อน stat หนักไว้หลัง result card |
| Patterns | `/patterns` | pattern summary | ใช้ analytics model | `GET /api/analytics` ผ่าน helper | advanced | ทำเป็น insight library |
| Prediction Lab | `/prediction-lab` | ทดลอง candidate | generated prediction results | `GET/POST /api/predictions` | should have | rename เป็น "ไอเดียเลข" หรือ "ทดลองสัญญาณ" |
| Backtest | `/backtest` | ทดสอบย้อนหลัง | hit rate, miss streak, history | `GET/POST /api/backtests` | advanced | ให้คนทั่วไปดูเป็น trust section ไม่ใช่หน้าแรก |
| Watchlist | `/watchlist` | เลขที่บันทึก | saved numbers + stats | `GET/POST/PATCH/DELETE /api/watchlist` | must have | ทำเป็น personal notebook |
| Compare | `/compare` | เทียบเลขหลายตัว | ranked candidates | `POST /api/compare` | must have | ควรเป็น core action |
| Calendar | `/calendar` | งวดถัดไป/อดีต | next draw, recent draws, monthly insights | `GET /api/calendar` | optional | ทำเป็น contextual utility |
| Methodology | `/methodology` | วิธีคิด | explanation/static content | ไม่มีหลัก | must have for trust | ทำเป็น trust page อ่านง่าย |
| Search | `/search` | ค้นเลข/งวด | grouped search results | `GET /api/search` | must have | ควรเป็น global entry point |

## Page-by-page ownership notes

### Home `/`

คืออะไร:

- หน้าแรกของ product
- ปัจจุบันเป็น product intro มากกว่า tool

User คาดหวัง:

- เห็นช่องใส่เลขใน 5 วินาที
- รู้ทันทีว่า product ทำอะไรกับเลขของเขา

UI ใหม่ควรเป็น:

- Hero เป็น input เลข
- CTA: "วิเคราะห์เลขนี้"
- รอง CTA: "เปรียบเทียบหลายเลข"
- หลัง submit ไป `/compare` หรือ `/search?q=...`

### Dashboard `/dashboard`

Code ที่ดึงข้อมูล:

`src/frontend/pages/dashboard/dashboard.data.ts`

```ts
export async function getDashboardPageData(): Promise<DashboardPageData> {
  try {
    const model = await apiGet<DashboardReadModel>(apiRoutes.dashboard, {
      cache: "no-store",
      schema: dashboardReadModelSchema
    });
```

อธิบายทีละบรรทัด:

- `getDashboardPageData` คือ data loader ของหน้า Dashboard
- `apiGet<DashboardReadModel>` คือเรียก API แล้วคาดหวัง shape ตาม dashboard schema
- `apiRoutes.dashboard` คือ `/api/dashboard`
- `cache: "no-store"` คือไม่ใช้ cache ของ fetch เพื่อให้ข้อมูลสด
- `schema: dashboardReadModelSchema` คือ validate response ก่อน UI ใช้

ผลต่อ UI:

- UI จะแสดง latest draw, metrics, signals, prediction summary จาก API เดียว
- ถ้า API fail หน้าไม่ควรแสดง mock signals ปลอม

ถ้าตัด logic นี้ออก:

- Dashboard จะกลับไปเป็น hardcoded UI หรือข้อมูลไม่ตรง DB

Redesign:

- Dashboard ไม่ควรเป็นหน้าแรกหลักสำหรับ user ทั่วไป
- ควรกลายเป็น "สรุปวันนี้" พร้อม CTA ไปวิเคราะห์เลข

### Results `/results`

Code:

`src/frontend/pages/results/results.data.ts`

```ts
const response = await apiGet<DrawListResponse>(apiRoutes.draws, {
  cache: "no-store",
  query: toResultsApiQuery(query),
  schema: drawListResponseSchema
});
```

อธิบายทีละบรรทัด:

- เรียก `/api/draws`
- ส่ง query จาก URL เช่น `q`, `prizeType`, `year`
- validate response ด้วย `drawListResponseSchema`
- output ถูก map ไปเป็น results read model

ผลต่อ UI:

- user ค้นเลขจากผลย้อนหลังได้
- URL share ได้ เช่น `/results?q=09`

Redesign:

- Results ควรเป็น "คลังผลย้อนหลัง" ไม่ใช่หน้า hero ใหญ่
- ช่องค้นเลขควรเด่นกว่า table

### Analytics `/analytics`

Code:

`src/frontend/pages/analytics/analytics.data.ts`

```ts
const model = await apiGet<AnalyticsReadModel>(apiRoutes.analytics, {
  cache: "no-store",
  query: toAnalyticsApiQuery(query),
  schema: analyticsReadModelSchema
});
```

อธิบายทีละบรรทัด:

- เรียก `/api/analytics`
- ส่ง filter เช่น `windowSize`, `prizeType`, `numberLength`
- validate ด้วย schema
- ได้ numberStats/digitStats/patternSummaries

ผลต่อ UI:

- charts/table ทั้งหมดมาจาก API analytics
- ถ้า user ไม่เข้าใจ stat หน้าอาจหนักเกินไป

Redesign:

- ทำเป็น "ดูสถิติย้อนหลัง" สำหรับคนที่อยากเจาะลึก
- อย่าใช้เป็นหน้าแรกของ core loop

### Prediction Lab `/prediction-lab`

Code:

`src/frontend/pages/prediction-lab/prediction-lab.data.ts`

```ts
export async function getLatestPredictionRun() {
  try {
    return await apiGet<PredictionResponse>(apiRoutes.predictions, {
      cache: "no-store",
      schema: predictionResponseSchema
    });
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) {
      return null;
    }
```

อธิบายทีละบรรทัด:

- โหลด prediction run ล่าสุดจาก `/api/predictions`
- ถ้า 404 แปลว่า "ยังไม่มี run" ไม่ใช่ระบบพัง
- return `null` ให้ UI แสดง no-run state
- error อื่น throw ต่อให้ UI แสดง error

ผลต่อ UI:

- หน้าเปิดมาแล้วโหลด run ล่าสุดได้
- ถ้ายังไม่เคย generate ต้องชวน user กด generate

Redesign:

- เปลี่ยนภาษาเป็น "ไอเดียเลขจากสัญญาณย้อนหลัง"
- อย่าใช้คำว่า AI ทำนายแม่น

### Compare `/compare`

Code:

`src/frontend/pages/compare/compare.data.ts`

```ts
export async function runCompareRequest(payload: CompareRequest) {
  return apiPost<CompareReadModel>(apiRoutes.compare, payload, {
    schema: compareReadModelSchema
  });
}
```

อธิบายทีละบรรทัด:

- รับ payload ที่มาจาก form
- POST ไป `/api/compare`
- validate response ด้วย `compareReadModelSchema`
- output คือ ranking ของเลขที่ user ใส่เอง

ผลต่อ UI:

- Compare คือ feature ที่ตรง core loop มากที่สุด
- User มีเลขอยู่แล้ว จึงควรเจอ feature นี้เร็ว

Redesign:

- ทำเป็น "ใส่เลขหลายตัวเพื่อเทียบเหตุผล"
- result card ต้องอธิบายว่า score มาจากอะไร

### Watchlist `/watchlist`

Code:

`src/api/service/watchlist.service.ts`

```ts
export async function getWatchlist() {
  const prisma = getPrisma();
  const items = await prisma.userWatchlistItem.findMany({
    orderBy: {
      updatedAt: "desc"
    }
  });
  const enrichedItems = await enrichWatchlistItems(items);

  return toApiWatchlistReadModel(enrichedItems);
}
```

อธิบายทีละบรรทัด:

- ดึงรายการเลขที่ user save ไว้
- เรียงตาม updated ล่าสุด
- เติม stats ให้แต่ละเลขผ่าน `enrichWatchlistItems`
- ส่งออกเป็น API read model

ผลต่อ UI:

- Watchlist ไม่ใช่แค่ note แต่เป็น notebook ที่มีสัญญาณย้อนหลัง
- item ที่ไม่มี stats ต้องยังแสดงได้

Redesign:

- ทำเป็น "เลขของฉัน"
- แต่ละเลขควรมี mini insight เช่น "หายไป 12 งวด", "เคยออก 4 ครั้ง"

### Search `/search`

Code:

`src/api/service/search.service.ts`

```ts
return {
  generatedAt,
  groups: {
    draws: draws.map((draw) => ({
      drawDate: draw.drawDate.toISOString(),
      drawNo: draw.drawNo ?? "-",
      id: draw.id,
      sourceStatus: draw.sourceStatus
    })),
    prizes: prizes.map((prize) => ({
      drawDate: prize.draw.drawDate.toISOString(),
      drawId: prize.drawId,
      drawNo: prize.draw.drawNo ?? "-",
      id: prize.id,
      number: prize.number,
      prizeType: prize.type as ApiWatchlistPrizeType
    })),
```

อธิบายทีละบรรทัด:

- response แบ่งเป็น groups
- `draws` คือเจองวดที่เกี่ยวข้อง
- `prizes` คือเจอเลขรางวัลที่ match
- `stats` และ `watchlist` อยู่ต่อจาก snippet นี้
- UI สามารถแยก section ได้ทันที

ผลต่อ UI:

- Search ควรเป็น entry point หลักของ product
- User ไม่ต้องรู้ว่าจะไป Results หรือ Analytics ก่อน

Redesign:

- ทำ global search box บนหน้าแรก/หัวเว็บ
- ผลลัพธ์ควรพูดว่า "พบเลขนี้ในผลย้อนหลัง", "มีสถิติ", "อยู่ใน watchlist"

### Patterns `/patterns`

Code:

`src/frontend/pages/patterns/index.tsx`

```ts
export async function PatternsPage() {
  const analytics = await getAnalyticsModel();
  const patternCells = toPatternHeatmapCells(analytics);
  const flaggedNumbers = getFlaggedNumbers(analytics);
```

อธิบายทีละบรรทัด:

- หน้า Patterns ไม่ได้มี API ของตัวเอง
- มัน reuse analytics model เดิมผ่าน `getAnalyticsModel()`
- `toPatternHeatmapCells` คือแปลง analytics ไปเป็น cell สำหรับ heatmap
- `getFlaggedNumbers` คือเลือกเลขที่มี pattern น่าสนใจ

ผู้ใช้เข้ามาดูอะไร:

- ดูรูปแบบเลขแบบ odd/even/high/low/double/ascending/descending/mirror

ได้อะไร:

- pattern summaries
- flagged numbers
- heatmap ของ pattern

ปัญหาเดิม:

- สำหรับคนทั่วไป หน้านี้ลึกเกินและมาช้าเกินใน user journey
- ใช้ภาษาฝั่ง analytics มากกว่าภาษาคน

UI ใหม่ควรเป็น:

- ถ้าคงไว้ ให้เป็น "คลัง insight รูปแบบเลข"
- อย่าอยู่ในเมนูหลักก่อน Compare / Watchlist / Search

### Methodology `/methodology`

Code:

`src/frontend/pages/methodology/index.tsx`

```ts
export function MethodologyPage() {
  return (
    <main className="space-y-6">
```

อธิบาย:

- หน้า Methodology เป็น trust page
- ไม่มี API call
- ใช้ content file ล้วนเพื่ออธิบายคำศัพท์ วิธีให้คะแนน และข้อจำกัด

ผู้ใช้เข้ามาดูอะไร:

- ระบบคิดยังไง
- score คืออะไร
- backtest อ่านยังไง
- monthly insight ใช้อย่างไร
- อะไรที่ระบบ "ไม่" claim

ต้องเห็นอะไรใน 5 วินาที:

- ข้อความเตือนว่าไม่ใช่การการันตี
- score breakdown
- link ย้อนกลับไปหน้าวิเคราะห์

UI ใหม่ควรเป็น:

- หน้าที่อ่านง่ายมาก
- มีตัวอย่าง "เลขหนึ่งตัวถูกประเมินยังไง"
- ควรเป็นฐาน copywriting ของหน้าอื่นด้วย

### Home `/`

Code:

`src/app/page.tsx`

```ts
import { HomePage } from "@/frontend/pages/home";

export default HomePage;
```

อธิบาย:

- route root ใช้ `HomePage` ตรง ๆ
- หน้าแรกจึงมีผลต่อ first impression ของ product โดยตรง

Code route-level:

`src/frontend/pages/home/index.tsx`

```ts
export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
```

อธิบาย:

- หน้าแรกตอนนี้เป็น landing/product intro
- ยังไม่ใช่ core loop page ที่ให้ user เริ่มวิเคราะห์เลขทันที

ผู้ใช้คาดหวัง:

- ถ้าเข้ามาจาก search/social ควรเห็นช่องใส่เลขทันที

ปัญหาเดิม:

- หน้าแรกยังเป็น marketing/overview มากกว่า action surface
- มี feature cards เยอะก่อน user ได้เริ่มใช้ product

UI ใหม่ควรเป็น:

- hero + search/input
- compare CTA
- watchlist/social proof รองลงมา

### App Shell และ Navigation

Code:

`src/app/(user)/layout.tsx`

```ts
export default function UserLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
```

อธิบาย:

- ทุกหน้าในกลุ่ม `(user)` ถูกครอบด้วย `AppShell`
- แปลว่า navigation, mobile header, sidebar เป็น shared shell ของ product

Code:

`src/frontend/components/layout/AppShell.tsx`

```ts
<Sidebar items={userNavigation} pathname={pathname} />
...
<div className="hidden w-full max-w-xs md:block">
  <Input placeholder="เธเนเธเธซเธฒเธเธงเธ” เน€เธฅเธ เธซเธฃเธทเธญเนเธ—เนเธ" />
</div>
```

อธิบายทีละบรรทัด:

- ใช้ `Sidebar` จาก `userNavigation`
- มี search input บน header แต่ตอนนี้ยังไม่ wire เข้ากับ `/search`
- placeholder ยังเป็น mojibake

ผลต่อ UI:

- Product มี intent จะมี global search
- แต่ current shell ยังไม่ complete

Code:

`src/frontend/components/search/GlobalSearch.tsx`

```ts
export function GlobalSearch() {
  return null;
}
```

อธิบาย:

- มี component ชื่อ GlobalSearch จริง
- แต่ตอนนี้ยังไม่ได้ทำอะไรเลย
- นี่คือช่องว่าง product ที่ชัดเจน: search backend พร้อมแล้ว แต่ global entry point ยังไม่เสร็จ

---

# 3. Feature Map

## Feature: ดูผลย้อนหลัง

คืออะไร:

- ดูงวดหวยย้อนหลังและเลขรางวัลในแต่ละงวด

Code service:

`src/api/service/draw.service.ts`

```ts
const [draws, total] = await Promise.all([
  prisma.lotteryDraw.findMany({
    include: {
      prizes: true
    },
    orderBy: {
      drawDate: "desc"
    },
    skip,
    take: pageSize,
    where
  }),
  prisma.lotteryDraw.count({ where })
]);
```

อธิบายทีละบรรทัด:

- `Promise.all` ดึง list และ count พร้อมกัน
- `lotteryDraw.findMany` คือ query งวดหวย
- `include.prizes` คือดึงเลขรางวัลมาด้วย
- `orderBy.drawDate desc` คือเอางวดล่าสุดขึ้นก่อน
- `skip/take` คือ pagination
- `where` คือ filter จาก query
- `count` คือจำนวนทั้งหมดเพื่อทำ pagination

Input:

- `lotteryType`, `prizeType`, `q`, `year`, `month`, `startDate`, `endDate`, `page`, `pageSize`

Output:

- list ของ draw พร้อม prizes

UI ที่เหมาะ:

- search-first list
- cards สำหรับงวดล่าสุด
- detail page สำหรับงวดเดียว

Edge cases:

- ไม่มีผลลัพธ์ -> empty state
- API fail -> error state
- งวด partial -> warning badge

## Feature: วิเคราะห์สถิติ

คืออะไร:

- เปลี่ยน raw prize rows เป็น stat เช่น frequency, missingDrawCount, patternFlags

Code:

`src/api/service/analytics.service.ts`

```ts
export async function getAnalyticsReadModel(query: AnalyticsQuery) {
  const materialized = await getMaterializedAnalyticsReadModel(query);

  if (materialized) {
    return materialized;
  }

  const prisma = getPrisma();

  return buildAnalyticsReadModelFromPrizes(await getPrizeWindow(prisma, query), query, new Date());
}
```

อธิบายทีละบรรทัด:

- รับ query เช่น `windowSize=120`
- ลองอ่าน materialized stats ก่อน
- ถ้ามี cache ก็ return ทันที
- ถ้าไม่มี cache ค่อย query DB สด
- `getPrizeWindow` เลือกงวดล่าสุดตาม window
- `buildAnalyticsReadModelFromPrizes` คำนวณสถิติ

Input:

- filter context เช่น prizeType, numberLength, windowSize

Output:

- `digitStats`, `numberStats`, `patternSummaries`

UI ที่เหมาะ:

- result card สำหรับ top number
- table สำหรับคนอยากเจาะลึก
- heatmap ใช้เสริม ไม่ใช่สิ่งแรก

## Feature: Compare เลขที่ user ใส่

คืออะไร:

- User ใส่เลขหลายตัว แล้วระบบให้คะแนนและเหตุผลเทียบกัน

Code:

`src/api/service/compare.service.ts`

```ts
const candidates = numbers
  .filter((number) => number.length === numberLength)
  .map((number, index) =>
    scoreNumber({
      inputWindow: input.windowSize,
      rank: index + 1,
      stat:
        statsByNumber.get(number) ??
        createEmptyNumberStat({
          computedAt,
          input,
          number,
          numberLength,
          sampleStat: numberStats[0]
        }),
      strategy
    })
  )
```

อธิบายทีละบรรทัด:

- เอาเลขที่ user ใส่มา filter ให้ตรงความยาว
- วนแต่ละเลขเพื่อคำนวณ score
- ถ้ามี stat จริง ใช้ stat จริง
- ถ้าไม่เจอ stat สร้าง empty stat เพื่อให้เลขยังถูก compare ได้
- ส่งเข้า `scoreNumber`

Input:

- numbers, strategyId, prizeType, windowSize, numberLength

Output:

- candidates เรียงคะแนน

UI ที่เหมาะ:

- ใส่เลขทีละหลายตัว
- result cards แบบ ranked
- อธิบาย "ทำไมเลขนี้ได้คะแนน"

## Feature: Prediction Lab

คืออะไร:

- ระบบเลือก candidate จาก numberStats แล้ว score ด้วย strategy

Code:

`src/api/service/prediction.service.ts`

```ts
const rankedResults = numberStats
  .map((stat, index) =>
    scoreNumber({
      inputWindow: input.windowSize,
      rank: index + 1,
      stat,
      strategy
    })
  )
  .sort((left, right) => right.score - left.score)
  .slice(0, input.count)
```

อธิบายทีละบรรทัด:

- เริ่มจาก numberStats ทั้งหมด
- แปลง stat แต่ละตัวเป็น prediction result
- ใช้ strategy ที่ user เลือก
- sort คะแนนมากไปน้อย
- ตัดจำนวนตาม `count`

Input:

- count, lotteryType, numberLength, prizeType, strategyId, windowSize

Output:

- prediction response พร้อม reasons

UI ที่เหมาะ:

- ควรพูดว่า "generated ideas" หรือ "เลขที่มีสัญญาณ"
- ต้องแสดง disclaimer เสมอ

## Feature: Watchlist

คืออะไร:

- user save เลขไว้ดูต่อ พร้อม note/tags และ stats enrichment

Code:

`src/api/service/watchlist.service.ts`

```ts
return items.map((item) => ({
  ...item,
  stats: statsByNumber.get(item.number)
}));
```

อธิบายทีละบรรทัด:

- เอา item เดิมจาก DB
- เติม `stats` ถ้ามีเลขตรงกับ analytics
- ถ้าไม่มี stats ก็ยัง return item ได้

Input:

- number, source, tags, note

Output:

- watchlist items + optional stats

UI ที่เหมาะ:

- notebook card
- แสดง stat แบบภาษาคน เช่น "หายไป 8 งวด"

## Feature: Search

คืออะไร:

- ค้นเลข/งวด/watchlist/stat จาก query เดียว

Code:

`src/api/service/search.service.ts`

```ts
if (!q) {
  return {
    generatedAt,
    groups: {
      draws: [],
      prizes: [],
      stats: [],
      watchlist: []
    },
    q,
    source: "api"
  };
}
```

อธิบายทีละบรรทัด:

- ถ้า query ว่าง ไม่ถือเป็น error
- คืน empty groups
- UI ใช้แสดง empty state ได้

Input:

- `q`

Output:

- grouped hits

UI ที่เหมาะ:

- global search
- grouped result sections

## Feature: Backtest

คืออะไร:

- เอา strategy ไปลองย้อนหลังว่าถ้าใช้แนวคิดนี้ในอดีตจะ hit แค่ไหน

Code:

`src/api/service/backtest.service.ts`

```ts
const results = runWalkForwardBacktest({
  candidateCount: input.candidateCount,
  draws,
  numberLength: input.numberLength,
  prizeType: input.prizeType,
  runId,
  strategy,
  windowSize: input.windowSize
});
```

อธิบายทีละบรรทัด:

- ส่งจำนวน candidate
- ส่ง draws ย้อนหลัง
- ส่ง length/prize type
- ส่ง strategy
- ส่ง window
- ได้ผลจำลองย้อนหลัง

UI ที่เหมาะ:

- trust/support page
- ไม่ควรเป็นหน้าแรกของคนทั่วไป

## Feature: Calendar

คืออะไร:

- แสดงงวดถัดไป งวดย้อนหลัง และ monthly insight

Code:

`src/api/service/calendar.service.ts`

```ts
const nextDraw = nextPersistedDraw
  ? {
      drawDate: formatCalendarDate(nextPersistedDraw.drawDate),
      drawDateIso: nextPersistedDraw.drawDate,
      drawNo: nextPersistedDraw.drawNo ?? undefined,
      id: nextPersistedDraw.id,
      isNextDraw: true,
      status: "upcoming" as const
    }
  : buildSyntheticNextDraw(computedAt, recentDraws[0]?.drawDate);
```

อธิบายทีละบรรทัด:

- ถ้า DB มีงวดอนาคต ใช้งวดนั้นเป็น next draw
- ถ้าไม่มี สร้างงวดถัดไปแบบ synthetic
- UI จึงมี next draw แสดงเสมอ

UI ที่เหมาะ:

- แสดง context ไม่ใช่ feature หลัก

---

# 4. Glossary ภาษาคน

| คำ | แปลแบบง่าย | ตัวอย่างหวย | UI ใช้ยังไง | ข้อควรระวัง |
|---|---|---|---|---|
| draw | งวดหวย | งวดวันที่ 16 เมษายน 2026 | card งวด | ต้องแยกอดีต/อนาคต |
| prize | รางวัลในงวด | รางวัลที่ 1, เลขท้าย 2 ตัว | list เลขในงวด | เลขต้องเป็น string |
| prizeType | ประเภทรางวัล | `TWO_DIGIT`, `FIRST` | filter/chip | user ไม่ควรเห็น enum ดิบทั้งหมด |
| frequency | ออกบ่อยแค่ไหน | เลข `09` ออก 4 จาก 120 งวด | percent label | ไม่ใช่โอกาสงวดหน้า |
| hitCount | จำนวนครั้งที่เจอ | เจอ `09` 4 ครั้ง | stat card | ขึ้นกับ window |
| missingDrawCount | หายไปกี่งวด | ไม่เจอมา 12 งวด | overdue badge | หายไปนานไม่ได้แปลว่าต้องออก |
| hot | ออกบ่อยใน window | `24` ออกบ่อยกว่าเลขอื่น | red/semantic card | ห้ามสื่อว่าเลขร้อนต้องซื้อ |
| cold | ออกน้อย | `03` ไม่ค่อยเจอ | blue/neutral card | ไม่ใช่เลขไม่ดี |
| overdue | หายไปนาน | `91` ไม่ออกหลายงวด | amber card | ไม่ใช่ guarantee |
| score | คะแนนรวม | 82/100 | ranking | เป็น heuristic ไม่ใช่ probability |
| confidence | ความมั่นใจเชิง product | "ข้อมูลพอ/ไม่พอ" | copy เช่น "sample 120 งวด" | ตอนนี้ code ไม่มี field confidence ตรง ๆ |
| pattern | รูปแบบเลข | เลขคู่, เลขสูง, เลขเบิ้ล | badges | pattern เป็นคำอธิบาย ไม่ใช่สูตรชนะ |
| backtest | ทดลองย้อนหลัง | ถ้าใช้ strategy นี้เมื่อ 120 งวดก่อนจะ hit ไหม | trust section | ผลอดีตไม่รับประกันอนาคต |
| prediction | candidate จาก scoring | ระบบเสนอ `09`, `24` | result card | ต้องเรียกว่า signal/idea ไม่ใช่เลขแม่น |
| windowSize | จำนวนงวดที่ใช้ดูย้อนหลัง | 30/60/120 งวด | filter | window ต่างกันผลต่างกัน |
| numberLength | จำนวนหลักของเลข | 2, 3, 6 | selector | ต้อง match prizeType |
| materialized stats | สถิติที่คำนวณไว้ก่อน | cache 120 งวดของเลขท้าย 2 ตัว | invisible to user | ถ้าไม่มี cache ระบบ fallback สด |
| DTO | ตัวแปลงข้อมูลก่อนส่ง API | Date object -> ISO string | ไม่มีใน UI โดยตรง | ถ้า mapping ผิด UI จะพัง |
| schema | กติกาข้อมูล | `numberLength` ต้องเป็น 2/3/6 | validate form/API | schema คือ contract |

---

# 5. Schema Dictionary พร้อม code

Source: `prisma/schema.prisma`

## Enums

Snippet:

```prisma
enum LotteryPrizeType {
  FIRST
  THREE_DIGIT
  THREE_FRONT
  THREE_BACK
  TWO_DIGIT
  NEAR_FIRST
  PRIZE2
  PRIZE3
  PRIZE4
  PRIZE5
  OTHER
}
```

อธิบายทีละบรรทัด:

- `FIRST` รางวัลที่ 1
- `THREE_DIGIT` เลข 3 ตัวจาก historical CSV ที่ไม่แยกหน้า/หลัง
- `THREE_FRONT`, `THREE_BACK` สำหรับ schema ที่รองรับหวยแบบแยกหน้า/หลัง
- `TWO_DIGIT` เลขท้าย 2 ตัว
- `NEAR_FIRST` รางวัลข้างเคียงรางวัลที่ 1
- `PRIZE2` ถึง `PRIZE5` รางวัลที่ 2-5
- `OTHER` เผื่อข้อมูลที่ยังจัด bucket ไม่ได้

ผลต่อ UI:

- UI ไม่ควรโชว์ enum ดิบทั้งหมด
- ควรแปลเป็น "รางวัลที่ 1", "เลขท้าย 2 ตัว", "รางวัลที่ 2"

## Model: LotteryDraw

Snippet:

```prisma
model LotteryDraw {
  id              String           @id @default(uuid(7)) @map("_id") @db.Uuid
  lotteryType     LotteryType      @default(THAI_GOVERNMENT)
  drawDate        DateTime
  drawNo          String?
  sourceUrl       String?
  sourceStatus    SourceStatus     @default(IMPORTED)
  publishedAt     DateTime?
  metadata        Json?
  prizes          LotteryPrize[]
  backtestResults BacktestResult[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@unique([lotteryType, drawDate])
  @@index([drawDate])
  @@index([sourceStatus])
  @@index([publishedAt])
  @@map("lottery_draws")
}
```

อธิบายทีละบรรทัด:

- `id` คือ UUID v7 ใช้เป็น key ใน URL detail
- `lotteryType` ตอนนี้มี `THAI_GOVERNMENT`
- `drawDate` คือวันที่ออกหวย
- `drawNo` คือเลขงวด ถ้ามี
- `sourceUrl` คือแหล่งข้อมูล
- `sourceStatus` บอกคุณภาพข้อมูล เช่น imported/partial/verified
- `publishedAt` คือวันเผยแพร่ ถ้ามี
- `metadata` เก็บข้อมูลเสริมจาก import
- `prizes` คือ relation ไป `LotteryPrize`
- `backtestResults` คือ relation ไปผล backtest ที่ใช้ draw นี้
- `createdAt/updatedAt` คือ audit timestamp
- `@@unique([lotteryType, drawDate])` กันงวดซ้ำ
- `@@map("lottery_draws")` map model เป็น table name จริง

Field dictionary:

| field | type | คืออะไร | ใช้กับหน้าไหน | ตัวอย่าง | warning |
|---|---|---|---|---|---|
| id | String UUID | รหัสงวด | Results detail, Backtest | `018...` | ห้ามเอาไปโชว์เป็น content หลัก |
| lotteryType | enum | ประเภทหวย | ทุกหน้า | `THAI_GOVERNMENT` | ตอนนี้รองรับแค่ชนิดเดียว |
| drawDate | DateTime | วันที่ออก | Results, Calendar | `2026-04-16` | ต้องระวัง timezone |
| drawNo | String? | เลขงวด | Results, Dashboard | `16/2026` | อาจไม่มี |
| sourceStatus | enum | สถานะข้อมูล | Results badges | `PARTIAL` | partial ไม่ใช่ error |
| metadata | Json? | raw import context | detail/admin future | csv info | user ไม่ควรเห็น raw JSON |

Raw vs computed:

- `LotteryDraw` คือ raw persisted data
- `coverage`, `statusLabel`, formatted date เป็น computed ใน DTO

## Model: LotteryPrize

Snippet:

```prisma
model LotteryPrize {
  id        String           @id @default(uuid(7)) @map("_id") @db.Uuid
  drawId    String           @db.Uuid
  draw      LotteryDraw      @relation(fields: [drawId], references: [id], onDelete: Cascade)
  type      LotteryPrizeType
  position  Int?
  number    String
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@index([drawId])
  @@index([type, number])
  @@map("lottery_prizes")
}
```

อธิบายทีละบรรทัด:

- `drawId` เชื่อม prize กับงวด
- `onDelete: Cascade` ถ้าลบงวด prizes จะถูกลบตาม
- `type` คือประเภทของรางวัล
- `position` ใช้เมื่อรางวัลเดียวมีหลายเลข เช่น รางวัลที่ 2 หลายรายการ
- `number` เป็น string เพื่อรักษา leading zero
- index `[type, number]` ช่วยค้นเลขเร็วขึ้น

Leading zero:

- `number` ต้องเป็น `String`
- ห้ามแปลงเป็น number ใน UI หรือ API เพราะ `09` จะกลายเป็น `9`

## Model: UserWatchlistItem

Snippet:

```prisma
model UserWatchlistItem {
  id        String          @id @default(uuid(7)) @map("_id") @db.Uuid
  number    String
  source    WatchlistSource @default(MANUAL)
  tags      String[]
  note      String?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@index([number])
  @@index([updatedAt])
  @@map("user_watchlist_items")
}
```

อธิบาย:

- เก็บเลขที่ user สนใจ
- `source` บอกว่ามาจาก user เอง, prediction, หรือ notebook
- `tags` ทำให้ user จัดกลุ่มเลขได้
- `note` คือเหตุผลส่วนตัว

UI:

- ควรเป็น personal notebook
- stats ที่แสดงบน watchlist ไม่ได้เก็บใน table นี้ แต่ enrich ตอนอ่าน

## Model: PredictionRun และ PredictionResult

Snippet:

```prisma
model PredictionRun {
  id           String             @id @default(uuid(7)) @map("_id") @db.Uuid
  strategy     String
  lotteryType  LotteryType?
  prizeType    LotteryPrizeType?
  numberLength Int?
  windowSize   Int?
  count        Int?
  generatedAt  DateTime?
  version      String?
  params       Json?
  items        PredictionResult[]
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}
```

อธิบาย:

- `PredictionRun` คือการ generate prediction หนึ่งครั้ง
- `strategy` คือวิธีถ่วงคะแนน
- `lotteryType/prizeType/numberLength/windowSize/count` คือ input สำคัญที่ต้องจำไว้
- `generatedAt` คือเวลาที่ generate
- `version` คือ version ของ scoring engine
- `params` คือ metadata/legacy fallback
- `items` คือผลลัพธ์แต่ละเลข

Snippet:

```prisma
model PredictionResult {
  id             String        @id @default(uuid(7)) @map("_id") @db.Uuid
  runId          String        @db.Uuid
  run            PredictionRun @relation(fields: [runId], references: [id])
  number         String
  score          Float
  reasons        String[]
  inputWindow    Int?
  numberLength   Int?
  rank           Int?
  scoreBreakdown Json?
  strategyId     String?
  strategyName   String?
  version        String?
}
```

อธิบาย:

- `PredictionResult` คือเลข candidate หนึ่งตัวใน run
- `number` เป็น string
- `score` คือคะแนนรวม
- `reasons` คือข้อความอธิบาย
- `scoreBreakdown` คือคะแนนย่อย เช่น hot/overdue/pattern

Run vs result:

- Run = การทดลองหนึ่งครั้ง
- Result = เลขแต่ละตัวที่ได้จาก run นั้น

## Model: DigitStatSnapshot และ NumberStatSnapshot

Snippet:

```prisma
model NumberStatSnapshot {
  lotteryType      LotteryType
  prizeType        LotteryPrizeType
  windowSize       Int
  number           String
  numberLength     Int
  drawCount        Int
  hitCount         Int
  frequencyPercent Float
  lastSeenDrawDate DateTime?
  missingDrawCount Int
  averageGap       Float?
  maxGap           Float?
  trendScore       Float
  patternFlags     Json?
  computedAt       DateTime
}
```

อธิบาย:

- Snapshot คือ computed data ไม่ใช่ raw result
- `windowSize` บอกดูย้อนหลังกี่งวด
- `hitCount` จำนวนครั้งที่เลขเจอ
- `frequencyPercent` สัดส่วนจาก sample
- `missingDrawCount` จำนวนงวดหลังสุดที่ไม่เจอ
- `trendScore` คะแนน heuristic ของความถี่+ความสด
- `computedAt` เวลา compute cache

ใช้กับ:

- Analytics
- Prediction
- Compare
- Watchlist enrichment
- Search stats

Warning:

- ถ้า snapshot stale UI อาจยังตอบได้เพราะมี fallback on-demand แต่ performance จะต่าง

## Model: BacktestRun และ BacktestResult

Snippet:

```prisma
model BacktestRun {
  strategyId        String
  strategyName      String
  lotteryType       LotteryType
  prizeType         LotteryPrizeType
  numberLength      Int
  startDrawDate     DateTime
  endDrawDate       DateTime
  candidateCount    Int
  hitRate           Float
  longestMissStreak Int
  averageHitRank    Float?
  coverage          Int
  computedAt        DateTime
  version           String
  results           BacktestResult[]
}
```

อธิบาย:

- `BacktestRun` คือการทดลองย้อนหลังหนึ่งครั้ง
- `hitRate` คือ % ที่ candidate เคย hit actual result
- `longestMissStreak` คือพลาดต่อเนื่องนานสุด
- `coverage` คือจำนวนงวดที่ถูกใช้ทดสอบ

Snippet:

```prisma
model BacktestResult {
  drawId           String      @db.Uuid
  draw             LotteryDraw @relation(fields: [drawId], references: [id])
  drawDate         DateTime
  generatedNumbers String[]
  actualNumbers    String[]
  isHit            Boolean
  hitNumbers       String[]
  rankOfHit        Int?
}
```

อธิบาย:

- `generatedNumbers` คือเลขที่ strategy เสนอในงวดจำลอง
- `actualNumbers` คือเลขที่ออกจริง
- `isHit` บอกว่ามีเลขตรงไหม
- `rankOfHit` บอกถ้าตรง ตรงอันดับที่เท่าไร

---

# 6. DTO Dictionary พร้อม code

DTO คือชั้นแปลงข้อมูล backend/raw DB ให้เป็น shape ที่ API ส่งออกไป UI ใช้

## Draw DTO

Path: `src/api/model/dto/draw.dto.ts`

```ts
export function toApiDraw(draw: DrawDtoInput): ApiDraw {
  const prizes = [...(draw.prizes ?? [])].sort(sortPrizeInput).map(toApiDrawPrize);
  const drawDateIso = normalizeDateString(draw.drawDate);
  const sourceStatus = getSourceStatus(draw.sourceStatus, prizes.length);
  const status = getDrawStatus(sourceStatus, prizes.length);
  const metadata = getMetadata(draw.metadata);
```

อธิบายทีละบรรทัด:

- รับ draw raw object
- sort prize แล้ว map เป็น API prize
- ทำ date เป็น ISO
- normalize sourceStatus
- คำนวณ display status เช่น complete/partial/imported
- sanitize metadata

ผลต่อ UI:

- UI ไม่ต้องรู้ DB detail
- UI ได้ `statusLabel`, `coverage`, formatted date

ถ้าตัด DTO นี้:

- หน้า Results ต้องทำ logic status เองและเสี่ยงไม่เหมือนกันทุกหน้า

## Analytics DTO

Path: `src/api/model/dto/analytics.dto.ts`

```ts
export function toApiNumberStat(stat: NumberStatDtoInput): ApiNumberStat {
  return {
    computedAt: normalizeDateString(stat.computedAt),
    drawCount: stat.drawCount,
    frequencyPercent: stat.frequencyPercent,
    hitCount: stat.hitCount,
```

อธิบาย:

- แปลง stat ภายในให้เป็น API contract
- date เป็น string
- copy `patternFlags` เป็น array ใหม่

UI:

- Analytics/Compare/Watchlist ใช้ field นี้เป็นภาษากลาง

## Prediction DTO

Path: `src/api/model/dto/prediction.dto.ts`

```ts
export function toApiPredictionResult(result: PredictionResultDtoInput): ApiPredictionResult {
  return {
    id: result.id,
    inputWindow: result.inputWindow,
    number: result.number,
    numberLength: result.numberLength,
    rank: result.rank,
    reasons: [...result.reasons],
    score: result.score,
    scoreBreakdown: { ...result.scoreBreakdown },
```

อธิบาย:

- `number` คือเลข candidate
- `rank` คืออันดับ
- `reasons` clone array เพื่อไม่ส่ง reference เดิม
- `scoreBreakdown` clone object

UI:

- Prediction card ต้องแสดง number, score, reasons, breakdown

## Dashboard DTO

Path: `src/api/model/dto/dashboard.dto.ts`

```ts
export function toApiDashboardReadModel(input: DashboardDtoInput): ApiDashboardReadModel {
  return {
    ...input,
    contractRows: input.contractRows.map((row) => ({ ...row })),
    generatedAt: normalizeDateString(input.generatedAt),
```

อธิบาย:

- clone object หลัก
- clone contract rows
- normalize generatedAt
- clone nested fields ต่อ

UI:

- Dashboard ได้ read model เดียวพร้อมใช้

## Watchlist DTO

Path: `src/api/model/dto/watchlist.dto.ts`

```ts
export function toApiWatchlistItem(item: WatchlistItemDtoInput): ApiWatchlistItem {
  return {
    createdAt: normalizeDateString(item.createdAt),
    id: item.id,
    note: item.note ?? undefined,
    number: item.number,
    scope: "global",
    source: item.source,
    stats: item.stats,
```

อธิบาย:

- แปลง createdAt เป็น string
- note null กลายเป็น undefined
- number ส่งเป็น string
- stats เป็น optional enrichment

UI:

- Watchlist card แสดง stats ได้ถ้ามี
- ถ้าไม่มี stats ต้อง fallback note

## Backtest DTO

Path: `src/api/model/dto/backtest.dto.ts`

```ts
export function toApiBacktestRun(run: BacktestRunDtoInput): ApiBacktestRun {
  return {
    averageHitRank: run.averageHitRank,
    candidateCount: run.candidateCount,
    computedAt: normalizeDateString(run.computedAt),
    coverage: run.coverage,
    endDrawDate: normalizeDateString(run.endDrawDate),
    hitRate: run.hitRate,
```

อธิบาย:

- ส่ง summary ของ backtest run
- date ทุกตัวเป็น string
- UI ใช้ทำ metric card เช่น hit rate / coverage

## Compare DTO

Path: `src/api/model/dto/compare.dto.ts`

```ts
export function toApiCompareReadModel(model: CompareReadModelDtoInput): ApiCompareReadModel {
  return {
    candidates: model.candidates.map(toApiCompareCandidate),
    generatedAt: normalizeDateString(model.generatedAt),
    sampleSize: model.sampleSize,
    source: model.source,
    strategyId: model.strategyId,
    strongestSignal: model.strongestSignal
  };
}
```

อธิบาย:

- ส่ง candidates หลัง map แล้ว
- ส่ง sampleSize ให้ UI บอก user ว่าดูจากข้อมูลกี่งวด/กลุ่ม
- strongestSignal เอาไปทำ insight headline ได้

## Calendar DTO

Path: `src/api/model/dto/calendar.dto.ts`

```ts
export function toApiCalendarReadModel(model: CalendarReadModelDtoInput): ApiCalendarReadModel {
  return {
    draws: model.draws.map(toApiCalendarDraw),
    generatedAt: normalizeDateString(model.generatedAt),
    monthlyInsights: model.monthlyInsights.map(toApiMonthlyInsight),
    nextDraw: toApiCalendarDraw(model.nextDraw),
    source: model.source
  };
}
```

อธิบาย:

- draws ทั้งหมดถูก normalize
- monthly insights clone array
- nextDraw เป็น object เดียวกับ draw shape

---

# 7. API Inventory ทุก endpoint พร้อม code

API mount หลัก:

Path: `src/app/api/[[...route]]/route.ts`

```ts
import { apiApp } from "@/api";

export const GET = apiApp.fetch;
export const POST = apiApp.fetch;
export const PUT = apiApp.fetch;
export const PATCH = apiApp.fetch;
export const DELETE = apiApp.fetch;
```

อธิบายทีละบรรทัด:

- import Elysia app
- method GET/POST/PUT/PATCH/DELETE ถูกส่งให้ `apiApp.fetch`
- Next.js เป็นแค่ entry point
- business logic อยู่ใน `src/api/router` และ `src/api/service`

Router composition:

Path: `src/api/router/index.ts`

```ts
return new Elysia({ prefix: "/api" })
  .get("/", () => ({
    name: "Lottery Intelligence API",
    status: "scaffold"
  }))
  .use(drawRouter)
  .use(analyticsRouter)
  .use(predictionRouter)
  .use(backtestRouter)
  .use(compareRouter)
  .use(calendarRouter)
  .use(dashboardRouter)
  .use(searchRouter)
  .use(watchlistRouter);
```

อธิบาย:

- ทุก endpoint อยู่ใต้ `/api`
- `.use(...)` คือ mount router แต่ละ feature
- ถ้าตัด router ตัวไหน API ของ feature นั้นหายทันที

## Endpoint table

| method | path | ใช้ทำอะไร | page |
|---|---|---|---|
| GET | `/api/draws` | ดึงผลย้อนหลังแบบ list/filter | Results, Search |
| GET | `/api/draws/:id` | ดึงรายละเอียดงวดเดียว | Result Detail |
| GET | `/api/analytics` | read model สถิติรวม | Analytics, Dashboard, Patterns |
| GET | `/api/analytics/digits` | digit stats เท่านั้น | Advanced chart/future |
| GET | `/api/analytics/numbers` | number stats เท่านั้น | Prediction, Compare, Watchlist |
| GET | `/api/predictions` | prediction run ล่าสุด | Prediction Lab, Dashboard summary |
| GET | `/api/predictions/:id` | prediction run เฉพาะ id | Future detail |
| POST | `/api/predictions` | generate prediction | Prediction Lab |
| GET | `/api/backtests` | backtest history | Backtest |
| GET | `/api/backtests/:id` | backtest run detail | Backtest |
| POST | `/api/backtests` | run backtest | Backtest |
| POST | `/api/compare` | compare เลขที่ user ใส่ | Compare |
| GET | `/api/calendar` | calendar read model | Calendar |
| GET | `/api/dashboard` | dashboard aggregate | Dashboard |
| GET | `/api/search` | grouped search | Search |
| GET | `/api/watchlist` | list watchlist + stats | Watchlist |
| POST | `/api/watchlist` | create watchlist item | Watchlist, Prediction Lab |
| PATCH | `/api/watchlist/:id` | update item | Watchlist |
| DELETE | `/api/watchlist/:id` | delete item | Watchlist |

## `/api/draws`

Route code:

`src/api/router/draw.router.ts`

```ts
export const drawRouter = new Elysia({ prefix: "/draws" })
  .get("/", ({ request }) => drawService.getDraws(parseQuery(request, searchQuerySchema)))
```

อธิบาย:

- prefix `/draws` รวมกับ `/api` เป็น `/api/draws`
- GET `/` อ่าน query จาก request
- validate query ด้วย `searchQuerySchema`
- ส่งเข้า `drawService.getDraws`

Request example:

```http
GET /api/draws?q=09&prizeType=TWO_DIGIT&page=1&pageSize=20
```

Success response example:

```json
{
  "source": "api",
  "draws": [
    {
      "id": "uuid",
      "drawDate": "16 เมษายน 2569",
      "drawDateIso": "2026-04-16T00:00:00.000Z",
      "drawNo": "16/2026",
      "status": "complete",
      "prizes": [{ "type": "TWO_DIGIT", "number": "09" }]
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

Empty response:

- `draws: []`
- UI แสดง empty state

Error response:

- ถ้า service fail UI ได้ error state จาก frontend data loader

UI mapping:

- loading: server page ตอนนี้ไม่มี skeleton ระหว่าง SSR
- empty: "ไม่พบผลย้อนหลัง"
- success: draw cards
- error: API unavailable

## `/api/draws/:id`

Route code:

```ts
.get("/:id", async ({ params, set }) => {
  const response = await drawService.getDrawById(params.id);

  if (!response) {
    set.status = 404;

    return {
      error: "Not found",
      message: "Draw not found"
    };
  }
```

อธิบาย:

- รับ id จาก URL
- service หา draw
- ไม่เจอคืน 404
- UI detail แยก `notFound` กับ `error`

## `/api/analytics`

Route code:

`src/api/router/analytics.router.ts`

```ts
export const analyticsRouter = new Elysia({ prefix: "/analytics" })
  .get("/", ({ request }) =>
    analyticsService.getAnalyticsReadModel(parseQuery(request, filterContextSchema))
  )
```

Request example:

```http
GET /api/analytics?prizeType=TWO_DIGIT&numberLength=2&windowSize=120
```

Success response:

```json
{
  "source": "api",
  "summary": { "drawCount": 120, "generatedAt": "2026-05-01T00:00:00.000Z" },
  "numberStats": [
    {
      "number": "09",
      "hitCount": 4,
      "frequencyPercent": 3.33,
      "missingDrawCount": 12,
      "patternFlags": ["odd", "low"]
    }
  ]
}
```

UI mapping:

- success: charts/tables
- empty: no stats
- error: unavailable

## `/api/predictions`

Route code:

`src/api/router/prediction.router.ts`

```ts
.get("/", async ({ set }) => {
  const prediction = await predictionService.getLatestPrediction();

  if (!prediction) {
    set.status = 404;

    return {
      error: "Not found",
      message: "Prediction run not found"
    };
  }

  return prediction;
})
```

อธิบาย:

- GET latest prediction
- ถ้ายังไม่เคย generate จะ 404
- UI แปล 404 เป็น "ยังไม่มี run"

POST code:

```ts
.post("/", async ({ body }) => predictionService.generate(predictionRequestSchema.parse(body)));
```

อธิบาย:

- รับ body
- validate ด้วย `predictionRequestSchema`
- generate และ persist run

## `/api/compare`

Route:

`src/api/router/compare.router.ts`

```ts
export const compareRouter = new Elysia({ prefix: "/compare" }).post("/", async ({ body }) =>
  compareService.compareNumbers(compareRequestSchema.parse(body))
);
```

อธิบาย:

- มี POST อย่างเดียว
- เหมาะกับ action ที่ user ส่งเลขไปวิเคราะห์

Request example:

```json
{
  "numbers": ["09", "24", "91"],
  "lotteryType": "THAI_GOVERNMENT",
  "prizeType": "TWO_DIGIT",
  "numberLength": 2,
  "windowSize": 120,
  "strategyId": "balanced"
}
```

## `/api/watchlist`

Route:

```ts
export const watchlistRouter = new Elysia({ prefix: "/watchlist" })
  .get("/", () => watchlistService.getWatchlist())
  .post("/", ({ body }) =>
    watchlistService.createWatchlistItem(createWatchlistItemSchema.parse(body))
  )
```

อธิบาย:

- GET list
- POST create
- PATCH update
- DELETE remove

UI mapping:

- add/save number
- edit tags/note
- show stats if available

## `/api/backtests`

Route code:

`src/api/router/backtest.router.ts`

```ts
export const backtestRouter = new Elysia({ prefix: "/backtests" })
  .get("/", () => backtestService.listBacktests())
  .get("/:id", async ({ params, set }) => {
    const response = await backtestService.getBacktestById(params.id);
```

อธิบาย:

- `GET /api/backtests` คืนรายการ run ล่าสุด
- `GET /api/backtests/:id` คืน detail ของ run เดียว
- `POST /api/backtests` ใช้เริ่ม run ใหม่

Request example:

```json
{
  "lotteryType": "THAI_GOVERNMENT",
  "prizeType": "TWO_DIGIT",
  "numberLength": 2,
  "windowSize": 120,
  "candidateCount": 5,
  "strategyId": "balanced"
}
```

Success response:

- summary ของ run
- result per draw

Empty:

- `GET /api/backtests` อาจคืน `items: []`
- UI ต้องแปลว่า "ยังไม่มี persisted run"

Error:

- `GET /api/backtests/:id` ไม่เจอ -> 404 `"Backtest run not found"`

UI mapping:

- loading: initial history load
- empty: no run yet
- success: chart/history
- error: unavailable but keep latest live run ifมี

## `/api/calendar`

Route code:

`src/api/router/calendar.router.ts`

```ts
export const calendarRouter = new Elysia({ prefix: "/calendar" }).get("/", () =>
  calendarService.getCalendarReadModel()
);
```

อธิบาย:

- มี endpoint เดียว
- อ่าน calendar read model สำเร็จครั้งเดียวจบ

Success response มี:

- `nextDraw`
- `draws`
- `monthlyInsights`

UI mapping:

- loading: SSR wait
- empty: ถ้า draw list ว่าง
- success: next draw + recent + monthly
- error: unavailable shell

## `/api/dashboard`

Route code:

`src/api/router/dashboard.router.ts`

```ts
export const dashboardRouter = new Elysia({ prefix: "/dashboard" }).get("/", () =>
  dashboardService.getDashboardReadModel()
);
```

อธิบาย:

- endpoint นี้เป็น aggregate endpoint
- รวม latest draw + analytics + prediction summary

Success response:

- `hero`
- `latestDraw`
- `metrics`
- `signals`
- `predictionSummary`
- `contractRows`

UI mapping:

- loading: SSR wait
- empty: latest draw unavailable
- success: overview
- error: no fake dashboard data, only shell

## `/api/search`

Route code:

`src/api/router/search.router.ts`

```ts
export const searchRouter = new Elysia({ prefix: "/search" }).get("/", ({ request }) =>
  searchService.search(apiQuery.parseQuery(request, searchQuerySchema))
);
```

อธิบาย:

- parse query string
- service ตัดสินเองว่าจะค้นจากแหล่งไหนบ้าง

Success response example:

```json
{
  "generatedAt": "2026-05-01T00:00:00.000Z",
  "q": "09",
  "source": "api",
  "groups": {
    "draws": [],
    "prizes": [],
    "stats": [],
    "watchlist": []
  }
}
```

สำคัญ:

- ถึงทุก group ว่างก็ยังถือว่า success
- เพราะ search query ว่างหรือไม่ match ไม่ใช่ exceptional case

## `/api/analytics/digits` และ `/api/analytics/numbers`

Route code:

`src/api/router/analytics.router.ts`

```ts
.get("/digits", ({ request }) =>
  analyticsService.getDigitStats(parseQuery(request, filterContextSchema))
)
.get("/numbers", ({ request }) =>
  analyticsService.getNumberStats(parseQuery(request, filterContextSchema))
);
```

อธิบาย:

- เป็น endpoint แยกย่อย
- ใช้ logic analytics ชุดเดียวกับ endpoint หลัก
- เหมาะกับ future UI ที่อยากโหลดเฉพาะตาราง/เฉพาะ chart

UI mapping:

- ตอนนี้ frontend หลักยังใช้ `/api/analytics` เป็น read model รวม
- endpoint ย่อยนี้เป็น technical affordance มากกว่า product surface

## `/api/search`

Route:

`src/api/router/search.router.ts`

```ts
export const searchRouter = new Elysia({ prefix: "/search" }).get("/", ({ request }) =>
  searchService.search(apiQuery.parseQuery(request, searchQuerySchema))
);
```

อธิบาย:

- query string validate ด้วย searchQuerySchema
- service คืน grouped results

Request:

```http
GET /api/search?q=09
```

Empty:

- q ว่างหรือไม่ match -> groups ทุกตัว empty

---

# 8. API State Matrix

| Page | API | Loading | Empty | Success | Error |
|---|---|---|---|---|---|
| Results | `GET /api/draws` | SSR/no explicit skeleton | draws empty | draw cards | error empty state |
| Result Detail | `GET /api/draws/:id` | SSR | 404 not found | prize detail | unavailable |
| Analytics | `GET /api/analytics` | SSR | numberStats empty | charts/table | error state |
| Dashboard | `GET /api/dashboard` | SSR | latestDraw missing | latest/signals | unavailable |
| Prediction Lab | `GET /api/predictions`, `POST /api/predictions` | loading state | no run/no candidates | result cards | error message |
| Backtest | `GET /api/backtests`, `POST /api/backtests` | loading state | no run | chart/history | unavailable |
| Compare | `POST /api/compare` | pending | no candidates | ranking | error but keep previous result |
| Watchlist | `GET /api/watchlist` | client loading implicit | no items | item cards | error UI should be improved |
| Search | `GET /api/search` | SSR | empty groups | grouped hits | error state |
| Calendar | `GET /api/calendar` | SSR | no rows | next/recent/monthly | unavailable |

---

# 9. Button / Action Map

| ปุ่ม | หน้า | ทำอะไร | API | state |
|---|---|---|---|---|
| Apply | Results | submit search query | `GET /api/draws` | URL state |
| Reset filters | Results | ล้าง filter | none | link |
| Detail | Results | ไปงวดเดียว | `GET /api/draws/:id` | route |
| Window 30/60/120 | Analytics | เปลี่ยน window | `GET /api/analytics` | URL state |
| Generate | Prediction Lab | generate candidates | `POST /api/predictions` | pending/error |
| Save to watchlist | Prediction Lab | save number | `POST /api/watchlist` | saved/error |
| Run backtest | Backtest | ทดลองย้อนหลัง | `POST /api/backtests` | pending/error |
| Compare | Compare | เทียบเลข | `POST /api/compare` | pending/error |
| Add item | Watchlist | เพิ่มเลข | `POST /api/watchlist` | local form |
| Edit item | Watchlist | แก้ note/tags | `PATCH /api/watchlist/:id` | editing |
| Delete item | Watchlist | ลบเลข | `DELETE /api/watchlist/:id` | destructive |
| Search | Search | ค้นเลข | `GET /api/search` | URL state |

---

# 10. Analysis Result Dictionary

## `score`

มาจาก `src/api/service/prediction/scoring-engine.ts`

```ts
const score = getWeightedScore(scoreBreakdown, strategy.weights);
```

อธิบาย:

- score คือคะแนนรวม
- ไม่ใช่ probability
- ใช้ weighted average จาก hot/overdue/pair/pattern/position

UI:

- แสดงเป็น "Signal score"
- อย่าเขียน "โอกาสถูกรางวัล"

## `scoreBreakdown`

Code:

```ts
return {
  hot: clamp(stat.frequencyPercent * 4),
  overdue: clamp(stat.missingDrawCount * 8),
  pair: getPairScore(stat.number),
  pattern: getPatternScore(stat),
  position: clamp(stat.trendScore)
};
```

อธิบาย:

- `hot` มาจากความถี่
- `overdue` มาจากจำนวนงวดที่หายไป
- `pair` มาจากเลขซ้ำ/เลขเป็นคู่ digit
- `pattern` มาจาก pattern flags
- `position` มาจาก trend score

## `reasons`

Code:

```ts
const reasons = [
  `Historical frequency is ${stat.frequencyPercent}% in the selected window.`,
  `Missing draw count is ${stat.missingDrawCount}.`,
  `Trend score is ${stat.trendScore}.`
];
```

อธิบาย:

- reasons คือข้อความบอกเหตุผล
- ตอนนี้เป็นภาษาอังกฤษและค่อนข้าง technical
- UI ใหม่ควรแปลเป็นภาษาคน เช่น "เลขนี้ออก 4 ครั้งใน 120 งวดล่าสุด"

## `trendDirection`

มาจาก `calculateDigitStats`

- `up` = ช่วงหลังเจอบ่อยกว่าช่วงก่อน
- `down` = ช่วงหลังเจอน้อยลง
- `flat` = ใกล้เคียงเดิม

UI:

- ใช้ลูกศรหรือ label สั้น
- ต้องอธิบายว่าเป็น trend ย้อนหลัง

## `missingDrawCount`

ความหมาย:

- จำนวนงวดหลังสุดที่ผ่านไปโดยไม่เจอเลขนี้

UI:

- "หายไป 12 งวด"

Warning:

- หายไปนานไม่ได้แปลว่าจะออก

## `hot/cold/overdue`

ใน dashboard:

`src/api/service/dashboard.service.ts`

```ts
const hotStat = analytics.numberStats.reduce((best, stat) => {
  if (!best) {
    return stat;
  }

  if (stat.frequencyPercent !== best.frequencyPercent) {
    return stat.frequencyPercent > best.frequencyPercent ? stat : best;
  }

  return stat.trendScore > best.trendScore ? stat : best;
}, analytics.numberStats[0]);
```

อธิบาย:

- hot เลือกเลขที่ frequencyPercent สูงสุด
- ถ้าเท่ากัน ใช้ trendScore ตัดสิน
- UI ควรบอกว่า "ใน window นี้" ไม่ใช่ตลอดกาล

---

# 11. Service Logic Map พร้อม code

## `draw.service.ts`

Input:

- `SearchQuery`

Process:

- build where
- query draw + prizes
- count total
- map DTO

Output:

- `ApiDrawListResponse` หรือ `ApiDrawDetailResponse`

UI:

- Results list/detail

Snippet:

```ts
if (query.q) {
  where.OR = [
    {
      drawNo: {
        contains: query.q
      }
    },
    {
      prizes: {
        some: {
          number: {
            contains: query.q
          }
        }
      }
    }
  ];
}
```

อธิบาย:

- ถ้า user search `q`
- ค้นทั้ง drawNo และ prize number
- ทำให้ `/results?q=09` หาเลขใน prizes ได้

## `analytics.service.ts` และ `analytics-engine.ts`

Input:

- `FilterContext`

Process:

- หา materialized snapshot ก่อน
- ถ้าไม่มี compute สดจาก prize window

Snippet:

```ts
const draws = await prisma.lotteryDraw.findMany({
  orderBy: {
    drawDate: "desc"
  },
  select: {
    id: true
  },
  take: query.windowSize,
  where: buildDrawWhere(query)
});
```

อธิบาย:

- เลือกงวดล่าสุดตาม windowSize
- เลือกเฉพาะ id ก่อน
- window นับเป็น "จำนวนงวด" ไม่ใช่จำนวน prize rows

ผลต่อ UI:

- ค่า drawCount มีความหมายกับ user
- ถ้า windowSize = 120 คือดู 120 งวด ไม่ใช่ 120 records

## `prediction.service.ts`

Input:

- `PredictionRequest`

Process:

- ใช้ analytics numberStats
- score ตาม strategy
- persist run/result
- read latest run ได้

Snippet:

```ts
await prisma.$transaction(async (transaction) => {
  await transaction.predictionRun.create({
    data: {
      id: runId,
      items: rankedResults.length
        ? {
            create: rankedResults.map((result) => ({
              id: result.id,
              number: result.number,
              reasons: result.reasons,
              score: result.score
            }))
          }
        : undefined,
      params: toPredictionRunParams(generatedAt, input, rankedResults),
      strategy: strategy.id
    }
  });
```

อธิบาย:

- เปิด transaction เพื่อ save run/result ให้ไปด้วยกัน
- สร้าง PredictionRun
- ถ้ามี results ก็ create PredictionResult
- เก็บ params เป็น metadata/legacy
- strategy บันทึกไว้เพื่ออ่านย้อนหลัง

ผลต่อ UI:

- Prediction Lab refresh แล้วเห็น run ล่าสุด
- Dashboard ดึง latest summary ได้

## `compare.service.ts`

อธิบาย:

- Compare เป็น prediction scoring ที่ user เลือกเลขเอง
- ถ้าเลขไม่มี stat ระบบสร้าง empty stat เพื่อไม่ทำให้เลขหายจากผลลัพธ์

ผลต่อ UI:

- เลขที่ user ใส่ทุกตัวควรแสดงถ้าความยาวถูกต้อง
- ถ้าไม่มีข้อมูลย้อนหลัง score จะต่ำและ reasons ควรสื่อว่า sample ไม่พบ

## `watchlist.service.ts`

อธิบาย:

- CRUD watchlist
- ตอนอ่าน list จะ enrich stat จาก analytics

ผลต่อ UI:

- watchlist คือ save/share loop
- ควรเป็นหน้า user-owned มากที่สุด

## `search.service.ts`

อธิบาย:

- query เดียวค้นหลายแหล่ง
- แบ่งผลเป็น draws/prizes/stats/watchlist

ผลต่อ UI:

- เหมาะกับ global search
- Search result page ควรเป็น gateway ไป feature อื่น

## `backtest.service.ts`

อธิบาย:

- ดึง draws ตามช่วงเวลา
- run walk-forward
- persist run/result

ผลต่อ UI:

- ใช้เป็น trust signal ว่า scoring เคย behave ยังไงในอดีต
- ไม่ควรสื่อว่า backtest ดี = อนาคตชนะ

## `calendar.service.ts`

อธิบาย:

- แยก next draw กับ recent past draws
- สร้าง monthly insights จากเลขท้าย 2 ตัว

ผลต่อ UI:

- Calendar เป็น context page
- Monthly insight ต้องมี sample size

## `dashboard.service.ts`

อธิบาย:

- aggregate latest draw, analytics, prediction summary เป็น read model เดียว
- เป็น convenience API สำหรับ dashboard

ผลต่อ UI:

- Dashboard ไม่ควรคำนวณเองฝั่ง frontend
- แต่ product redesign อาจลดบทบาท dashboard

## `draw-seed.service.ts`

Source relevant:

`src/api/service/draw-seed.service.ts`

```ts
export async function seedDraws(
  seedFile: LotteryDrawSeedFile,
  options: SeedDrawsOptions = {}
): Promise<SeedReport> {
```

อธิบาย:

- import historical draws
- รองรับ CSV/JSON จาก phase ก่อน
- สำคัญต่อ production data pipeline ไม่ใช่ UI โดยตรง

## `materialized-stats.ts`

Source relevant:

`src/api/service/analytics/materialized-stats.ts`

```ts
const MATERIALIZED_PRIZE_TYPES = [
  "TWO_DIGIT",
  "THREE_DIGIT",
  "FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5"
] as const;
```

อธิบาย:

- สถิติที่ precompute ครอบคลุมเลขท้าย 2 ตัว, 3 ตัว, รางวัลที่ 1 และรางวัลที่ 2-5
- ใช้กับ canonical windows 30/60/120
- ถ้า query ไม่ตรง context เหล่านี้ ระบบ fallback compute สด

## Explainable Function Logic

ส่วนนี้ตั้งใจตอบคำถามตรง ๆ ว่า "AI ใช้ logic แบบไหนใน code" โดยยก function จริงแล้วแปลเป็นภาษาคน

### `buildDrawWhere`

Path: `src/api/service/draw.service.ts`

```ts
function buildDrawWhere(query: GetDrawsQuery): LotteryDrawWhereInput {
  const where: LotteryDrawWhereInput = {
    lotteryType: query.lotteryType
  };
  const drawDate = buildDrawDateFilter(query);

  if (drawDate) {
    where.drawDate = drawDate;
  }

  if (query.prizeType) {
    where.prizes = {
      some: {
        type: query.prizeType
      }
    };
  }

  if (query.q) {
    where.OR = [
      {
        drawNo: {
          contains: query.q
        }
      },
      {
        prizes: {
          some: {
            number: {
              contains: query.q
            }
          }
        }
      }
    ];
  }

  return where;
}
```

อธิบายทีละบรรทัด:

- เริ่มจากกำหนดว่า query นี้ดูเฉพาะ `lotteryType` ไหน
- เรียก `buildDrawDateFilter` เพื่อหาว่ามีเงื่อนไขเรื่องช่วงวันที่หรือไม่
- ถ้ามีช่วงวันที่ ก็เติมเข้า `where.drawDate`
- ถ้า user เลือก `prizeType` ก็กรองให้งวดนั้นต้องมี prize type นั้นอย่างน้อยหนึ่งตัว
- ถ้า user พิมพ์ `q` ก็เปิด search สองทางพร้อมกัน:
  - หาใน `drawNo`
  - หาใน `prizes.number`
- สุดท้าย return where object ให้ Prisma ใช้ query

Input:

- search/filter จากหน้า Results

Process:

- เปลี่ยนภาษาของ user เป็นเงื่อนไข DB

Output:

- Prisma where object

Logic นี้กำลังคิดอะไร:

- หน้า Results ไม่ได้ค้นแค่ "เลขงวด"
- มันค้นเลขรางวัลด้วย
- เพราะ user ทั่วไปมักจำ "เลข" มากกว่าจำ "draw no"

ผลต่อ UI:

- พิมพ์ `09` แล้วเจองวดที่มี `09` ในรางวัลได้
- ถ้าตัด OR ของ prizes ออก Search จะดูโง่ลงทันที เพราะ user พิมพ์เลขแล้วไม่เจอสิ่งที่เขาคาด

### `buildDrawDateFilter`

Path: `src/api/service/draw.service.ts`

```ts
function buildDrawDateFilter(query: GetDrawsQuery): DateTimeFilter<"LotteryDraw"> | undefined {
  const filter: DateTimeFilter<"LotteryDraw"> = {};
  const yearMonthRange = buildYearMonthRange(query.year, query.month);

  if (yearMonthRange) {
    filter.gte = yearMonthRange.start;
    filter.lt = yearMonthRange.end;
  }

  if (query.startDate) {
    filter.gte = new Date(query.startDate);
  }

  if (query.endDate) {
    filter.lte = new Date(query.endDate);
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}
```

อธิบาย:

- function นี้แปล filter เรื่องวันเวลา
- ถ้า user เลือก `year` หรือ `month` จะสร้างช่วงวันอัตโนมัติ
- ถ้า user ส่ง `startDate` หรือ `endDate` โดยตรง จะ override field บางส่วน
- ถ้าไม่มี filter เลย return `undefined`

Logic นี้กำลังคิดอะไร:

- UI ควรมีหลายวิธีให้ user จำกัดช่วงข้อมูล
- บางคนคิดเป็น "เมษายน 2024"
- บางคนคิดเป็น "จากวันไหนถึงวันไหน"

ผลต่อ UI:

- URL state ของ Results/Analytics มีความหมายจริง
- ถ้าตัด logic นี้ หน้า filter ตามเวลาแทบจะไร้ค่า

### `getPrizeWindow`

Path: `src/api/service/analytics/analytics-engine.ts`

```ts
export async function getPrizeWindow(
  prisma: { ... },
  query: AnalyticsQuery
) {
  const draws = await prisma.lotteryDraw.findMany({
    orderBy: {
      drawDate: "desc"
    },
    select: {
      id: true
    },
    take: query.windowSize,
    where: buildDrawWhere(query)
  });

  if (draws.length === 0) {
    return [];
  }

  const drawIds = draws.map((draw) => draw.id);

  return prisma.lotteryPrize.findMany({
    include: {
      draw: true
    },
    orderBy: [
      {
        draw: {
          drawDate: "desc"
        }
      },
      {
        position: "asc"
      },
      {
        number: "asc"
      }
    ],
    where: buildPrizeWhere(query, drawIds)
  });
}
```

อธิบายทีละบรรทัด:

- ดึง `LotteryDraw` มาก่อน ไม่ดึง `LotteryPrize` ทันที
- เลือกเฉพาะ `id`
- `take: query.windowSize` หมายถึงใช้ "จำนวนงวด" ตามที่ user ขอ
- ถ้าไม่เจองวดเลย return `[]`
- ถ้าเจอ จึงเอา draw ids ไป query `LotteryPrize`
- include `draw` เพื่อให้ prize แต่ละแถวรู้ว่าสังกัดงวดไหน
- sort ตามวันที่งวด, position, number

Logic นี้กำลังคิดอะไร:

- Analytics ต้องคิดจาก "งวด" ไม่ใช่ "จำนวนแถวรางวัล"
- ถ้าคิดผิดเป็น row-based window จะเพี้ยนทันที เพราะ 1 งวดมีหลายรางวัล

ผลต่อ UI:

- `windowSize=120` แปลตรงตัวว่า 120 งวด
- user อ่าน sample size แล้วเชื่อถือได้

ถ้าตัด logic นี้ออก:

- Analytics, Prediction, Compare จะคำนวณจากฐาน sample ผิด

### `buildAnalyticsReadModelFromPrizes`

Path: `src/api/service/analytics/analytics-engine.ts`

```ts
export function buildAnalyticsReadModelFromPrizes(
  prizes: Awaited<ReturnType<typeof getPrizeWindow>>,
  query: AnalyticsQuery,
  computedAt: Date
): ApiAnalyticsReadModel {
  const drawCount = getDrawCount(prizes);
  const context = {
    computedAt,
    drawCount,
    windowSize: query.windowSize
  };
  const digitStats = calculateDigitStats(extractDigitEvents(prizes), context);
  const numberStats = calculateNumberStats(prizes, context, query.numberLength);

  return toApiAnalyticsReadModel({
    digitStats,
    generatedAt: computedAt,
    numberStats,
    patternSummaries: summarizePatterns(numberStats, drawCount),
    source: "api",
    summary: {
      drawCount,
      generatedAt: computedAt
    }
  });
}
```

อธิบาย:

- เริ่มจากรู้ว่า prize rows ที่เลือกมาเป็นของกี่งวดจริง
- สร้าง context กลาง เช่น `drawCount`, `windowSize`, `computedAt`
- แปลง prize เป็น digit events เพื่อใช้คำนวณ digit-level stats
- คำนวณ number-level stats ตามความยาวเลขที่สนใจ
- สรุป pattern จาก number stats อีกชั้น
- map ทั้งหมดเป็น DTO สำหรับ API

Logic นี้กำลังคิดอะไร:

- analytics read model เป็น "ภาษากลาง" ของหลายหน้า
- ต้องรวมทั้งระดับ digit, ระดับ number, และ pattern summary ในก้อนเดียว

ผลต่อ UI:

- หน้า Analytics ใช้ก้อนนี้ตรง ๆ
- Dashboard, Compare, Prediction, Watchlist ใช้บางส่วนของก้อนนี้

### `extractDigitEvents`

Path: `src/api/service/analytics/digit-events.ts`

```ts
export function extractDigitEvents(prizes: readonly PrizeLike[]): DigitEvent[] {
  return prizes.flatMap((prize) => {
    const digits = [...prize.number];

    return digits.map((digit, index) => ({
      digit,
      drawDate: normalizeDate(prize.draw.drawDate),
      lotteryType: prize.draw.lotteryType,
      number: prize.number,
      position: index + 1,
      prizeType: prize.type
    }));
  });
}
```

อธิบาย:

- เอาเลขหนึ่งตัว เช่น `123456`
- แตกเป็น digit events:
  - `1` ตำแหน่ง 1
  - `2` ตำแหน่ง 2
  - ...
- digit event แต่ละตัวจำทั้งวันที่ งวด ประเภทรางวัล และตำแหน่ง

Logic นี้กำลังคิดอะไร:

- ถ้าจะทำ heatmap หรือ digit analysis ต้องมองเลขเป็น "ตัวเลขย่อยตามตำแหน่ง"
- ไม่ใช่มองเป็น string ทั้งก้อนอย่างเดียว

ผลต่อ UI:

- heatmap และ digit stats เกิดขึ้นได้เพราะ function นี้

### `calculateDigitStats`

Path: `src/api/service/analytics/number-stats.ts`

```ts
export function calculateDigitStats(
  events: readonly DigitEvent[],
  context: AnalyticsContext
): ApiDigitStat[] {
  const groups = new Map<string, DigitEvent[]>();

  for (const event of events) {
    const key = [event.lotteryType, event.prizeType, event.digit, event.position].join("|");
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return [...groups.values()]
    .map((group) => {
      const latestEvent = getLatestEvent(group);
      const hitCount = group.length;

      return {
        computedAt: context.computedAt.toISOString(),
        digit: group[0]?.digit ?? "",
        drawCount: context.drawCount,
        frequencyPercent: getFrequencyPercent(hitCount, context.drawCount),
        hitCount,
        lastSeenDrawDate: latestEvent?.drawDate.toISOString(),
        lotteryType: group[0]?.lotteryType ?? "",
        missingDrawCount: getMissingDrawCount(latestEvent, events),
        position: group[0]?.position,
        prizeType: group[0]?.prizeType ?? "",
        trendDirection: getTrendDirection(group, events),
        windowSize: context.windowSize
      };
    })
```

อธิบาย:

- group event ตาม `lotteryType + prizeType + digit + position`
- เช่น "เลข 9 ที่ตำแหน่งสุดท้ายของ TWO_DIGIT"
- แต่ละกลุ่มคำนวณ:
  - hitCount
  - frequencyPercent
  - lastSeenDrawDate
  - missingDrawCount
  - trendDirection

Logic นี้กำลังคิดอะไร:

- user บางคนสน pattern รายหลัก เช่นเลขท้ายมักลงเลขอะไร
- จึงไม่พอแค่ดู "เลขทั้งตัว"

ผลต่อ UI:

- digit heatmap มีความหมาย
- แต่ถ้า UI ใหม่ไม่ใช้ digit view หนัก ๆ ก็ยังเก็บไว้เป็น advanced layer

### `calculateNumberStats`

Path: `src/api/service/analytics/number-stats.ts`

```ts
export function calculateNumberStats(
  prizes: readonly PrizeLike[],
  context: AnalyticsContext,
  numberLength?: number
): ApiNumberStat[] {
  const filteredPrizes = numberLength
    ? prizes.filter((prize) => prize.number.length === numberLength)
    : prizes;
  const groups = new Map<string, PrizeLike[]>();

  for (const prize of filteredPrizes) {
    const key = [prize.draw.lotteryType, prize.type, prize.number].join("|");
    groups.set(key, [...(groups.get(key) ?? []), prize]);
  }
```

อธิบาย:

- ถ้า user สนใจเลข 2 ตัว ก็กรองเฉพาะเลขยาว 2 หลักก่อน
- group ตาม `lotteryType + prizeType + number`
- นั่นแปลว่าหนึ่งแถวในผลลัพธ์คือ "เลขหนึ่งตัวในบริบทหนึ่งประเภท"

ส่วนคำนวณสำคัญ:

```ts
return {
  averageGap: getAverageGap(group),
  computedAt: context.computedAt.toISOString(),
  drawCount: context.drawCount,
  frequencyPercent: getFrequencyPercent(hitCount, context.drawCount),
  hitCount,
  lastSeenDrawDate: latestPrize
    ? normalizeDate(latestPrize.draw.drawDate).toISOString()
    : undefined,
  missingDrawCount: getMissingDrawCountFromDate(
    latestPrize ? normalizeDate(latestPrize.draw.drawDate) : undefined,
    prizes
  ),
  number: group[0]?.number ?? "",
  numberLength: group[0]?.number.length ?? 0,
  patternFlags: getPatternFlags(group[0]?.number ?? ""),
  prizeType: group[0]?.type ?? "",
  trendScore: getTrendScore(hitCount, context.drawCount, group),
  windowSize: context.windowSize
};
```

อธิบาย:

- `averageGap` = โดยเฉลี่ยเว้นกี่วัน/กี่ช่วงระหว่างครั้งที่เจอ
- `frequencyPercent` = ออกบ่อยแค่ไหนใน sample นี้
- `missingDrawCount` = ตั้งแต่ครั้งล่าสุด มีผ่านไปกี่งวดแล้ว
- `patternFlags` = odd/even/high/low/double ฯลฯ
- `trendScore` = คะแนน heuristic สำหรับเอาไปจัดอันดับต่อ

Logic นี้กำลังคิดอะไร:

- นี่คือหัวใจของ product
- เพราะมันเปลี่ยน raw history ให้กลายเป็น "เหตุผลที่เล่าให้ user ฟังได้"

ผลต่อ UI:

- compare, prediction, watchlist, search stats ใช้ field เหล่านี้หมด

### `summarizePatterns`

Path: `src/api/service/analytics/number-stats.ts`

```ts
export function summarizePatterns(
  numberStats: readonly ApiNumberStat[],
  drawCount: number
): ApiPatternSummary[] {
  const flags: ApiPatternFlag[] = [
    "odd",
    "even",
    "high",
    "low",
    "double",
    "ascending",
    "descending",
    "mirror"
  ];

  return flags
    .map((flag) => {
      const hitCount = numberStats.filter((stat) => stat.patternFlags.includes(flag)).length;

      return {
        frequencyPercent: getFrequencyPercent(hitCount, numberStats.length),
        hitCount,
        id: `pattern-${flag}`,
        insight: `${flag} appeared in ${hitCount} tracked number groups from ${drawCount} draws.`,
        label: flag,
        pattern: flag,
        sampleSize: numberStats.length
      };
    })
    .filter((summary) => summary.hitCount > 0);
}
```

อธิบาย:

- มีชุด pattern ที่ระบบรู้จักอยู่ 8 แบบ
- วนดูทีละ pattern ว่าปรากฏใน numberStats กี่ครั้ง
- ทำ summary ของแต่ละ pattern
- ทิ้ง pattern ที่ไม่เจอเลย

Logic นี้กำลังคิดอะไร:

- แทนที่จะบอกเลขเป็นตัว ๆ อย่างเดียว ระบบพยายามเล่า "แนวโน้มของรูปแบบเลข"

ผลต่อ UI:

- หน้า Patterns และบางส่วนของ Analytics ใช้สรุปนี้ได้
- ถ้าตัดออก product จะเหลือแต่สถิติระดับเลขเดี่ยว

### `getPatternFlags`

Path: `src/api/service/analytics/number-stats.ts`

```ts
function getPatternFlags(number: string): ApiPatternFlag[] {
  const digits = [...number].map(Number);
  const flags: ApiPatternFlag[] = [];
  const lastDigit = digits.at(-1);

  if (lastDigit !== undefined) {
    flags.push(lastDigit % 2 === 0 ? "even" : "odd");
    flags.push(lastDigit >= 5 ? "high" : "low");
  }

  if (new Set(digits).size === 1 && digits.length > 1) {
    flags.push("double");
  }
```

อธิบาย:

- ดูเลขตัวสุดท้ายเพื่อใส่ odd/even
- ดูว่าตัวสุดท้าย >= 5 หรือไม่เพื่อใส่ high/low
- ถ้าทุก digit เหมือนกันใส่ `double`
- ด้านล่างยังมี logic `ascending`, `descending`, `mirror`

Logic นี้กำลังคิดอะไร:

- product ต้องมีภาษาง่าย ๆ อธิบายเลข
- pattern flags คือภาษานั้น

ผลต่อ UI:

- badge เช่น odd, high, mirror เกิดจากตรงนี้

### `scoreNumber`

Path: `src/api/service/prediction/scoring-engine.ts`

```ts
export function scoreNumber({
  inputWindow,
  rank,
  stat,
  strategy
}: ScoreNumberInput): ApiPredictionResult {
  const scoreBreakdown = getScoreBreakdown(stat);
  const score = getWeightedScore(scoreBreakdown, strategy.weights);

  return {
    id: `${strategy.id}-${stat.prizeType}-${stat.number}`,
    inputWindow,
    number: stat.number,
    numberLength: stat.numberLength,
    rank,
    reasons: getReasons(stat, scoreBreakdown),
    score,
    scoreBreakdown,
    strategyId: strategy.id,
    strategyName: strategy.name,
    version: PREDICTION_ENGINE_VERSION
  };
}
```

อธิบาย:

- รับ stat ของเลขหนึ่งตัว
- แปลง stat เป็นคะแนนย่อยก่อน
- เอาน้ำหนักของ strategy มาคูณรวม
- คืน prediction result ที่พร้อมใช้ใน UI

Logic นี้กำลังคิดอะไร:

- AI ในที่นี้ไม่ได้ "เดา" แบบ black box
- มันเป็น scoring heuristic ที่ชัดเจนและอธิบายได้

ผลต่อ UI:

- score และ reasons ทุกหน้าที่เกี่ยวกับ prediction/compare มาจาก logic นี้

### `getScoreBreakdown`

Path: `src/api/service/prediction/scoring-engine.ts`

```ts
function getScoreBreakdown(stat: ApiNumberStat): ApiPredictionScoreBreakdown {
  return {
    hot: clamp(stat.frequencyPercent * 4),
    overdue: clamp(stat.missingDrawCount * 8),
    pair: getPairScore(stat.number),
    pattern: getPatternScore(stat),
    position: clamp(stat.trendScore)
  };
}
```

อธิบาย:

- `hot` เอาความถี่มาขยายเป็นคะแนน
- `overdue` เอาความหายไปนานมาขยายเป็นคะแนน
- `pair` ดูโครง digit ซ้ำ
- `pattern` ดูจำนวน pattern flags
- `position` ใช้ trend score เดิม

Logic นี้กำลังคิดอะไร:

- ระบบไม่ได้มองเลขจากมุมเดียว
- มันรวมหลายเหตุผลแล้วทำเป็น score breakdown

ผลต่อ UI:

- score breakdown card เป็น explainable UI ที่ควรโชว์ ไม่ควรซ่อน

### `getPredictionStrategy`

Path: `src/api/service/prediction/strategy-registry.ts`

```ts
export const predictionStrategies = {
  balanced: {
    id: "balanced",
    name: "Balanced",
    weights: {
      hot: 0.3,
      overdue: 0.2,
      pair: 0.1,
      pattern: 0.15,
      position: 0.25
    }
  },
  coldRebound: {
```

อธิบาย:

- strategy ไม่ได้เปลี่ยนสูตรทั้งหมด
- strategy เปลี่ยนน้ำหนักของเหตุผลแต่ละแบบ
- `balanced` คือกลาง ๆ
- `coldRebound` ให้น้ำหนัก overdue สูง
- `hotTrend` ให้น้ำหนัก hot สูง

Logic นี้กำลังคิดอะไร:

- user อาจอยากตีความสัญญาณคนละแบบ
- จึงมีหลาย strategy โดยใช้ numberStats ก้อนเดียวกัน

ผลต่อ UI:

- UI ควรอธิบาย strategy ว่า "เน้นอะไร" ไม่ใช่แค่ชื่อ

### `compareNumbers`

Path: `src/api/service/compare.service.ts`

```ts
const statsByNumber = new Map(numberStats.map((stat) => [stat.number, stat]));
...
stat:
  statsByNumber.get(number) ??
  createEmptyNumberStat({
    computedAt,
    input,
    number,
    numberLength,
    sampleStat: numberStats[0]
  }),
```

อธิบาย:

- สร้าง map ของ stat ตามเลข เพื่อหาเร็ว
- ถ้าเลขที่ user ใส่มี stat ก็ใช้ stat นั้น
- ถ้าไม่มี ก็สร้าง empty stat

Logic นี้กำลังคิดอะไร:

- user ควรได้ผล compare สำหรับเลขที่ตัวเองใส่ทุกตัว
- ไม่ควรเงียบหายเพียงเพราะเลขนั้นไม่อยู่ใน top stats

ผลต่อ UI:

- compare page จึงเหมาะเป็น core tool มาก เพราะรับ input ตรงจาก user

### `runWalkForwardBacktest`

Path: `src/api/service/backtest/walk-forward.ts`

```ts
return sortedDraws.flatMap((targetDraw, targetIndex) => {
  const historyDraws = sortedDraws.slice(0, targetIndex).slice(-windowSize);
  const historyPrizes = historyDraws.flatMap(withDrawContext).filter(matchesPrizeContext);
  const actualNumbers = targetDraw.prizes
    .filter(matchesPrizeContext)
    .map((prize) => prize.number);

  if (historyPrizes.length === 0 || actualNumbers.length === 0) {
    return [];
  }
```

อธิบาย:

- วนทีละงวดตามลำดับเวลา
- สำหรับงวดเป้าหมายแต่ละงวด ให้มองย้อนกลับไปเฉพาะอดีต ไม่ใช้อนาคต
- ดึง history window ก่อนงวดนั้น
- แยก actual numbers ของงวดปัจจุบัน
- ถ้าไม่มีอดีตพอ หรือไม่มีเลขจริงให้เทียบ ก็ข้าม

Logic นี้กำลังคิดอะไร:

- backtest ที่ดีต้องไม่แอบรู้อนาคต
- นี่คือ walk-forward จริง

ผลต่อ UI:

- หน้า backtest ใช้บอก trust ของ strategy ได้อย่างมีวินัยกว่า random simulation

### `getBacktestSummary`

Path: `src/api/service/backtest/walk-forward.ts`

```ts
export function getBacktestSummary(results: readonly ApiBacktestResult[]) {
  const hitResults = results.filter((result) => result.isHit);
  const hitRanks = hitResults.flatMap((result) =>
    result.rankOfHit === undefined ? [] : [result.rankOfHit]
  );

  return {
    averageHitRank:
      hitRanks.length > 0
        ? round(hitRanks.reduce((total, rank) => total + rank, 0) / hitRanks.length)
        : undefined,
    hitRate: results.length > 0 ? round((hitResults.length / results.length) * 100) : 0,
    longestMissStreak: getLongestMissStreak(results)
  };
}
```

อธิบาย:

- `hitRate` = โดนกี่ % ของงวดที่ลอง
- `averageHitRank` = ถ้าโดน ส่วนใหญ่โดนลำดับสูงหรือต่ำ
- `longestMissStreak` = พลาดติดกันนานสุดกี่งวด

Logic นี้กำลังคิดอะไร:

- ไม่พอจะบอกแค่ว่าโดนหรือไม่โดน
- ต้องบอกลักษณะความเสี่ยงด้วย

ผลต่อ UI:

- user ควรอ่านหน้า backtest เป็น "behavior report" ไม่ใช่ "สูตรชนะ"

### `getCalendarReadModel`

Path: `src/api/service/calendar.service.ts`

```ts
const [nextPersistedDraw, recentDraws, monthlyDraws] = await Promise.all([
  prisma.lotteryDraw.findFirst({
    orderBy: {
      drawDate: "asc"
    },
    where: {
      drawDate: {
        gt: computedAt
      }
    }
  }),
```

อธิบาย:

- หา future draw ถ้ามีจริงใน DB
- หา recent past draws
- หา monthly draw sample จำนวนหนึ่งสำหรับ insight

Logic นี้กำลังคิดอะไร:

- calendar ต้องแยก "สิ่งที่จะมาถึง" ออกจาก "สิ่งที่ผ่านไปแล้ว"
- และ monthly insight เป็นของแถมเชิง context

### `buildMonthlyInsights`

Path: `src/api/service/calendar.service.ts`

```ts
const twoDigitNumbers = monthDraws.flatMap((draw) =>
  draw.prizes.filter((prize) => prize.type === "TWO_DIGIT").map((prize) => prize.number)
);
```

อธิบาย:

- monthly insight ตอนนี้ดูเฉพาะ `TWO_DIGIT`
- นำเลขสองตัวของงวดในเดือนเดียวกันมานับ
- แล้วสรุป hot/cold/parity/high-low

Logic นี้กำลังคิดอะไร:

- หน้านี้ไม่ได้พยายามอธิบายทุก prize type
- มันย่อให้ user เข้าใจง่ายผ่านเลขสองตัว

ผลต่อ UI:

- ถ้าจะใช้ monthly insight บน consumer UI ต้องบอกชัดว่าเป็น insight เฉพาะเลขสองตัว

### `getDashboardReadModel`

Path: `src/api/service/dashboard.service.ts`

```ts
const [latestDrawRecord, analytics, latestPredictionSummary] = await Promise.all([
  prisma.lotteryDraw.findFirst({
    include: {
      prizes: true
    },
    orderBy: {
      drawDate: "desc"
    },
    where: {
      drawDate: {
        lte: generatedAt
      }
    }
  }),
  analyticsService.getAnalyticsReadModel({
    lotteryType: "THAI_GOVERNMENT",
    numberLength: 2,
    page: 1,
    pageSize: 20,
    prizeType: "TWO_DIGIT",
    windowSize: DASHBOARD_WINDOW_SIZE
  }),
  predictionService.getLatestPredictionSummary()
]);
```

อธิบาย:

- dashboard รวมสาม source:
  - latest draw
  - two-digit analytics
  - latest prediction summary

Logic นี้กำลังคิดอะไร:

- dashboard เป็น aggregate read model
- มันไม่ใช่ source of truth ใหม่ แต่มันรวม source หลายตัวไว้หน้าเดียว

ผลต่อ UI:

- dashboard ใช้ง่ายขึ้นเชิง implementation
- แต่เชิง product อาจยังไม่ใช่หน้าเริ่มต้นที่ดีที่สุด

### `search`

Path: `src/api/service/search.service.ts`

```ts
if (!q) {
  return {
    generatedAt,
    groups: {
      draws: [],
      prizes: [],
      stats: [],
      watchlist: []
    },
    q,
    source: "api"
  };
}
```

อธิบาย:

- q ว่าง = ไม่ใช่ error
- search service จงใจ return empty groups

Logic นี้กำลังคิดอะไร:

- หน้า search ควรเป็นมิตรกับการเริ่มต้น
- ไม่มี query ยังไม่ถือว่าระบบล้ม

ส่วน query หลัก:

```ts
const [draws, prizes, stats, watchlist] = await Promise.all([
  prisma.lotteryDraw.findMany({ ... }),
  prisma.lotteryPrize.findMany({ ... }),
  getSearchStats(query),
  prisma.userWatchlistItem.findMany({ ... })
]);
```

อธิบาย:

- ยิงค้นพร้อมกัน 4 แหล่ง
- แล้วเอามาจัด group

ผลต่อ UI:

- Search page ควรเป็น "finder" ของทั้งระบบ

### `getSearchStats`

Path: `src/api/service/search.service.ts`

```ts
if (digitLength === 2) {
  return mapSearchStats(
    await analyticsService.getNumberStats({
      lotteryType: query.lotteryType,
      numberLength: 2,
      page: 1,
      pageSize: 100,
      prizeType: "TWO_DIGIT",
      windowSize: SEARCH_STATS_WINDOW_SIZE
    }),
    query.q ?? ""
  );
}
```

อธิบาย:

- ถ้า q เป็นเลข 2 หลัก -> search ใน two-digit stats
- ถ้า 3 หลัก -> three-digit stats
- ถ้า 6 หลัก -> FIRST + PRIZE2-5

Logic นี้กำลังคิดอะไร:

- ระบบตีความ "ประเภทของเลข" จากความยาว
- user ไม่ต้องเข้าใจก่อนว่าเลขนี้ควรไปหาที่ endpoint ไหน

ผลต่อ UI:

- Search UX ดูฉลาดขึ้น

### `enrichWatchlistItems`

Path: `src/api/service/watchlist.service.ts`

```ts
for (const item of items) {
  const length = item.number.length;

  if (!numbersByLength.has(length)) {
    numbersByLength.set(length, new Set());
  }

  numbersByLength.get(length)?.add(item.number);
}
```

อธิบาย:

- จัดกลุ่มเลข watchlist ตามความยาวก่อน
- 2 หลักไปชุดหนึ่ง
- 3 หลักอีกชุด
- 6 หลักอีกชุด

Logic นี้กำลังคิดอะไร:

- การ enrich stats ต้องรู้ก่อนว่าเลขแต่ละตัวควรเทียบกับ prize type ไหน

ผลต่อ UI:

- watchlist item 2 หลักกับ 6 หลักจึงไม่ถูกปน context กัน

### `getWatchlistStatsByNumber`

Path: `src/api/service/watchlist.service.ts`

```ts
await Promise.all([
  enrichStatsForPrizeType(statsByNumber, twoDigitNumbers, "TWO_DIGIT", 2),
  enrichStatsForPrizeType(statsByNumber, threeDigitNumbers, "THREE_DIGIT", 3),
  ...sixDigitPrizeTypes.map((prizeType) =>
    enrichStatsForPrizeType(statsByNumber, sixDigitNumbers, prizeType, 6)
  )
]);
```

อธิบาย:

- 2 หลัก -> TWO_DIGIT
- 3 หลัก -> THREE_DIGIT
- 6 หลัก -> ลอง match หลาย prize type ตั้งแต่ FIRST ถึง PRIZE5

Logic นี้กำลังคิดอะไร:

- สำหรับเลข 6 หลัก ระบบไม่รู้ล่วงหน้าว่าควรอิงรางวัลไหนที่สุด
- จึงลองหลาย prize type แล้วค่อยเลือก stat ที่ดีที่สุด

ผลต่อ UI:

- watchlist 6 หลักมีโอกาสได้ stat ที่ useful มากขึ้น

### `seedDraws`

Path: `src/api/service/draw-seed.service.ts`

```ts
const persistedDraw = await transaction.lotteryDraw.upsert({
  create: toDrawCreateInput(draw, seedFile),
  update: toDrawUpdateInput(draw, seedFile),
  where: {
    lotteryType_drawDate: {
      drawDate,
      lotteryType: draw.lotteryType
    }
  }
});

await transaction.lotteryPrize.deleteMany({
  where: {
    drawId: persistedDraw.id
  }
});
```

อธิบาย:

- seed ไม่ insert ซ้ำมั่ว ๆ
- ใช้ `lotteryType + drawDate` เป็นตัวตัดสินว่าเป็นงวดเดิมไหม
- ถ้ามีอยู่แล้วให้ update draw
- แล้วลบ prize เก่าของงวดนั้นออกก่อน
- ค่อย create prize ใหม่

Logic นี้กำลังคิดอะไร:

- import ต้อง idempotent
- ถ้ารันซ้ำควรได้ผลสุดท้ายเหมือนกัน ไม่พอกพูนข้อมูลซ้ำ

ผลต่อ product:

- data source เชื่อถือได้
- Results/Analytics จะไม่บวมเพราะ duplicate rows

### `toDrawSeedInput`

Path: `src/api/service/draw-seed.service.ts`

```ts
const prizes = [
  ...toNumberPrizes("FIRST", row.first_prize),
  ...toNumberPrizes("THREE_DIGIT", row.last3_numbers),
  ...toNumberPrizes("TWO_DIGIT", row.last2_number),
  ...toNumberPrizes("NEAR_FIRST", row.near_first_prize),
  ...toNumberPrizes("PRIZE2", row.prize2_numbers),
  ...toNumberPrizes("PRIZE3", row.prize3_numbers),
  ...toNumberPrizes("PRIZE4", row.prize4_numbers),
  ...toNumberPrizes("PRIZE5", row.prize5_numbers)
];
```

อธิบาย:

- CSV column ไหนแปลเป็น prize type อะไร ถูก lock ไว้ตรงนี้
- นี่คือ mapping หลักของ historical import

Logic นี้กำลังคิดอะไร:

- raw CSV ต้องถูก translate ให้เป็น domain model ที่ product ใช้ต่อได้

ผลต่อ UI:

- ถ้า mapping นี้ผิด หน้า Results, Analytics, Compare จะผิดทั้งหมด

### `splitPipeValues`

Path: `src/api/service/draw-seed.service.ts`

```ts
function splitPipeValues(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter((item) => /^\d+$/.test(item));
}
```

อธิบาย:

- แยกเลขหลายตัวจาก CSV ที่คั่นด้วย `|`
- trim ช่องว่าง
- เก็บเฉพาะค่าที่เป็นตัวเลขล้วน

Logic นี้กำลังคิดอะไร:

- import layer กัน placeholder หรือ text แปลก ๆ หลุดเข้า DB

ผลต่อ product:

- ลดโอกาสมีเลขปลอมในผลย้อนหลัง

### `getCsvDrawSourceStatus`

Path: `src/api/service/draw-seed.service.ts`

```ts
function getCsvDrawSourceStatus(row: CsvHistoryRow, prizeCount: number): SourceStatus {
  if (prizeCount === 0) {
    return "IMPORTED";
  }

  if (row.has_detail_section !== "True") {
    return "PARTIAL";
  }

  return "VERIFIED";
}
```

อธิบาย:

- ไม่มี prize เลย -> `IMPORTED`
- มี prize แต่ source บอกว่า detail section ไม่ครบ -> `PARTIAL`
- ครบ -> `VERIFIED`

Logic นี้กำลังคิดอะไร:

- UI ควรบอก user ว่าข้อมูลชุดนี้น่าเชื่อแค่ไหน

ผลต่อ UI:

- badge `complete/imported/partial` ใน Results มีที่มาจากตรงนี้ร่วมกับ DTO layer

---

# 12. Feature Dependency Graph

```text
CSV / seed data
  -> LotteryDraw + LotteryPrize
    -> Analytics engine
      -> NumberStat / DigitStat
        -> Materialized snapshots
        -> Prediction scoring
        -> Compare scoring
        -> Watchlist enrichment
        -> Search stats
    -> Results UI
    -> Calendar UI

Prediction scoring
  -> PredictionRun + PredictionResult
    -> Prediction Lab
    -> Dashboard prediction summary

Backtest engine
  -> BacktestRun + BacktestResult
    -> Backtest UI
```

ภาษาคน:

- Draw/prize คือฐาน
- Analytics คือเครื่องแปลฐานข้อมูลเป็นสัญญาณ
- Prediction/Compare ใช้สัญญาณเดียวกัน แต่คนละ use case
- Watchlist/Search ทำให้ user กลับมาใช้ข้อมูลของตัวเอง

---

# 13. MVP vs Advanced

## Must have

- ใส่เลขแล้ววิเคราะห์ได้
- Compare เลขหลายตัว
- Search เลข
- Save watchlist
- Results historical source
- Methodology/disclaimer

## Should have

- Analytics detail page
- Prediction Lab
- Dashboard summary
- Calendar context

## Later

- Backtest forทั่วไปแบบ simplified
- Pattern library
- Share image/card
- User account
- Personalized history

## Cut ถ้าต้องลด scope

- Dashboard contract table
- Advanced heatmap
- Raw API contract display
- Backtest detailed row table สำหรับ user ทั่วไป

---

# 14. UI Redesign Direction

## หน้าแรกควรเป็นอะไร

หน้าแรกควรเป็น "Analyze a number" ไม่ใช่ dashboard overview

ควรเห็นใน 10 วินาที:

- ช่องใส่เลข
- เลือก 2 ตัว / 3 ตัว / 6 ตัว
- ปุ่มวิเคราะห์
- ข้อความว่า "อ้างอิงข้อมูลย้อนหลัง ไม่รับประกันผล"

## Result card

Result card สำหรับเลขหนึ่งตัวควรมี:

- เลขใหญ่
- signal score
- เคยออกกี่ครั้ง
- หายไปกี่งวด
- ล่าสุดออกเมื่อไร
- reasons ภาษาคน 2-3 ข้อ
- save button

## Navigation ใหม่

Navigation ควรลดคำ technical:

- วิเคราะห์เลข
- เปรียบเทียบเลข
- เลขของฉัน
- ผลย้อนหลัง
- วิธีคิด

Advanced:

- สถิติเชิงลึก
- ทดลองย้อนหลัง
- ปฏิทิน

## Chart ไหนควรใช้/ตัด

ใช้:

- small bar/score breakdown
- simple trend list
- compact stat chips

ตัดหรือลด:

- heatmap ใหญ่ในหน้าแรก
- table หนัก
- contract rows

---

# 15. UI State Blueprint

## Analyze / Compare core page

- primary question: "เลขนี้มีสัญญาณอะไร"
- CTA: วิเคราะห์เลข
- component list: input, number length selector, result cards, save button
- API required: `POST /api/compare`, `POST /api/watchlist`
- states: idle, pending, empty, success, error
- mobile: input เต็ม width, cards stack
- desktop: input left, result right

## Results

- primary question: "เลขนี้เคยออกในผลย้อนหลังไหม"
- CTA: ค้นเลข
- API: `GET /api/draws`
- states: loading/empty/success/error
- mobile: cards
- desktop: filter + list

## Analytics

- primary question: "เลขกลุ่มนี้มีแนวโน้มย้อนหลังยังไง"
- CTA: เปลี่ยน window/prize
- API: `GET /api/analytics`
- states: empty/success/error
- mobile: summary cards first, chart after

## Prediction Lab

- primary question: "ถ้าให้ระบบเสนอเลขจากสัญญาณ จะได้อะไร"
- CTA: Generate
- API: `GET/POST /api/predictions`
- states: loading/no run/no candidates/success/error

## Watchlist

- primary question: "เลขที่ฉันสนใจตอนนี้เป็นยังไง"
- CTA: Add number
- API: `GET/POST/PATCH/DELETE /api/watchlist`
- states: empty/success/error/editing

## Search

- primary question: "ค้นเลขนี้เจออะไรบ้าง"
- CTA: Search
- API: `GET /api/search`
- states: empty/success/error

## Patterns

- primary question: "รูปแบบเลขแบบไหนกำลังพบในชุดข้อมูลนี้"
- CTA: ไปดู Analytics หรือ Compare ต่อ
- API required: ใช้ analytics model เดิม
- state: empty/success
- mobile: list ของ flagged numbers มาก่อน heatmap
- desktop: heatmap + summary side by side

## Methodology

- primary question: "ระบบคิดยังไง และฉันควรตีความผลแบบไหน"
- CTA: กลับไปวิเคราะห์เลข
- API required: none
- state: static success
- mobile: accordion/callout blocks
- desktop: long-form reference

## Home

- primary question: "ฉันจะเริ่มกับเลขที่สนใจยังไง"
- CTA: ใส่เลข
- API required: ideally search/compare on submit
- state: static now, should become action-first
- mobile: one-column hero with immediate input
- desktop: hero + example result preview

---

# 16. Current Risk

## Feature เยอะเกิน

ตอนนี้มี Dashboard, Results, Analytics, Patterns, Prediction Lab, Backtest, Watchlist, Compare, Calendar, Methodology, Search

Risk:

- user ไม่รู้เริ่มตรงไหน
- product ดูเหมือน analytics suite มากกว่า consumer tool

หลักฐานจาก code:

- `src/lib/app/navigation.ts` มีเมนู 10 หน้าในระดับเดียวกัน
- `src/frontend/components/search/GlobalSearch.tsx` ยังว่างอยู่
- `src/frontend/pages/home/index.tsx` ยังพาผู้ใช้ดู feature overview ก่อนเริ่มวิเคราะห์เลข

## Dashboard mindset

Dashboard ตอนนี้ aggregate หลายอย่างดีในเชิง engineering แต่ user ทั่วไปอาจไม่รู้ว่าต้องทำอะไรต่อ

## Mock fallback

หลายหน้ามี shell/mock เพื่อรักษา layout ตอน error แต่ production path ไม่ควร render data ปลอม

ต้องแยก:

- shell/copy fallback = okay
- fake records = ไม่ควร

## Schema overdesign

Schema รองรับ prediction/backtest/materialized stats แล้ว ซึ่งดีต่อ long-term แต่ UI ไม่ควร expose complexity ทั้งหมด

## Mojibake

`src/lib/app/navigation.ts` และ `design.md` บางส่วนมี Thai mojibake

ผล:

- ถ้าใช้ copy เหล่านี้ตรง ๆ UX เสียทันที
- ควรแก้ใน polish phase แต่เอกสารนี้ไม่แก้ code

ตัวอย่าง:

- `src/lib/app/navigation.ts`
- `src/frontend/components/layout/AppShell.tsx`

ผลเชิง product:

- owner ยังไม่ควรยึด Thai copy ปัจจุบันเป็น source of truth
- ควร define copy ใหม่จาก product language ก่อน redesign

---

# 17. Roadmap

## Phase 1: Reclaim product

- อ่าน `po.md`
- lock product sentence
- lock core loop
- เลือกหน้า core ใหม่

## Phase 2: Schema understanding

- เข้าใจ raw data: draw/prize
- เข้าใจ computed data: stats/prediction/backtest
- เข้าใจ run vs result

## Phase 3: Core loop

- หน้าแรก input เลข
- Compare/result card
- save watchlist

## Phase 4: Real data

- Results/search ใช้ DB จริง
- stats ใช้ analytics
- no fake records

## Phase 5: Analyze

- แปล stat เป็นภาษาคน
- score explanation
- uncertainty/disclaimer

## Phase 6: Save/share

- watchlist
- tags/note
- share card หรือ copy summary

## Phase 7: Advanced

- Prediction Lab
- Backtest
- Calendar
- Methodology deeper

---

# 18. Final Checklist

## อ่านอะไรก่อน

1. Section 0-1 เพื่อเข้า product
2. Section 2 เพื่อรู้แต่ละหน้ามีไว้ทำไม
3. Section 4 เพื่อเข้าใจศัพท์
4. Section 5 เพื่อเข้าใจ data model
5. Section 10 เพื่อเข้าใจ score/stat
6. Section 14-15 เพื่อออกแบบ UI ใหม่

## Lock อะไร

- Product sentence
- Core loop
- Meaning ของ score
- Meaning ของ missingDrawCount/frequency
- Rule ว่าไม่ claim ทำนายแม่นแน่นอน
- Rule ว่าเลขต้องเป็น string

## Ignore อะไรชั่วคราว

- Heatmap ใหญ่
- Backtest table ลึก
- Contract rows
- Internal DTO naming
- Prisma details ที่ user ไม่เห็น

## สิ่งที่ owner ควรคุมเอง

- copywriting ภาษาคน
- hierarchy หน้าแรก
- อะไรคือ must-have สำหรับ user ทั่วไป
- การแปล stat เป็น insight
- tone ที่ไม่ hype

## ประโยค product ที่ควรยึด

> ใส่เลขที่สนใจ แล้วดูว่าสถิติย้อนหลังบอกอะไรเกี่ยวกับเลขนี้บ้าง พร้อมเหตุผลที่อ่านง่ายและบันทึกไว้ดูต่อได้
