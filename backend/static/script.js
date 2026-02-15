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

function showDetail(stock) {
    const modal = document.getElementById('detail-view');

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

    // Show Modal
    modal.classList.remove('hidden');
}

function closeDetail() {
    document.getElementById('detail-view').classList.add('hidden');
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
        const response = await fetch(`${API_BASE}/stocks/${symbol}`);
        if (!response.ok) {
            throw new Error('Stock not found');
        }
        const stock = await response.json();
        showDetail(stock); // Reuse the same detail view
    } catch (error) {
        alert(`Error: ${error.message}. Please check the symbol and try again.`);
    } finally {
        input.disabled = false;
        input.classList.remove('opacity-50');
        input.value = ''; // Optional: clear input or keep it
    }
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        executeSearch();
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', fetchStocks);
