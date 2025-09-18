from pydantic import BaseModel
from typing import List, Optional


class Sport(BaseModel):
    idSport: Optional[str] = None
    strSport: Optional[str] = None
    strFormat: Optional[str] = None
    strSportThumb: Optional[str] = None
    strSportIconGreen: Optional[str] = None
    strSportDescription: Optional[str] = None


class League(BaseModel):
    idLeague: str
    strLeague: Optional[str] = None
    strSport: Optional[str] = None
    strLeagueAlternate: Optional[str] = None
    dateFirstEvent: Optional[str] = None
    strCountry: Optional[str] = None
    strBadge: Optional[str] = None
    strLogo: Optional[str] = None
    strDescriptionEN: Optional[str] = None


class Standing(BaseModel):
    idTeam: Optional[str] = None
    idLeague: Optional[str] = None
    strTeam: Optional[str] = None
    strLeague: Optional[str] = None
    intRank: Optional[int] = None
    intWin: Optional[int] = None
    intLoss: Optional[int] = None
    intDraw: Optional[int] = None
    intGoalsFor: Optional[int] = None
    intGoalsAgainst: Optional[int] = None
    intPoints: Optional[int] = None


class Player(BaseModel):
    idPlayer: Optional[str] = None
    idTeam: Optional[str] = None
    strPlayer: Optional[str] = None
    strTeam: Optional[str] = None
    strSport: Optional[str] = None
    strPosition: Optional[str] = None
    dateBorn: Optional[str] = None
    strNationality: Optional[str] = None
    strThumb: Optional[str] = None
    strCutout: Optional[str] = None
    strRender: Optional[str] = None
    strDescriptionEN: Optional[str] = None


class Event(BaseModel):
    id: Optional[str] = None
    sport: Optional[str] = None
    league: Optional[str] = None
    season: Optional[str] = None
    round: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    timestamp: Optional[str] = None
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None
    thumbnail: Optional[str] = None
    video: Optional[str] = None


class EventDetail(Event):
    description: Optional[str] = None
    referee: Optional[str] = None
    attendance: Optional[int] = None


class TeamEventBundle(BaseModel):
    team_id: str
    upcoming: List[Event]
    recent: List[Event]


class UnifiedEventsResponse(BaseModel):
    sport: str
    league_id: Optional[str] = None
    upcoming: List[Event]
    recent: List[Event]


class SportsListResponse(BaseModel):
    sports: List[Sport]


class LeaguesListResponse(BaseModel):
    leagues: List[League]


class StandingsResponse(BaseModel):
    league_id: str
    standings: List[Standing]


class PlayersResponse(BaseModel):
    players: List[Player]


class ComparePlayerRequest(BaseModel):
    sport: str
    player_id: str
    user_metrics: dict


class CompareMetric(BaseModel):
    metric: str
    player_value: float
    user_value: float
    percentile: Optional[float] = None


class ComparePlayerResponse(BaseModel):
    player_id: str
    player_name: Optional[str]
    sport: str
    metrics: List[CompareMetric]
