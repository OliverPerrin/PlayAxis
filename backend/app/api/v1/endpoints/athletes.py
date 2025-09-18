from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.athlete import AthleteSearchResponse, CompareAthleteRequest, CompareAthleteResponse, CompareAthleteMetric
from app.services.external_standings import (
    extract_skiing_athletes,
    extract_running_athletes,
    extract_cycling_athletes,
)

router = APIRouter(prefix="/athletes", tags=["athletes"])

SUPPORTED = {"skiing": extract_skiing_athletes, "running": extract_running_athletes, "cycling": extract_cycling_athletes}

@router.get("/{sport}", response_model=AthleteSearchResponse)
async def list_athletes(sport: str, q: str | None = None, limit: int = 50):
    sport = sport.lower()
    if sport not in SUPPORTED:
        raise HTTPException(status_code=404, detail="Sport not supported for athletes")
    rows = await SUPPORTED[sport](limit=limit)
    if q:
        qlow = q.lower()
        rows = [r for r in rows if qlow in (r.get('name','').lower())]
    return {"sport": sport, "athletes": rows}

# Simple benchmark metrics per sport for comparison logic
BENCHMARKS = {
    'running': {  # approximate world-class reference values
        '5k_sec': 12 * 60 + 35,  # 12:35
        '10k_sec': 26 * 60 + 30,  # 26:30
        'half_marathon_sec': 58 * 60,  # 58:00
        'marathon_sec': 2 * 3600 + 60 + 10,  # 2:01:10
    },
    'cycling': {
        'ftp_wkg': 6.8,  # elite pro FTP w/kg
        'vo2max_mlkgmin': 85,
    },
    'skiing': {
        'giant_slalom_sec': 75,
        'slalom_sec': 50,
    }
}

@router.post("/compare", response_model=CompareAthleteResponse)
async def compare_athlete(payload: CompareAthleteRequest):
    sport = payload.sport.lower()
    athletes_fn = SUPPORTED.get(sport)
    if not athletes_fn:
        raise HTTPException(status_code=400, detail="Unsupported sport")
    athletes = await athletes_fn(limit=200)
    athlete = next((a for a in athletes if a['id'] == payload.athlete_id), None)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    user = payload.user_metrics or {}
    benchmarks = BENCHMARKS.get(sport, {})
    metrics: List[CompareAthleteMetric] = []

    # Generic translation of world-record style events (running)
    if sport == 'running':
        # expected user metrics: e.g., {"5k_sec": 1500, "10k_sec": 3300}
        for k, record_val in benchmarks.items():
            if not k.endswith('_sec'):  # only time based
                continue
            user_time = user.get(k)
            if user_time is None:
                continue
            # Faster time is better: percentile approximate scale
            ratio = record_val / user_time if user_time else 0
            percentile = min(99.9, max(0.1, ratio * 100))
            metrics.append(CompareAthleteMetric(
                metric=k.replace('_sec',''),
                athlete_value=record_val,
                user_value=user_time,
                delta=user_time - record_val,
                percentile=percentile
            ))
    elif sport == 'cycling':
        # expected: ftp_wkg, vo2max_mlkgmin
        ftp_ref = benchmarks.get('ftp_wkg')
        ftp_user = user.get('ftp_wkg')
        if ftp_user is not None and ftp_ref:
            percentile = min(99.9, max(0.1, (ftp_user / ftp_ref) * 100))
            metrics.append(CompareAthleteMetric(metric='ftp_wkg', athlete_value=ftp_ref, user_value=ftp_user, delta=ftp_user-ftp_ref, percentile=percentile))
        vo2_ref = benchmarks.get('vo2max_mlkgmin')
        vo2_user = user.get('vo2max_mlkgmin')
        if vo2_user is not None and vo2_ref:
            percentile = min(99.9, max(0.1, (vo2_user / vo2_ref) * 100))
            metrics.append(CompareAthleteMetric(metric='vo2max_mlkgmin', athlete_value=vo2_ref, user_value=vo2_user, delta=vo2_user-vo2_ref, percentile=percentile))
    elif sport == 'skiing':
        # expected: giant_slalom_sec, slalom_sec (times)
        for k, ref in benchmarks.items():
            user_time = user.get(k)
            if user_time is None:
                continue
            ratio = ref / user_time if user_time else 0
            percentile = min(99.9, max(0.1, ratio * 100))
            metrics.append(CompareAthleteMetric(metric=k.replace('_sec',''), athlete_value=ref, user_value=user_time, delta=user_time-ref, percentile=percentile))

    return CompareAthleteResponse(
        sport=sport,
        athlete_id=athlete['id'],
        athlete_name=athlete['name'],
        metrics=metrics
    )
