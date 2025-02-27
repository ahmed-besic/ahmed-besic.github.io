document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_URL = 'https://api.coingecko.com/api/v3';
    const BACKUP_API_URL = 'https://api.coingecko.com/api/v3'; // Same for now, but could be different in the future
    const REFRESH_INTERVAL = 300000; // 5 minutes
    let COINS_PER_PAGE = 15;
    const CACHE_DURATION = 3600000; // Cache data for 1 hour
    const MAX_RETRIES = 2; // Maximum number of retry attempts
    const RETRY_DELAY = 2000; // Initial delay before retry in milliseconds
    
    // Add Vine token configuration
    const VINE_TOKEN_ID = 'vine';
    const PINNED_TOKENS = [VINE_TOKEN_ID]; // Array of tokens to pin at the top

    // Cache objects
    const cache = {
        marketData: { data: null, timestamp: 0 },
        coinDetails: {}, // Will store individual coin details
        priceHistory: {} // Will store price history data
    };
    
    // State management
    let cryptoData = [];
    let favorites = loadFavorites();
    let portfolio = loadPortfolio();
    let currentPage = 1;
    let selectedCrypto = null;
    let currentSortMethod = 'rank';
    let priceChart = null;
    let chartPeriod = '24h';
    let refreshTimer = null;
    let isLoadingData = false;
    
    // Elements
    const cryptoSearch = document.getElementById('cryptoSearch');
    const sortMethodSelect = document.getElementById('sortMethod');
    const refreshButton = document.getElementById('refreshButton');
    const showFavoritesOnlyCheckbox = document.getElementById('showFavoritesOnly');
    const cryptoListBody = document.getElementById('cryptoListBody');
    const lastUpdatedSpan = document.getElementById('lastUpdated');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const pageIndicator = document.getElementById('pageIndicator');
    const cryptoDetail = document.getElementById('cryptoDetail');
    const chartContainer = document.getElementById('priceChart').getContext('2d');
    const portfolioValueElement = document.getElementById('portfolioValue');
    const portfolioChangeElement = document.getElementById('portfolioChange');
    const portfolioHoldingsElement = document.getElementById('portfolioHoldings');
    const portfolioListElement = document.getElementById('portfolioList');
    const exportPortfolioButton = document.getElementById('exportPortfolio');
    const clearPortfolioButton = document.getElementById('clearPortfolio');
    const addHoldingModal = document.getElementById('addHoldingModal');
    const closeModalSpan = document.querySelector('.close-modal');
    const holdingCryptoInput = document.getElementById('holdingCrypto');
    const holdingQuantityInput = document.getElementById('holdingQuantity');
    const holdingPurchasePriceInput = document.getElementById('holdingPurchasePrice');
    const addHoldingButton = document.getElementById('addHoldingButton');
    const chartPeriodButtons = document.querySelectorAll('.chart-period');
    
    // Initialize
    initializeApp();
    
    function initializeApp() {
        // Set up event listeners
        cryptoSearch.addEventListener('input', filterAndDisplayCryptos);
        sortMethodSelect.addEventListener('change', handleSortMethodChange);
        refreshButton.addEventListener('click', () => loadCryptoData(true));
        showFavoritesOnlyCheckbox.addEventListener('change', filterAndDisplayCryptos);
        prevPageButton.addEventListener('click', () => changePage(-1));
        nextPageButton.addEventListener('click', () => changePage(1));
        exportPortfolioButton.addEventListener('click', exportPortfolio);
        clearPortfolioButton.addEventListener('click', clearPortfolio);
        closeModalSpan.addEventListener('click', closeModal);
        addHoldingButton.addEventListener('click', addHolding);
        
        // Chart period buttons
        chartPeriodButtons.forEach(button => {
            button.addEventListener('click', () => {
                chartPeriodButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                chartPeriod = button.getAttribute('data-period');
                if (selectedCrypto) {
                    loadPriceHistory(selectedCrypto.id);
                }
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === addHoldingModal) {
                closeModal();
            }
        });
        
        // Load data
        loadCryptoData();
        
        // Set up refresh timer - increased interval to avoid rate limits
        refreshTimer = setInterval(() => loadCryptoData(), REFRESH_INTERVAL);
        
        // Add notification about API limitations with more details
        const cryptoDashboard = document.querySelector('.crypto-dashboard');
        const apiNotice = document.createElement('div');
        apiNotice.className = 'api-notice';
        apiNotice.innerHTML = `
            <p>⚠️ This tracker uses the free CoinGecko API which has rate limits (10-50 calls/minute). 
            If you encounter errors, we'll use cached data when possible and retry automatically.</p>
        `;
        cryptoDashboard.insertAdjacentElement('afterbegin', apiNotice);
        
        // Mobile optimizations
        if (window.innerWidth <= 768) {
            // Set a smaller page size for mobile
            COINS_PER_PAGE = 10;
            
            // Add touch feedback for list items
            document.addEventListener('click', function(e) {
                if (e.target.closest('.crypto-list-item')) {
                    const item = e.target.closest('.crypto-list-item');
                    item.classList.add('tapped');
                    setTimeout(() => item.classList.remove('tapped'), 300);
                }
            });
        }
    }
    
    // Helper function to perform fetch with retry logic
    async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES, delay = RETRY_DELAY) {
        try {
            const response = await fetch(url, options);
            
            // Handle rate limiting (429) with special retry logic
            if (response.status === 429) {
                if (retries > 0) {
                    console.log(`Rate limited, retrying in ${delay/1000}s...`, retries, 'retries left');
                    // Show user feedback about retrying
                    const retryMessage = document.createElement('div');
                    retryMessage.className = 'retry-message';
                    retryMessage.innerHTML = `API rate limit reached. Retrying in ${delay/1000}s... (${retries} attempts left)`;
                    
                    // Append to appropriate container based on current context
                    if (url.includes('/market_chart')) {
                        document.getElementById('noChartData').innerHTML = retryMessage.outerHTML;
                    } else if (url.includes('coins/') && !url.includes('/market_chart')) {
                        cryptoDetail.innerHTML = retryMessage.outerHTML;
                    } else {
                        // Main data fetch
                        if (cryptoListBody) {
                            cryptoListBody.appendChild(retryMessage);
                        }
                    }
                    
                    // Wait and then retry with increased delay (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
                } else {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
            }
            
            // For other errors, just return the response to handle elsewhere
            return response;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                // This is likely a network error
                if (retries > 0) {
                    console.log(`Network error, retrying in ${delay/1000}s...`, retries, 'retries left');
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Try alternate API URL if this is the last retry and we're using the primary URL
                    const newUrl = (retries === 1 && url.startsWith(API_URL)) 
                        ? url.replace(API_URL, BACKUP_API_URL)
                        : url;
                    
                    return fetchWithRetry(newUrl, options, retries - 1, delay * 2);
                }
            }
            
            // Format network errors to be more user-friendly
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Unable to connect to the API. Check your internet connection.');
            }
            
            throw error;
        }
    }

    // Data loading functions
    async function loadCryptoData(forceRefresh = false) {
        if (isLoadingData) return;
        
        try {
            // Check if we have cached data that's still valid
            const now = Date.now();
            if (!forceRefresh && cache.marketData.data && (now - cache.marketData.timestamp) < CACHE_DURATION) {
                console.log('Using cached market data');
                cryptoData = [...cache.marketData.data];
                updateLastUpdated(new Date(cache.marketData.timestamp));
                filterAndDisplayCryptos();
                updatePortfolioValues();
                return;
            }
            
            isLoadingData = true;
            cryptoListBody.innerHTML = '<div class="loading-spinner">Loading cryptocurrency data...</div>';
            
            const response = await fetchWithRetry(`${API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`);
            
            // Check for rate limit status
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. CoinGecko API allows only a limited number of requests per minute. Please wait a moment and try again.');
            }
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Check if Vine token is in the data, and add it if not
            let vineTokenData = data.find(coin => coin.id === VINE_TOKEN_ID);
            
            if (!vineTokenData) {
                try {
                    // Fetch Vine token specifically
                    const vineResponse = await fetchWithRetry(`${API_URL}/coins/${VINE_TOKEN_ID}/market_chart?vs_currency=usd&days=1`);
                    if (vineResponse.ok) {
                        // Now fetch the coin details for Vine
                        const vineCoinResponse = await fetchWithRetry(`${API_URL}/coins/${VINE_TOKEN_ID}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
                        if (vineCoinResponse.ok) {
                            const vineCoin = await vineCoinResponse.json();
                            
                            // Create a compatible data structure for Vine token
                            vineTokenData = {
                                id: VINE_TOKEN_ID,
                                symbol: vineCoin.symbol || 'vine',
                                name: vineCoin.name || 'Vine',
                                image: vineCoin.image?.small || './images/vine-placeholder.png',
                                current_price: vineCoin.market_data?.current_price?.usd || 0,
                                market_cap: vineCoin.market_data?.market_cap?.usd || 0,
                                total_volume: vineCoin.market_data?.total_volume?.usd || 0,
                                price_change_percentage_24h: vineCoin.market_data?.price_change_percentage_24h || 0,
                                rank: 0, // Will be updated below
                                isPinned: true // Special flag for pinned tokens
                            };
                            
                            // Add Vine to the data
                            data.unshift(vineTokenData);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching Vine token data:', error);
                    // Create a placeholder for Vine if we couldn't fetch it
                    vineTokenData = {
                        id: VINE_TOKEN_ID,
                        symbol: 'vine',
                        name: 'Vine',
                        image: './images/vine-placeholder.png',
                        current_price: 0,
                        market_cap: 0,
                        total_volume: 0,
                        price_change_percentage_24h: 0,
                        rank: 0,
                        isPinned: true
                    };
                    data.unshift(vineTokenData);
                }
            } else {
                // Mark Vine token as pinned
                vineTokenData.isPinned = true;
            }
            
            // Update the data with favorite status
            const processedData = data.map((coin, index) => ({
                ...coin,
                rank: index + 1,
                isFavorite: favorites.includes(coin.id),
                isPinned: PINNED_TOKENS.includes(coin.id) || coin.isPinned
            }));
            
            // Cache the data
            cache.marketData.data = [...processedData];
            cache.marketData.timestamp = now;
            
            cryptoData = [...processedData];
            
            updateLastUpdated();
            filterAndDisplayCryptos();
            updatePortfolioValues();
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            
            // Display a more helpful error message
            let errorMessage = 'Failed to load cryptocurrency data.';
            
            if (error.message.includes('Rate limit')) {
                errorMessage = error.message;
            } else if (error.message.includes('Network error')) {
                errorMessage = error.message;
            } else if (error.message.includes('API request failed')) {
                errorMessage = error.message;
            }
            
            cryptoListBody.innerHTML = `<div class="error-message">
                ${errorMessage} 
                <button id="retryButton" class="retry-btn">Retry</button>
                <p class="error-details">Technical details: ${error.message}</p>
            </div>`;
            
            // Add event listener for retry button
            document.getElementById('retryButton').addEventListener('click', () => loadCryptoData(true));
            
            // If we have cached data, use it as fallback
            if (cache.marketData.data) {
                console.log('Using cached data as fallback');
                setTimeout(() => {
                    cryptoData = [...cache.marketData.data];
                    updateLastUpdated(new Date(cache.marketData.timestamp));
                    cryptoListBody.innerHTML += '<div class="info-message">Showing cached data from last successful request.</div>';
                    filterAndDisplayCryptos();
                    updatePortfolioValues();
                }, 2000); // Short delay to ensure error is visible
            }
        } finally {
            isLoadingData = false;
        }
    }
    
    async function loadCoinDetails(coinId) {
        try {
            cryptoDetail.innerHTML = '<div class="loading-spinner">Loading details...</div>';
            
            // Check if we have cached data that's still valid
            const now = Date.now();
            if (cache.coinDetails[coinId] && (now - cache.coinDetails[coinId].timestamp) < CACHE_DURATION) {
                console.log('Using cached coin details for', coinId);
                displayCoinDetails(cache.coinDetails[coinId].data);
                return;
            }
            
            const response = await fetchWithRetry(`${API_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
            
            if (!response.ok) {
                // Handle all HTTP error codes
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                } else if (response.status === 404) {
                    throw new Error('Cryptocurrency details not found. The coin may have been delisted.');
                } else {
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            // Cache the data
            cache.coinDetails[coinId] = {
                data: data,
                timestamp: now
            };
            
            displayCoinDetails(data);
        } catch (error) {
            console.error('Error fetching coin details:', error);
            
            let errorMessage = 'Failed to load cryptocurrency details.';
            
            if (error.message.includes('Rate limit')) {
                errorMessage = error.message;
            } else if (error.message.includes('Network error')) {
                errorMessage = error.message;
            } else if (error.message.includes('API request failed')) {
                errorMessage = error.message;
            }
            
            cryptoDetail.innerHTML = `<div class="error-message">
                ${errorMessage}
                <button class="retry-coin-btn" data-coin="${coinId}">Retry</button>
                <p class="error-details">Technical details: ${error.message}</p>
            </div>`;
            
            // Add event listener for retry button
            document.querySelector('.retry-coin-btn').addEventListener('click', function() {
                const coinToRetry = this.getAttribute('data-coin');
                loadCoinDetails(coinToRetry);
            });
            
            // If we have cached data, use it as fallback
            if (cache.coinDetails[coinId]) {
                setTimeout(() => {
                    displayCoinDetails(cache.coinDetails[coinId].data);
                    cryptoDetail.innerHTML += '<div class="info-message">Showing cached data from last successful request.</div>';
                }, 2000); // Short delay to ensure error is visible
            }
        }
    }
    
    async function loadPriceHistory(coinId) {
        try {
            document.getElementById('noChartData').style.display = 'block';
            document.getElementById('noChartData').textContent = 'Loading price data...';
            
            let days;
            switch(chartPeriod) {
                case '24h': days = 1; break;
                case '7d': days = 7; break;
                case '30d': days = 30; break;
                case '90d': days = 90; break;
                case '1y': days = 365; break;
                default: days = 1;
            }
            
            // Try to simplify the request if we keep getting rate limited
            const interval = days > 90 ? 'daily' : days > 7 ? 'hourly' : '';
            const intervalParam = interval ? `&interval=${interval}` : '';
            
            // Create a cache key combining coinId and period
            const cacheKey = `${coinId}_${days}`;
            
            // Check if we have cached data that's still valid
            const now = Date.now();
            if (cache.priceHistory[cacheKey] && (now - cache.priceHistory[cacheKey].timestamp) < CACHE_DURATION) {
                console.log('Using cached price history for', cacheKey);
                document.getElementById('noChartData').style.display = 'none';
                createPriceChart(cache.priceHistory[cacheKey].data, chartPeriod);
                return;
            }
            
            const url = `${API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}${intervalParam}`;
            console.log('Fetching price history:', url);
            
            const response = await fetchWithRetry(url);
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                } else if (response.status === 404) {
                    throw new Error('Price history not available for this cryptocurrency.');
                } else {
                    throw new Error(`Price history request failed with status ${response.status}: ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            if (!data.prices || data.prices.length === 0) {
                throw new Error('No price data available for this time period.');
            }
            
            // Cache the price data
            cache.priceHistory[cacheKey] = {
                data: data.prices,
                timestamp: now
            };
            
            document.getElementById('noChartData').style.display = 'none';
            createPriceChart(data.prices, chartPeriod);
        } catch (error) {
            console.error('Error fetching price history:', error);
            document.getElementById('noChartData').style.display = 'block';
            
            let errorMessage = 'Failed to load price data: ' + error.message;
            
            // Simplify the message for common errors
            if (error.message.includes('Rate limit')) {
                errorMessage = error.message;
            } else if (error.message.includes('Network error')) {
                errorMessage = error.message;
            }
            
            document.getElementById('noChartData').innerHTML = `
                ${errorMessage}
                <button class="retry-chart-btn" data-coin="${coinId}">Retry</button>
            `;
            
            // Add event listener for retry button
            document.querySelector('.retry-chart-btn').addEventListener('click', function() {
                const coinToRetry = this.getAttribute('data-coin');
                loadPriceHistory(coinToRetry);
            });
            
            // If we have cached data, use it as fallback
            const cacheKey = `${coinId}_${days}`;
            if (cache.priceHistory[cacheKey]) {
                setTimeout(() => {
                    document.getElementById('noChartData').style.display = 'none';
                    createPriceChart(cache.priceHistory[cacheKey].data, chartPeriod);
                    
                    // Add a small info message about cached data
                    const chartContainer = document.querySelector('.chart-container');
                    const infoMessage = document.createElement('div');
                    infoMessage.className = 'info-message';
                    infoMessage.textContent = 'Showing cached price data';
                    infoMessage.style.marginTop = '10px';
                    chartContainer.insertAdjacentElement('afterend', infoMessage);
                }, 2000); // Short delay to ensure error is visible
            }
        }
    }
    
    // Display functions
    function filterAndDisplayCryptos() {
        const searchTerm = cryptoSearch.value.toLowerCase();
        const showFavoritesOnly = showFavoritesOnlyCheckbox.checked;
        
        let filtered = [...cryptoData];
        
        // Apply filters
        if (searchTerm) {
            filtered = filtered.filter(coin => 
                coin.name.toLowerCase().includes(searchTerm) || 
                coin.symbol.toLowerCase().includes(searchTerm)
            );
        }
        
        if (showFavoritesOnly) {
            filtered = filtered.filter(coin => coin.isFavorite);
        }
        
        // Sort data
        sortCryptoData(filtered);
        
        // Update pagination
        const totalPages = Math.ceil(filtered.length / COINS_PER_PAGE);
        if (currentPage > totalPages) {
            currentPage = 1;
        }
        
        const startIndex = (currentPage - 1) * COINS_PER_PAGE;
        const paginatedData = filtered.slice(startIndex, startIndex + COINS_PER_PAGE);
        
        displayCryptoList(paginatedData);
        updatePagination(filtered.length);
    }
    
    // Enhance the displayCryptoList function to highlight pinned tokens
    function displayCryptoList(cryptos) {
        if (cryptos.length === 0) {
            cryptoListBody.innerHTML = '<div class="no-data-message">No cryptocurrencies found matching your criteria</div>';
            return;
        }
        
        cryptoListBody.innerHTML = '';
        
        cryptos.forEach(coin => {
            const priceChange = coin.price_change_percentage_24h || 0;
            const isPriceUp = priceChange >= 0;
            
            // For mobile, make the price formatting more compact
            const priceDisplay = window.innerWidth <= 480 && coin.current_price < 1 
                ? formatCompactNumber(coin.current_price)
                : formatNumber(coin.current_price);
            
            const listItem = document.createElement('div');
            listItem.className = 'crypto-list-item';
            
            // Add special class for pinned tokens
            if (coin.isPinned) {
                listItem.classList.add('pinned-token');
            }
            
            listItem.innerHTML = `
                ${coin.isPinned ? '<div class="pinned-badge">★</div>' : ''}
                <div class="crypto-rank">${coin.rank}</div>
                <div class="crypto-name">
                    <img src="${coin.image}" alt="${coin.name}" class="crypto-icon" onerror="this.src='https://via.placeholder.com/30?text=${coin.symbol.charAt(0).toUpperCase()}'">
                    <div>
                        <div class="coin-name">${coin.name}</div>
                        <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                    </div>
                </div>
                <div class="crypto-price">$${priceDisplay}</div>
                <div class="crypto-change ${isPriceUp ? 'positive' : 'negative'}">
                    ${isPriceUp ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(2)}%
                </div>
                <div class="crypto-market-cap">$${formatMarketCap(coin.market_cap)}</div>
                <div class="crypto-volume">$${formatMarketCap(coin.total_volume)}</div>
                <div class="crypto-actions">
                    <button class="action-btn favorite-btn ${coin.isFavorite ? 'active' : ''}" title="Add to favorites">
                        ★
                    </button>
                    <button class="action-btn portfolio-btn" title="Add to portfolio">
                        +
                    </button>
                </div>
            `;
            
            // Add event listener for row click
            listItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    selectedCrypto = coin;
                    loadCoinDetails(coin.id);
                    loadPriceHistory(coin.id);
                }
            });
            
            // Add event listener for favorite button
            const favoriteBtn = listItem.querySelector('.favorite-btn');
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(coin.id);
            });
            
            // Add event listener for portfolio button
            const portfolioBtn = listItem.querySelector('.portfolio-btn');
            portfolioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openAddHoldingModal(coin);
            });
            
            cryptoListBody.appendChild(listItem);
        });
    }
    
    function displayCoinDetails(coin) {
        // Build description HTML, limiting to 300 characters with "Read more" link
        let description = coin.description.en || 'No description available.';
        const shortDescription = description.length > 300 
            ? description.substring(0, 300) + '...'
            : description;
        
        cryptoDetail.innerHTML = `
            <div class="crypto-detail-header">
                <img src="${coin.image.large}" alt="${coin.name}" class="crypto-detail-icon">
                <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>
            </div>
            
            <div class="crypto-detail-price">
                <span class="current-price">$${formatNumber(coin.market_data.current_price.usd)}</span>
                <span class="price-change ${coin.market_data.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                    ${coin.market_data.price_change_percentage_24h >= 0 ? '↑' : '↓'} 
                    ${Math.abs(coin.market_data.price_change_percentage_24h || 0).toFixed(2)}% (24h)
                </span>
            </div>
            
            <div class="crypto-stats">
                <div class="stat-item">
                    <div class="stat-title">Market Cap</div>
                    <div class="stat-value">$${formatMarketCap(coin.market_data.market_cap.usd)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-title">24h Volume</div>
                    <div class="stat-value">$${formatMarketCap(coin.market_data.total_volume.usd)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-title">Circulating Supply</div>
                    <div class="stat-value">${formatNumber(coin.market_data.circulating_supply)} ${coin.symbol.toUpperCase()}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-title">Max Supply</div>
                    <div class="stat-value">${coin.market_data.max_supply ? formatNumber(coin.market_data.max_supply) + ' ' + coin.symbol.toUpperCase() : 'Unlimited'}</div>
                </div>
            </div>
            
            <div class="crypto-price-range">
                <div class="range-title">24h Range</div>
                <div class="range-bar">
                    <div class="range-low">$${formatNumber(coin.market_data.low_24h.usd)}</div>
                    <div class="range-high">$${formatNumber(coin.market_data.high_24h.usd)}</div>
                </div>
            </div>
            
            <div class="crypto-description">
                <h3>About ${coin.name}</h3>
                <div class="description-text">${shortDescription}</div>
                <a href="${coin.links.homepage[0]}" target="_blank" rel="noopener noreferrer" class="crypto-link">Official Website</a>
                ${coin.links.blockchain_site[0] ? `<a href="${coin.links.blockchain_site[0]}" target="_blank" rel="noopener noreferrer" class="crypto-link">Blockchain Explorer</a>` : ''}
            </div>
        `;
    }
    
    function createPriceChart(priceData, period) {
        // Ensure we have the chart container
        const chartCanvas = document.getElementById('priceChart');
        if (!chartCanvas) {
            console.error('Chart canvas element not found');
            return;
        }
        
        // Get the context safely
        let chartContainer;
        try {
            chartContainer = chartCanvas.getContext('2d');
        } catch (error) {
            console.error('Failed to get chart context:', error);
            return;
        }
        
        // Ensure we have the selected crypto
        if (!selectedCrypto) {
            console.error('No cryptocurrency selected for chart');
            return;
        }
        
        // Prepare data for chart
        const labels = [];
        const prices = [];
        
        priceData.forEach(dataPoint => {
            const date = new Date(dataPoint[0]);
            let label;
            
            // Format time based on period
            if (period === '24h') {
                label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (period === '7d') {
                label = `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                label = date.toLocaleDateString();
            }
            
            labels.push(label);
            prices.push(dataPoint[1]);
        });
        
        // Destroy existing chart if it exists
        if (priceChart) {
            priceChart.destroy();
        }
        
        // Create new chart
        try {
            priceChart = new Chart(chartContainer, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Price (USD)`,
                        data: prices,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${selectedCrypto.name || 'Cryptocurrency'} Price Chart (${period})`,
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `Price: $${context.raw.toFixed(2)}`;
                                }
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxTicksLimit: 8,
                                maxRotation: 0
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    }
                }
            });
        } catch (error) {
            console.error('Failed to create chart:', error);
            document.getElementById('noChartData').style.display = 'block';
            document.getElementById('noChartData').textContent = 'Failed to create chart: ' + error.message;
        }
    }
    
    function updatePortfolioDisplay() {
        if (Object.keys(portfolio).length === 0) {
            portfolioListElement.innerHTML = '<p class="no-data-message">Your portfolio is empty. Add cryptocurrencies from the list above.</p>';
            return;
        }
        
        portfolioListElement.innerHTML = '';
        
        Object.keys(portfolio).forEach(coinId => {
            const holding = portfolio[coinId];
            const coin = cryptoData.find(c => c.id === coinId);
            
            if (!coin) return; // Skip if coin data not available
            
            const currentValue = holding.quantity * coin.current_price;
            const initialValue = holding.quantity * holding.purchasePrice;
            const profitLoss = currentValue - initialValue;
            const profitLossPercentage = (profitLoss / initialValue) * 100;
            const isProfitable = profitLoss >= 0;
            
            const holdingItem = document.createElement('div');
            holdingItem.className = 'portfolio-item';
            holdingItem.innerHTML = `
                <div class="portfolio-item-info">
                    <img src="${coin.image}" alt="${coin.name}" class="crypto-icon">
                    <div>
                        <div class="portfolio-item-name">${coin.name}</div>
                        <div class="portfolio-item-quantity">${holding.quantity} ${coin.symbol.toUpperCase()}</div>
                    </div>
                </div>
                <div class="portfolio-item-value">
                    <div class="current-value">$${formatNumber(currentValue)}</div>
                    <div class="profit-loss ${isProfitable ? 'positive' : 'negative'}">
                        ${isProfitable ? '+' : ''}$${formatNumber(profitLoss)} (${profitLossPercentage.toFixed(2)}%)
                    </div>
                </div>
                <div class="portfolio-item-actions">
                    <button class="action-btn remove-btn" title="Remove from portfolio">×</button>
                </div>
            `;
            
            // Add event listener for remove button
            const removeBtn = holdingItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                removeFromPortfolio(coinId);
            });
            
            portfolioListElement.appendChild(holdingItem);
        });
    }
    
    function updatePortfolioValues() {
        if (Object.keys(portfolio).length === 0 || cryptoData.length === 0) {
            portfolioValueElement.textContent = '$0.00';
            portfolioChangeElement.textContent = '0.00%';
            portfolioChangeElement.className = '';
            portfolioHoldingsElement.textContent = '0';
            updatePortfolioDisplay();
            return;
        }
        
        let totalValue = 0;
        let totalPrevValue = 0;
        let holdingsCount = 0;
        
        Object.keys(portfolio).forEach(coinId => {
            const holding = portfolio[coinId];
            const coin = cryptoData.find(c => c.id === coinId);
            
            if (coin) {
                const currentValue = holding.quantity * coin.current_price;
                const prevDayPrice = coin.current_price / (1 + (coin.price_change_percentage_24h / 100));
                const prevDayValue = holding.quantity * prevDayPrice;
                
                totalValue += currentValue;
                totalPrevValue += prevDayValue;
                holdingsCount++;
            }
        });
        
        // Calculate 24h change percentage
        const changeValue = totalValue - totalPrevValue;
        const changePercentage = (totalPrevValue > 0) ? (changeValue / totalPrevValue) * 100 : 0;
        const isPositiveChange = changePercentage >= 0;
        
        // Update UI
        portfolioValueElement.textContent = formatCurrency(totalValue);
        portfolioChangeElement.textContent = `${isPositiveChange ? '+' : ''}${changePercentage.toFixed(2)}%`;
        portfolioChangeElement.className = isPositiveChange ? 'positive' : 'negative';
        portfolioHoldingsElement.textContent = holdingsCount.toString();
        
        // Update portfolio display
        updatePortfolioDisplay();
    }
    
    // Portfolio management functions
    function openAddHoldingModal(coin) {
        holdingCryptoInput.value = coin.name;
        holdingQuantityInput.value = '';
        holdingPurchasePriceInput.value = coin.current_price;
        
        // Store selected crypto for later reference
        selectedCrypto = coin;
        
        // Show modal
        addHoldingModal.style.display = 'block';
    }
    
    function closeModal() {
        addHoldingModal.style.display = 'none';
    }
    
    function addHolding() {
        if (!selectedCrypto) return;
        
        const quantity = parseFloat(holdingQuantityInput.value);
        const purchasePrice = parseFloat(holdingPurchasePriceInput.value);
        
        if (isNaN(quantity) || quantity <= 0 || isNaN(purchasePrice) || purchasePrice <= 0) {
            alert('Please enter valid quantity and purchase price');
            return;
        }
        
        // Add to portfolio
        portfolio[selectedCrypto.id] = {
            quantity: quantity,
            purchasePrice: purchasePrice,
            dateAdded: new Date().toISOString()
        };
        
        // Save portfolio
        savePortfolio(portfolio);
        
        // Update UI
        updatePortfolioValues();
        
        // Close modal
        closeModal();
    }
    
    function removeFromPortfolio(coinId) {
        if (confirm('Are you sure you want to remove this cryptocurrency from your portfolio?')) {
            delete portfolio[coinId];
            savePortfolio(portfolio);
            updatePortfolioValues();
        }
    }
    
    function clearPortfolio() {
        if (confirm('Are you sure you want to clear your entire portfolio? This cannot be undone.')) {
            portfolio = {};
            savePortfolio(portfolio);
            updatePortfolioValues();
        }
    }
    
    function exportPortfolio() {
        if (Object.keys(portfolio).length === 0) {
            alert('Your portfolio is empty');
            return;
        }
        
        // Create CSV content
        let csvContent = 'Cryptocurrency,Quantity,Purchase Price,Current Price,Current Value,Profit/Loss\n';
        
        Object.keys(portfolio).forEach(coinId => {
            const holding = portfolio[coinId];
            const coin = cryptoData.find(c => c.id === coinId);
            
            if (coin) {
                const currentValue = holding.quantity * coin.current_price;
                const initialValue = holding.quantity * holding.purchasePrice;
                const profitLoss = currentValue - initialValue;
                
                csvContent += `"${coin.name}",${holding.quantity},${holding.purchasePrice},${coin.current_price},${currentValue},${profitLoss}\n`;
            }
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `crypto-portfolio-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Favorites management
    function toggleFavorite(coinId) {
        const index = favorites.indexOf(coinId);
        if (index === -1) {
            favorites.push(coinId);
        } else {
            favorites.splice(index, 1);
        }
        
        // Update crypto data
        cryptoData.forEach(coin => {
            if (coin.id === coinId) {
                coin.isFavorite = !coin.isFavorite;
            }
        });
        
        // Save favorites
        saveFavorites(favorites);
        
        // Update display
        filterAndDisplayCryptos();
    }
    
    // Pagination functions
    function changePage(delta) {
        const searchTerm = cryptoSearch.value.toLowerCase();
        const showFavoritesOnly = showFavoritesOnlyCheckbox.checked;
        
        let filtered = [...cryptoData];
        
        if (searchTerm) {
            filtered = filtered.filter(coin => 
                coin.name.toLowerCase().includes(searchTerm) || 
                coin.symbol.toLowerCase().includes(searchTerm)
            );
        }
        
        if (showFavoritesOnly) {
            filtered = filtered.filter(coin => coin.isFavorite);
        }
        
        const totalPages = Math.ceil(filtered.length / COINS_PER_PAGE);
        
        currentPage += delta;
        
        // Ensure page is within valid range
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        
        filterAndDisplayCryptos();
    }
    
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / COINS_PER_PAGE);
        
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageButton.disabled = currentPage <= 1;
        nextPageButton.disabled = currentPage >= totalPages;
    }
    
    // Sorting function
    function handleSortMethodChange() {
        currentSortMethod = sortMethodSelect.value;
        filterAndDisplayCryptos();
    }
    
    // Modify sortCryptoData to keep pinned tokens at the top
    function sortCryptoData(data) {
        // First separate pinned and normal tokens
        const pinnedTokens = data.filter(coin => coin.isPinned);
        const normalTokens = data.filter(coin => !coin.isPinned);
        
        // Sort normal tokens according to selected method
        switch (currentSortMethod) {
            case 'rank':
                normalTokens.sort((a, b) => a.rank - b.rank);
                break;
            case 'name':
                normalTokens.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price':
                normalTokens.sort((a, b) => b.current_price - a.current_price);
                break;
            case 'change':
                normalTokens.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
                break;
            case 'volume':
                normalTokens.sort((a, b) => b.total_volume - a.total_volume);
                break;
            case 'market_cap':
                normalTokens.sort((a, b) => b.market_cap - a.market_cap);
                break;
            default:
                normalTokens.sort((a, b) => a.rank - b.rank);
        }
        
        // Put pinnedTokens at the top and sort them by name if there are multiple
        pinnedTokens.sort((a, b) => a.name.localeCompare(b.name));
        
        // Replace the original array with the combined sorted array
        data.length = 0;
        data.push(...pinnedTokens, ...normalTokens);
        
        return data;
    }
    
    // Storage functions
    function loadFavorites() {
        const savedFavorites = localStorage.getItem('cryptoFavorites');
        return savedFavorites ? JSON.parse(savedFavorites) : [];
    }
    
    function saveFavorites(favoritesArray) {
        localStorage.setItem('cryptoFavorites', JSON.stringify(favoritesArray));
    }
    
    function loadPortfolio() {
        const savedPortfolio = localStorage.getItem('cryptoPortfolio');
        return savedPortfolio ? JSON.parse(savedPortfolio) : {};
    }
    
    function savePortfolio(portfolioData) {
        localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolioData));
    }
    
    // Helper functions
    function updateLastUpdated(date = new Date()) {
        lastUpdatedSpan.textContent = date.toLocaleTimeString() + 
            (date.getTime() < Date.now() - 60000 ? ' (cached)' : '');
    }
    
    function formatNumber(value) {
        if (value === null || value === undefined) return '0.00';
        
        if (value < 1) {
            // For small values like 0.00001234, show more decimal places
            return value.toFixed(value < 0.0001 ? 8 : 6);
        }
        
        return value.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
    
    function formatCurrency(value) {
        return '$' + formatNumber(value);
    }
    
    function formatMarketCap(value) {
        if (value === null || value === undefined) return '0';
        
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(2) + 'B';
        } else if (value >= 1000000) {
            return (value / 1000000).toFixed(2) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(2) + 'K';
        }
        
        return value.toFixed(2);
    }
    
    // Add a helper function for compact number formatting on mobile
    function formatCompactNumber(value) {
        if (value === null || value === undefined) return '0.00';
        
        // For very small values in cryptocurrencies (common in certain coins)
        if (value < 0.0001) {
            return value.toExponential(2);
        } else if (value < 1) {
            return value.toPrecision(3);
        }
        
        return value.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
    
    // Cleanup when leaving the page
    window.addEventListener('beforeunload', () => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
    });
});