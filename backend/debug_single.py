import yfinance as yf
import pandas as pd

symbol = "RELIANCE.NS"
print(f"Downloading {symbol}...")
data = yf.download(symbol, period="5d", interval="15m", progress=False)
print("Data shape:", data.shape)
print("Columns:", data.columns)
print("Head:", data.head())
