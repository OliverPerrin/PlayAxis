# Leaderboards Endpoint

GET /api/v1/leaderboards

Query params:
- `category`: string (e.g., "overall", "running", "cycling")
- `timeframe`: string (e.g., "weekly", "monthly", "yearly", "alltime")

The frontend supports any of these response shapes:
- Array
```json
[
  { "rank": 1, "name": "Alex Runner", "score": 2450, "streak": 45, "change": 0, "country": "🇺🇸", "avatar": "🏃‍♂️" }
]
```

- Object with "data"
```json
{
  "data": [
    { "rank": 1, "name": "Alex Runner", "score": 2450, "streak": 45, "change": 0, "country": "🇺🇸", "avatar": "🏃‍♂️" }
  ]
}
```

- Object with "leaderboard"
```json
{
  "leaderboard": [
    { "rank": 1, "name": "Alex Runner", "score": 2450, "streak": 45, "change": 0, "country": "🇺🇸", "avatar": "🏃‍♂️" }
  ]
}
```

Field flexibility:
- `name` or `username` is accepted.
- `score`, `points`, or `value` are accepted for the numeric ranking value.
- `streak` or `current_streak`.
- `change` or `rank_change`.
- `country` or `flag`.
- `avatar` is optional (emoji or URL).