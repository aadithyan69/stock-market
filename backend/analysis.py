import yfinance as yf
import pandas as pd
import ta
from models import StockAnalysis, TradeSignal

# Default list of stocks to scan (Major US/Indian stocks mix for demo)
STOCKS_TO_SCAN = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "HINDUNILVR.NS", "LICI.NS"
]

def analyze_stock_df(symbol: str, df: pd.DataFrame) -> StockAnalysis:
    if df.empty or len(df) < 20:
        return StockAnalysis(
            symbol=symbol,
            current_price=0.0,
            signal=TradeSignal(action="ERROR", confidence=0.0, reason="Insufficient Data"),
            entry_price=0.0,
            target_price=0.0,
            stop_loss=0.0,
            rsi=0.0,
            macd=0.0,
            trend="UNKNOWN"
        )

    # Calculate Indicators
    # RSI
    df['rsi'] = ta.momentum.rsi(df['Close'], window=14)
    
    # MACD
    macd = ta.trend.MACD(df['Close'])
    df['macd'] = macd.macd()
    df['macd_signal'] = macd.macd_signal()
    
    # Bollinger Bands
    bb = ta.volatility.BollingerBands(df['Close'], window=20, window_dev=2)
    df['bb_upper'] = bb.bollinger_hband()
    df['bb_lower'] = bb.bollinger_lband()
    
    # ATR for Stop Loss/Target
    df['atr'] = ta.volatility.average_true_range(df['High'], df['Low'], df['Close'])

    # Get latest values
    last_row = df.iloc[-1]
    current_price = last_row['Close']
    rsi = last_row['rsi']
    macd_val = last_row['macd']
    macd_sig = last_row['macd_signal']
    atr = last_row['atr']
    
    # Generate Signal
    action = "HOLD"
    reason = []
    
    # Simple Strategy
    if rsi < 30:
        action = "BUY"
        reason.append("RSI Oversold (<30)")
    elif rsi > 70:
        action = "SELL"
        reason.append("RSI Overbought (>70)")
        
    if macd_val > macd_sig:
        if action == "BUY":
            reason.append("MACD Bullish Crossover")
    elif macd_val < macd_sig:
        if action == "SELL":
            reason.append("MACD Bearish Crossover")

    # Determine trend
    sma50 = ta.trend.sma_indicator(df['Close'], window=50).iloc[-1]
    trend = "UP" if current_price > sma50 else "DOWN"

    # Set Targets
    if action == "BUY":
        entry_price = current_price
        stop_loss = current_price - (atr * 1.5)
        target_price = current_price + (atr * 2.0)
    elif action == "SELL":
        entry_price = current_price
        stop_loss = current_price + (atr * 1.5)
        target_price = current_price - (atr * 2.0)
    else:
        entry_price = 0.0
        stop_loss = 0.0
        target_price = 0.0

    return StockAnalysis(
        symbol=symbol,
        current_price=round(current_price, 2),
        signal=TradeSignal(
            action=action, 
            confidence=0.8 if len(reason) > 1 else 0.5,
            reason=", ".join(reason) if reason else "No clear signal"
        ),
        entry_price=round(entry_price, 2),
        target_price=round(target_price, 2),
        stop_loss=round(stop_loss, 2),
        rsi=round(rsi, 2),
        macd=round(macd_val, 2),
        trend=trend
    )

def analyze_market():
    results = []
    try:
        # Bulk download
        # period='5d' to get enough data for indicators (SMA50 might need more, let's use 1mo to be safe for SMA50 on 15m?)
        # 15m interval limit is 60 days
        tickers_str = " ".join(STOCKS_TO_SCAN)
        data = yf.download(tickers_str, period="5d", interval="15m", group_by='ticker', threads=True)
        
        for symbol in STOCKS_TO_SCAN:
            try:
                stock_df = data[symbol].copy()
                # Drop rows with NaN in Close which might happen if tickers have different trading hours?
                # Usually fine for NSE set
                stock_df.dropna(subset=['Close'], inplace=True)
                analysis = analyze_stock_df(symbol, stock_df)
                results.append(analysis)
            except Exception as e:
                print(f"Error analyzing {symbol}: {e}")
                
    except Exception as e:
         print(f"Bulk download failed: {e}")
         return []
         
    return results

def analyze_single_stock(symbol: str):
     # Fallback/Single stock analysis
     try:
        # Use yf.download for consistency
        df = yf.download(symbol, period="5d", interval="15m", progress=False)
        
        # Check if df is multi-index (happens if symbol is list or sometimes with recent yfinance)
        if isinstance(df.columns, pd.MultiIndex):
             # If level 1 is ticker, likely we just need level 0
             # But check if there's only one ticker level
             if len(df.columns.levels[1]) == 1:
                  df.columns = df.columns.droplevel(1)
             else:
                  # If passing symbol list, this logic would need to change, but here it's single stock
                  pass
             
        if df.empty:
            return None
            
        return analyze_stock_df(symbol, df)
     except Exception as e:
         print(f"Error fetching {symbol}: {e}")
         return None
