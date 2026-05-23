# Calculation Guide

เอกสารนี้สรุปว่าในโปรเจกต์ Lottery Intelligence Dashboard มี logic คำนวณอะไรบ้าง คำนวณยังไง ใช้ตัวแปรอะไร ผลลัพธ์หมายความว่าอะไร และ logic ไหนพึ่งพา logic ไหน

เป้าหมายของระบบนี้ไม่ใช่ “ฟันธงเลขออก” แต่คือการอ่านข้อมูลย้อนหลังให้กลายเป็น signal เช่น ความถี่ ความห่าง trend รูปทรงเลข และผลทดสอบย้อนหลัง

## ภาพรวมแบบสั้น

ระบบคิดเป็นชั้น ๆ แบบนี้:

```text
LotteryPrize rows
  -> Digit events
  -> Digit stats / Number stats / Shape flags
  -> Analytics read model
  -> Prediction / Compare / Pattern / Calendar / Backtest
  -> UI cards, tables, heatmaps, explanations
```

พูดง่าย ๆ:

1. เอาข้อมูลหวยย้อนหลังจาก database
2. แตกเลขออกเป็น digit รายตำแหน่ง เช่น `017890` กลายเป็น position 1 = `0`, position 2 = `1`, ...
3. นับว่า digit หรือเลขเคยออกบ่อยแค่ไหน
4. ดูว่า digit หรือเลขหายไปกี่งวด
5. ดู trend ว่าช่วงหลังมาแรงขึ้นหรือลง
6. วิเคราะห์รูปทรงเลข เช่น ซ้ำไหม เรียงไหม คี่คู่สมดุลไหม
7. รวมคะแนนตาม strategy แล้วจัดอันดับ

## คำศัพท์หลัก

`windowSize`

จำนวนงวดย้อนหลังที่ใช้คำนวณ เช่น `120` แปลว่าใช้ 120 งวดล่าสุดเป็นข้อมูลตั้งต้น ไม่ใช่จำนวนเลขที่จะ generate

`candidateCount`

จำนวนเลขที่อยากให้ระบบ generate เช่น `5` แปลว่าเอา top 5 candidates

`targetDrawCount`

ใช้ใน backtest เท่านั้น แปลว่าต้องการย้อนทดสอบกี่งวด เช่น ทดสอบ 30 งวดล่าสุด

`prizeType`

ประเภทรางวัล เช่น `TWO_DIGIT`, `THREE_FRONT`, `FIRST`, `PRIZE5` มีผลกับความยาวเลขและ logic ที่เหมาะสม

`numberLength`

ความยาวเลขที่ระบบควรใช้:

```text
TWO_DIGIT = 2 หลัก
THREE_DIGIT / THREE_FRONT / THREE_BACK = 3 หลัก
FIRST / NEAR_FIRST / PRIZE2 / PRIZE3 / PRIZE4 / PRIZE5 = 6 หลัก
```

code: `src/lib/app/prediction.ts:9`, `src/lib/app/prediction.ts:23`

### `SIX_DIGIT_ALL`

`SIX_DIGIT_ALL` ไม่ใช่รางวัลจริงในตารางหวยดิบ แต่เป็น prize type ระดับ analysis ที่ใช้กับหน้า `/analytics`, `/patterns`, และ `/calendar`

หน้าที่ของมันคือรวมรางวัล 6 หลักทุกกลุ่มเข้าด้วยกัน:

```text
SIX_DIGIT_ALL =
  FIRST
  + NEAR_FIRST
  + PRIZE2
  + PRIZE3
  + PRIZE4
  + PRIZE5
```

ตัวอย่างแบบบ้าน ๆ:

```text
scope = ALL_TIME
prizeType = SIX_DIGIT_ALL
engineVersion = analysis-engine-v8
snapshot row metadata matches payload metadata (sampleDrawCount/samplePrizeCount/windowSize)
```

แปลว่า:

1. ใช้ทุกงวดที่มีรางวัล 6 หลักอย่างน้อยหนึ่งตัวใน scope (ไม่มี cap 50/100/500)
2. ดึงเลขจาก `FIRST`, `NEAR_FIRST`, `PRIZE2`, `PRIZE3`, `PRIZE4`, `PRIZE5` ของงวดเหล่านั้นทั้งหมด
3. ตัดเลขที่ความยาวไม่ใช่ 6 หลักออก เช่นข้อมูลเก่าที่ first prize เป็น 7 หลัก
4. map `type` ของเลขเหล่านั้นให้เป็น `SIX_DIGIT_ALL`
5. ค่อยเอาไปคำนวณ digit position, number frequency, pattern, และ calendar heatmap เหมือน prize type อื่น

เหตุผลที่ไม่เพิ่ม `SIX_DIGIT_ALL` ลง raw enum `LotteryPrizeType`:

- มันไม่ใช่รางวัลจริง
- raw result page ต้องยังแสดงรางวัลตามประเภทจริง
- analysis snapshot เท่านั้นที่ต้องรู้จักกลุ่มนี้

ไฟล์หลัก:

- `src/api/service/analysis-snapshot/analysis-context.ts:5`
- `src/api/service/analysis-snapshot/sample-resolver.ts:1`
- `src/api/service/analysis-snapshot/compute-analysis-snapshot.ts:1`
- `prisma/schema.prisma:139`

หลังเปลี่ยน logic กลุ่มนี้ ต้องรัน migration และ recompute snapshot ใหม่ เพราะข้อมูลใน `analysis_snapshot_runs` เป็น precomputed read model

## 1. Digit Events

ไฟล์หลัก:

`src/api/service/analytics/digit-events.ts:19`

หน้าที่:

แตกเลขทั้งก้อนออกเป็น digit รายตำแหน่ง

ตัวอย่าง:

```text
number = 017890

จะได้:
position 1 -> digit 0
position 2 -> digit 1
position 3 -> digit 7
position 4 -> digit 8
position 5 -> digit 9
position 6 -> digit 0
```

ตัวแปรที่ได้ต่อหนึ่ง digit:

```ts
{
  digit: "0",
  number: "017890",
  position: 1,
  prizeType: "FIRST",
  lotteryType: "THAI_GOVERNMENT",
  drawDate: Date
}
```

ผลลัพธ์เอาไปใช้ที่:

`calculateDigitStats` เพื่อคำนวณ hot, overdue, trend รายตำแหน่ง

## 2. Analysis sample (v8 — single path)

ไฟล์หลัก:

- `src/api/service/analysis-snapshot/sample-resolver.ts`
- `src/api/service/analysis-snapshot/analysis-context.ts`

หน้าที่:

เลือก **sample เดียว** ตาม analysis context — ไม่มี preset 50/100/500 และไม่มี numeric `windowSize` cap อีกต่อไป

นิยาม:

| ช่อง | ความหมาย |
| --- | --- |
| `scope = ALL_TIME` | ทุกงวดที่มีรางวัลตรง `prizeType` จนถึง now (ทุกเดือน ทุกปี) |
| `scope = MONTH` | งวดที่ `EXTRACT(MONTH FROM drawDate) = month` ทุกปี (ไม่มี year ใน product/compute) |
| `windowPreset` | ค่าเดียว: `ALL` (= full eligible sample ใน scope) |
| `engineVersion` | `analysis-engine-v8` — snapshot v8 (MONTH across all years) และเก่ากว่าไม่ใช้ |

วิธีทำ:

1. `resolveAnalysisSample(context)` — SQL ไม่มี `LIMIT`
2. กรอง prize ตาม `prizeType` / `numberLength`
3. `buildAnalysisReadModelsFromSample(context, sample)` → analytics/pattern/calendar read models
4. Snapshot hit ใช้ `contextKey` เดียวกับ on-demand; miss → on-demand; query นอก context (เช่น `startDate`) → empty read model

dependency:

```text
resolveAnalysisSample
  -> buildAnalysisReadModelsFromSample
  -> buildAnalyticsReadModelFromPrizes
  -> extractDigitEvents
  -> calculateDigitStats
  -> calculateNumberStats
  -> summarizePatterns
```

Precompute matrix (v8):

```text
contexts = 11 ALL_TIME + (11 prize types × 12 months) = 143
MONTH contextKey uses ALL_YEARS (no per-year cells)
```

`windowSize` ในแถว `analysis_snapshot_runs` = `sampleDrawCount` (ไม่ใช่ cap) และ analytics payload ภายใน snapshot ต้องมี metadata ตรงกับ row นี้  
Query นอก context (`startDate` / `endDate` / `q`) → empty read model (ไม่ silent cap)

ผลลัพธ์:

`ApiAnalyticsReadModel` ซึ่งมี:

```text
digitStats
numberStats
patternSummaries
summary.drawCount
generatedAt
```

## 3. Digit Stats

ไฟล์หลัก:

`src/api/service/analytics/number-stats.ts:26`

หน้าที่:

ตอบคำถามว่า “digit นี้ ในตำแหน่งนี้ ของรางวัลนี้ ออกบ่อยไหม หายไปนานไหม และ trend เป็นยังไง”

กลุ่มที่นับ:

```text
lotteryType + prizeType + digit + position
```

ตัวอย่าง:

```text
FIRST position 1 digit 0
FIRST position 1 digit 1
FIRST position 2 digit 0
...
```

### hitCount

จำนวนครั้งที่ digit นั้นออกในตำแหน่งนั้น

ตัวอย่าง:

```text
ใน 120 งวด
หลักที่ 1 ของ FIRST มี digit 0 ออก 14 ครั้ง

hitCount = 14
```

### frequencyPercent

เปอร์เซ็นต์ความถี่ของ digit ในตำแหน่งนั้น

สูตร:

```text
frequencyPercent = (hitCount / sampleSize) * 100
```

code:

`src/api/service/analytics/number-stats.ts:341`

ตัวอย่าง:

```text
หลักที่ 1 มีข้อมูล 120 งวด
digit 0 ออก 14 ครั้ง

frequencyPercent = (14 / 120) * 100 = 11.67%
```

ความหมาย:

ถ้า digit กระจายเท่ากันแบบสุ่ม digit 0-9 ควรอยู่ประมาณ 10% ต่อ digit ดังนั้น 11.67% แปลว่า digit นี้ออกมากกว่าค่า baseline เล็กน้อย

### missingDrawCount

จำนวนงวดที่ digit นี้ไม่ได้เจอหลังจากครั้งล่าสุด

code:

`src/api/service/analytics/number-stats.ts:284`

ตัวอย่าง:

```text
window มี 120 งวด
digit 7 ในหลักที่ 2 เจอล่าสุดเมื่อ 5 งวดก่อน

missingDrawCount = 5
```

ความหมาย:

ค่านี้สูงแปลว่า “หายไปนาน” แต่ไม่ได้แปลว่า “ต้องออก”

### trendDirection

ดูว่าช่วงหลัง digit นี้มาแรงขึ้นหรือลง

code:

`src/api/service/analytics/number-stats.ts:305`

วิธีคิด:

1. แบ่ง window เป็นครึ่งเก่าและครึ่งล่าสุด
2. คำนวณ rate ของ digit ในครึ่งเก่า
3. คำนวณ rate ของ digit ในครึ่งล่าสุด
4. ถ้าครึ่งล่าสุดมากกว่าครึ่งเก่าเกิน threshold เล็ก ๆ = `up`
5. ถ้าครึ่งล่าสุดน้อยกว่า = `down`
6. ถ้าพอ ๆ กัน = `flat`

สูตรแบบบ้าน ๆ:

```text
olderRate = olderHits / olderSampleSize
recentRate = recentHits / recentSampleSize

ถ้า recentRate > olderRate -> up
ถ้า recentRate < olderRate -> down
ถ้าใกล้กัน -> flat
```

ผลลัพธ์:

```text
up = กำลังมาแรงขึ้น
down = ช่วงหลังอ่อนลง
flat = ไม่เปลี่ยนชัด
```

## 4. Number Stats

ไฟล์หลัก:

`src/api/service/analytics/number-stats.ts:68`

หน้าที่:

ตอบคำถามว่า “เลขทั้งตัวนี้เคยออกบ่อยแค่ไหน หายไปนานไหม และมี pattern อะไร”

กลุ่มที่นับ:

```text
lotteryType + prizeType + number
```

ตัวอย่าง:

```text
TWO_DIGIT number 99
FIRST number 017890
PRIZE5 number 123456
```

### hitCount

จำนวนครั้งที่เลขนั้นเคยออกใน window

ตัวอย่าง:

```text
เลข 99 ใน TWO_DIGIT ออก 3 ครั้งใน 120 งวด
hitCount = 3
```

### frequencyPercent

สูตร:

```text
frequencyPercent = (hitCount / samplePrizeCount) * 100
frequencyPerDrawPercent = (hitCount / drawCount) * 100
```

code:

`src/api/service/analytics/number-stats.ts`

ข้อควรเข้าใจ:

เลข 2 หลักมีโอกาสซ้ำได้บ่อยกว่า เลข 6 หลัก exact-number repeat หายากมาก ดังนั้นสำหรับ 6 หลักไม่ควรยึด exact frequency เป็นพระเอก

### averageGap / maxGap

ดูระยะห่างระหว่างวันที่เลขเดิมเคยออก

code:

`src/api/service/analytics/number-stats.ts:345`, `src/api/service/analytics/number-stats.ts:353`, `src/api/service/analytics/number-stats.ts:357`

สูตร:

```text
gap = จำนวนวันระหว่างครั้งที่ออกติดกัน
averageGap = ค่าเฉลี่ย gap
maxGap = gap ที่ยาวที่สุด
```

### trendScore

คะแนนรวมแบบง่ายของความถี่และความสดใหม่

code:

`src/api/service/analytics/number-stats.ts:370`

สูตร:

```text
recencyScore = 100 - (missingDrawCount / drawCount) * 100
trendScore = frequencyPercent * 0.65 + recencyScore * 0.35
```

แปลไทย:

เลขที่ออกบ่อยและเพิ่งออกไม่นานจะได้ trendScore สูงกว่าเลขที่ออกน้อยและหายไปนาน

## 5. Shape Analysis

ไฟล์หลัก:

`src/lib/app/number-shape.ts:36`

หน้าที่:

ดู “รูปทรง” ของเลข ไม่สนว่าเคยออกกี่ครั้ง

ตัวอย่างเลข:

```text
017890
```

ระบบจะดู:

```text
มีกี่ digit ที่ไม่ซ้ำ
เลขซ้ำหนักไหม
มีเลขเรียงไหม
เป็น palindrome ไหม
คี่/คู่สมดุลไหม
สูง/ต่ำสมดุลไหม
ผลรวม digit อยู่ช่วงต่ำ กลาง หรือสูง
```

### Shape flags

flag สำคัญ:

```text
odd / even = digit สุดท้ายเป็นคี่หรือคู่
high / low = digit สุดท้ายสูงหรือต่ำ โดย 5-9 คือ high, 0-4 คือ low
double = ทุก digit เหมือนกัน เช่น 99 หรือ 111
has_repeat = มี digit ซ้ำ
all_unique = digit ไม่ซ้ำเลย
double_pair = มี digit ที่ซ้ำเป็นคู่ตั้งแต่ 2 กลุ่ม
triple = มี digit ซ้ำ 3 ตัว
quad_or_more = ซ้ำ 4 ตัวขึ้นไป
ascending = ทุกหลักเรียงขึ้นแบบเข้ม (หลักถัดไปมากกว่าหลักก่อนหน้าเสมอ) — ใช้บน `/patterns` สำหรับรางวัล 2 และ 3 หลัก เช่น 09, 135, 123
descending = ทุกหลักเรียงลงแบบเข้ม (หลักถัดไปน้อยกว่าหลักก่อนหน้าเสมอ) — ใช้บน `/patterns` สำหรับรางวัล 2 และ 3 หลัก เช่น 90, 531, 987
ascending_run = มีช่วงเรียงขึ้น 3 ตัวติดกันแบบ +1 เช่น 123 (ยังคำนวณใน engine/scoring แต่ไม่แสดงการ์ด overview บน `/patterns` สำหรับ 6 หลัก)
descending_run = มีช่วงเรียงลง 3 ตัวติดกันแบบ -1 เช่น 987 (ยังคำนวณใน engine/scoring แต่ไม่แสดงการ์ด overview บน `/patterns` สำหรับ 6 หลัก)
palindrome = อ่านหน้าอ่านหลังเหมือนกัน เช่น 121
balanced_odd_even = คี่/คู่ใกล้เคียงกัน
balanced_high_low = สูง/ต่ำใกล้เคียงกัน
low_sum / mid_sum / high_sum = ผลรวม digit อยู่ช่วงต่ำ กลาง สูง
```

code:

`src/lib/app/number-shape.ts:36`

### shape naturalness

ไฟล์:

`src/lib/app/number-shape.ts:120`

ความหมาย:

คะแนนว่าเลขนี้ “ดูเป็นธรรมชาติ” แค่ไหน เช่น ไม่ซ้ำหนักเกินไป digit กระจายดี ผลรวมไม่สุดโต่ง

ตัวอย่าง:

```text
017890 -> digit กระจายดีมาก จึง natural สูง
000000 -> ซ้ำหนักมาก จึง natural ต่ำ
111222 -> มี pattern แต่ซ้ำเยอะ จึง natural ไม่เต็ม
```

วิธีคิด:

1. เริ่มจากคะแนน unique digit
2. ถ้าซ้ำหนักมาก โดนหัก
3. ถ้าผลรวม digit อยู่ช่วงกลาง บวกคะแนน
4. ถ้าผลรวมต่ำหรือสูงมาก โดนหัก
5. clamp ให้อยู่ 0-100

code คะแนน unique:

`src/lib/app/number-shape.ts:224`

### shape pattern

ไฟล์:

`src/lib/app/number-shape.ts:139`

ความหมาย:

คะแนนว่าเลขมี pattern ที่น่าสนใจไหม เช่น เรียงบางช่วง สมดุล คี่คู่สมดุล สูงต่ำสมดุล palindrome

สูตรแบบย่อ:

```text
เริ่มที่ 40
+12 ถ้ามี run เรียงขึ้นหรือลง
+8 หรือ +4 ถ้า palindrome
+8 ถ้าคี่/คู่สมดุล
+8 ถ้าสูง/ต่ำสมดุล
+6 ถ้าผลรวม digit อยู่กลาง
- penalty ถ้าซ้ำหนักมาก
```

### mini DNA

ไฟล์:

`src/lib/app/number-shape.ts:202`

ใช้แสดง character ของแต่ละ digit:

```text
E/H = even/high = คู่และสูง
E/L = even/low = คู่และต่ำ
O/H = odd/high = คี่และสูง
O/L = odd/low = คี่และต่ำ
```

ตัวอย่าง:

```text
017890
0 = E/L
1 = O/L
7 = O/H
8 = E/H
9 = O/H
0 = E/L
```

## 6. Pattern Summaries

ไฟล์หลัก:

`src/api/service/analytics/number-stats.ts:121`

หน้าที่:

สรุปว่า pattern แต่ละชนิดเจอบ่อยแค่ไหนในชุด numberStats

สูตร:

```text
patternFrequency = patternHitCount / totalHits * 100
```

ตัวอย่าง:

```text
ใน 100 records
เลขที่มี digit ซ้ำ 68 records

has_repeat = 68%
```

ใช้ที่:

analytics API, patterns page, methodology display

## 7. Prediction Lab

ไฟล์หลัก:

`src/api/service/prediction.service.ts:41`

หน้าที่:

generate เลขจาก digitStats รายตำแหน่ง ไม่ใช่สุ่มเลข และไม่ใช่แค่ดูเลข exact เดิม

flow:

```text
Prediction Lab UI
  1. prizeType
  2. patternIds (optional, multiselect — percentages from GET /api/patterns, same sample as /patterns)
  3. strategyId
  4. count
  5. windowSize

Prediction input
  -> normalize numberLength จาก prizeType
  -> normalize patternIds ให้เหลือเฉพาะ pattern ที่ valid ต่อรางวัล
  -> analyticsService.getDigitStats
  -> buildPositionPredictionResults
       -> enumerate digit combinations
       -> filter candidates ด้วย AND ของ patternIds (ถ้าไม่ส่ง patternIds = ไม่กรอง)
       -> strategy score + diverse select
  -> persist prediction run
  -> return ranked results
```

Pattern playground options ใช้ shared lib `src/lib/app/pattern-playground/` และดึง overview จาก `GET /api/patterns` (snapshot ก่อน, on-demand fallback) ด้วย scope `ALL_TIME` + `windowPreset: ALL` — **ไม่ใช้** `windowSize` ของ prediction เป็นตัวคำนวณเปอร์เซ็นต์ pattern

code:

`src/api/service/prediction.service.ts:54`, `src/api/service/prediction/position-engine.ts:30`, `src/lib/app/pattern-playground/`

### Step 1: เลือก digit ที่ดีในแต่ละตำแหน่ง

ไฟล์:

`src/api/service/prediction/position-engine.ts:135`

ทุกตำแหน่งจะมี candidate digit 0-9 และแต่ละ digit ได้คะแนนจาก:

```text
hot = ความถี่เทียบ baseline
overdue = หายไปนานแค่ไหน
position = trend ของตำแหน่งนั้น
```

### position hot

code:

`src/api/service/prediction/position-engine.ts:347`

สูตร:

```text
hot = 50 + (frequencyPercent - 10) * 6
```

แปล:

```text
ถ้า digit ออก 10% พอดี -> hot = 50
ถ้า digit ออกมากกว่า 10% -> hot สูงขึ้น
ถ้า digit ออกต่ำกว่า 10% -> hot ต่ำลง
```

ตัวอย่าง:

```text
frequencyPercent = 11.67
hot = 50 + (11.67 - 10) * 6
hot = 60.02
```

### position overdue

code:

`src/api/service/prediction/position-engine.ts:261`

สูตร:

```text
overdue = missingDrawCount * 8
```

แล้วบีบให้อยู่ 0-100

ตัวอย่าง:

```text
missingDrawCount = 9
overdue = 9 * 8 = 72
```

แปล:

ยิ่ง digit ในตำแหน่งนั้นหายไปนาน คะแนน overdue ยิ่งสูง

### trend

code:

`src/api/service/prediction/position-engine.ts:336`

mapping:

```text
up = 65
flat = 50
down = 35
```

แปล:

ถ้าช่วงหลัง digit นี้ออกบ่อยขึ้น จะได้ 65 ถ้าเฉย ๆ ได้ 50 ถ้าลดลงได้ 35

### Step 2: ประกอบเลขจาก digit รายตำแหน่ง

ไฟล์:

`src/api/service/prediction/position-engine.ts:189`

ระบบเอา digit ที่คะแนนดีในแต่ละตำแหน่งมาประกอบเป็นเลข เช่น:

```text
position 1: 0, 1, 6, ...
position 2: 1, 7, 4, ...
position 3: 7, 9, 0, ...
...
```

แล้ว enumerate เป็นเลข candidate หลายตัว เช่น:

```text
017890
117890
067890
...
```

### Step 3: คำนวณ scoreBreakdown ของเลขทั้งตัว

ไฟล์:

`src/api/service/prediction/position-engine.ts:281`

สูตร:

```text
hot = average(position hot ของทุกหลัก)
overdue = average(position overdue ของทุกหลัก)
position = average(trend score ของทุกหลัก)
pair = shape naturalness score
pattern = shape pattern score
```

ใน UI label ถูกแปลงที่:

`src/frontend/pages/prediction-lab/prediction-lab.mappers.ts:55`

```text
hot -> position hot
overdue -> position overdue
pair -> shape naturalness
pattern -> shape pattern
position -> trend
```

### Step 4: รวมคะแนนตาม strategy

ไฟล์:

`src/api/service/prediction/position-engine.ts:200`

สูตร:

```text
score =
  hot * weight.hot +
  overdue * weight.overdue +
  pair * weight.pair +
  pattern * weight.pattern +
  position * weight.position
```

### Strategy weights

ไฟล์:

`src/api/service/prediction/strategy-registry.ts:9`

`Balanced`

```text
hot 0.30
overdue 0.20
shape naturalness 0.10
shape pattern 0.15
trend 0.25
```

ใช้ตอนอยากได้สัญญาณแบบกลาง ๆ ไม่เอียงไป hot หรือ overdue มากเกินไป

`Cold rebound`

```text
hot 0.10
overdue 0.45
shape naturalness 0.10
shape pattern 0.15
trend 0.20
```

ใช้ตอนอยากเน้น digit หรือเลขที่หายไปนาน

`Hot trend`

```text
hot 0.50
overdue 0.05
shape naturalness 0.10
shape pattern 0.10
trend 0.25
```

ใช้ตอนอยากเน้นตัวที่ออกบ่อยและกำลังมา

### ตัวอย่างจาก UI

ถ้าเลข `017890` มี:

```text
position hot = 59.99
position overdue = 73.33
shape naturalness = 100
shape pattern = 74
trend = 55
strategy = Balanced
```

สูตร:

```text
score =
59.99 * 0.30 +
73.33 * 0.20 +
100 * 0.10 +
74 * 0.15 +
55 * 0.25

score =
17.997 +
14.666 +
10 +
11.1 +
13.75

score = 67.513
```

UI ปัดเป็น:

```text
67.51
```

แปลแบบบ้าน ๆ:

เลขนี้ไม่ได้แปลว่าต้องออก แต่แปลว่า “จากข้อมูลย้อนหลัง เลขนี้มีคะแนนรวมค่อนข้างดีตาม strategy ที่เลือก”

## 8. Diversity Filter

ไฟล์:

`src/api/service/prediction/position-engine.ts:55`

หน้าที่:

ลดปัญหาเลข generate ออกมาหน้าตาคล้ายกันเกินไป เช่น `00`, `11`, `22` เยอะเกิน

logic:

```text
ถ้าเลขซ้ำ digit เดียวทั้งตัว เช่น 00, 111, 999999 จะจำกัดจำนวน
ถ้า digit เดิมถูกใช้ในตำแหน่งเดิมเยอะเกินไป จะข้าม candidate นั้นก่อน
ถ้าเลือกได้ไม่ครบ ค่อยเติมจาก ranked candidates ที่เหลือ
```

ตัวแปรสำคัญ:

```text
count = จำนวนเลขที่ user อยากได้
numberLength = ความยาวเลข
digitUseByPosition = map ว่า position นี้ใช้ digit นี้ไปกี่ครั้งแล้ว
```

code จำกัดเลขซ้ำ:

`src/api/service/prediction/position-engine.ts:123`

code จำกัดการใช้ digit เดิมในตำแหน่งเดิม:

`src/api/service/prediction/position-engine.ts:105`

## 9. Legacy Number Scoring

ไฟล์:

`src/api/service/prediction/scoring-engine.ts:19`

หน้าที่:

ใช้ scoring จาก `ApiNumberStat` โดยตรง สำหรับ compare และบาง workflow ที่ไม่ได้ประกอบเลขจาก position engine

สูตร breakdown:

`src/api/service/prediction/scoring-engine.ts:44`

```text
hot = frequencyPercent * 4
overdue = missingDrawCount * 8
pair = shape naturalness
pattern = shape pattern
position = trendScore
```

สูตรรวม:

`src/api/service/prediction/scoring-engine.ts:54`

```text
score =
hot * weight.hot +
overdue * weight.overdue +
pair * weight.pair +
pattern * weight.pattern +
position * weight.position
```

ความต่างจาก Prediction Lab:

```text
Prediction Lab ใช้ digit รายตำแหน่งมาประกอบเลข
Compare ใช้เลขที่ user ใส่มา แล้วเอา numberStats/shape ไปให้คะแนน
```

## 10. Compare

ไฟล์หลัก:

`src/api/service/compare.service.ts:10`

หน้าที่:

ให้ user ใส่เลขหลายตัว แล้วระบบช่วยเรียงว่าเลขไหน signal รวมดีกว่า

flow:

```text
input numbers
  -> trim และ unique
  -> หา numberStats จาก analytics
  -> ถ้าเลขไม่มี stat ให้สร้าง empty stat
  -> scoreNumber
  -> sort score มากไปน้อย
```

ถ้าเลขไม่เคยอยู่ใน stats:

`src/api/service/compare.service.ts:67`

ระบบสร้าง stat ว่าง:

```text
frequencyPercent = 0
hitCount = 0
missingDrawCount = drawCount หรือ windowSize
trendScore = 0
patternFlags = shape flags จากตัวเลขนั้น
```

`strongestSignal`

ไฟล์:

`src/api/service/compare.service.ts:111`

วิธีคิด:

รวม scoreBreakdown ทุก candidate แล้วดูว่า field ไหนรวมสูงสุด เช่น hot, overdue, pattern

## 11. Backtest

ไฟล์หลัก:

`src/api/service/backtest/walk-forward.ts:43`

หน้าที่:

ทดสอบย้อนหลังแบบ walk-forward

แปลแบบบ้าน ๆ:

ระบบย้อนเวลาไปทีละงวด แล้วทายงวดนั้นโดยใช้เฉพาะข้อมูลก่อนหน้างวดนั้น ห้ามแอบเห็นผลจริงล่วงหน้า

flow:

```text
sort draws จากเก่าไปใหม่
เลือก targetDraws ตาม targetDrawCount
สำหรับแต่ละ target draw:
  historyDraws = งวดก่อนหน้า target draw ตาม windowSize
  สร้าง digitStats จาก historyDraws
  generate candidate numbers
  เทียบกับ actualNumbers ของ target draw
  ถ้าตรง = hit
```

ตัวแปรสำคัญ:

```text
windowSize = จำนวนงวดก่อนหน้า target draw ที่ใช้คำนวณ
targetDrawCount = จำนวนงวดที่อยากย้อนทดสอบ
candidateCount = จำนวนเลขที่ generate ต่อหนึ่งงวด
```

### hit / miss

```text
hitNumbers = generatedNumbers ที่อยู่ใน actualNumbers
isHit = hitNumbers.length > 0
rankOfHit = ลำดับของเลขที่ถูกใน generatedNumbers
```

### explanation payload

ไฟล์:

`src/api/service/backtest/walk-forward.ts:142`

ถ้า row นั้น hit ระบบแนบคำอธิบายว่า:

```text
ใช้ window กี่งวด
ใช้ strategy อะไร
เลขที่ generate แต่ละตัวได้ score เท่าไร
breakdown ของแต่ละเลขคืออะไร
position breakdown เป็นยังไง
```

### summary

ไฟล์:

`src/api/service/backtest/walk-forward.ts:184`

ผลรวมของ backtest มี:

```text
hitRate = จำนวน row ที่ hit / จำนวน row ทั้งหมด * 100
averageHitRank = ค่าเฉลี่ย rank ของเลขที่ hit
longestMissStreak = miss ติดกันยาวสุดกี่งวด
expectedRandomHitRate = ถ้าสุ่มมั่ว โอกาส hit ควรประมาณเท่าไร
liftVsRandom = hitRate - expectedRandomHitRate
```

### expectedRandomHitRate

ไฟล์:

`src/api/service/backtest/walk-forward.ts:204`, `src/api/service/backtest/walk-forward.ts:221`

แนวคิด:

ถ้า generate 5 เลขจากเลข 2 หลักทั้งหมด 100 แบบ และ actual มี 1 เลข โอกาสสุ่มโดนไม่ใช่ 50% แต่ประมาณ 5%

สูตรแบบแนวคิด:

```text
universeSize = 10 ^ numberLength
generatedCount = จำนวนเลขที่ระบบ generate แบบไม่ซ้ำ
actualCount = จำนวนเลขจริงในงวดนั้น

คำนวณโอกาส miss ทุกตัวก่อน
randomHitProbability = 1 - missProbability
```

## 12. Patterns Page

ไฟล์หลัก:

`src/frontend/pages/patterns/patterns.mappers.ts:246`

หน้าที่:

เอา analytics numberStats มาแปลงเป็นหน้าอ่าน pattern

flow:

```text
analytics.numberStats
  -> filter ตาม prizeType
  -> เลือก pattern definitions ตาม numberLength
  -> นับว่า pattern แต่ละอันเจอกี่ hit
  -> ทำ overview cards
  -> ทำ examples พร้อม mini DNA
  -> ทำ distribution summary
```

query default:

`src/frontend/pages/patterns/patterns.mappers.ts:196`

```text
prizeType default = TWO_DIGIT
windowSize default = 30
```

ส่ง query ไป analytics:

`src/frontend/pages/patterns/patterns.mappers.ts:211`

```text
numberLength = getPrizeNumberLength(prizeType)
prizeType = selected prizeType
windowSize = selected windowSize
```

overview card:

`src/frontend/pages/patterns/patterns.mappers.ts:303`

สูตร:

```text
value = total hitCount ของเลขที่ match pattern
percent = value / totalHits * 100
examples = ตัวอย่างเลข 3 ตัวแรก
```

distribution:

`src/frontend/pages/patterns/patterns.mappers.ts:342`

คำนวณ:

```text
repeatCount
uniqueCount
balancedOddEvenCount
balancedHighLowCount
averageUniqueDigits
digitSums
```

## 13. Calendar Monthly Heatmap

ไฟล์หลัก:

- `src/api/service/calendar/calendar-heatmap-insight.ts`
- `src/api/service/calendar.service.ts`
- `src/api/service/analytics/position-heatmap.ts`
- `src/api/service/lottery/prize-slots.ts`

หน้าที่:

แสดงความถี่ digit 0-9 ในแต่ละ position ของเลขรางวัลที่เลือก โดยนับจาก **ทุกแถวรางวัล** ในทุกงวดของ sample (ไม่ใช่แค่ “งวดที่เคยออก”)

### sample

```text
resolveAnalysisSample(context)   # snapshot, on-demand, และ audit replay ใช้นิยามเดียว
drawCount = ทุกงวด eligible ใน scope (ไม่มี draw cap)
prize rows = ทุกเลขรางวัลที่ตรง prizeType และ numberLength
```

**MONTH scope** (ทุก consumer รวม `/calendar`):

```text
EXTRACT(MONTH FROM drawDate) = month   # ทุกปีในเดือนนั้น (ไม่มี year ใน product/compute)
```

ตัวอย่าง May + PRIZE5 = ทุกงวดใน พ.ค. ทุกปีที่มี PRIZE5 → ตัวหาร = draws × prizes/draw จริง (~100–200 ต่องวด)

### matrix ขนาด

แถว = ความยาวเลข (`numberLength`: 2 / 3 / 6)  
คอลัมน์ = digit 0-9

รางวัลต่องวด (catalog):

```text
TWO_DIGIT = 1  → 2×10
THREE_FRONT / THREE_BACK = 2  → 3×10
FIRST = 1, NEAR_FIRST = 2  → 6×10
PRIZE2 = 5, PRIZE3 = 10, PRIZE4 = 50, PRIZE5 = 100  → 6×10
```

### hit / opportunity (ตัวเลขหลักบน UI)

ต่อ cell ที่ position P และ digit D:

```text
hitCount(P,D) = จำนวนครั้งที่ D ปรากฏที่ตำแหน่ง P จากทุกแถวรางวัลใน sample
opportunityCount(P) = ผลรวมช่องอ่านที่ตำแหน่ง P (= drawCount × แถวรางวัลจริงต่องวด)
hitRatePercent = hitCount / opportunityCount × 100
```

ตัวอย่าง PRIZE5, 50 งวดใน scope, ข้อครบ 100 แถว/งวด:

```text
opportunityCount ต่อ position = 50 × 100 = 5,000
แสดงใน UI: hit / 5,000 และ %
```

ถ้าข้อไม่ครบ catalog → ใช้ **แถวรางวัลจริง** เป็นตัวหาร + `dataCompleteness = partial`

### tone (สี)

code: `assignWithinRowVisualTones` ใน `position-heatmap.ts`

```text
จัดอันดับ digit ภายในแถว position เดียวกัน
~20% บน = hot/warm, ~20% ล่าง = cool/cold
ไม่ใช่ความน่าจะถูกรางวัล
```

### ฟิลด์เสริม (API เท่านั้น ไม่แสดงบนหน้า Calendar หลัก)

- `appearanceCount` = จำนวน**งวด**ที่ digit ปรากฏอย่างน้อย 1 ครั้ง
- `missingRounds`, `score`, `lift`, `expectedRatePercent` = ใช้ภายใน engine / หน้าอื่น

## 14. Analysis Snapshot Engine

ไฟล์หลัก:

`src/api/service/analysis-snapshot/compute-analysis-snapshot.ts`

script:

`scripts/compute-analysis.ts`

หน้าที่:

precompute analytics stats เก็บลง table เพื่อให้หน้าเว็บโหลดเร็วขึ้น

flow:

```text
listAnalysisContexts() จาก context-plan
resolveAnalysisSample(context)   # ไม่มี LIMIT
buildAnalysisReadModelsFromSample(context, sample)
ลบ snapshot เก่า → insert analysis_snapshot_runs (+ derived tables)
```

Runtime: `snapshot-reader` hit → return; miss → `on-demand-read-model` (sample + builders เดียวกัน)

เงื่อนไข snapshot hit:

```text
prizeType + scope (+ month เมื่อ MONTH) ตรง analysis context
ไม่มี startDate/endDate/q นอก context
engineVersion = analysis-engine-v8
```

catalog: `src/api/service/analysis-snapshot/analysis-context.ts`

`ANALYSIS_PRIZE_TYPES` ตอนนี้มี `SIX_DIGIT_ALL` ด้วย โดยเป็น grouped analysis prize type ไม่ใช่ raw lottery prize type

เวลาคำนวณ `SIX_DIGIT_ALL`, `sample-resolver` จะ resolve source prize types แบบนี้:

```text
SIX_DIGIT_ALL -> FIRST, NEAR_FIRST, PRIZE2, PRIZE3, PRIZE4, PRIZE5
```

แล้วค่อย normalize prize type ใน read model เป็น `SIX_DIGIT_ALL` เพื่อให้ `/analytics`, `/patterns`, และ `/calendar` เห็นข้อมูลเป็นกลุ่มเดียว

เพราะ snapshot tables ต้องเก็บ grouped value นี้ได้ field `prizeType` ใน analysis snapshot tables จึงเป็น string ไม่ใช่ `LotteryPrizeType` enum:

```text
analysis_snapshot_runs.prizeType
analysis_digit_stats.prizeType
analysis_number_stats.prizeType
analysis_pattern_summaries.prizeType
analysis_calendar_heatmaps.prizeType
```

script full recompute:

`scripts/compute-analysis.ts`

script incremental:

`scripts/compute-analysis.ts`

ตัวอย่าง command:

```bash
bun run db:compute-analysis
bun run db:compute-analysis -- --prizeType=TWO_DIGIT --scope=ALL_TIME
bun run db:compute-analysis -- --prizeType=FIRST --scope=MONTH --month=5
```

## 15. Dashboard

ไฟล์หลัก:

`src/api/service/dashboard.service.ts:41`

หน้าที่:

ดึงข้อมูลหลาย service มารวมเป็นหน้าแรก

มันไม่ได้คำนวณ prediction ใหม่เอง แต่รวม:

```text
latest draw
analytics read model
latest prediction summary
```

dependency:

```text
dashboard
  -> draw service / prisma latest draw query
  -> analyticsService.getAnalyticsReadModel
  -> predictionService.getLatestPredictionSummary
```

code:

`src/api/service/dashboard.service.ts:44`, `src/api/service/dashboard.service.ts:61`, `src/api/service/dashboard.service.ts:70`

## 16. Search

ไฟล์หลัก:

`src/api/service/search.service.ts:18`

หน้าที่:

ค้นหาข้อมูล draw, prize, stats, watchlist

stats window คงที่:

`src/api/service/search.service.ts:7`

```text
SEARCH_STATS_WINDOW_SIZE = 120
```

search stats:

`src/api/service/search.service.ts:156`

แปล:

ถ้าค้นเลข 2 หลัก จะไปดู stats ของ TWO_DIGIT

ถ้าค้นเลข 3 หลัก จะไปดู stats ของ THREE_DIGIT / THREE_FRONT / THREE_BACK

ถ้าค้นเลข 6 หลัก จะไปดู stats ของ FIRST / PRIZE2 / PRIZE3 / PRIZE4 / PRIZE5

## 17. Watchlist

ไฟล์หลัก:

`src/api/service/watchlist.service.ts:98`

หน้าที่:

เอาเลขที่ user save ไว้ไป enrich ด้วย stats

flow:

```text
watchlist numbers
  -> group ตามความยาวเลข
  -> ดึง analytics numberStats window 120
  -> ถ้าเลขเดียวกันเจอหลาย prizeType เลือก stat ที่ hitCount สูงกว่า
```

code enrich:

`src/api/service/watchlist.service.ts:122`

ผลลัพธ์ที่ user เห็น:

```text
hitCount
frequencyPercent
missingDrawCount
trendScore
```

## 18. Dependency Map

ภาพรวม dependency:

```text
analytics/digit-events
  -> analytics/number-stats

analytics/number-stats
  -> analytics/analytics-engine
  -> analysis-snapshot/snapshot-reader

lib/app/number-shape
  -> analytics/number-stats
  -> prediction/position-engine
  -> prediction/scoring-engine
  -> compare.service
  -> patterns.mappers

analytics.service
  -> prediction.service
  -> compare.service
  -> watchlist.service
  -> search.service
  -> dashboard.service
  -> patterns page data

prediction/position-engine
  -> prediction.service
  -> backtest/walk-forward

prediction/scoring-engine
  -> compare.service

backtest/walk-forward
  -> backtest.service
  -> backtest page

calendar.service
  -> calendar page
```

## 19. ข้อควรระวังในการอ่านผล

`frequencyPercent` ไม่ใช่ probability ที่งวดหน้าจะออก

มันคือสถิติย้อนหลังใน window ที่เลือก

`overdue` ไม่ได้แปลว่าถึงคิวแน่นอน

มันแปลว่า digit หรือเลขนั้นหายไปนานใน sample ที่เลือก

`trend up` ไม่ได้แปลว่าจะขึ้นต่อ

มันแปลว่าช่วงหลังใน window ออกบ่อยกว่าช่วงแรก

`shape naturalness` และ `shape pattern` ไม่ได้ดูประวัติการออก

มันดูหน้าตาของเลข เช่น ซ้ำไหม เรียงไหม สมดุลไหม

เลข 6 หลัก exact repeat ไม่ควรเป็นสัญญาณหลัก

เพราะ universe ใหญ่มาก เช่น 000000-999999 มี 1,000,000 แบบ การซ้ำตรง ๆ จึงน้อยมากเมื่อเทียบกับเลข 2 หลักที่มีแค่ 100 แบบ

## 20. ตัวอย่าง end-to-end

สมมุติ user เปิด Prediction Lab:

```text
prizeType = FIRST
patternIds = ["all_unique", "balanced_odd_even"]   # optional; UI shows % from /patterns sample
windowSize = 120
count = 5
strategy = Balanced
```

ระบบทำ:

```text
1. FIRST -> numberLength 6
2. ดึง digitStats ของ FIRST (analytics scope ALL_TIME สำหรับ digit; windowSize บันทึกเป็น inputWindow ในผลลัพธ์)
3. position 1 เลือก digit ที่คะแนนดี
4. position 2 เลือก digit ที่คะแนนดี
5. ทำครบ 6 position
6. ประกอบเลข candidate
7. กรอง candidate ที่ไม่ตรงทุก pattern ใน patternIds (ถ้ามี)
8. คำนวณ hot/overdue/trend เฉลี่ย
9. คำนวณ shape naturalness และ shape pattern
10. รวมคะแนนด้วย Balanced weights
11. sort score มากไปน้อย
12. return top 5
```

ถ้าได้เลข:

```text
017890
```

และ breakdown:

```text
position hot = 59.99
position overdue = 73.33
shape naturalness = 100
shape pattern = 74
trend = 55
```

สูตร:

```text
score =
59.99 * 0.30 +
73.33 * 0.20 +
100 * 0.10 +
74 * 0.15 +
55 * 0.25

score = 67.51
```

คำแปล:

เลขนี้คะแนนดีพอประมาณ เพราะ digit รายตำแหน่งมีความถี่และ overdue พอใช้ รูปทรงเลขดีมาก และ trend กลาง ๆ

แต่ยังต้องอ่านเป็น signal จากอดีต ไม่ใช่คำทำนายที่รับประกันผล
