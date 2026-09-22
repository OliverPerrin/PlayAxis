"""Sourced historical performances, without invented rankings or percentiles."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/athletes", tags=["athletes"])
BENCHMARKS = [
    {
        "id": "cheptegei-monaco-2020",
        "name": "Joshua Cheptegei",
        "country": "Uganda",
        "sport": "running",
        "distance_m": 5000,
        "time_sec": 755.36,
        "date": "2020-08-14",
        "venue": "Monaco",
        "source": "https://worldathletics.org/news/press-release/cheptegei-5000m-world-record-ratified",
    },
    {
        "id": "kipyegon-paris-2023",
        "name": "Faith Kipyegon",
        "country": "Kenya",
        "sport": "running",
        "distance_m": 5000,
        "time_sec": 845.20,
        "date": "2023-06-09",
        "venue": "Paris",
        "source": "https://worldathletics.org/news/report/paris-kipyegon-girma-ingebrigtsen-5000m-steeplechase-two-miles-world-record-best",
    },
    {
        "id": "ganna-grenchen-2022",
        "name": "Filippo Ganna",
        "country": "Italy",
        "sport": "cycling",
        "distance_m": 56792,
        "time_sec": 3600,
        "date": "2022-10-08",
        "venue": "Grenchen velodrome",
        "source": "https://www.uci.org/pressrelease/filippo-ganna-breaks-the-uci-hour-record-timed-by-tissot/82aysypXuU0sdkVD69YVI",
    },
    {
        "id": "biedermann-rome-2009",
        "name": "Paul Biedermann",
        "country": "Germany",
        "sport": "swimming",
        "distance_m": 400,
        "time_sec": 220.07,
        "date": "2009-07-26",
        "venue": "Rome, 400 m freestyle",
        "source": "https://www.worldaquatics.com/news/1913459/swimming-day-1-mens-400m-free-yang-sun-chn-confirms-credentials",
    },
]


class Comparison(BaseModel):
    sport: str = "running"
    athlete_id: str
    user_metrics: dict[str, float]


@router.post("/compare")
async def compare(payload: Comparison):
    row = next(
        (
            r
            for r in BENCHMARKS
            if r["id"] == payload.athlete_id and r["sport"] == payload.sport
        ),
        None,
    )
    if not row:
        raise HTTPException(404, "No verified reference performance for this selection")
    metric = "distance_m" if row["sport"] == "cycling" else "time_sec"
    value = payload.user_metrics.get(
        metric,
        payload.user_metrics.get("5k_sec") if row["sport"] == "running" else None,
    )
    bound = 1000000 if metric == "distance_m" else 36000
    if value is None or not 0 < value <= bound:
        raise HTTPException(422, "Enter a positive, finite comparison value")
    reference = row[metric]
    return {
        "sport": row["sport"],
        "athlete_id": row["id"],
        "athlete_name": row["name"],
        "source": row["source"],
        "performance_date": row["date"],
        "metrics": [
            {
                "metric": metric,
                "athlete_value": reference,
                "user_value": value,
                "delta": value - reference,
                "ratio": value / reference,
                "time_ratio": value / reference if metric == "time_sec" else None,
                "percentile": None,
            }
        ],
    }


@router.get("/{sport}")
async def athletes(sport: str, q: str = "", limit: int = Query(50, ge=1, le=100)):
    return {
        "sport": sport,
        "athletes": [
            r
            for r in BENCHMARKS
            if r["sport"] == sport and q.casefold() in r["name"].casefold()
        ][:limit],
        "coverage": "Dated performances from World Athletics, UCI and World Aquatics. Compare the stated event and conditions.",
    }
