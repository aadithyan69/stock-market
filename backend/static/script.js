const API_BASE = '/api';

async function fetchStocks() {
    const grid = document.getElementById('stock-grid');

    try {
        const response = await fetch(`${API_BASE}/stocks`);
        const data = await response.json();

        renderStocks(data.stocks);
    } catch (error) {
        console.error('Error fetching stocks:', error);
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-400">
                <i class="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
                <p>Failed to load market data. Please try again.</p>
            </div>
        `;
    }
}

function renderStocks(stocks) {
    const grid = document.getElementById('stock-grid');
    grid.innerHTML = ''; // Clear loading state

    stocks.forEach(stock => {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl p-6 border border-gray-700 stock-card cursor-pointer';
        card.onclick = () => showDetail(stock);

        // Determine color based on signal
        let signalColor = 'text-gray-400';
        let signalBg = 'bg-gray-700';
        let arrow = ''; // No arrow for HOLD

        if (stock.signal.action === 'BUY') {
            signalColor = 'text-green-400';
            signalBg = 'bg-green-900/30';
            arrow = '<i class="fa-solid fa-arrow-trend-up mr-1"></i>';
        } else if (stock.signal.action === 'SELL') {
            signalColor = 'text-red-400';
            signalBg = 'bg-red-900/30';
            arrow = '<i class="fa-solid fa-arrow-trend-down mr-1"></i>';
        }

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-bold text-lg">${stock.symbol.replace('.NS', '')}</h3>
                    <span class="text-xs text-gray-400">NSE</span>
                </div>
                <div class="px-3 py-1 rounded-full text-xs font-bold ${signalColor} ${signalBg}">
                    ${arrow}${stock.signal.action}
                </div>
            </div>
            
            <div class="flex justify-between items-end mb-4">
                <span class="text-2xl font-mono text-white">₹${stock.current_price}</span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-700">
                <div>
                    <span class="block mb-1">RSI</span>
                    <span class="font-mono text-white">${stock.rsi}</span>
                </div>
                <div class="text-right">
                    <span class="block mb-1">Confidence</span>
                    <span class="font-mono text-white">${(stock.signal.confidence * 100).toFixed(0)}%</span>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}


let stockChart = null;
let currentSymbol = null;

function showDetail(stock) {
    const modal = document.getElementById('detail-view');
    currentSymbol = stock.symbol; // Store for updates

    // Set Interval Dropdown to default 15m or keep previous? 
    // Let's reset to 15m on new stock open
    document.getElementById('chart-interval').value = "15m";
    document.getElementById('chart-type').value = "candlestick";

    updateModalContent(stock);

    // Render Chart
    renderChart(stock);

    // Show Modal
    modal.classList.remove('hidden');
}


// Recommendations Logic
async function fetchRecommendations() {
    const grid = document.getElementById('recommendations-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE}/recommendations`);
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();

        if (data.stocks.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-gray-500 text-sm italic">No strong buy signals for tomorrow found.</div>';
            return;
        }

        grid.innerHTML = '';
        data.stocks.forEach(stock => {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 rounded-lg p-4 border border-gray-700 hover:bg-gray-750 cursor-pointer transition';
            card.onclick = () => showDetail(stock);

            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-blue-400">${stock.symbol.replace('.NS', '')}</h4>
                    <span class="text-green-400 text-xs font-bold uppercase">${stock.signal.action}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-white">₹${stock.current_price}</span>
                    <span class="text-gray-400">Target: ₹${stock.target_price}</span>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading recommendations:", error);
        grid.innerHTML = '<div class="col-span-full text-red-400 text-sm">Failed to load recommendations.</div>';
    }
}

function updateModalContent(stock) {
    // Populate Modal Data
    document.getElementById('detail-symbol').textContent = stock.symbol.replace('.NS', '');
    document.getElementById('detail-price').textContent = `₹${stock.current_price}`;

    // Signal Badge
    const badge = document.getElementById('detail-signal-badge');
    badge.textContent = stock.signal.action;
    badge.className = 'px-4 py-2 rounded-lg font-bold ' +
        (stock.signal.action === 'BUY' ? 'bg-green-600 text-white' :
            stock.signal.action === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white');

    // Targets
    document.getElementById('detail-target').textContent = stock.target_price || '--';
    document.getElementById('detail-entry').textContent = stock.entry_price || '--';
    document.getElementById('detail-sl').textContent = stock.stop_loss || '--';

    // Reasons
    const reasonsList = document.getElementById('detail-reasons');
    reasonsList.innerHTML = stock.signal.reason.split(',').map(r => `<li>${r.trim()}</li>`).join('') || '<li>No specific signal generated</li>';

    // Indicators
    document.getElementById('detail-rsi').textContent = stock.rsi;
    document.getElementById('detail-macd').textContent = stock.macd;
    document.getElementById('detail-trend').textContent = stock.trend;

    // News
    const newsContainer = document.getElementById('detail-news');
    if (stock.news && stock.news.length > 0) {
        newsContainer.innerHTML = stock.news.map(n => `
            <a href="${n.link}" target="_blank" class="block bg-gray-700/50 p-3 rounded hover:bg-gray-700 transition">
                <h4 class="text-blue-400 font-semibold text-sm mb-1">${n.title}</h4>
                <div class="flex justify-between text-xs text-gray-500">
                    <span>${n.publisher}</span>
                    <i class="fa-solid fa-external-link-alt"></i>
                </div>
            </a>
        `).join('');
    } else {
        newsContainer.innerHTML = '<p class="text-gray-400 text-sm italic">No recent news found.</p>';
    }
}

async function updateChart() {
    const interval = document.getElementById('chart-interval').value;
    // const chartType is handled in renderChart or we just re-fetch data if needed?
    // Changing chart type doesn't need new data, but changing interval does.
    // Ideally we separate data fetch from rendering, but simple approach: fetch again.

    if (!currentSymbol) return;

    try {
        // Show loading state on chart?

        const response = await fetch(`${API_BASE}/stocks/${currentSymbol}?interval=${interval}`);
        if (!response.ok) throw new Error('Failed to update chart');

        const stock = await response.json();
        renderChart(stock); // Re-render with new data
        updateModalContent(stock); // Update price/indicators for new interval?
        // Note: Indicators might change with interval!

    } catch (error) {
        console.error("Error updating chart:", error);
    }
}

function renderChart(stock) {
    const chartType = document.getElementById('chart-type').value || 'candlestick';

    // Prepare Data for ApexCharts
    // Candlestick expects: [timestamp, open, high, low, close]
    // Line/Area expects: [timestamp, close]

    const serieData = stock.history.map(h => {
        // Parse time to timestamp
        // Format from API: "HH:MM" (today) or "YYYY-MM-DD HH:MM"
        // ApexCharts needs timestamp or full date string
        let timeStr = h.time;
        if (timeStr.length === 5) {
            // Append today's date if it's just HH:MM
            const today = new Date().toISOString().split('T')[0];
            timeStr = `${today}T${timeStr}:00`;
        }

        const timestamp = new Date(timeStr).getTime();

        if (chartType === 'candlestick') {
            return {
                x: timestamp,
                y: [h.open, h.high, h.low, h.close]
            };
        } else {
            return {
                x: timestamp,
                y: h.close
            };
        }
    });

    const options = {
        series: [{
            data: serieData,
            name: 'Price'
        }],
        chart: {
            type: chartType, // 'candlestick' or 'area'
            height: 350,
            background: 'transparent',
            toolbar: {
                show: false
            }
        },
        theme: {
            mode: 'dark'
        },
        xaxis: {
            type: 'datetime',
            tooltip: {
                enabled: false
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            tooltip: {
                enabled: true
            },
            opposite: true
        },
        grid: {
            borderColor: '#334155',
            strokeDashArray: 4,
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#4ade80',
                    downward: '#f87171'
                }
            }
        },
        stroke: {
            width: 2,
            colors: ['#3b82f6'] // Blue for line chart
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100]
            }
        },
        dataLabels: {
            enabled: false
        }
    };

    if (stockChart) {
        stockChart.destroy();
    }

    stockChart = new ApexCharts(document.querySelector("#stockChart"), options);
    stockChart.render();
}


function closeDetail() {
    document.getElementById('detail-view').classList.add('hidden');
    currentSymbol = null;
}

// Search Logic
async function executeSearch() {
    const input = document.getElementById('stock-search');
    let symbol = input.value.trim().toUpperCase();

    if (!symbol) return;

    // Show simple loading or just wait
    input.disabled = true;
    input.classList.add('opacity-50');

    try {
        // Default interval 15m
        const response = await fetch(`${API_BASE}/stocks/${symbol}?interval=15m`);
        if (!response.ok) {
            throw new Error('Stock not found');
        }
        const stock = await response.json();
        showDetail(stock);
    } catch (error) {
        alert(`Error: ${error.message}. Please check the symbol and try again.`);
    } finally {
        input.disabled = false;
        input.classList.remove('opacity-50');
        input.value = '';
    }
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        executeSearch();
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    fetchStocks();
    fetchRecommendations();
});
