# MVP User Pages Implementation Plan

เอกสารนี้สรุปแผน implement หน้า user-facing ของ Lottery Intelligence Dashboard โดยอิงจากโครงสร้างโปรเจกต์ปัจจุบัน และเขียนให้ dev ที่ยังไม่มีพื้นฐานสถิติสามารถอ่านแล้วเริ่มทำงานต่อได้

## สถานะโปรเจกต์ปัจจุบัน

โปรเจกต์นี้เป็น scaffold-first MVP ใช้ Bun, Next.js App Router, Elysia API, Prisma + MongoDB และมีแนวทาง UI จาก `design.md`

สิ่งที่มีแล้ว:

- Route หลักมีครบตาม MVP navigation แล้ว ได้แก่ Dashboard, Results, Analytics, Patterns, Prediction Lab, Backtest, Watchlist, Compare, Calendar และ Methodology
- `DashboardPage` มี mock read model และ UI รอบแรกที่ parse ผ่าน Zod schema แล้ว
- `ResultsPage` มี mock UI ที่ค่อนข้างสมบูรณ์แล้ว และใช้ primitive/component ของโปรเจกต์จริง
- `Dashboard` และ `Results` มี contract แยกใน `src/schema/api` และ Zod schema ใน `src/schema/app`
- หน้า user-facing อื่นยังเป็น `PagePlaceholder`
- Sidebar และ AppShell พร้อมรองรับ user-facing dashboard layout
- API scaffold มี `/api/draws`, `/api/analytics`, `/api/predictions`, `/api/watchlist`
- Prisma schema มีแกนหลัก `LotteryDraw`, `LotteryPrize`, `UserWatchlistItem`, `PredictionRun`, `PredictionResult`
- Chart primitives ยังเป็น placeholder เช่น `TimeSeriesChart`, `Heatmap`
- Global search component ยังเป็น placeholder

ช่องว่างสำคัญ:

- ยังไม่มี service logic สำหรับ query ข้อมูลจริง
- ยังไม่มี data ingestion หรือ seed data จริง
- ยังไม่มี analytics read model เช่น `digit_stats`, `number_stats`, `strategy/backtest`
- API DTO และ app Zod schema มีเฉพาะบางหน้า ยังต้องขยายให้ครบตาม stage
- Prediction และ Backtest ยังไม่มี engine กลางให้หลายหน้า reuse

## Stage Management

โปรเจกต์นี้ไม่ควร implement ตามหน้า 1-10 ตรง ๆ เพราะหลายหน้าพึ่ง foundation เดียวกัน เช่น Results เป็นฐานของ Analytics, Analytics เป็นฐานของ Prediction, และ Prediction เป็นฐานของ Backtest/Compare ดังนั้นให้ใช้ stage แบบ foundation gate ก่อน แล้วค่อยขยาย feature

### Current Stage

ตอนนี้อยู่ที่ `Stage 0: Contract Freeze`

สิ่งที่เสร็จแล้ว:

- Dashboard และ Results มี mock read model ที่ validate ด้วย Zod ตอน render
- Results เริ่มแยก field สำหรับ API-ready contract แล้ว เช่น `drawDateIso`, `lotteryType`, `status`, `statusLabel`, `prizeType`
- Dashboard มี contract สำหรับ `latestDraw`, `metrics`, `signals`, `predictionSummary`, `contractRows`
- มี shared helper สำหรับ query string และ API request แล้วใน `src/util/api/query.ts` และ `src/lib/api/http.ts`
- เริ่ม Phase 1A แล้วด้วย shared query/filter contracts ใน `src/schema/api/query.ts` และ `src/schema/app/query.schema.ts`
- เพิ่ม contract และ Zod schema รอบแรกสำหรับ analytics, backtest, compare, calendar
- เพิ่ม backend-only DTO mapper สำหรับ analytics, backtest, compare, calendar โดยยังไม่ implement computation จริง
- เริ่ม Phase 1B แล้วด้วย test-ready contract fixtures ใน `src/schema/mock` ที่ไหลผ่าน DTO mapper และ Zod parse
- เริ่ม Phase 1C แล้วด้วย reusable UI foundation ได้แก่ `FilterToolbar`, `EmptyState`, และ `LoadingSkeleton`
- Copy สำคัญยังสื่อสารแบบ analysis ไม่ใช่ guarantee

สิ่งที่ต้องทำให้จบก่อนขยับ stage:

- ตรวจและใช้งาน shared query context เช่น `lotteryType`, `prizeType`, `windowSize`, `startDate`, `endDate` กับ endpoints ชุดแรก
- เติม contract ที่ยังขาดสำหรับ dashboard/prediction/watchlist ให้สอดคล้องกับ shared query/filter shape เมื่อเริ่มแตะ feature นั้น
- ใช้ shared query/http helpers กับ endpoints ใหม่แทนการ parse query หรือประกอบ URL เองในแต่ละ router/page
- ย้าย page-local mock ที่เริ่มถูกใช้ซ้ำให้มาอิง shared fixtures ใน `src/schema/mock`
- นำ reusable UI foundation ไปใช้ใน Results, Analytics, Prediction, Backtest และ Compare เมื่อเริ่มแตะหน้านั้น

Definition of Done ของ Stage 0:

- Mock ทุกชุดที่เป็น read model ต้อง parse ผ่าน Zod
- API interface ใน `src/schema/api` และ app schema ใน `src/schema/app` ต้องมี field หลักตรงกัน
- Page files ห้ามมี business logic หรือการคำนวณสถิติจริง
- `bun run check` ต้องผ่าน

### Stage 1: Results As Source Of Truth

เป้าหมาย:

- ทำให้ Results เป็นฐานข้อมูลย้อนหลังที่หน้าอื่นเชื่อถือได้
- ต่อ API เส้นแรกให้ทำงานผ่าน service layer โดยไม่ทำให้ UI contract เปลี่ยน

งานหลัก:

- Implement `drawService.getDraws()` และ `drawService.getDrawById()`
- Implement `GET /api/draws` และ `GET /api/draws/:id`
- Map Prisma `LotteryDraw` + `LotteryPrize` เป็น `ResultsReadModel`
- รองรับ filter ขั้นต่ำ: `lotteryType`, `year`, `month`, `q`, `prizeType`
- ทำ search โดยรักษาเลขเป็น string เสมอ เพื่อไม่ให้ leading zero หาย

Definition of Done:

- Results ใช้ mock หรือ API ผ่าน contract เดียวกัน
- `status` เป็น machine-readable เช่น `complete`, `partial`, `imported`
- `statusLabel` เป็นข้อความที่ UI ใช้แสดง
- `bun run check` ผ่าน

### Stage 2: Analytics Engine

เป้าหมาย:

- สร้าง computation กลางก่อนทำ Analytics, Dashboard, Prediction, Compare

งานหลัก:

- สร้าง utility แตก `LotteryPrize.number` เป็น digit events
- Implement `analyticsService.getDigitStats()`
- Implement `analyticsService.getNumberStats()`
- Implement `GET /api/analytics/digits` และ `GET /api/analytics/numbers`
- ทำ chart primitives ให้รับ data จริงแทน placeholder

Definition of Done:

- Stats ทุกตัวมี context เช่น `lotteryType`, `prizeType`, `windowSize`, `computedAt`
- มี fixture หรือ test case สำหรับเลขที่มีศูนย์นำหน้า เช่น `007`, `09`
- Dashboard hot/cold/overdue ใช้ service เดียวกับ Analytics

### Stage 3: Dashboard And Analytics UI

เป้าหมาย:

- เปลี่ยน Dashboard และ Analytics จาก mock-only ไปใช้ analytics read model จริง

งานหลัก:

- Dashboard ใช้ `drawService.getLatestDraw()` และ analytics summary
- Analytics page แสดง digit stats, position stats, last seen, missing draw count
- เพิ่ม empty/loading state สำหรับ table และ chart
- Mobile layout ต้อง explicit สำหรับ filters และ table overflow

Definition of Done:

- Page ไม่คำนวณ stats เอง
- UI ใช้ primitives/components ที่มีอยู่
- Chart/table อ่านได้ทั้ง desktop และ mobile

### Stage 4: Explainable Prediction

เป้าหมาย:

- ทำ Prediction Lab แบบอธิบายได้ โดยยังไม่ทำ ML หนักหรือคำกล่าวอ้างเกินจริง

งานหลัก:

- สร้าง strategy registry แบบ static ก่อน เช่น `hotTrend`, `coldRebound`, `balanced`
- Implement `predictionService.scoreNumber()` และ `predictionService.generate()`
- Implement `POST /api/predictions`
- ทุก result ต้องมี `score`, `scoreBreakdown`, `reasons`, `inputWindow`, `version`

Definition of Done:

- ไม่มี copy แนว guarantee
- ทุก score มี explanation
- ใช้ analytics engine เดิม ไม่ duplicate logic ใน Prediction page

### Stage 5: Watchlist Workflow

เป้าหมาย:

- ทำให้ product เริ่มมี workflow ส่วนตัวของผู้ใช้

งานหลัก:

- Implement watchlist CRUD: `GET`, `POST`, `PATCH`, `DELETE`
- Enrich watchlist item ด้วย `number_stats`
- Save number จาก Prediction, Compare หรือ Analytics เข้า Watchlist
- ถ้ายังไม่มี auth ให้ระบุชัดว่าเป็น global/local MVP

Definition of Done:

- Mutation อยู่ใน API/service
- Watchlist item มี `number`, `numberLength`, `lotteryType`, `tags`, `note`, `source`
- UI มี empty state และ archived/muted state ถ้ารองรับ archive

### Stage 6: Backtest Before Trusting Strategies

เป้าหมาย:

- ตรวจ strategy ด้วย walk-forward backtest ก่อนขยาย prediction ให้ซับซ้อน

งานหลัก:

- Implement `POST /api/backtests`
- เก็บ `BacktestRun` และ `BacktestResult`
- Metric ขั้นต่ำ: `hitRate`, `longestMissStreak`, `averageHitRank`, `coverage`
- ใช้ strategy version และ params เดียวกับ Prediction

Definition of Done:

- ป้องกัน data leakage โดยใช้เฉพาะงวดก่อนหน้าของงวดที่กำลังทดสอบ
- แสดงข้อจำกัดและ sample size ชัดเจน
- มี random baseline หรืออย่างน้อยระบุว่ายังไม่มี baseline

### Stage 7: Compare, Calendar, Methodology Polish

เป้าหมาย:

- ขยาย feature ที่ reuse engine เดิม และเพิ่ม trust layer ให้ product

งานหลัก:

- Compare ใช้ `predictionService.scoreNumber()` และ `analyticsService.getNumberStats()`
- Calendar ใช้ draw schedule helper และ monthly analytics
- Methodology อธิบายสูตร ข้อจำกัด และ glossary
- Link จากทุกหน้าที่มี score หรือคำศัพท์สถิติไป Methodology

Definition of Done:

- ไม่มี logic ใหม่ที่ควรอยู่ใน analytics/prediction service ถูกเขียนซ้ำใน page
- Copy สอดคล้อง responsible prediction
- `bun run check` ผ่าน

### Deferred Until After MVP

สิ่งต่อไปนี้ควรเลื่อนไปหลัง MVP เว้นแต่ผู้ใช้ขอชัดเจน:

- Auth และ multi-user personalization
- Official source sync/import UI
- Fuzzy search, command palette, search index แยก
- Bayesian confidence, Monte Carlo, clustering, Prophet, LightGBM/XGBoost, LSTM
- ROI simulation หรือ payout/risk financial modeling

## หลักการ implement

1. เริ่มจาก data contract ก่อน UI ลึก ๆ  
   ทุกหน้าควรรู้ว่าต้องการข้อมูลรูปทรงไหนก่อน แล้วค่อยต่อ API/Prisma ภายหลัง

2. แยก raw data กับ computed stats  
   `draws` และ `prizes` คือข้อมูลจริงย้อนหลัง ส่วน hot/cold/overdue/trend/score คือข้อมูลที่คำนวณจาก raw data

3. ใช้ service layer เป็นที่รวม logic  
   Page ไม่ควรคำนวณสถิติเอง ให้เรียก service หรือ API ที่คืน read model พร้อมใช้

4. ทำ score แบบ explainable ตั้งแต่แรก  
   ทุกเลขที่แนะนำต้องมี `scoreBreakdown` และ `reasons` เพื่อให้ผู้ใช้เข้าใจว่าเลขนั้นน่าสนใจเพราะอะไร

5. Backtest ต้องป้องกัน data leakage  
   เวลาทดสอบย้อนหลัง ห้ามใช้ข้อมูลของงวดที่จะทายมาคำนวณสูตร ต้องใช้เฉพาะข้อมูลงวดก่อนหน้าเท่านั้น

6. สื่อสารว่าเป็น analysis ไม่ใช่ guarantee  
   Lottery เป็นเหตุการณ์สุ่ม ผลย้อนหลังช่วยอธิบาย pattern ในข้อมูล แต่ไม่สามารถการันตีผลอนาคตได้

### Contract, Schema, และ DTO ownership

เพื่อไม่ให้ API contract, frontend validation, และ backend mapper ซ้ำบทบาทกัน ให้ใช้ ownership ต่อไปนี้:

- `src/schema/api`: public API contract เป็น TypeScript interface/type ของ request หรือ response ที่ endpoint เปิดเผย
- `src/schema/app`: Zod validation schema สำหรับ app/frontend, URL query params, form state, request body และ inferred app types
- `src/api/model/dto`: backend-only mapper/serializer สำหรับแปลง Prisma/domain/service result เป็น shape จาก `src/schema/api`

Flow ที่ควรใช้:

```text
Frontend form/query
  -> validate with src/schema/app
  -> call /api/...
  -> API router validates request with src/schema/app when needed
  -> service handles business logic
  -> dto maps service/domain result
  -> return src/schema/api shape
```

ข้อห้าม:

- Page หรือ frontend component ห้าม import จาก `src/api/model/dto`
- DTO file ไม่ควรเป็น shared Zod schema source
- ห้ามให้ frontend ผูกกับ Prisma-ish field หรือ backend mapper โดยตรง
- ถ้า response ต้อง normalize date, enum, label หรือซ่อน internal field ให้ทำใน DTO mapper

## Glossary สถิติแบบง่าย

- Draw: งวดหวยหนึ่งงวด เช่น 1 เมษายน 2026
- Prize: รางวัลในงวด เช่น รางวัลที่ 1, เลขท้าย 2 ตัว, เลขหน้า 3 ตัว
- Frequency: จำนวนครั้งที่เลขออกในช่วงข้อมูลที่เลือก เช่น เลข 7 ออก 120 ครั้งจาก 1,250 งวด
- Position frequency: ความถี่แยกตามตำแหน่ง เช่น เลข 7 ออกบ่อยที่หลักสิบ แต่ไม่บ่อยที่หลักหน่วย
- Recency: เลขนั้นออกล่าสุดเมื่อไหร่
- Overdue หรือ Missing draw count: เลขหายไปกี่งวดแล้วนับจากครั้งล่าสุดที่ออก
- Hot number: เลขที่ออกบ่อยกว่ากลุ่มอื่นในช่วงข้อมูลที่เลือก
- Cold number: เลขที่ออกน้อยกว่ากลุ่มอื่นในช่วงข้อมูลที่เลือก
- Trend: ทิศทางช่วงสั้น เช่น 20 งวดล่าสุดเลขนี้ออกถี่ขึ้นหรือน้อยลงเมื่อเทียบกับ 20 งวดก่อนหน้า
- Score: คะแนนรวม 0-100 ที่รวมหลาย signal เช่น hot trend, overdue, position support
- Hit rate: Backtest ทายโดนกี่งวดจากจำนวนงวดที่ทดสอบ
- Longest miss streak: จำนวนงวดติดกันที่ strategy พลาดนานที่สุด

## Data Model ที่ควรเตรียม

### 1. draws

มีแล้วใน Prisma เป็น `LotteryDraw`

หน้าที่:

- เก็บข้อมูลงวด เช่น วันที่ออกรางวัล ประเภทหวย เลขงวด
- เป็น parent ของ prizes

ควรเพิ่มในอนาคต:

- `sourceUrl` แหล่งข้อมูล
- `sourceStatus` เช่น verified, partial, imported
- `publishedAt`
- `metadata` สำหรับข้อมูลเสริมจาก official source

### 2. prizes

มีแล้วใน Prisma เป็น `LotteryPrize`

หน้าที่:

- เก็บเลขรางวัลทั้งหมดของแต่ละงวด
- รองรับ prize type เช่น first, three front, three back, two digit

ข้อควรระวัง:

- เก็บเลขเป็น string เสมอ เพื่อรักษาเลขศูนย์นำหน้า เช่น `"007"`
- แยก `type` และ `position` ให้ชัด เพื่อรองรับรางวัลที่มีหลายเลขใน type เดียวกัน

### 3. digit_stats

ยังไม่มี ควรเป็น read model หรือ materialized snapshot

หน้าที่:

- เก็บสถิติเลข 0-9
- แยกตาม lottery type, prize type, position, date range หรือ draw window

field ที่ควรมี:

- `lotteryType`
- `prizeType`
- `digit`
- `position`
- `windowSize`
- `drawCount`
- `hitCount`
- `frequencyPercent`
- `lastSeenDrawDate`
- `missingDrawCount`
- `trendDirection`
- `computedAt`

วิธีคำนวณแบบง่าย:

1. ดึง prizes ตามช่วงงวดที่เลือก
2. แตกเลขแต่ละรางวัลเป็น digit events เช่น `"583"` กลายเป็น `(5, pos1)`, `(8, pos2)`, `(3, pos3)`
3. นับจำนวนแต่ละ digit รวม และนับแยก position
4. หา last seen ด้วยการเรียง draw date ล่าสุดก่อน

### 4. number_stats

ยังไม่มี ควรเป็น read model สำหรับเลข 2, 3, 6 ตัว

หน้าที่:

- ตอบคำถามว่าเลขชุดหนึ่งเคยออกกี่ครั้ง ล่าสุดเมื่อไหร่ hot/cold/overdue แค่ไหน
- ใช้ร่วมกันใน Results, Watchlist, Compare, Prediction Lab

field ที่ควรมี:

- `number`
- `numberLength`
- `lotteryType`
- `prizeType`
- `drawCount`
- `hitCount`
- `frequencyPercent`
- `lastSeenDrawDate`
- `missingDrawCount`
- `averageGap`
- `maxGap`
- `trendScore`
- `patternFlags`
- `computedAt`

### 5. predictions

มีแล้วบางส่วนเป็น `PredictionRun` และ `PredictionResult`

ควรขยาย:

- `strategyId`
- `targetDrawDate`
- `lotteryType`
- `numberLength`
- `scoreBreakdown`
- `inputWindow`
- `version`

`PredictionResult` ควรมี:

- `number`
- `score`
- `reasons`
- `scoreBreakdown`
- `rank`

### 6. watchlist

มีแล้วเป็น `UserWatchlistItem`

ควรขยาย:

- `lotteryType`
- `numberLength`
- `sourcePredictionId`
- `lastViewedAt`
- `archivedAt`

ถ้ายังไม่มีระบบ user auth ให้เป็น local MVP/global watchlist ไปก่อน แต่ควรออกแบบ field ให้รองรับ `userId` ภายหลัง

### 7. strategies

ยังไม่มี ควรเพิ่มเพื่อให้ Prediction Lab และ Backtest ใช้สูตรเดียวกัน

field ที่ควรมี:

- `id`
- `name`
- `description`
- `type`
- `defaultParams`
- `isActive`
- `version`
- `createdAt`
- `updatedAt`

ตัวอย่าง strategy:

- Hot trend
- Cold rebound
- Balanced
- Pair support
- Position frequency

### 8. backtest_runs และ backtest_results

ควรเพิ่มเพื่อเก็บผลทดสอบย้อนหลัง

`BacktestRun`:

- `strategyId`
- `params`
- `lotteryType`
- `prizeType`
- `numberLength`
- `startDrawDate`
- `endDrawDate`
- `candidateCount`
- `hitRate`
- `longestMissStreak`
- `computedAt`

`BacktestResult`:

- `runId`
- `drawId`
- `generatedNumbers`
- `actualNumbers`
- `isHit`
- `hitNumbers`
- `rankOfHit`

## Data Field Dictionary แบบละเอียด

section นี้อธิบาย field ที่มีอยู่แล้วและ field ที่ควรเพิ่มในอนาคต โดยใช้ภาษาง่าย ๆ ว่าแต่ละ field คืออะไร เก็บอะไร ทำไมต้องมี และเอาไปใช้กับ feature ไหน

### หลักการตั้ง field สำหรับโปรเจกต์นี้

- เลขหวยต้องเก็บเป็น `String` เสมอ เพราะเลขอาจมีศูนย์นำหน้า เช่น `007`, `09`, `000123`
- ทุกข้อมูลควรผูกกับ `lotteryType` เพื่อรองรับหวยหลายประเภทในอนาคต
- ทุกสถิติควรมี context เช่น `prizeType`, `dateRange`, `windowSize` ไม่อย่างนั้นตัวเลขจะตีความผิดง่าย
- ข้อมูล raw เช่น `draws` และ `prizes` ควรเก็บถาวร ส่วนข้อมูลสถิติ เช่น `digit_stats` และ `number_stats` จะคำนวณใหม่ได้
- Field ที่เป็น score ควรมี explanation หรือ breakdown คู่กันเสมอ เพื่อให้ผู้ใช้รู้ว่าคะแนนมาจากอะไร

### LotteryDraw หรือ draws

ตารางนี้คือ “หนึ่งงวดหวย” เช่น งวดวันที่ 1 เมษายน 2026 เป็นแกนหลักที่ข้อมูลอื่นจะอ้างอิงถึง

| Field          | สถานะ    | เก็บอะไร                                           | ทำไมต้องมี                                                  | ใช้กับ feature              |
| -------------- | -------- | -------------------------------------------------- | ----------------------------------------------------------- | --------------------------- |
| `id`           | มีแล้ว   | รหัสภายในของงวด ใช้ UUID v7                        | ใช้อ้างอิงงวดแบบไม่พึ่งวันที่อย่างเดียว และเชื่อมกับ prizes | Results, Backtest, Calendar |
| `lotteryType`  | มีแล้ว   | ประเภทหวย เช่น `THAI_GOVERNMENT`                   | อนาคตถ้ามีหลายประเภทหวยจะไม่ปนกัน                           | ทุกหน้า                     |
| `drawDate`     | มีแล้ว   | วันที่ออกผลรางวัล                                  | ใช้เรียงงวด กรองปี/เดือน ทำ calendar และ backtest           | Results, Calendar, Backtest |
| `drawNo`       | มีแล้ว   | เลขงวดหรือรหัสงวด ถ้าแหล่งข้อมูลมี                 | ช่วยค้นหาและแสดงข้อมูลแบบที่ผู้ใช้คุ้นเคย                   | Results                     |
| `prizes`       | มีแล้ว   | relation ไปยังรางวัลในงวดนั้น                      | ทำให้ดึงรางวัลทั้งหมดของงวดเดียวได้                         | Results, Analytics          |
| `createdAt`    | มีแล้ว   | เวลาที่ record ถูกสร้างในระบบ                      | ใช้ audit ว่าข้อมูลเข้าระบบเมื่อไหร่                        | Admin/internal, data audit  |
| `updatedAt`    | มีแล้ว   | เวลาที่ record ถูกแก้ล่าสุด                        | ใช้ตรวจว่าข้อมูลถูกแก้หรือ sync ใหม่เมื่อไหร่               | Data audit                  |
| `sourceUrl`    | ควรเพิ่ม | URL หรือ reference ของแหล่งข้อมูล                  | เพิ่มความน่าเชื่อถือ และย้อนตรวจได้                         | Results, Methodology        |
| `sourceStatus` | ควรเพิ่ม | สถานะข้อมูล เช่น `verified`, `partial`, `imported` | บอกว่าข้อมูลงวดนี้ครบและตรวจแล้วหรือยัง                     | Results, Dashboard          |
| `publishedAt`  | ควรเพิ่ม | เวลาที่ผลถูกเผยแพร่จากแหล่งต้นทาง                  | ใช้แยกเวลาประกาศจริงกับเวลาที่เรา import                    | Results, Calendar           |
| `metadata`     | ควรเพิ่ม | JSON ข้อมูลเสริม เช่น หมายเหตุวันเลื่อน            | ยืดหยุ่นสำหรับข้อมูลพิเศษโดยไม่ต้องเพิ่ม column บ่อย        | Calendar, Data audit        |

ตัวอย่างการใช้จริง:

- หน้า Results ใช้ `drawDate` เพื่อ filter เดือนเมษายน 2026
- หน้า Calendar ใช้ `drawDate` เพื่อหา pattern เดือนเดียวกันในอดีต
- Backtest ใช้ `drawDate` เพื่อเรียงลำดับเวลาและป้องกันการใช้ข้อมูลอนาคต

### LotteryPrize หรือ prizes

ตารางนี้คือ “รางวัลแต่ละรายการในงวด” เช่น รางวัลที่ 1 คือ `123456`, เลขท้าย 2 ตัวคือ `89`

| Field       | สถานะ  | เก็บอะไร                               | ทำไมต้องมี                                                    | ใช้กับ feature                 |
| ----------- | ------ | -------------------------------------- | ------------------------------------------------------------- | ------------------------------ |
| `id`        | มีแล้ว | รหัสภายในของรางวัล                     | ใช้อ้างอิงรางวัลแต่ละแถว                                      | Results                        |
| `drawId`    | มีแล้ว | id ของงวดที่รางวัลนี้อยู่              | เชื่อม prize กลับไป draw                                      | Results, Analytics             |
| `draw`      | มีแล้ว | relation ไปยัง `LotteryDraw`           | ช่วย query รางวัลพร้อมข้อมูลงวด                               | Results                        |
| `type`      | มีแล้ว | ประเภทรางวัล เช่น `FIRST`, `TWO_DIGIT` | แยกเลข 2 ตัว 3 ตัว 6 ตัวไม่ให้ปนกัน                           | Results, Analytics, Prediction |
| `position`  | มีแล้ว | ลำดับของรางวัลในประเภทเดียวกัน         | ใช้กรณีมีหลายเลขในรางวัลประเภทเดียว เช่น เลขหน้า 3 ตัวหลายชุด | Results                        |
| `number`    | มีแล้ว | เลขรางวัลแบบ string                    | รักษาศูนย์นำหน้า และใช้ค้นหา/แตก digit                        | ทุก feature ที่เกี่ยวกับเลข    |
| `createdAt` | มีแล้ว | เวลาที่ prize ถูกสร้าง                 | ใช้ audit/import tracking                                     | Data audit                     |
| `updatedAt` | มีแล้ว | เวลาที่ prize ถูกแก้ล่าสุด             | ใช้ตรวจความเปลี่ยนแปลงของข้อมูล                               | Data audit                     |

ข้อควรจำ:

- `number` ห้ามแปลงเป็น number type เพราะ `007` จะกลายเป็น `7`
- การวิเคราะห์เลข 2 ตัวควรใช้เฉพาะ prize type ที่เป็นเลข 2 ตัว หรือสร้าง rule ที่ระบุชัดว่าใช้เลขท้าย 2 จากรางวัลที่ 1 หรือไม่

### LotteryType enum

ใช้บอกว่าข้อมูลเป็นหวยประเภทไหน

| Value             | ความหมาย             | ทำไมต้องมี                                                   |
| ----------------- | -------------------- | ------------------------------------------------------------ |
| `THAI_GOVERNMENT` | สลากกินแบ่งรัฐบาลไทย | เป็นค่าเริ่มต้นของ MVP และทำให้โครงสร้างรองรับหวยอื่นในอนาคต |

ในอนาคตอาจเพิ่มหวยประเภทอื่นได้ เช่น lottery ต่างประเทศ หรือหวยชุดอื่น แต่ต้องแยก schedule, prize type และ methodology ให้ชัด

### LotteryPrizeType enum

ใช้บอกว่ารางวัลเป็นประเภทอะไร

| Value         | ความหมาย                   | ใช้ทำอะไร                                                             |
| ------------- | -------------------------- | --------------------------------------------------------------------- |
| `FIRST`       | รางวัลที่ 1 เลข 6 ตัว      | วิเคราะห์เลข 6 ตัว และดึงเลขท้ายบางตำแหน่งถ้า strategy ระบุ           |
| `THREE_FRONT` | เลขหน้า 3 ตัว              | ใช้ search และ analytics ของเลข 3 ตัว                                 |
| `THREE_BACK`  | เลขท้าย 3 ตัว              | ใช้ search และ analytics ของเลข 3 ตัว                                 |
| `TWO_DIGIT`   | เลขท้าย 2 ตัว              | ใช้กับ feature ที่คนใช้บ่อยที่สุด เช่น search 2 ตัว, prediction 2 ตัว |
| `NEAR_FIRST`  | รางวัลข้างเคียงรางวัลที่ 1 | เก็บผลย้อนหลังให้ครบ แต่ MVP อาจยังไม่ใช้ใน prediction                |
| `OTHER`       | รางวัลอื่น ๆ               | รองรับข้อมูลครบชุดโดยไม่ต้องรื้อ schema                               |

### UserWatchlistItem หรือ watchlist

ตารางนี้คือ “เลขที่ผู้ใช้สนใจ” เช่น ผู้ใช้ save `47` พร้อม tag `เลขบ้าน`

| Field                | สถานะ                | เก็บอะไร                                      | ทำไมต้องมี                              | ใช้กับ feature            |
| -------------------- | -------------------- | --------------------------------------------- | --------------------------------------- | ------------------------- |
| `id`                 | มีแล้ว               | รหัส watchlist item                           | ใช้ edit/delete เลขที่บันทึก            | Watchlist                 |
| `number`             | มีแล้ว               | เลขที่ผู้ใช้สนใจ เช่น `47`, `583`             | เป็นหัวใจของ watchlist                  | Watchlist, Compare        |
| `source`             | มีแล้ว               | ที่มาของเลข เช่น manual, prediction, notebook | บอกว่าเลขนี้ผู้ใช้ใส่เองหรือมาจากระบบ   | Watchlist                 |
| `tags`               | มีแล้ว               | ป้ายกำกับ เช่น `เลขบ้าน`, `เลขฝัน`            | ช่วยจัดหมวดเลขส่วนตัว                   | Watchlist, Global search  |
| `note`               | มีแล้ว               | note ส่วนตัวของผู้ใช้                         | เก็บบริบทที่ระบบคำนวณให้ไม่ได้          | Watchlist                 |
| `createdAt`          | มีแล้ว               | วันที่บันทึกเลข                               | ใช้เรียงรายการและดู history             | Watchlist                 |
| `updatedAt`          | มีแล้ว               | วันที่แก้ไขล่าสุด                             | ใช้ sync UI และ audit                   | Watchlist                 |
| `lotteryType`        | ควรเพิ่ม             | ประเภทหวยของเลขนี้                            | เลขเดียวกันอาจอยู่คนละบริบทถ้ามีหลายหวย | Watchlist                 |
| `numberLength`       | ควรเพิ่ม             | ความยาวเลข เช่น 2, 3, 6                       | ช่วยเลือก analytics ที่ถูกต้อง          | Watchlist, Compare        |
| `sourcePredictionId` | ควรเพิ่ม             | prediction result ที่ทำให้ save เลขนี้        | ย้อนดูได้ว่าเลขมาจากสูตรไหน             | Prediction Lab, Watchlist |
| `lastViewedAt`       | ควรเพิ่ม             | ผู้ใช้เปิดดูเลขนี้ล่าสุดเมื่อไหร่             | ใช้จัดลำดับหรือทำ notification ในอนาคต  | Watchlist                 |
| `archivedAt`         | ควรเพิ่ม             | เวลาที่ผู้ใช้ archive เลข                     | ซ่อนเลขโดยไม่ลบประวัติ                  | Watchlist                 |
| `userId`             | ควรเพิ่มเมื่อมี auth | เจ้าของ watchlist item                        | รองรับหลายผู้ใช้จริง                    | Watchlist                 |

ตัวอย่างการใช้จริง:

- ผู้ใช้ save `47` จาก Prediction Lab ระบบตั้ง `source = PREDICTION`
- ผู้ใช้ใส่ tag `เลขบ้าน` ทำให้ global search หา tag นี้เจอ
- หน้า Watchlist enrich เลข `47` ด้วย `number_stats` เพื่อบอกว่าเคยออกกี่ครั้งและล่าสุดเมื่อไหร่

### WatchlistSource enum

ใช้บอกที่มาของเลขใน watchlist

| Value        | ความหมาย                  | ตัวอย่าง                             |
| ------------ | ------------------------- | ------------------------------------ |
| `MANUAL`     | ผู้ใช้กรอกเอง             | พิมพ์ `47` ใน Watchlist              |
| `PREDICTION` | มาจาก Prediction Lab      | กด save เลขที่ระบบแนะนำ              |
| `NOTEBOOK`   | มาจากบันทึก/ไอเดียส่วนตัว | อนาคตถ้ามี notebook หรือ import note |

### PredictionRun หรือ predictions

ตารางนี้คือ “การ generate เลขหนึ่งครั้ง” เช่น ผู้ใช้เลือกสูตร Balanced แล้วกด generate ได้เลขออกมา 10 ตัว

| Field            | สถานะ    | เก็บอะไร                                         | ทำไมต้องมี                         | ใช้กับ feature              |
| ---------------- | -------- | ------------------------------------------------ | ---------------------------------- | --------------------------- |
| `id`             | มีแล้ว   | รหัสของ prediction run                           | ใช้อ้างอิงชุดผลลัพธ์หนึ่งครั้ง     | Prediction Lab              |
| `strategy`       | มีแล้ว   | ชื่อสูตร เช่น `balanced`                         | บอกว่าผลนี้มาจากสูตรไหน            | Prediction Lab, Backtest    |
| `params`         | มีแล้ว   | JSON parameter เช่น window size, candidate count | ทำให้ run เดิม reproduce ได้       | Prediction Lab, Backtest    |
| `items`          | มีแล้ว   | relation ไป prediction results                   | ดึงเลขทั้งหมดใน run เดียวกัน       | Prediction Lab              |
| `createdAt`      | มีแล้ว   | วันที่ generate                                  | ใช้ history และ audit              | Prediction Lab              |
| `updatedAt`      | มีแล้ว   | วันที่แก้ไขล่าสุด                                | ใช้ audit                          | Internal                    |
| `strategyId`     | ควรเพิ่ม | id ของ strategy definition                       | แยกชื่อสูตรกับ version/config จริง | Prediction, Backtest        |
| `targetDrawDate` | ควรเพิ่ม | งวดที่ต้องการทำนาย                               | ทำให้รู้ว่าผลนี้ตั้งใจใช้กับงวดไหน | Prediction Lab, Watchlist   |
| `lotteryType`    | ควรเพิ่ม | ประเภทหวย                                        | ไม่ให้ผลหลายหวยปนกัน               | ทุก prediction              |
| `numberLength`   | ควรเพิ่ม | ความยาวเลขที่ generate                           | แยกสูตร 2/3/6 ตัว                  | Prediction Lab              |
| `inputWindow`    | ควรเพิ่ม | ใช้ข้อมูลย้อนหลังช่วงไหน เช่น 120 งวด            | ช่วยอธิบาย score และ reproduce     | Prediction Lab, Methodology |
| `version`        | ควรเพิ่ม | version ของ scoring engine                       | กันผลเก่ากับสูตรใหม่ปนกัน          | Prediction, Backtest        |
| `status`         | ควรเพิ่ม | `completed`, `failed`, `running`                 | รองรับงานคำนวณที่ใช้เวลานาน        | Prediction, Backtest        |

### PredictionResult

ตารางนี้คือ “เลขแต่ละตัวที่อยู่ใน prediction run” เช่น run หนึ่งมีเลขแนะนำ `47`, `83`, `09`

| Field            | สถานะ    | เก็บอะไร                             | ทำไมต้องมี                             | ใช้กับ feature            |
| ---------------- | -------- | ------------------------------------ | -------------------------------------- | ------------------------- |
| `id`             | มีแล้ว   | รหัสผลลัพธ์แต่ละเลข                  | ใช้อ้างอิง result เฉพาะตัว             | Prediction Lab            |
| `runId`          | มีแล้ว   | id ของ prediction run                | ผูกเลขกลับไปยัง run ที่สร้างมัน        | Prediction Lab            |
| `run`            | มีแล้ว   | relation ไป `PredictionRun`          | query ข้อมูล run พร้อม result          | Prediction Lab            |
| `number`         | มีแล้ว   | เลขที่แนะนำ                          | สิ่งที่ผู้ใช้เห็นและ save ได้          | Prediction Lab, Watchlist |
| `score`          | มีแล้ว   | คะแนนรวม เช่น 82                     | ใช้จัดอันดับเลข                        | Prediction, Compare       |
| `reasons`        | มีแล้ว   | เหตุผลเป็นข้อความ เช่น hot trend สูง | ทำให้ผลลัพธ์อธิบายได้                  | Explain score             |
| `createdAt`      | มีแล้ว   | วันที่สร้าง result                   | audit/history                          | Internal                  |
| `updatedAt`      | มีแล้ว   | วันที่แก้ result                     | audit                                  | Internal                  |
| `scoreBreakdown` | ควรเพิ่ม | คะแนนย่อย เช่น hot 30, overdue 20    | ผู้ใช้รู้ว่าคะแนนมาจากอะไร             | Prediction, Compare       |
| `rank`           | ควรเพิ่ม | ลำดับในชุดผลลัพธ์                    | แสดง top 1, top 2 และใช้ backtest rank | Prediction, Backtest      |
| `confidence`     | ควรเพิ่ม | ความมั่นใจ เช่น low/medium/high      | แยก score สูงออกจากความมั่นใจสูง       | Prediction, Compare       |

ตัวอย่าง `scoreBreakdown`:

```json
{
  "hotTrend": 28,
  "overdue": 12,
  "positionSupport": 24,
  "pairSupport": 10,
  "patternSupport": 8
}
```

### digit_stats

ตารางหรือ read model นี้คือ “สถิติเลขโดด 0-9” ใช้ตอบคำถามว่าเลข 7 ออกบ่อยไหม ออกตำแหน่งไหน และหายไปนานหรือยัง

| Field              | สถานะ    | เก็บอะไร                            | ทำไมต้องมี                             | ใช้กับ feature        |
| ------------------ | -------- | ----------------------------------- | -------------------------------------- | --------------------- |
| `lotteryType`      | ควรเพิ่ม | ประเภทหวย                           | แยกข้อมูลแต่ละหวย                      | Analytics             |
| `prizeType`        | ควรเพิ่ม | ประเภทรางวัลที่นำมาคำนวณ            | เลข 2 ตัวกับ 6 ตัวมีบริบทต่างกัน       | Analytics             |
| `digit`            | ควรเพิ่ม | เลขโดด 0-9                          | หน่วยวิเคราะห์หลักของหน้านี้           | Analytics             |
| `position`         | ควรเพิ่ม | ตำแหน่งหลัก เช่น หลักสิบ หลักหน่วย  | ดูว่า digit แข็งแรงในตำแหน่งไหน        | Analytics, Prediction |
| `windowSize`       | ควรเพิ่ม | จำนวนงวดย้อนหลังที่ใช้ เช่น 50, 120 | ทำให้รู้ว่าสถิติอิงช่วงไหน             | Analytics             |
| `drawCount`        | ควรเพิ่ม | จำนวนงวดที่ใช้คำนวณ                 | ใช้วัด sample size                     | Analytics, Confidence |
| `hitCount`         | ควรเพิ่ม | จำนวนครั้งที่ digit ปรากฏ           | เป็นฐานของ frequency                   | Analytics             |
| `frequencyPercent` | ควรเพิ่ม | hit count แปลงเป็นเปอร์เซ็นต์       | ผู้ใช้เปรียบเทียบง่ายกว่า count ดิบ    | Analytics             |
| `lastSeenDrawDate` | ควรเพิ่ม | วันที่ digit นี้ออกล่าสุด           | ใช้บอก recency                         | Analytics, Watchlist  |
| `missingDrawCount` | ควรเพิ่ม | หายไปกี่งวดแล้ว                     | ใช้หา overdue                          | Analytics, Prediction |
| `trendDirection`   | ควรเพิ่ม | แนวโน้ม เช่น up/down/flat           | บอกว่าช่วงล่าสุด digit นี้มาแรงขึ้นไหม | Dashboard             |
| `computedAt`       | ควรเพิ่ม | เวลาที่คำนวณสถิตินี้                | ใช้ cache invalidation และ audit       | Internal              |

ตัวอย่าง:

- `digit = 7`, `position = units`, `windowSize = 120`, `hitCount = 18`
- แปลว่าใน 120 งวดล่าสุด เลข 7 เคยออกที่หลักหน่วย 18 ครั้ง

### number_stats

ตารางหรือ read model นี้คือ “สถิติของเลขเป็นชุด” เช่น `47`, `583`, `123456`

| Field              | สถานะ    | เก็บอะไร                                 | ทำไมต้องมี                                        | ใช้กับ feature              |
| ------------------ | -------- | ---------------------------------------- | ------------------------------------------------- | --------------------------- |
| `number`           | ควรเพิ่ม | เลขชุด เช่น `47`                         | ตัวหลักที่ผู้ใช้ค้นหา/save/compare                | Results, Watchlist, Compare |
| `numberLength`     | ควรเพิ่ม | ความยาวเลข 2, 3, 6                       | แยกบริบทการวิเคราะห์                              | Analytics, Prediction       |
| `lotteryType`      | ควรเพิ่ม | ประเภทหวย                                | รองรับหลายหวย                                     | ทุกหน้า                     |
| `prizeType`        | ควรเพิ่ม | ประเภทรางวัล                             | ทำให้รู้ว่า `47` มาจากเลขท้าย 2 หรือ segment อื่น | Results, Analytics          |
| `drawCount`        | ควรเพิ่ม | จำนวนงวดที่ใช้คำนวณ                      | วัดฐานข้อมูล                                      | Analytics                   |
| `hitCount`         | ควรเพิ่ม | จำนวนครั้งที่เลขนี้ออก                   | บอกว่าเคยออกบ่อยแค่ไหน                            | Watchlist, Compare          |
| `frequencyPercent` | ควรเพิ่ม | hit count เป็นเปอร์เซ็นต์                | เปรียบเทียบเลขหลายตัวง่าย                         | Compare                     |
| `lastSeenDrawDate` | ควรเพิ่ม | ออกล่าสุดวันไหน                          | ตอบคำถามผู้ใช้ทันที                               | Watchlist                   |
| `missingDrawCount` | ควรเพิ่ม | ไม่ออกมากี่งวด                           | ใช้ overdue score                                 | Prediction                  |
| `averageGap`       | ควรเพิ่ม | ค่าเฉลี่ยระยะห่างระหว่างครั้งที่ออก      | ช่วยดู rhythm ในอดีต                              | Analytics                   |
| `maxGap`           | ควรเพิ่ม | เคยหายไปนานสุดกี่งวด                     | ใช้ risk/overdue context                          | Watchlist                   |
| `trendScore`       | ควรเพิ่ม | คะแนนแนวโน้มล่าสุด                       | ใช้ hot trend strategy                            | Prediction                  |
| `patternFlags`     | ควรเพิ่ม | pattern เช่น double, ascending, odd/even | ใช้ Patterns และ score                            | Patterns, Prediction        |
| `computedAt`       | ควรเพิ่ม | เวลาที่คำนวณ                             | ใช้ cache และตรวจ freshness                       | Internal                    |

ตัวอย่าง:

- `number = 47`, `hitCount = 6`, `lastSeenDrawDate = 2025-11-16`, `missingDrawCount = 9`
- แปลว่าเลข 47 เคยออก 6 ครั้งในช่วงข้อมูลที่เลือก และหายไป 9 งวดจากครั้งล่าสุด

### strategies

ตารางนี้คือ “นิยามสูตร” ไม่ใช่ผลลัพธ์ เช่น สูตร Hot trend หรือ Balanced

| Field           | สถานะ    | เก็บอะไร                                   | ทำไมต้องมี                              | ใช้กับ feature       |
| --------------- | -------- | ------------------------------------------ | --------------------------------------- | -------------------- |
| `id`            | ควรเพิ่ม | รหัส strategy                              | อ้างอิงสูตรแบบ stable                   | Prediction, Backtest |
| `name`          | ควรเพิ่ม | ชื่อที่แสดงใน UI                           | ให้ผู้ใช้เลือกสูตรได้ง่าย               | Prediction Lab       |
| `description`   | ควรเพิ่ม | คำอธิบายสูตร                               | ใช้ใน Methodology และ tooltip           | Methodology          |
| `type`          | ควรเพิ่ม | กลุ่มสูตร เช่น statistical, ml, simulation | แยกสูตรพื้นฐานกับ advanced              | Prediction, Backtest |
| `defaultParams` | ควรเพิ่ม | config เริ่มต้น เช่น window 120            | ทำให้ run สูตรได้โดยไม่ต้องกรอกทุกอย่าง | Prediction           |
| `isActive`      | ควรเพิ่ม | เปิด/ปิดสูตร                               | ซ่อนสูตรที่ยังทดลองหรือ deprecated      | Prediction           |
| `version`       | ควรเพิ่ม | version ของสูตร                            | backtest เก่า/ใหม่เทียบกันได้           | Backtest             |
| `createdAt`     | ควรเพิ่ม | วันที่สร้างสูตร                            | audit                                   | Internal             |
| `updatedAt`     | ควรเพิ่ม | วันที่แก้สูตร                              | audit และ versioning                    | Internal             |

### backtest_runs

ตารางนี้คือ “การทดสอบสูตรย้อนหลังหนึ่งครั้ง” เช่น ทดสอบ Balanced ระหว่างปี 2022-2025

| Field               | สถานะ    | เก็บอะไร                   | ทำไมต้องมี                                  | ใช้กับ feature |
| ------------------- | -------- | -------------------------- | ------------------------------------------- | -------------- |
| `strategyId`        | ควรเพิ่ม | สูตรที่ทดสอบ               | รู้ว่าผลนี้เป็นของสูตรไหน                   | Backtest       |
| `params`            | ควรเพิ่ม | config ที่ใช้ทดสอบ         | reproduce ผลได้                             | Backtest       |
| `lotteryType`       | ควรเพิ่ม | ประเภทหวย                  | แยกข้อมูลหลายหวย                            | Backtest       |
| `prizeType`         | ควรเพิ่ม | ประเภทรางวัลที่ทดสอบ       | เลข 2/3/6 ตัวต้องวัดแยกกัน                  | Backtest       |
| `numberLength`      | ควรเพิ่ม | ความยาวเลข                 | ใช้เทียบ strategy อย่างยุติธรรม             | Backtest       |
| `startDrawDate`     | ควรเพิ่ม | วันเริ่ม test              | กำหนดช่วงข้อมูลย้อนหลัง                     | Backtest       |
| `endDrawDate`       | ควรเพิ่ม | วันจบ test                 | กำหนดช่วงข้อมูลย้อนหลัง                     | Backtest       |
| `candidateCount`    | ควรเพิ่ม | generate กี่เลขต่อหนึ่งงวด | hit rate จะเปลี่ยนตามจำนวนเลขที่แนะนำ       | Backtest       |
| `hitRate`           | ควรเพิ่ม | อัตรางวดที่ทายโดน          | metric หลักที่ผู้ใช้เข้าใจง่าย              | Backtest       |
| `longestMissStreak` | ควรเพิ่ม | พลาดติดกันนานสุดกี่งวด     | สะท้อนความเสี่ยงมากกว่า hit rate อย่างเดียว | Backtest       |
| `computedAt`        | ควรเพิ่ม | เวลาที่คำนวณ               | บอก freshness และ audit                     | Backtest       |

### backtest_results

ตารางนี้คือ “ผลของแต่ละงวดภายใน backtest run”

| Field              | สถานะ    | เก็บอะไร                             | ทำไมต้องมี                     | ใช้กับ feature |
| ------------------ | -------- | ------------------------------------ | ------------------------------ | -------------- |
| `runId`            | ควรเพิ่ม | backtest run ที่ result นี้สังกัด    | รวมผลรายงวดเป็นชุดเดียว        | Backtest       |
| `drawId`           | ควรเพิ่ม | งวดที่กำลังทดสอบ                     | เทียบกับผลจริงของงวดนั้น       | Backtest       |
| `generatedNumbers` | ควรเพิ่ม | เลขที่ strategy แนะนำในงวดนั้น       | ใช้ตรวจว่าทายอะไรไว้           | Backtest       |
| `actualNumbers`    | ควรเพิ่ม | เลขจริงของงวดนั้น                    | ใช้ตัดสิน hit/miss             | Backtest       |
| `isHit`            | ควรเพิ่ม | งวดนี้ทายโดนหรือไม่                  | คำนวณ hit rate                 | Backtest       |
| `hitNumbers`       | ควรเพิ่ม | เลขที่โดนจริง ถ้ามี                  | แสดงรายละเอียดผู้ใช้           | Backtest       |
| `rankOfHit`        | ควรเพิ่ม | ถ้าโดน เลขที่โดนอยู่ลำดับที่เท่าไหร่ | วัดว่า strategy จัดอันดับดีไหม | Backtest       |

ตัวอย่าง:

- `generatedNumbers = ["47", "83", "09"]`
- `actualNumbers = ["83"]`
- `isHit = true`
- `rankOfHit = 2`

แปลว่า strategy ทายโดน เพราะเลขจริง `83` อยู่ในรายการแนะนำลำดับที่ 2

## API และ module ที่ควรวาง

ใช้ boundary เดิมของโปรเจกต์:

- `src/api/router`: route definition
- `src/api/service`: business logic
- `src/api/model/dto`: DTO
- `src/schema/api`: API interface
- `src/schema/app`: Zod schema สำหรับ frontend/app
- `src/frontend/pages`: route-level page
- `src/frontend/components`: composed UI
- `src/frontend/chart-primitives`: D3 chart foundation

Endpoint ที่แนะนำ:

- `GET /api/draws`
- `GET /api/draws/:id`
- `GET /api/analytics/summary`
- `GET /api/analytics/digits`
- `GET /api/analytics/numbers`
- `GET /api/analytics/patterns`
- `POST /api/predictions`
- `GET /api/predictions/:id`
- `POST /api/backtests`
- `GET /api/backtests/:id`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `PATCH /api/watchlist/:id`
- `DELETE /api/watchlist/:id`
- `GET /api/search`
- `GET /api/calendar`
- `POST /api/compare`

## Shared MVP Features

### Global search

คืออะไร:

- ช่องค้นหาเลขหรือข้อความจากทุกหน้า เช่น ค้นหา `47`, `583`, tag, note, draw date

ประโยชน์:

- ทำให้เว็บรู้สึกเป็น product จริง ผู้ใช้ไม่ต้องจำว่าเลขอยู่หน้าไหน

วิธีทำ:

- ทำ `GlobalSearch` เป็น client component
- สร้าง `/api/search?q=...`
- ค้นจาก draws, prizes, number_stats, watchlist tags
- แยก result type เช่น draw, number, watchlist

Advance:

- ทำ fuzzy search
- ทำ recent searches
- ทำ command palette
- ทำ search index แยกถ้าข้อมูลใหญ่

### Date/draw range selector

คืออะไร:

- ตัวเลือกช่วงงวด เช่น 50 งวดล่าสุด, ปีนี้, custom date range

ประโยชน์:

- สถิติทุกอย่างเปลี่ยนตามช่วงข้อมูล ผู้ใช้เห็นบริบทมากขึ้น

วิธีทำ:

- สร้าง shared filter state เช่น `lotteryType`, `startDate`, `endDate`, `windowSize`
- ส่ง filter นี้ไป API ทุกหน้า analytics/prediction/backtest

Advance:

- save preset
- compare ranges
- sync filter กับ URL query string

### Lottery type selector

คืออะไร:

- ตัวเลือกประเภทหวย เผื่ออนาคตมีหลายประเภท

ประโยชน์:

- โครงสร้างพร้อมขยายโดยไม่ต้องรื้อ API

วิธีทำ:

- ใช้ enum `LotteryType`
- ใส่ใน query ของทุก endpoint
- MVP เริ่มที่ `THAI_GOVERNMENT`

Advance:

- รองรับ lottery type หลายประเทศ
- แยก timezone, schedule, prize taxonomy ต่อ type

### Save number to watchlist

คืออะไร:

- ปุ่มบันทึกเลขจาก Prediction, Compare, Analytics เข้า Watchlist

ประโยชน์:

- เปลี่ยน dashboard จากอ่านเฉย ๆ เป็น workflow ส่วนตัวของผู้ใช้

วิธีทำ:

- `POST /api/watchlist`
- ส่ง `number`, `tags`, `note`, `source`
- หน้าอื่นเรียก mutation เดียวกัน

Advance:

- auth และ user-specific watchlist
- notification ก่อนงวดออก
- alert เมื่อเลขใน watchlist มี signal เปลี่ยน

### Explain score

คืออะไร:

- อธิบายว่าคะแนนของเลขมาจากอะไร เช่น hot 35 คะแนน, overdue 20 คะแนน, position 30 คะแนน

ประโยชน์:

- เพิ่มความน่าเชื่อถือ และลดความรู้สึกว่าเว็บสุ่มเลขมั่ว

วิธีทำ:

- ทุก prediction result มี `scoreBreakdown`
- UI แสดงเป็น row หรือ popover
- `reasons` เป็นภาษาคนอ่านได้

Advance:

- interactive explanation
- show historical examples
- compare explanation ระหว่างเลขหลายชุด

### Empty state, loading skeleton, responsive, light/dark

คืออะไร:

- สถานะ UI เมื่อยังไม่มีข้อมูล, กำลังโหลด, เปิดบนมือถือ, หรือสลับ theme

ประโยชน์:

- ทำให้ MVP ดู production และลดความงงของผู้ใช้

วิธีทำ:

- สร้าง reusable components เช่น `EmptyState`, `LoadingSkeleton`, `FilterToolbar`
- ใช้ design tokens จาก `globals.css`
- light mode ทำก่อน dark mode ค่อยเพิ่มด้วย CSS variables

Advance:

- skeleton เฉพาะ chart/table
- persisted theme
- mobile bottom nav หรือ collapsible sidebar

## Navigation MVP

โปรเจกต์มี navigation หลักใน `src/lib/app/navigation.ts` แล้ว ควรรักษา order นี้ไว้ใน MVP เพราะเรียงจาก overview ไป trust/documentation ได้ดี:

1. Dashboard: ภาพรวม
2. Results: ผลย้อนหลัง
3. Analytics: วิเคราะห์
4. Patterns: แพตเทิร์น
5. Prediction Lab: ห้องทดลองทำนาย
6. Backtest: ทดสอบย้อนหลัง
7. Watchlist: รายการเฝ้าดู
8. Compare: เปรียบเทียบ
9. Calendar: ปฏิทิน
10. Methodology: วิธีคำนวณ

## Feature Explanation แบบเข้าใจง่าย

section นี้อธิบาย feature ในมุมผู้ใช้และ product ก่อนเข้าแผน implement เชิงเทคนิค จุดประสงค์คือให้ dev ที่ไม่ถนัดสถิติยังเข้าใจว่าแต่ละหน้ากำลังช่วยผู้ใช้อย่างไร

### Dashboard แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนหน้า home ของ banking app หรือ investment app ที่เปิดมาแล้วเห็นภาพรวมทันที ไม่ต้องกดหลายหน้า

ผู้ใช้ใช้ทำอะไร:

- ดูงวดล่าสุด
- ดูเลขที่ระบบมองว่าน่าสนใจ
- ดูเลข hot, cold, overdue แบบสรุป
- กดไปดูรายละเอียดใน Results, Analytics, Prediction Lab หรือ Backtest

ตัวอย่างสถานการณ์:

- ผู้ใช้เปิดเว็บก่อนวันหวยออก อยากรู้ว่าตอนนี้เลขไหนกำลังถูกพูดถึงจากข้อมูลย้อนหลัง
- Dashboard ควรตอบเร็ว ๆ ว่า “งวดล่าสุดคืออะไร”, “เลขไหนมาแรง”, “เลขไหนหายไปนาน”, “มี prediction summary อะไร”

ข้อมูลที่อยู่เบื้องหลัง:

- `LotteryDraw` สำหรับงวดล่าสุด
- `LotteryPrize` สำหรับผลรางวัลงวดล่าสุด
- `digit_stats` สำหรับ hot/cold digit
- `number_stats` สำหรับ overdue numbers
- `PredictionRun` และ `PredictionResult` สำหรับ prediction summary ล่าสุด

สิ่งที่ควรระวัง:

- Dashboard ไม่ควรคำนวณเองทุกอย่างใน component
- ควรรับข้อมูลจาก `DashboardSummaryDto` ที่ backend/service เตรียมไว้
- ตัวเลขแนะนำต้องมี link ไป explanation หรือ methodology

### Results แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนสมุดทะเบียนผลหวยย้อนหลังที่ค้นหาได้

ผู้ใช้ใช้ทำอะไร:

- ดูผลรางวัลย้อนหลัง
- filter ตามปี เดือน งวด หรือประเภทหวย
- ค้นเลข 2 ตัว 3 ตัว 6 ตัว
- กดเข้าไปดูรายละเอียดงวด
- ตรวจว่าข้อมูลในระบบครบแค่ไหน

ตัวอย่างสถานการณ์:

- ผู้ใช้สงสัยว่าเลข `47` เคยออกเมื่อไหร่
- เขาพิมพ์ `47` แล้วระบบแสดงงวดที่เกี่ยวข้อง พร้อมบอกว่าเป็นเลขท้าย 2 ตัวหรืออยู่ในรางวัลประเภทไหน

ข้อมูลที่อยู่เบื้องหลัง:

- `LotteryDraw` คือรายการงวด
- `LotteryPrize` คือเลขรางวัลในแต่ละงวด
- `sourceStatus` ในอนาคตใช้บอกว่าข้อมูล verified หรือยัง

สิ่งที่ควรระวัง:

- เลขต้อง search แบบ string เพื่อรักษาศูนย์นำหน้า
- ต้องแยก search ตามความยาวเลข ไม่อย่างนั้นค้น `09` อาจชนกับเลข 6 ตัวที่มี `09` อยู่ข้างในแบบไม่ตั้งใจ
- Results เป็นฐานความจริงของระบบ ถ้าหน้านี้ผิด analytics และ prediction จะผิดตาม

### Number Analytics แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนหน้ารายงานว่าตัวเลข 0-9 แต่ละตัวมีพฤติกรรมอย่างไร

ผู้ใช้ใช้ทำอะไร:

- ดูว่าเลขโดดตัวไหนออกบ่อย
- ดูว่าเลขโดดตัวไหนหายไปนาน
- ดูว่าเลขบางตัวเด่นในตำแหน่งไหน เช่น หลักสิบหรือหลักหน่วย
- เปรียบเทียบ hot/cold แบบเห็นภาพ

ตัวอย่างสถานการณ์:

- ผู้ใช้อยากรู้ว่าเลข `7` ช่วงหลังออกบ่อยจริงไหม
- Analytics ควรบอกได้ว่าเลข `7` ออกกี่ครั้งใน 120 งวดล่าสุด ออกตำแหน่งไหนบ่อย และออกล่าสุดเมื่อไหร่

ข้อมูลที่อยู่เบื้องหลัง:

- `LotteryPrize.number` ถูกแตกเป็น digit
- `digit_stats` เก็บผลนับเลข 0-9
- `number_stats` ใช้เมื่อต้องดูเลขเป็นชุด เช่น `47`

สิ่งที่ควรระวัง:

- ต้องบอกช่วงข้อมูลเสมอ เช่น 50 งวดล่าสุดหรือ 120 งวดล่าสุด
- Hot ในช่วงสั้นกับ hot ระยะยาวอาจไม่เหมือนกัน
- ค่า frequency ควรแสดงคู่กับจำนวนงวดที่ใช้คำนวณ

### Patterns แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนแปลเลขดิบให้กลายเป็นภาษาที่คนดูสูตรเข้าใจ เช่น คู่/คี่ สูง/ต่ำ เลขเบิ้ล เลขเรียง

ผู้ใช้ใช้ทำอะไร:

- ดูว่า pattern แบบไหนเกิดบ่อย
- ดู pattern แยกตามวันที่ 1 หรือ 16
- ดู pattern รายเดือน
- ใช้ pattern เป็นเหตุผลประกอบ prediction score

ตัวอย่างสถานการณ์:

- ผู้ใช้อยากรู้ว่าเลขท้าย 2 ตัวช่วงหลังออกคู่หรือคี่มากกว่ากัน
- Patterns ควรแสดงสัดส่วนคู่/คี่ และบอกได้ว่าข้อมูลอิงกี่งวด

ข้อมูลที่อยู่เบื้องหลัง:

- `LotteryPrize.number`
- `patternFlags` ใน `number_stats`
- `drawDate` เพื่อแยกวันที่ 1/16 และเดือน

สิ่งที่ควรระวัง:

- Pattern เป็น descriptive insight ไม่ใช่หลักฐานว่ารอบหน้าจะออกแบบเดิม
- ต้องเทียบกับ baseline เช่น random หรือค่าเฉลี่ยระยะยาว เพื่อไม่ให้ตีความเกินจริง

### Prediction Lab แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนห้องทดลองสูตร ผู้ใช้เลือกสูตรแล้วระบบ generate เลขพร้อมเหตุผล

ผู้ใช้ใช้ทำอะไร:

- เลือกสูตร เช่น Hot trend, Cold rebound, Balanced
- เลือกความยาวเลข เช่น 2 ตัว 3 ตัว 6 ตัว
- กด generate เลขแนะนำ
- ดู score และเหตุผลของแต่ละเลข
- save เลขที่สนใจเข้า Watchlist

ตัวอย่างสถานการณ์:

- ผู้ใช้เลือกสูตร Balanced และให้ระบบแนะนำเลข 10 ตัว
- ระบบแสดง `47` score 82 พร้อมเหตุผลว่า hot trend ดี, position support ดี, แต่ confidence medium เพราะข้อมูลช่วงล่าสุดยังไม่มาก

ข้อมูลที่อยู่เบื้องหลัง:

- `strategies` กำหนดสูตร
- `digit_stats` และ `number_stats` เป็น input ของคะแนน
- `PredictionRun` เก็บการ generate หนึ่งครั้ง
- `PredictionResult` เก็บเลขแต่ละตัวพร้อม score และ reasons

สิ่งที่ควรระวัง:

- ห้ามแสดงเหมือนเป็นเลขล็อกหรือการันตี
- ทุก score ต้อง explain ได้
- ทุก strategy ควรเอาไป backtest ได้

### Backtest แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนเอาสูตรไปย้อนสอบในอดีตว่า ถ้าเราใช้สูตรนี้มาตั้งแต่ปีก่อน ผลจะเป็นอย่างไร

ผู้ใช้ใช้ทำอะไร:

- เลือก strategy
- เลือกช่วงข้อมูลย้อนหลัง
- ดูว่าสูตรทายโดนบ่อยแค่ไหน
- ดูว่าสูตรเคยพลาดติดกันนานสุดกี่งวด
- เทียบหลายสูตรในหน้าเดียว

ตัวอย่างสถานการณ์:

- ผู้ใช้สงสัยว่าสูตร Hot trend ดีกว่า Balanced ไหม
- Backtest ควรแสดงว่าแต่ละสูตร hit rate เท่าไหร่ longest miss streak เท่าไหร่ และดีกว่า random baseline หรือไม่

ข้อมูลที่อยู่เบื้องหลัง:

- `LotteryDraw` และ `LotteryPrize` สำหรับข้อมูลจริงย้อนหลัง
- `strategies` สำหรับสูตรที่ทดสอบ
- `backtest_runs` เก็บผลสรุปการทดสอบ
- `backtest_results` เก็บผลรายงวด

สิ่งที่ควรระวัง:

- ต้องใช้ walk-forward backtest เท่านั้น
- ห้ามใช้ข้อมูลของงวดเป้าหมายมาคำนวณเลขที่จะทายงวดนั้น
- Hit rate ต้องอ่านคู่กับ candidate count เพราะแนะนำ 100 เลขย่อมมีโอกาสโดนมากกว่าแนะนำ 5 เลข

### Watchlist แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนสมุดจดเลขส่วนตัว แต่ระบบช่วยเติมสถิติให้

ผู้ใช้ใช้ทำอะไร:

- บันทึกเลขที่สนใจ
- ใส่ tag เช่น เลขบ้าน เลขฝัน เลขสูตร
- เขียน note
- ดูว่าเลขนั้นเคยออกกี่ครั้ง ออกล่าสุดเมื่อไหร่ และหายไปกี่งวด

ตัวอย่างสถานการณ์:

- ผู้ใช้บันทึกเลข `47` พร้อม tag `เลขบ้าน`
- Watchlist แสดงว่า `47` เคยออก 6 ครั้ง ล่าสุดวันที่ไหน และตอนนี้อยู่กลุ่ม hot/warm/cold อะไร

ข้อมูลที่อยู่เบื้องหลัง:

- `UserWatchlistItem` เก็บเลข tag note และ source
- `number_stats` enrich ข้อมูลสถิติของเลขนั้น
- `PredictionResult` ใช้เชื่อมกลับถ้าเลขมาจาก Prediction Lab

สิ่งที่ควรระวัง:

- watchlist เป็นข้อมูลส่วนตัว ถ้ามี auth ต้องผูก `userId`
- note และ tag ไม่ควรเอาไปเปิดเผยในส่วน public
- ถ้ายังไม่มี auth ให้ทำเป็น MVP local/global ชัดเจน

### Compare แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนเอาเลขหลายตัวมาวางบนโต๊ะ แล้วชั่งน้ำหนักว่าตัวไหนเด่นด้านไหน

ผู้ใช้ใช้ทำอะไร:

- ใส่เลขหลายชุดเพื่อเทียบกัน
- ดูว่าเลขไหน hot กว่า
- ดูว่าเลขไหน overdue กว่า
- ดูว่าเลขไหนมี pattern support มากกว่า
- ดู score breakdown แบบ side-by-side

ตัวอย่างสถานการณ์:

- ผู้ใช้ลังเลระหว่าง `47`, `83`, `09`
- Compare ควรแสดงว่า `47` hot กว่า, `83` overdue กว่า, `09` มี position support ต่ำกว่า

ข้อมูลที่อยู่เบื้องหลัง:

- `number_stats`
- `digit_stats`
- scoring engine เดียวกับ Prediction Lab
- `scoreBreakdown`

สิ่งที่ควรระวัง:

- Compare ไม่ควรบอกว่าเลขไหน “ต้องซื้อ”
- ควรบอกว่าเลขไหนมี signal ด้านไหน เพื่อให้ผู้ใช้ตัดสินใจเอง

### Calendar แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนปฏิทินหวยที่ไม่ได้บอกแค่วันออก แต่บอก insight ของเดือนนั้นด้วย

ผู้ใช้ใช้ทำอะไร:

- ดูงวดถัดไป
- ดู countdown
- ดู pattern ของเดือนนี้จากอดีต
- ดูว่าเลขหรือ pattern ไหนเด่นในเดือนเดียวกัน

ตัวอย่างสถานการณ์:

- วันนี้ใกล้งวดวันที่ 16
- Calendar แสดง countdown และ insight ว่าในเดือนนี้จากอดีต เลขคู่/คี่ หรือ digit group ไหนเด่นกว่าปกติ

ข้อมูลที่อยู่เบื้องหลัง:

- `LotteryDraw.drawDate`
- calendar helper สำหรับหางวดวันที่ 1/16
- `digit_stats`, `number_stats`, `patterns` ที่ filter ตามเดือน

สิ่งที่ควรระวัง:

- ต้องรองรับกรณีวันออกหวยเลื่อน
- Insight รายเดือนมี sample size น้อย ต้องสื่อสารความไม่แน่นอน

### Methodology แบบเข้าใจง่าย

ภาพจำง่าย ๆ:

- เหมือนคู่มืออธิบายว่าเว็บคิดเลขยังไง และข้อจำกัดคืออะไร

ผู้ใช้ใช้ทำอะไร:

- อ่านว่า Hot คืออะไร
- อ่านว่า Cold คืออะไร
- อ่านว่า Backtest ต้องดูยังไง
- เข้าใจว่า Prediction score ไม่ใช่การการันตี

ตัวอย่างสถานการณ์:

- ผู้ใช้เห็นเลข `47` ได้ score 82 แล้วสงสัยว่าทำไม
- Methodology ควรอธิบายว่า score มาจาก hot trend, overdue, position support, pair support และ pattern support อย่างไร

ข้อมูลที่อยู่เบื้องหลัง:

- เนื้อหา static ที่ version ได้
- ตัวอย่างจาก `PredictionResult.scoreBreakdown`
- ผล Backtest summary ต่อ strategy ในอนาคต

สิ่งที่ควรระวัง:

- ภาษาต้องไม่ technical เกินไป
- ต้องมี responsible prediction copy ชัดเจน
- ควร link จากทุกหน้าที่มี score หรือคำศัพท์สถิติ

## Feature Plan

### 1. Dashboard

คืออะไร:

- หน้า overview ของระบบ แสดงงวดล่าสุด เลขเด่นประจำงวด Hot/Cold numbers เลขที่หายไปนาน trend สั้น ๆ prediction summary และปุ่มไปดูรายละเอียดแต่ละ section

ประโยชน์:

- เป็นหน้าแรกที่ผู้ใช้เข้าใจภาพรวมได้ทันที
- ช่วยพาไป feature อื่นโดยไม่ต้องรู้ว่าจะเริ่มจากหน้าไหน
- ทำให้เว็บดูครบและพร้อมใช้งานตั้งแต่ first impression

วิธีทำ MVP:

- มี contract รอบแรกแล้วใน `src/schema/api/dashboard.ts` และ `src/schema/app/dashboard.schema.ts`
- มี mock read model ใน `src/frontend/pages/dashboard/dashboard.mock.json`
- ขั้นถัดไปคือ map contract นี้เข้ากับ service จริง
- `drawService.getLatestDraw()`
- `analyticsService.getHotColdSummary()`
- `analyticsService.getOverdueNumbers()`
- `predictionService.getLatestPredictionSummary()`
- UI ใช้ cards, compact charts, CTA links ไป Results, Analytics, Prediction Lab, Backtest

วิธีคิดสถิติ:

- Hot: นับเลขที่ออกบ่อยสุดในช่วง N งวดล่าสุด
- Cold: นับเลขที่ออกน้อยสุดในช่วง N งวดล่าสุด
- Overdue: นับว่าห่างจากงวดล่าสุดมากี่งวดแล้ว
- Trend: เทียบจำนวนครั้งในช่วงล่าสุดกับช่วงก่อนหน้า เช่น 20 งวดล่าสุดเทียบ 20 งวดก่อน

Advance:

- Personalized dashboard ตาม watchlist
- Alert เมื่อเลขที่ติดตามมี score สูงขึ้น
- เพิ่ม confidence/uncertainty เพื่อบอกว่าข้อมูลแน่นแค่ไหน
- Dashboard สำหรับหลาย lottery type

### 2. Results

คืออะไร:

- หน้าผลรางวัลย้อนหลัง พร้อม filter ปี เดือน งวด ค้นหาเลข 2/3/6 ตัว เข้าไปดูรายละเอียดงวด และแสดงสถานะข้อมูล เช่น มีข้อมูล 1,250 งวด

ประโยชน์:

- เป็นฐานความน่าเชื่อถือของทั้งระบบ เพราะ analytics และ prediction ต้องอ้างอิงผลย้อนหลัง
- ผู้ใช้ตรวจสอบเลขย้อนหลังได้โดยตรง
- ช่วยทีม validate data contract ก่อนทำ feature สถิติซับซ้อน

วิธีทำ MVP:

- มี contract รอบแรกแล้วใน `src/schema/api/results.ts` และ `src/schema/app/results.schema.ts`
- `ResultsPage` ใช้ mock read model ที่ parse ผ่าน Zod แล้ว
- ขั้นถัดไปคือ map mock contract เดิมเข้ากับ API จริง
- `GET /api/draws?year=&month=&q=&lotteryType=`
- `GET /api/draws/:id`
- สร้าง detail route ภายหลัง เช่น `/results/[drawId]`
- ทำ search ให้รองรับเลข string และรักษา leading zero

วิธีคิดข้อมูล:

- ค้นหา 2 ตัวจาก prize type `TWO_DIGIT`
- ค้นหา 3 ตัวจาก `THREE_FRONT` และ `THREE_BACK`
- ค้นหา 6 ตัวจาก `FIRST`
- ถ้าผู้ใช้ค้นเลขสั้น ให้ match ตาม prize type ที่ความยาวตรงกันก่อน

Advance:

- Import/verify จาก official source
- Data completeness audit
- Export CSV
- แสดง diff ถ้าข้อมูลถูกแก้ไขย้อนหลัง

### 3. Number Analytics

คืออะไร:

- หน้าวิเคราะห์เลข 0-9 เช่น ความถี่รวม ความถี่ตามตำแหน่ง ออกล่าสุดเมื่อไหร่ หายไปกี่งวด และกราฟเปรียบเทียบ hot/cold

ประโยชน์:

- ทำให้ผู้ใช้เห็นพฤติกรรมของ digit แต่ละตัวอย่างเป็นระบบ
- เป็นฐานข้อมูลให้ Prediction Lab ใช้สร้าง score
- ช่วยให้ dev ตรวจว่าการคำนวณถูกต้องก่อนขยับไปเลขชุดใหญ่

วิธีทำ MVP:

- `GET /api/analytics/digits`
- สร้าง `DigitStatDto`
- สร้าง service แตก prize number เป็น digit events
- UI ใช้ table + bar chart + heatmap ตำแหน่ง

วิธีคิดสถิติ:

- ความถี่รวม: เลข 0-9 แต่ละตัวปรากฏกี่ครั้งจากทุกตำแหน่ง
- ความถี่ตามตำแหน่ง: เลข 0-9 ปรากฏที่หลักที่ 1, 2, 3 หรือ 1-6 บ่อยแค่ไหน
- ออกล่าสุด: งวดล่าสุดที่พบ digit นั้น
- หายไปกี่งวด: จำนวนงวดจากงวดล่าสุดถึงงวดที่ digit นั้นออกครั้งล่าสุด

Advance:

- Rolling window เช่น 30, 60, 120 งวด
- เทียบ period ต่อ period
- เพิ่ม smoothing เพื่อไม่ให้ข้อมูลช่วงสั้นแกว่งเกินไป
- เพิ่ม confidence interval แบบง่ายเพื่อบอกความไม่แน่นอน

### 4. Patterns

คืออะไร:

- หน้าวิเคราะห์ pattern เช่น เลขคู่/คี่ สูง/ต่ำ ผลรวมตัวเลข เลขเบิ้ล เลขเรียง เลขกลับ pattern วันที่ 1/16 และ pattern รายเดือน

ประโยชน์:

- ผู้ใช้สายดูสูตรเข้าใจง่าย เพราะ pattern เป็นภาษาคนมากกว่าสถิติดิบ
- เป็น signal เสริมให้ prediction score
- ใช้ทำ content/insight รายเดือนใน Calendar ได้

วิธีทำ MVP:

- `GET /api/analytics/patterns`
- สร้าง utility functions สำหรับ pattern detection
- เก็บผลเป็น `patternFlags` ใน number stats หรือคำนวณ on demand
- UI ใช้ segmented controls สำหรับ prize type และ month/date group

วิธีคิด pattern:

- คู่/คี่: digit สุดท้ายหาร 2 ลงตัวคือคู่
- สูง/ต่ำ: กำหนด 0-4 เป็นต่ำ และ 5-9 เป็นสูง
- ผลรวมตัวเลข: รวม digit ทุกตัว เช่น `583` ได้ 16
- เลขเบิ้ล: มี digit ซ้ำ เช่น `55`, `115`, `909`
- เลขเรียง: digit ต่อกัน เช่น `123`, `789`
- เลขกลับ: เลขสองตัวที่กลับตำแหน่งกัน เช่น `12` กับ `21`
- วันที่ 1/16: แยกกลุ่มตามวันที่ออกหวย
- รายเดือน: grouping ตามเดือนของ `drawDate`

Advance:

- Association rules เพื่อดูว่า pattern ไหนมักเกิดร่วมกัน
- Seasonality test แบบง่าย
- Pattern clustering
- Benchmark เทียบกับ random baseline เพื่อป้องกันตีความเกินจริง

### 5. Prediction Lab

คืออะไร:

- หน้า generate เลขแนะนำ เลือกสูตรได้ เช่น Hot trend, Cold rebound, Balanced, Pair support, Position frequency แต่ละเลขมี score และเหตุผล พร้อมปุ่ม save เข้า watchlist และ disclaimer

ประโยชน์:

- เป็น feature หลักที่ทำให้เว็บมีความแตกต่าง
- ทำให้ผู้ใช้ interact กับข้อมูล ไม่ใช่ดูรายงานเฉย ๆ
- สร้างสะพานไป Watchlist, Compare และ Backtest

วิธีทำ MVP:

- `POST /api/predictions`
- รับ `strategy`, `numberLength`, `candidateCount`, `lotteryType`, `dateRange`
- สร้าง `predictionService.generate()`
- คืน `PredictionResultDto[]` ที่มี `number`, `score`, `scoreBreakdown`, `reasons`
- UI มี strategy selector, range selector, result cards/table, save button

สูตรที่แนะนำ:

- Hot trend: ให้คะแนนเลขที่ออกบ่อยขึ้นในช่วงล่าสุด
- Cold rebound: ให้คะแนนเลขที่หายไปนาน แต่ยังเคยออกในอดีตพอสมควร
- Balanced: ผสม hot, cold, position และ pattern แบบน้ำหนักกลาง ๆ
- Pair support: ให้คะแนนเลขที่ digit pair หรือ 2 ตัวท้ายมีประวัติสนับสนุน
- Position frequency: ให้คะแนนเมื่อ digit แต่ละตัวแข็งแรงในตำแหน่งของมัน

ตัวอย่าง score แบบง่าย:

```text
score = hotTrend * 0.30
      + overdue * 0.20
      + positionSupport * 0.25
      + pairSupport * 0.15
      + patternSupport * 0.10
```

ทุก signal ควรถูก normalize เป็น 0-100 ก่อนรวมคะแนน

Advance:

- Ensemble หลาย strategy แล้วดู agreement
- ปรับน้ำหนักจากผล Backtest จริง
- เพิ่ม random baseline เทียบให้ผู้ใช้เห็น
- เพิ่ม parameter tuning
- เพิ่ม explanation ที่บอกว่า signal ไหนลากคะแนนขึ้นหรือลง

### 6. Backtest

คืออะไร:

- หน้าทดสอบ strategy กับข้อมูลย้อนหลัง เลือกสูตร เลือกช่วงข้อมูล ดู hit rate, longest miss streak, performance chart และ compare strategy ได้ 2-3 สูตร

ประโยชน์:

- ทำให้เว็บดูจริงจังและ production มากขึ้นทันที
- ช่วยพิสูจน์ว่าสูตรไม่ได้มีแค่ชื่อเท่ ๆ
- ช่วยผู้ใช้เข้าใจความเสี่ยง เช่น พลาดติดกันได้นานแค่ไหน

วิธีทำ MVP:

- `POST /api/backtests`
- รับ strategy, params, date range, candidate count
- ใช้วิธี walk-forward
- เก็บผลเป็น `BacktestRun` และ `BacktestResult`
- UI แสดง metric cards, performance chart, strategy comparison table

วิธีคิด walk-forward:

1. เลือกช่วง test เช่น 2023-2025
2. สำหรับแต่ละงวดในช่วง test ให้ใช้ข้อมูลงวดก่อนหน้านั้นเท่านั้น
3. Generate เลขจาก strategy
4. เทียบกับผลจริงของงวดนั้น
5. บันทึกว่าทายโดนหรือไม่
6. รวมเป็น hit rate และ miss streak

Metric ที่ควรมี:

- Hit rate: จำนวนงวดที่มีเลขแนะนำตรงกับผลจริง หารด้วยจำนวนงวดทั้งหมด
- Longest miss streak: ช่วงที่พลาดติดกันยาวที่สุด
- Average hit rank: ถ้าโดน เลขที่โดนอยู่ rank ที่เท่าไหร่
- Coverage: จำนวนงวดที่มีข้อมูลเพียงพอให้ทดสอบ

Advance:

- Compare กับ random strategy
- Bootstrap confidence interval
- Parameter sweep เพื่อหา config ที่เหมาะ
- ROI simulation ถ้าอนาคตมีข้อมูลราคาหรือ payout
- Guardrail ตรวจ overfitting

### 7. Watchlist

คืออะไร:

- หน้าเก็บเลขที่ผู้ใช้สนใจ พร้อม tag เช่น เลขบ้าน เลขฝัน เลขสูตร ดู stats ของเลขนั้น บอกว่าเคยออกกี่ครั้ง ล่าสุดเมื่อไหร่ และ note ส่วนตัว

ประโยชน์:

- ทำให้ผู้ใช้กลับมาใช้ซ้ำ เพราะมีพื้นที่ส่วนตัว
- รวมเลขจาก Prediction Lab, Compare และ Analytics ไว้ที่เดียว
- เป็นจุดเริ่มต้นสำหรับ notification ในอนาคต

วิธีทำ MVP:

- `GET /api/watchlist`
- `POST /api/watchlist`
- `PATCH /api/watchlist/:id`
- `DELETE /api/watchlist/:id`
- ดึง `number_stats` มา enrich watchlist item
- UI มี list/table, tag chips, note editor, quick stats

วิธีคิดข้อมูล:

- เลขหนึ่งตัวใน watchlist ควรมีทั้ง personal data และ computed stats
- personal data เช่น tags/note/source
- computed stats เช่น hit count/latest seen/missing draw count

Advance:

- User auth และ multi-user
- Reminder ก่อนงวดออก
- Watchlist health score
- Auto-update เมื่อเลขมี signal ใหม่

### 8. Compare

คืออะไร:

- หน้าเทียบเลขหลายชุด ดู score breakdown เลขไหน hot กว่า overdue กว่า และมี pattern support มากกว่า

ประโยชน์:

- ช่วยผู้ใช้ตัดสินใจระหว่างเลขหลายชุด
- Reuse scoring engine จาก Prediction Lab
- ทำให้ explain score มีพื้นที่แสดงผลที่ชัดเจน

วิธีทำ MVP:

- `POST /api/compare`
- รับ array ของ numbers และ filter context
- ใช้ `analyticsService.getNumberStats()` และ `predictionService.scoreNumber()`
- UI เป็น table side-by-side พร้อม bar breakdown

วิธีคิด score breakdown:

- Hot score: เลขนี้ออกถี่แค่ไหนในช่วงที่เลือก
- Overdue score: หายไปนานแค่ไหน
- Position score: digit แต่ละตำแหน่งแข็งแรงไหม
- Pattern score: มี pattern ที่เคย support บ่อยไหม

Advance:

- Portfolio view ดูหลายเลขเป็นชุดเดียว
- Diversity score เพื่อลดเลขที่ pattern ซ้ำกันมากเกินไป
- Scenario compare เช่น short window vs long window

### 9. Calendar

คืออะไร:

- หน้าปฏิทินงวดหวย countdown งวดถัดไป insight รายเดือน และเลขที่เด่นในเดือนนั้นจากอดีต

ประโยชน์:

- ทำให้ product มี rhythm ตามวันใช้งานจริง
- ผู้ใช้เข้ามาดูได้ก่อนวันหวยออก
- เชื่อม Methodology/Analytics กับ context ของเดือน

วิธีทำ MVP:

- `GET /api/calendar`
- สร้าง helper หา draw date ถัดไป เช่น วันที่ 1 และ 16 ของเดือน
- สรุป insight รายเดือนจาก historical draws
- UI เป็น calendar list + countdown + monthly insight cards

วิธีคิดข้อมูล:

- Next draw: วันที่ 1 หรือ 16 ที่อยู่ถัดจากวันนี้
- Monthly insight: filter draws ที่เดือนเดียวกันในอดีต แล้วคำนวณ hot/cold/overdue
- Date pattern: แยกสถิติวันที่ 1 กับวันที่ 16

Advance:

- รองรับวันเลื่อนตามประกาศทางการ
- Sync official schedule
- Calendar reminders
- Compare month seasonality หลายปี

### 10. Methodology

คืออะไร:

- หน้าอธิบายสูตรแบบเข้าใจง่าย เช่น Hot คืออะไร Cold คืออะไร Backtest อ่านยังไง และ Prediction score ไม่ใช่การการันตี

ประโยชน์:

- ช่วยให้เว็บดูจริงจังและน่าเชื่อถือ
- ลดความเข้าใจผิดเรื่องการทำนายหวย
- เป็น documentation ให้ทีมและผู้ใช้ในที่เดียว

วิธีทำ MVP:

- Static page จาก content ที่ version ได้
- อธิบายคำศัพท์ด้วยตัวอย่างเลขจริงหรือ mock
- มี disclaimer ชัดเจน
- Link จาก Prediction Lab, Backtest, Dashboard

Advance:

- Interactive examples
- Method version history
- Backtest report ต่อ strategy
- FAQ เรื่องความน่าจะเป็นและข้อจำกัด

"Bayesian + Recency Weight + Gap Z-score + Ensemble"

## Progress Log

### Phase 2A: Draw API foundation

Status: implemented, pending project check by user.

Scope shipped:

- Expanded draw API contract and app validation schema for list/detail responses.
- Implemented backend-only draw DTO mapping from Prisma-shaped draw/prize records to API transport shapes.
- Implemented `drawService.getDraws()` and `drawService.getDrawById()`.
- Implemented `GET /api/draws` and `GET /api/draws/:id`.
- Added first-pass query support for `lotteryType`, `year`, `month`, `q`, `prizeType`, `page`, and `pageSize`.

Deferred:

- Results page is not wired to `/api/draws` yet.
- Prisma indexes are not changed in this batch because the existing schema already has `@@unique([lotteryType, drawDate])`, `@@index([drawDate])`, and prize indexes for `[drawId]` and `[type, number]`.
- Shared Prisma client ownership should be revisited in a follow-up batch if more services start querying the database.

### Phase 2B: Results page and draw detail contract

Status: implemented, pending project check by user.

Scope shipped:

- Added a backend Prisma client helper in `src/api/service/prisma.ts` so the later PostgreSQL adapter migration has one service-layer integration point.
- Updated `drawService` to use the shared backend Prisma helper.
- Connected Results page to the `/api/draws` response contract with fallback to the validated mock read model while the database adapter migration is pending.
- Added an empty state for API-backed Results responses with no draw records.
- Added a draw detail page route at `/results/[id]`.
- Added a Results detail page that reads `/api/draws/:id` and falls back to the validated mock draw contract when the API/database is unavailable.

Deferred:

- Database runtime wiring remains pending because the project will move from MongoDB direct connection to PostgreSQL with a Prisma driver adapter.
- The Results page still keeps mock fallback behavior until the PostgreSQL adapter and seed data are ready.
- Search/filter controls are visually present but not yet bound to URL query params.
