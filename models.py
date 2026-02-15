from pydantic import BaseModel
from typing import List, Optional

class StockRequest(BaseModel):
    symbol: str

class TradeSignal(BaseModel):
    action: str  # "BUY", "SELL", "HOLD"
    confidence: float
    reason: str

class StockAnalysis(BaseModel):
    symbol: str
    current_price: float
    signal: TradeSignal
    entry_price: float
    target_price: float
    stop_loss: float
    rsi: float
    macd: float
    trend: str # "UP", "DOWN", "SIDEWAYS"
    history: List[dict] = [] # List of {time: str, close: float}
    news: List[dict] = [] # List of {title: str, link: str, publisher: str, thumbnail: Optional[dict]}

class StockListResponse(BaseModel):
    stocks: List[StockAnalysis]
