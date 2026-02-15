import time
import yfinance as yf
import analysis

start_time = time.time()
print("Starting analysis...")
results = analysis.analyze_market()
end_time = time.time()

print(f"Analysis took {end_time - start_time:.2f} seconds")
print(f"Analyzed {len(results)} stocks")
