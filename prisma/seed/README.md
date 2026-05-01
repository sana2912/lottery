# Draw Seed Files

Put real draw imports in `prisma/seed/draws.json`, a single CSV file, or a directory of CSV files, then run:

```bash
bun run db:seed
```

To use another file:

```bash
bun run db:seed prisma/seed/my-draws.json
bun run db:seed lottory-histoty/results_2022_2026.csv
bun run db:seed lottory-histoty
```

Expected shape:

```json
{
  "source": {
    "name": "Source display name",
    "url": "https://example.com/draws",
    "status": "IMPORTED"
  },
  "draws": [
    {
      "lotteryType": "THAI_GOVERNMENT",
      "drawDate": "2026-04-16",
      "drawNo": "08/2026",
      "sourceUrl": "https://example.com/draws/2026-04-16",
      "sourceStatus": "VERIFIED",
      "publishedAt": "2026-04-16T09:00:00.000Z",
      "metadata": {
        "sourceRecordId": "2026-04-16"
      },
      "prizes": [
        { "type": "FIRST", "number": "123456" },
        { "type": "THREE_FRONT", "position": 1, "number": "123" },
        { "type": "THREE_BACK", "position": 1, "number": "456" },
        { "type": "TWO_DIGIT", "number": "09" }
      ]
    }
  ]
}
```

Numbers must be strings so leading zeroes are preserved.

CSV imports from the current history scraper are normalized as:

- `first_prize` -> `FIRST`
- `last3_numbers` -> `THREE_DIGIT`
- `last2_number` -> `TWO_DIGIT`
- `near_first_prize` -> `NEAR_FIRST`
- `prize2_numbers` -> `PRIZE2`
- `prize3_numbers` -> `PRIZE3`
- `prize4_numbers` -> `PRIZE4`
- `prize5_numbers` -> `PRIZE5`
