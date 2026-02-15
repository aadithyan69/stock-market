from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from models import StockListResponse, StockAnalysis
import analysis

app = FastAPI(title="Stock Technical Analysis API")

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Configure CORS
origins = [
    "*", # Allow all for simplicity in this hybrid mode
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["UI"])
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/stocks", response_model=StockListResponse, tags=["Stocks"])
async def get_market_analysis():
    try:
        # analyze_market now handles the bulk fetching and returns list of results
        results = analysis.analyze_market()
        return StockListResponse(stocks=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/{symbol}", response_model=StockAnalysis, tags=["Stocks"])
async def get_stock_analysis(symbol: str):
    # Standardize symbol (e.g. valid NSE/BSE checks)
    if not symbol.endswith(".NS") and not symbol.endswith(".BO"):
        # Assume NSE if no extension provided for Indian context
        # But allow user to type just 'RELIANCE'
        symbol = f"{symbol.upper()}.NS" 
    else:
        symbol = symbol.upper()
        
    try:
        result = analysis.analyze_single_stock(symbol)
        if result is None or result.current_price == 0.0:
             raise HTTPException(status_code=404, detail="Stock data not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
