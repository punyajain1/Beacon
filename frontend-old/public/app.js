/**
 * FinPilot - Frontend Client Logic (Vanilla JS)
 */

// --- STATE MANAGEMENT ---
const state = {
  activeTab: 'dashboard',
  conversationId: null,
  assets: [],
  newsList: [],
  wsConnection: null,
  wsReconnectTimer: null,
  wsReconnectDelay: 2000,
  wsMaxReconnectDelay: 30000,
  isPortfolioLoaded: false,
  isWsConnected: false,
  seenArticleUrls: new Set(),
};

// Dismiss loading screen when both WebSocket and portfolio are synced
function checkLoadingStatus() {
  if (state.isPortfolioLoaded && state.isWsConnected) {
    const loader = document.getElementById('app-loading-screen');
    if (loader && !loader.classList.contains('fade-out')) {
      const statusText = document.getElementById('loading-status-text');
      if (statusText) statusText.textContent = 'Engines ready. Syncing interface...';

      setTimeout(() => {
        loader.classList.add('fade-out');
      }, 600);
    }
  }
}

// Fallback: dismiss loading screen after 6s even if backend is unreachable
setTimeout(() => {
  const loader = document.getElementById('app-loading-screen');
  if (loader && !loader.classList.contains('fade-out')) {
    const statusText = document.getElementById('loading-status-text');
    if (statusText) statusText.textContent = 'Backend offline. Running in read-only mode.';
    setTimeout(() => {
      loader.classList.add('fade-out');
    }, 800);
  }
}, 6000);


// --- DOM ELEMENTS ---
const elements = {
  // Navigation Tabs
  navTabs: document.querySelectorAll('.nav-tab'),
  tabContents: document.querySelectorAll('.tab-content'),

  // WS Status
  wsIndicator: document.getElementById('ws-indicator'),
  wsStatusText: document.getElementById('ws-status-text'),

  // Dashboard
  statTotalValue: document.getElementById('stat-total-value'),
  statTotalCost: document.getElementById('stat-total-cost'),
  statTotalPL: document.getElementById('stat-total-pl'),
  assetsList: document.getElementById('assets-list'),
  openAddAssetBtn: document.getElementById('open-add-asset-btn'),

  // Modals - Add Position
  addAssetModal: document.getElementById('add-asset-modal'),
  closeAddAssetBtn: document.getElementById('close-add-asset-btn'),
  cancelAddAssetBtn: document.getElementById('cancel-add-asset-btn'),
  addAssetForm: document.getElementById('add-asset-form'),

  // Modals - Update Position
  updateAssetModal: document.getElementById('update-asset-modal'),
  closeUpdateAssetBtn: document.getElementById('close-update-asset-btn'),
  cancelUpdateAssetBtn: document.getElementById('cancel-update-asset-btn'),
  updateAssetForm: document.getElementById('update-asset-form'),
  updateAssetIdInput: document.getElementById('update-asset-id'),
  updateAssetNameStatic: document.getElementById('update-asset-name-static'),
  updateAssetAmountInput: document.getElementById('update-asset-amount'),
  updateAssetPriceInput: document.getElementById('update-asset-price'),

  // Chatbot
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  chatHistoryBox: document.getElementById('chat-history-box'),
  sourcesContainer: document.getElementById('sources-container'),
  clearChatBtn: document.getElementById('clear-chat-btn'),

  // News
  newsFeed: document.getElementById('news-feed'),
  triggerNewsFetchBtn: document.getElementById('trigger-news-fetch-btn'),
  sentimentPosVal: document.getElementById('sentiment-pos-val'),
  sentimentNeuVal: document.getElementById('sentiment-neu-val'),
  sentimentNegVal: document.getElementById('sentiment-neg-val'),
  sentimentProgressPos: document.querySelector('.sentiment-progress.positive'),
  sentimentProgressNeu: document.querySelector('.sentiment-progress.neutral'),
  sentimentProgressNeg: document.querySelector('.sentiment-progress.negative'),
  hotAssetsList: document.getElementById('hot-assets-list'),

  // Recommendations
  recommendationsDeck: document.getElementById('recommendations-deck'),

  // Sync Wallet Modal
  openSyncWalletBtn: document.getElementById('open-sync-wallet-btn'),
  syncWalletModal: document.getElementById('sync-wallet-modal'),
  closeSyncWalletBtn: document.getElementById('close-sync-wallet-btn'),
  cancelSyncWalletBtn: document.getElementById('cancel-sync-wallet-btn'),
  confirmSyncWalletBtn: document.getElementById('confirm-sync-wallet-btn'),
  syncTabWallet: document.getElementById('sync-tab-wallet'),
  syncTabManual: document.getElementById('sync-tab-manual'),
  syncPanelWallet: document.getElementById('sync-panel-wallet'),
  syncPanelManual: document.getElementById('sync-panel-manual'),
  walletAddressInput: document.getElementById('wallet-address-input'),
  fetchWalletBtn: document.getElementById('fetch-wallet-btn'),
  walletFetchStatus: document.getElementById('wallet-fetch-status'),
  syncAddRowBtn: document.getElementById('sync-add-row-btn'),
  syncHoldingsBody: document.getElementById('sync-holdings-body'),
  syncEmptyState: document.getElementById('sync-empty-state'),
  syncResultBanner: document.getElementById('sync-result-banner'),
};

// --- API URL RESOLVER ---
// When running locally (any localhost port), use relative paths so the
// Next.js proxy (next.config.ts rewrites) forwards /api/* and /ws/* to
// the Express backend on port 3000. This eliminates all CORS issues.
// In production (non-localhost), use the absolute deployed backend URL.
const PRODUCTION_BACKEND_URL = 'https://finpilot-backend-api.onrender.com';

const IS_LOCAL = window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1';

function getApiUrl(path) {
  // On localhost: use relative path (proxied by Next.js → port 3000)
  // On production: prefix with the deployed backend URL
  if (IS_LOCAL) return path;
  return `${PRODUCTION_BACKEND_URL}${path}`;
}

function getWsUrl() {
  if (IS_LOCAL) {
    // Bypass Next.js and connect directly to Express WS on port 3000
    // (Next.js does not proxy WebSocket upgrades via rewrites)
    return 'ws://localhost:3000/ws/news';
  }
  return PRODUCTION_BACKEND_URL.replace(/^http/, 'ws') + '/ws/news';
}

/**
 * Safely parse a fetch response as JSON.
 * Falls back to { success: false, error } if the server returns a non-JSON
 * response (e.g. HTML "Internal Server Error" page from a crashed backend).
 */
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    console.error(`Non-JSON response (HTTP ${res.status}):`, text.slice(0, 200));
    return { success: false, error: `Server error (HTTP ${res.status})` };
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


function getConversationId() {
  let id = localStorage.getItem('finpilot_conv_id');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('finpilot_conv_id', id);
  }
  return id;
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

function formatPercentage(value) {
  if (value === undefined || value === null) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Basic markdown formattings for bold and line breaks to preserve AI readability
 */
function formatResponseText(text) {
  if (!text) return '';
  let formatted = escapeHTML(text);
  // Convert bold: **text** to <strong>text</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert bullet points starting with * or - to list items
  formatted = formatted.replace(/(?:^|\n)[-•*]\s+(.*?)(?=\n|$)/g, '<div class="chat-bullet-item">• $1</div>');
  // Replace remaining newlines with line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

// --- TABS CONTROLLER ---
function setupTabs() {
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (state.activeTab === targetTab) return;

      // Update state
      state.activeTab = targetTab;

      // Update nav class
      elements.navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content panels
      elements.tabContents.forEach(content => {
        if (content.id === `tab-${targetTab}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Handle tab-specific activation logic
      if (targetTab === 'dashboard') {
        fetchGlobalMarketData();
        fetchPortfolio();
      } else if (targetTab === 'recommendations') {
        renderRecommendationsPage();
      } else if (targetTab === 'docs') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    });
  });
}

// --- DOCS NAVIGATION & SCROLLSPY ---
function setupDocsNav() {
  const navLinks = document.querySelectorAll('.docs-nav-link');
  const sections = document.querySelectorAll('.docs-section');

  // Click handler for smooth scrolling
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        // Calculate offset (e.g. 40px padding top)
        const offsetPosition = targetSection.offsetTop - 20;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Update active class immediately on click
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  // Scrollspy logic to highlight current section on scroll
  window.addEventListener('scroll', () => {
    if (state.activeTab !== 'docs') return;

    let currentSectionId = '';
    const scrollPosition = window.scrollY + 160; // offset for dynamic highlights

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
        currentSectionId = section.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });
}

// --- MODALS ENGINE ---
function openModal(modal) {
  modal.classList.add('active');
}

function closeModal(modal) {
  modal.classList.remove('active');
}

function setupModals() {
  // Add Asset Modal Triggers
  elements.openAddAssetBtn.addEventListener('click', () => {
    elements.addAssetForm.reset();
    openModal(elements.addAssetModal);
  });
  elements.closeAddAssetBtn.addEventListener('click', () => closeModal(elements.addAssetModal));
  elements.cancelAddAssetBtn.addEventListener('click', () => closeModal(elements.addAssetModal));

  // Update Asset Modal Triggers
  elements.closeUpdateAssetBtn.addEventListener('click', () => closeModal(elements.updateAssetModal));
  elements.cancelUpdateAssetBtn.addEventListener('click', () => closeModal(elements.updateAssetModal));

  // Close Modals on Outer Overlay Click
  window.addEventListener('click', (e) => {
    if (e.target === elements.addAssetModal) closeModal(elements.addAssetModal);
    if (e.target === elements.updateAssetModal) closeModal(elements.updateAssetModal);
  });
}

// --- PORTFOLIO CRUDS ---
async function fetchGlobalMarketData() {
  try {
    const res = await fetch(getApiUrl('/api/market/global'));
    const json = await res.json();
    if (json.success && json.data) {
      const data = json.data;
      
      const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
      const formatPercent = (val, el) => {
        const num = parseFloat(val);
        el.style.color = num > 0 ? 'var(--accent-green)' : (num < 0 ? 'var(--accent-red)' : 'var(--text-muted)');
        return `${num > 0 ? '+' : ''}${num}%`;
      };
      
      document.getElementById('global-mcap').textContent = formatCurrency(data.totalMarketCap);
      const mcapChangeEl = document.getElementById('global-mcap-change');
      mcapChangeEl.textContent = formatPercent(data.mcapChange, mcapChangeEl);

      document.getElementById('global-vol').textContent = formatCurrency(data.totalVolume24h);
      const volChangeEl = document.getElementById('global-vol-change');
      volChangeEl.textContent = formatPercent(data.volumeChange, volChangeEl);

      const btcD = parseFloat(data.btcDominance);
      document.getElementById('global-btcd').textContent = `${btcD}%`;
      const btcLabel = document.getElementById('global-btcd-label');
      if (btcD > 50) {
        btcLabel.textContent = 'Bitcoin-led market';
        btcLabel.style.color = 'var(--accent-gold)';
      } else {
        btcLabel.textContent = 'Altcoin-heavy market';
        btcLabel.style.color = 'var(--accent-blue)';
      }
    }
  } catch (err) {
    console.error('Error fetching global market data:', err);
  }
}

async function fetchPortfolio() {
  try {
    const res = await fetch(getApiUrl('/api/portfolio'));
    const result = await safeJson(res);

    if (result.success) {
      state.assets = result.data;
      updateWsSubscriptions();
      updateSummaryStats(result.summary);
      renderAssetsTable(result.data);
      state.isPortfolioLoaded = true;
      checkLoadingStatus();
    } else {
      console.error('Failed to retrieve portfolio data:', result.error);
    }
  } catch (error) {
    console.error('Error fetching portfolio:', error);
  }
}

function updateSummaryStats(summary) {
  if (!summary) return;

  elements.statTotalValue.textContent = formatCurrency(summary.totalCurrentValue);
  elements.statTotalCost.textContent = formatCurrency(summary.totalCost);

  const plText = `${formatCurrency(summary.totalProfitLoss)} (${formatPercentage(summary.totalProfitLossPercentage)})`;
  elements.statTotalPL.textContent = plText;

  // Handle profit colors
  elements.statTotalPL.className = 'summary-value';
  if (summary.totalProfitLoss > 0) {
    elements.statTotalPL.classList.add('positive');
  } else if (summary.totalProfitLoss < 0) {
    elements.statTotalPL.classList.add('negative');
  }
}

function renderAssetsTable(assets) {
  if (!assets || assets.length === 0) {
    elements.assetsList.innerHTML = `
      <tr>
        <td colspan="8" class="text-muted text-center" style="padding: 40px 0;">No assets found in your portfolio. Click '+ Add Asset' to begin.</td>
      </tr>
    `;
    return;
  }

  elements.assetsList.innerHTML = assets.map(asset => {
    const isProfit = asset.profitLoss >= 0;
    const plClass = isProfit ? 'positive' : 'negative';
    const plSign = isProfit ? '+' : '';
    const lastAnalyzed = asset.lastAnalyzedAt
      ? new Date(asset.lastAnalyzedAt).toLocaleString()
      : 'Never';

    return `
      <tr>
        <td><strong>${escapeHTML(asset.assetName)}</strong></td>
        <td><span class="tag neutral">${escapeHTML(asset.symbol)}</span></td>
        <td><span class="small text-muted">${escapeHTML(asset.assetType)}</span></td>
        <td>${asset.amount}</td>
        <td>${formatCurrency(asset.buyingPrice)}</td>
        <td>${formatCurrency(asset.currentPrice)}</td>
        <td>
          <span style="color: ${isProfit ? 'var(--accent-green)' : 'var(--accent-red)'}">
            ${plSign}${formatCurrency(asset.profitLoss)}<br>
            <span class="small text-muted">${formatPercentage(asset.profitLossPercentage)}</span>
          </span>
        </td>
        <td style="text-align: right;">
          <button class="btn-primary-link" onclick="triggerUpdateAssetModal('${asset.id}', '${escapeHTML(asset.assetName)}', '${escapeHTML(asset.symbol)}', ${asset.amount}, ${asset.buyingPrice})">Edit</button>
          <button class="btn-danger-link" onclick="deleteAsset('${asset.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Add position
elements.addAssetForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    assetName: document.getElementById('asset-name').value.trim(),
    assetType: document.getElementById('asset-type').value,
    symbol: document.getElementById('asset-symbol').value.toUpperCase().trim(),
    amount: document.getElementById('asset-amount').value,
    buyingPrice: document.getElementById('asset-price').value,
  };

  try {
    const res = await fetch(getApiUrl('/api/portfolio/add'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await safeJson(res);

    if (result.success) {
      closeModal(elements.addAssetModal);
      fetchPortfolio();
    } else {
      // result.errors is an array from validation middleware; result.error is a string from controller
      const msg = result.error
        || (Array.isArray(result.errors) ? result.errors.map(e => e.msg).join(', ') : null)
        || 'Failed to add asset';
      alert(`Error: ${msg}`);
    }
  } catch (error) {
    console.error('Error adding asset:', error);
    alert('Network error: Could not reach the server. Is the backend running?');
  }
});

// Trigger Update Modal (global function bound to window so onclick works)
window.triggerUpdateAssetModal = function (id, name, symbol, amount, buyingPrice) {
  elements.updateAssetIdInput.value = id;
  elements.updateAssetNameStatic.textContent = `${name} (${symbol})`;
  elements.updateAssetAmountInput.value = amount;
  elements.updateAssetPriceInput.value = buyingPrice;
  openModal(elements.updateAssetModal);
};

// Update position
elements.updateAssetForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = elements.updateAssetIdInput.value;
  const payload = {};

  const amt = elements.updateAssetAmountInput.value;
  const price = elements.updateAssetPriceInput.value;

  if (amt !== '') payload.amount = amt;
  if (price !== '') payload.buyingPrice = price;

  try {
    const res = await fetch(getApiUrl(`/api/portfolio/update/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await safeJson(res);

    if (result.success) {
      closeModal(elements.updateAssetModal);
      fetchPortfolio();
    } else {
      alert(`Error: ${result.error || 'Failed to update asset'}`);
    }
  } catch (error) {
    console.error('Error updating asset:', error);
  }
});

// Delete position
window.deleteAsset = async function (id) {
  if (!confirm('Are you sure you want to remove this position from your portfolio?')) return;

  try {
    const res = await fetch(getApiUrl(`/api/portfolio/remove/${id}`), {
      method: 'DELETE',
    });
    const result = await safeJson(res);

    if (result.success) {
      fetchPortfolio();
    } else {
      alert(`Error: ${result.error || 'Failed to delete asset'}`);
    }
  } catch (error) {
    console.error('Error deleting asset:', error);
  }
};

// --- CHATBOT ASSISTANT ---
async function fetchChatHistory() {
  try {
    const res = await fetch(getApiUrl(`/api/chat/history?conversationId=${state.conversationId}`));
    const result = await safeJson(res);

    if (result.success && result.data && result.data.messages) {
      renderChatHistory(result.data.messages);
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
  }
}

function renderChatHistory(messages) {
  if (!messages || messages.length === 0) return;

  // Clear other than initial welcome message
  elements.chatHistoryBox.innerHTML = `
    <div class="chat-message assistant">
      <div class="message-content">
        Hello, I am FinPilot, your advanced AI financial advisor powered by <strong>Groq GPT-OSS 120B</strong> and <strong>HuggingFace FinBERT</strong> sentiment models. How can I help you analyze cryptocurrencies, precious metals, or your portfolio positions today?
      </div>
    </div>
  `;

  let allSources = [];

  messages.forEach(msg => {
    const roleClass = msg.role === 'USER' ? 'user' : 'assistant';
    appendMessage(msg.message, roleClass, false);

    if (msg.sources && msg.sources.length > 0) {
      allSources = msg.sources; // Keep latest sources
    }
  });

  updateSourcesList(allSources);
  scrollToBottom(elements.chatHistoryBox);
}

function appendMessage(text, role, animate = true) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${role}`;
  if (animate) msgDiv.style.animation = 'fadeIn 0.25s ease';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = formatResponseText(text);

  msgDiv.appendChild(contentDiv);
  elements.chatHistoryBox.appendChild(msgDiv);
  scrollToBottom(elements.chatHistoryBox);
}

function showThinkingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'chat-message assistant';
  indicator.id = 'chat-thinking-indicator';
  indicator.innerHTML = `
    <div class="message-content chat-bubble-thinking">
      <span></span><span></span><span></span>
    </div>
  `;
  elements.chatHistoryBox.appendChild(indicator);
  scrollToBottom(elements.chatHistoryBox);
}

function removeThinkingIndicator() {
  const indicator = document.getElementById('chat-thinking-indicator');
  if (indicator) indicator.remove();
}

function updateSourcesList(sources) {
  if (!sources || sources.length === 0) {
    elements.sourcesContainer.innerHTML = `
      <p class="text-muted small">Sources and references used by the AI to answer your queries will appear here.</p>
    `;
    return;
  }

  // Deduplicate and filter empty sources
  const uniqueSources = [...new Set(sources)].filter(Boolean);

  elements.sourcesContainer.innerHTML = uniqueSources.map(url => {
    let hostName = url;
    try {
      hostName = new URL(url).hostname;
    } catch (_) { }
    return `<a href="${escapeHTML(url)}" target="_blank" class="source-item">${escapeHTML(hostName)} &rarr;</a>`;
  }).join('');
}

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

// Send chat message
elements.chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userText = elements.chatInput.value.trim();
  if (!userText) return;

  // Clear input
  elements.chatInput.value = '';

  // Render user message instantly
  appendMessage(userText, 'user');

  // Show AI thinking
  showThinkingIndicator();

  try {
    const res = await fetch(getApiUrl('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        conversationId: state.conversationId,
      }),
    });

    const result = await safeJson(res);
    removeThinkingIndicator();

    if (result.success && result.data) {
      appendMessage(result.data.message, 'assistant');
      if (result.data.sources) {
        updateSourcesList(result.data.sources);
      }
    } else {
      appendMessage('I apologize, but I encountered an error while processing your request. Please try again.', 'assistant');
    }
  } catch (error) {
    console.error('Chat error:', error);
    removeThinkingIndicator();
    appendMessage('Unable to reach FinPilot advisor. Please check your network connection.', 'assistant');
  }
});

// Clear chat history
elements.clearChatBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete your chat history? This cannot be undone.')) return;

  elements.clearChatBtn.disabled = true;
  elements.clearChatBtn.textContent = 'Clearing...';

  try {
    const res = await fetch(getApiUrl(`/api/chat/clear?conversationId=${state.conversationId}`), {
      method: 'DELETE',
    });

    const result = await safeJson(res);
    if (result.success) {
      // Completely erase trace by regenerating a new conversation ID locally as well
      const newId = generateUUID();
      localStorage.setItem('finpilot_conv_id', newId);
      state.conversationId = newId;

      // Reset UI back to initial state
      elements.chatHistoryBox.innerHTML = `
        <div class="chat-message assistant">
          <div class="message-content">
            Hello, I am FinPilot, your advanced AI financial advisor powered by <strong>Groq GPT-OSS 120B</strong> and <strong>HuggingFace FinBERT</strong> sentiment models. How can I help you analyze cryptocurrencies, precious metals, or your portfolio positions today?
          </div>
        </div>
      `;
      updateSourcesList([]);
    } else {
      alert(`Error: ${result.error || 'Failed to clear chat history'}`);
    }
  } catch (error) {
    console.error('Error clearing chat:', error);
    alert('Failed to connect to backend server to clear chat.');
  } finally {
    elements.clearChatBtn.disabled = false;
    elements.clearChatBtn.textContent = 'Clear Chat';
  }
});

// --- REAL-TIME WEBSOCKET NEWS HUB ---
function connectNewsWebSocket() {
  // Use getWsUrl() which targets port 3000 directly for local WS
  // (Next.js HTTP rewrites cannot proxy WebSocket upgrades)
  const wsUrl = getWsUrl();


  if (state.wsConnection) {
    state.wsConnection.close();
  }

  console.log(`Connecting news WS to: ${wsUrl}`);
  const ws = new WebSocket(wsUrl);
  state.wsConnection = ws;

  ws.onopen = () => {
    console.log('News WebSocket connection established successfully');
    elements.wsIndicator.className = 'status-indicator online';
    elements.wsStatusText.textContent = 'Connected';
    state.wsReconnectDelay = 2000; // Reset delay
    if (state.wsReconnectTimer) clearTimeout(state.wsReconnectTimer);
    state.isWsConnected = true;
    updateWsSubscriptions();
    checkLoadingStatus();
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      console.log('WS Message received:', payload.type);

      switch (payload.type) {
        case 'initial_news':
          // Legacy handling for old broadcast logic (safeguard)
          const legacyNews = payload.data || [];
          state.newsList = legacyNews.filter(a => !state.seenArticleUrls.has(a.url));
          state.newsList.forEach(a => state.seenArticleUrls.add(a.url));
          renderNewsFeed(state.newsList);
          break;

        case 'news_update':
          const newArticles = (payload.data || []).filter(a => !state.seenArticleUrls.has(a.url));
          newArticles.forEach(a => state.seenArticleUrls.add(a.url));
          if (newArticles.length > 0) {
            state.newsList = [...newArticles, ...state.newsList].slice(0, 50); // Cap at 50
            renderNewsFeed(state.newsList);
          }
          break;

        case 'news_summary':
          renderSentimentAndHotAssets(payload.data);
          break;

        case 'pong':
          // Heartbeat check if needed
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error parsing WS news packet:', error);
    }
  };

  ws.onclose = () => {
    console.warn('News WebSocket disconnected. Retrying connection...');
    elements.wsIndicator.className = 'status-indicator offline';
    elements.wsStatusText.textContent = 'Disconnected';

    // Backoff reconnect
    if (state.wsReconnectTimer) clearTimeout(state.wsReconnectTimer);
    state.wsReconnectTimer = setTimeout(() => {
      state.wsReconnectDelay = Math.min(state.wsReconnectDelay * 2, state.wsMaxReconnectDelay);
      connectNewsWebSocket();
    }, state.wsReconnectDelay);
  };

  ws.onerror = (err) => {
    console.error('WebSocket connection error:', err);
    ws.close();
  };
}

function updateWsSubscriptions() {
  if (state.wsConnection && state.wsConnection.readyState === WebSocket.OPEN) {
    const assetSymbols = state.assets.map(a => a.symbol);
    state.wsConnection.send(JSON.stringify({
      type: 'subscribe',
      assets: assetSymbols
    }));
  }
}

function renderNewsFeed(news) {
  if (!news || news.length === 0) {
    elements.newsFeed.innerHTML = `
      <p class="text-muted" style="padding: 20px 0;">No news articles available. Press "Force Fetch News" to fetch articles in real-time.</p>
    `;
    return;
  }

  const fetchTimes = news.map(a => new Date(a.createdAt || a.publishedAt).getTime());
  const lastFetch = new Date(Math.max(...fetchTimes));
  const lastFetchedSpan = document.getElementById('last-fetched-time');
  if (lastFetchedSpan) {
    lastFetchedSpan.textContent = 'Last fetched: ' + lastFetch.toLocaleString();
  }

  elements.newsFeed.innerHTML = news.map(article => {
    const sentiment = article.sentiment || { label: 'neutral', score: 0 };
    const dateStr = new Date(article.publishedAt).toLocaleString();
    const assetsText = (article.relatedAssets || []).map(asset =>
      `<span class="tag asset">${escapeHTML(asset)}</span>`
    ).join(' ');

    return `
      <div class="news-item">
        <div class="news-meta">
          <div class="news-meta-left">
            <span><strong>${escapeHTML(article.source)}</strong></span>
            <span class="text-muted">•</span>
            <span class="text-muted">${dateStr}</span>
          </div>
          <span class="tag ${sentiment.label}">${escapeHTML(sentiment.label)}</span>
        </div>
        <a href="${escapeHTML(article.url)}" target="_blank" class="news-title">${escapeHTML(article.title)}</a>
        <p class="news-description">${escapeHTML(article.description || 'No summary available.')}</p>
        <div class="news-footer">
          <div>${assetsText}</div>
          <span class="small text-muted">Relevance: ${(article.relevanceScore * 100).toFixed(0)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderSentimentAndHotAssets(data) {
  if (!data) return;

  const { sentimentBreakdown, topAssets } = data;
  if (sentimentBreakdown) {
    const posVal = sentimentBreakdown.positive || 0;
    const neuVal = sentimentBreakdown.neutral || 0;
    const negVal = sentimentBreakdown.negative || 0;
    const total = posVal + neuVal + negVal || 1;

    // Set counters
    elements.sentimentPosVal.textContent = posVal;
    elements.sentimentNeuVal.textContent = neuVal;
    elements.sentimentNegVal.textContent = negVal;

    // Set progress bars
    elements.sentimentProgressPos.style.width = `${(posVal / total) * 100}%`;
    elements.sentimentProgressNeu.style.width = `${(neuVal / total) * 100}%`;
    elements.sentimentProgressNeg.style.width = `${(negVal / total) * 100}%`;
  }

  if (topAssets && topAssets.length > 0) {
    elements.hotAssetsList.innerHTML = topAssets.map(asset => `
      <li>
        <span>${escapeHTML(asset)}</span>
        <strong style="color: var(--accent-blue)">Active Mention</strong>
      </li>
    `).join('');
  } else {
    elements.hotAssetsList.innerHTML = `
      <li class="text-muted small">No assets mentioned in recent news.</li>
    `;
  }
}

// Force fetch news
elements.triggerNewsFetchBtn.addEventListener('click', async () => {
  elements.triggerNewsFetchBtn.disabled = true;
  elements.triggerNewsFetchBtn.textContent = 'Fetching News...';

  try {
    const res = await fetch(getApiUrl('/api/news/trigger-fetch'), { method: 'POST' });
    const result = await safeJson(res);

    if (res.status === 202 || result.success) {
      // Background task accepted — update button to show processing state
      elements.triggerNewsFetchBtn.textContent = 'Running in background...';
      console.log('News fetch started in background. Results will arrive via WebSocket.');

      // Reset button after 90s (give the pipeline time to finish)
      setTimeout(() => {
        elements.triggerNewsFetchBtn.disabled = false;
        elements.triggerNewsFetchBtn.textContent = 'Force Fetch News';
      }, 90000);
    } else {
      console.error('Trigger news fetch error:', result.error);
      elements.triggerNewsFetchBtn.disabled = false;
      elements.triggerNewsFetchBtn.textContent = 'Force Fetch News';
    }
  } catch (error) {
    console.error('Error triggering news fetch:', error);
    elements.triggerNewsFetchBtn.disabled = false;
    elements.triggerNewsFetchBtn.textContent = 'Force Fetch News';
  }
});

// Fetch existing news from REST API immediately (no WS needed)
async function fetchNewsFromApi() {
  try {
    const res = await fetch(getApiUrl('/api/news?limit=100'));
    const result = await safeJson(res);
    if (result.success && Array.isArray(result.articles) && result.articles.length > 0) {
      const newArticles = result.articles.filter(a => !state.seenArticleUrls.has(a.url));
      newArticles.forEach(a => state.seenArticleUrls.add(a.url));

      if (newArticles.length > 0) {
        state.newsList = [...state.newsList, ...newArticles]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .slice(0, 50);
        renderNewsFeed(state.newsList);

        computeAndRenderSentimentFromArticles(state.newsList);
        console.log(`Loaded ${newArticles.length} new articles from REST API`);
      }
    }
  } catch (error) {
    console.error('Error fetching news from REST API:', error);
  }
}

/**
 * Compute sentiment breakdown and hot assets from a list of articles
 * and update the sidebar panels without needing a WS news_summary event.
 */
function computeAndRenderSentimentFromArticles(articles) {
  const breakdown = { positive: 0, neutral: 0, negative: 0 };
  const assetCounts = {};

  articles.forEach(article => {
    const label = article.sentiment?.label || 'neutral';
    if (breakdown[label] !== undefined) breakdown[label]++;

    (article.relatedAssets || []).forEach(asset => {
      assetCounts[asset] = (assetCounts[asset] || 0) + 1;
    });
  });

  const topAssets = Object.entries(assetCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([asset]) => asset);

  renderSentimentAndHotAssets({ sentimentBreakdown: breakdown, topAssets });
}


// --- AI PORTFOLIO RECOMMENDATIONS DECK ---
function renderRecommendationsPage() {
  if (state.assets.length === 0) {
    elements.recommendationsDeck.innerHTML = `
      <p class="text-muted" style="padding: 20px 0;">Your portfolio is currently empty. Add assets in the Dashboard tab to request recommendations.</p>
    `;
    return;
  }

  // Render an empty card / loader outline for each asset
  elements.recommendationsDeck.innerHTML = state.assets.map(asset => {
    return `
      <div class="rec-card" id="rec-card-${asset.id}">
        <div class="rec-header">
          <div class="rec-asset-title">${escapeHTML(asset.assetName)} <span class="tag neutral">${escapeHTML(asset.symbol)}</span></div>
          <div class="text-muted small">Position: ${asset.amount} units @ ${formatCurrency(asset.buyingPrice)}</div>
          <div class="text-muted small">Last Analyzed: <span id="last-analyzed-${asset.id}">${asset.lastAnalyzedAt ? new Date(asset.lastAnalyzedAt).toLocaleString() : 'Never'}</span></div>
          
          <button class="btn btn-secondary small" style="margin-top: 16px;" onclick="runSingleAssetAnalysis('${asset.id}')" id="btn-analyze-${asset.id}">
            ${asset.lastAnalyzedAt ? 'Recalculate Analysis' : 'Run AI Analysis'}
          </button>
        </div>
        <div class="rec-body" id="rec-body-${asset.id}">
          <p class="text-muted small" style="padding: 30px 0; text-align: center;">Click 'Run AI Analysis' to pull current technical price patterns, sentiment scores, and generate AI recomendations.</p>
        </div>
      </div>
    `;
  }).join('');

  // Fetch cached analysis for assets that were previously analyzed
  state.assets.forEach(async (asset) => {
    if (asset.lastAnalyzedAt) {
      try {
        const res = await fetch(getApiUrl(`/api/portfolio/${asset.id}/analysis`));
        const result = await safeJson(res);
        if (result.success && result.data) {
          renderAnalysisPayload(asset.id, result.data);
        }
      } catch (error) {
        console.error(`Error loading cached analysis for ${asset.assetName}:`, error);
      }
    }
  });
}

function renderAnalysisPayload(id, data) {
  const bodyDiv = document.getElementById(`rec-body-${id}`);
  if (!bodyDiv) return;

  const act = data.action.toLowerCase(); // buy, hold, sell
  const actionLabel = data.action; // BUY, HOLD, SELL

  // Update recommendation body with premium fade-in style
  bodyDiv.style.opacity = 0;
  bodyDiv.style.transition = 'opacity 0.5s ease';

  bodyDiv.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
      <div>
        <span class="rec-action-badge ${act}">${escapeHTML(actionLabel)}</span>
        <span style="margin-left: 12px; font-size: 13px;" class="text-muted">Confidence Score: <strong>${data.confidence}%</strong></span>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 8px 0;">
        <div class="summary-card" style="padding: 12px 16px;">
          <span class="summary-label" style="font-size: 10px;">7D Price Target</span>
          <span style="font-size: 16px;" class="summary-value">${data.priceTarget ? formatCurrency(data.priceTarget) : 'N/A'}</span>
        </div>
        <div class="summary-card" style="padding: 12px 16px;">
          <span class="summary-label" style="font-size: 10px;">Risk Profile</span>
          <span style="font-size: 16px;" class="summary-value">${escapeHTML(data.riskLevel)}</span>
        </div>
        <div class="summary-card" style="padding: 12px 16px;">
          <span class="summary-label" style="font-size: 10px;">7D Price Change</span>
          <span style="font-size: 16px; color: ${data.priceChange7d >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}" class="summary-value">${formatPercentage(data.priceChange7d)}</span>
        </div>
        <div class="summary-card" style="padding: 12px 16px;">
          <span class="summary-label" style="font-size: 10px;">Media Sentiment</span>
          <span style="font-size: 16px;" class="summary-value">${escapeHTML(data.sentimentLabel)} (${(data.sentimentScore * 100).toFixed(0)}%)</span>
        </div>
      </div>

      <!-- Advanced Technical Indicators Panel -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
        <h4 style="margin-bottom: 12px; font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Advanced Technical Indicators (30-Day Calculations)</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
          
          <div style="padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--panel-bg);">
            <div class="summary-label" style="font-size: 9px; margin-bottom: 4px;">RSI (14-period)</div>
            <div style="font-size: 13px; font-weight: 500;">
              ${data.rsi !== undefined ? data.rsi : 'N/A'}
              <span class="tag ${data.rsiSignal === 'BUY' ? 'positive' : data.rsiSignal === 'SELL' ? 'negative' : 'neutral'}" style="margin-left: 6px;">
                ${data.rsiSignal || 'NEUTRAL'}
              </span>
            </div>
          </div>

          <div style="padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--panel-bg);">
            <div class="summary-label" style="font-size: 9px; margin-bottom: 4px;">MACD (12/26/9 EMA)</div>
            <div style="font-size: 13px; font-weight: 500; display: flex; flex-direction: column; gap: 2px;">
              <span>Line: ${data.macd?.macdLine ?? 'N/A'} | Signal: ${data.macd?.signalLine ?? 'N/A'}</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                Hist: ${data.macd?.histogram ?? 'N/A'}
                <span class="tag ${data.macd?.signal === 'BUY' ? 'positive' : data.macd?.signal === 'SELL' ? 'negative' : 'neutral'}" style="margin-left: 4px;">
                  ${data.macd?.signal || 'NEUTRAL'}
                </span>
              </span>
            </div>
          </div>

          <div style="padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--panel-bg);">
            <div class="summary-label" style="font-size: 9px; margin-bottom: 4px;">Bollinger Bands (20-period)</div>
            <div style="font-size: 12px; font-weight: 500; display: flex; flex-direction: column; gap: 2px;">
              <span>Upper: ${data.bollingerBands?.upper ? formatCurrency(data.bollingerBands.upper) : 'N/A'}</span>
              <span>Lower: ${data.bollingerBands?.lower ? formatCurrency(data.bollingerBands.lower) : 'N/A'}</span>
              <span style="font-size: 11px; color: var(--text-muted);">
                BB Signal: 
                <span class="tag ${data.bollingerBands?.signal === 'BUY' ? 'positive' : data.bollingerBands?.signal === 'SELL' ? 'negative' : 'neutral'}" style="margin-left: 4px;">
                  ${data.bollingerBands?.signal || 'NEUTRAL'}
                </span>
              </span>
            </div>
          </div>

          <div style="padding: 12px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--panel-bg);">
            <div class="summary-label" style="font-size: 9px; margin-bottom: 4px;">On-Balance Volume (OBV)</div>
            <div style="font-size: 13px; font-weight: 500;">
              ${data.obv !== undefined ? new Intl.NumberFormat('en-US').format(data.obv) : 'N/A'}
            </div>
          </div>

        </div>
      </div>
      
      <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
        <h4 style="margin-bottom: 8px;">Analytical Reasoning</h4>
        <ul class="rec-reasoning-list">
          ${(data.reasoning || []).map(reason => `<li>${escapeHTML(reason)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  // Trigger fade in
  setTimeout(() => {
    bodyDiv.style.opacity = 1;
  }, 50);
}

window.runSingleAssetAnalysis = async function (id) {
  const btn = document.getElementById(`btn-analyze-${id}`);
  const bodyDiv = document.getElementById(`rec-body-${id}`);
  const dateSpan = document.getElementById(`last-analyzed-${id}`);

  if (!btn || !bodyDiv) return;

  btn.disabled = true;
  btn.textContent = 'Analysing Data Streams...';

  // Helper to wait
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Step definitions
  const steps = [
    { num: 1, title: 'Syncing Live Asset Quotes', desc: 'Fetching precious metals pricing (Gold API v2) and active crypto WebSocket feeds...' },
    { num: 2, title: 'NLP News Sentiment Scanning', desc: 'Crawling recent media articles and classifying sentiment using HuggingFace FinBERT...' },
    { num: 3, title: 'Calculating Technical Indicators', desc: 'Scanning price action histories to compute active RSI, MACD, and EMA support metrics...' },
    { num: 4, title: 'Groq GPT-OSS 120B Synthesis', desc: 'Invoking the Groq GPT-OSS 120B cognitive optimizer to formulate trading targets and strategies...' }
  ];

  // Render initial stepper HTML
  bodyDiv.innerHTML = `
    <div class="analysis-stepper">
      ${steps.map(s => `
        <div class="step-row" id="step-${s.num}-${id}">
          <div class="step-indicator">${s.num}</div>
          <div class="step-content">
            <span class="step-title">${s.title} <span class="step-status-icon" id="step-icon-${s.num}-${id}"></span></span>
            <span class="step-desc">${s.desc}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  let fetchCompleted = false;
  let fetchResult = null;
  let fetchError = null;

  // Fire background API call
  const apiPromise = fetch(getApiUrl(`/api/portfolio/analyze/${id}`), { method: 'POST' })
    .then(async res => {
      const data = await safeJson(res);
      fetchCompleted = true;
      fetchResult = data;
    })
    .catch(err => {
      fetchCompleted = true;
      fetchError = err;
    });

  try {
    // Sequence through step highlights
    for (let i = 1; i <= 4; i++) {
      const row = document.getElementById(`step-${i}-${id}`);
      const iconSpan = document.getElementById(`step-icon-${i}-${id}`);
      if (row) {
        row.classList.add('active');
        if (iconSpan) iconSpan.innerHTML = '<span class="step-spinner"></span>';
      }

      if (i < 4) {
        // First 3 steps take ~1.2s each
        await delay(1200);
        if (row) {
          row.classList.remove('active');
          row.classList.add('completed');
        }
        if (iconSpan) iconSpan.innerHTML = ' <span style="color: var(--accent-green); font-weight: bold; margin-left: 6px;">✔</span>';
      } else {
        // Step 4: Wait for both simulation timeline AND background fetch to finish
        const simulationMinTime = delay(1200);
        while (!fetchCompleted) {
          await delay(150);
        }
        await simulationMinTime; // ensure we animate step 4 for at least 1.2s
        if (row) {
          row.classList.remove('active');
          row.classList.add('completed');
        }
        if (iconSpan) iconSpan.innerHTML = ' <span style="color: var(--accent-green); font-weight: bold; margin-left: 6px;">✔</span>';
        await delay(500); // Breathe
      }
    }

    // Now render final payload
    if (fetchResult && fetchResult.success && fetchResult.data) {
      const data = fetchResult.data;

      // Update last analyzed timestamp locally
      const nowStr = new Date().toLocaleString();
      if (dateSpan) dateSpan.textContent = nowStr;

      renderAnalysisPayload(id, data);
    } else {
      const errMessage = (fetchResult && fetchResult.error) ? fetchResult.error : 'Server error';
      bodyDiv.innerHTML = `<p class="text-muted small" style="padding: 30px 0; text-align: center; color: var(--accent-red) !important;">Failed to complete analysis: ${escapeHTML(errMessage)}</p>`;
    }
  } catch (error) {
    console.error('Error analyzing asset:', error);
    bodyDiv.innerHTML = `<p class="text-muted small" style="padding: 30px 0; text-align: center; color: var(--accent-red) !important;">Failed to connect to backend server.</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Recalculate Analysis';
  }
};

// --- WALLET SYNC MODULE ---

// In-memory list of holdings to sync
let syncHoldings = [];

function syncUpdateEmptyState() {
  if (elements.syncEmptyState) {
    elements.syncEmptyState.style.display = syncHoldings.length === 0 ? 'block' : 'none';
  }
}

function syncRenderRow(holding, index) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-index', index);
  tr.style.borderBottom = '1px solid var(--border-color)';
  tr.innerHTML = `
    <td style="padding: 6px;">
      <input type="text" value="${escapeHTML(holding.symbol)}" placeholder="BTC"
        style="width:70px; padding:4px 6px; background:var(--panel-bg); border:1px solid var(--border-color); border-radius:4px; color:var(--text-main); font-size:12px;"
        onchange="syncUpdateHolding(${index}, 'symbol', this.value)" />
    </td>
    <td style="padding: 6px;">
      <input type="text" value="${escapeHTML(holding.assetName)}" placeholder="Bitcoin"
        style="width:100px; padding:4px 6px; background:var(--panel-bg); border:1px solid var(--border-color); border-radius:4px; color:var(--text-main); font-size:12px;"
        onchange="syncUpdateHolding(${index}, 'assetName', this.value)" />
    </td>
    <td style="padding: 6px;">
      <select style="padding:4px 6px; background:var(--panel-bg); border:1px solid var(--border-color); border-radius:4px; color:var(--text-main); font-size:12px;"
        onchange="syncUpdateHolding(${index}, 'assetType', this.value)">
        <option value="CRYPTO" ${holding.assetType === 'CRYPTO' ? 'selected' : ''}>Crypto</option>
        <option value="METAL" ${holding.assetType === 'METAL' ? 'selected' : ''}>Metal</option>
      </select>
    </td>
    <td style="padding: 6px;">
      <input type="number" value="${holding.amount}" step="any" min="0" placeholder="0.00"
        style="width:90px; padding:4px 6px; background:var(--panel-bg); border:1px solid var(--border-color); border-radius:4px; color:var(--text-main); font-size:12px;"
        onchange="syncUpdateHolding(${index}, 'amount', parseFloat(this.value))" />
    </td>
    <td style="padding: 6px;">
      <input type="number" value="${holding.buyingPrice || ''}" step="any" min="0" placeholder="Auto"
        style="width:90px; padding:4px 6px; background:var(--panel-bg); border:1px solid var(--border-color); border-radius:4px; color:var(--text-main); font-size:12px;"
        onchange="syncUpdateHolding(${index}, 'buyingPrice', parseFloat(this.value) || 0)" />
    </td>
    <td style="padding: 6px; text-align: center;">
      <button onclick="syncRemoveRow(${index})" style="background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:16px; padding:0 4px;">✕</button>
    </td>
  `;
  return tr;
}

function syncRebuildTable() {
  if (!elements.syncHoldingsBody) return;
  elements.syncHoldingsBody.innerHTML = '';
  syncHoldings.forEach((h, i) => {
    elements.syncHoldingsBody.appendChild(syncRenderRow(h, i));
  });
  syncUpdateEmptyState();
}

window.syncUpdateHolding = function(index, field, value) {
  if (syncHoldings[index]) syncHoldings[index][field] = value;
};

window.syncRemoveRow = function(index) {
  syncHoldings.splice(index, 1);
  syncRebuildTable();
};

function syncAddEmptyRow() {
  syncHoldings.push({ symbol: '', assetName: '', assetType: 'CRYPTO', amount: 0, buyingPrice: 0 });
  syncRebuildTable();
}

function syncPopulateFromWalletData(tokens) {
  // tokens: [{ symbol, name, balance }]
  const newRows = tokens
    .filter(t => parseFloat(t.balance) > 0)
    .map(t => ({
      symbol: (t.symbol || '').toUpperCase(),
      assetName: t.name || t.symbol,
      assetType: 'CRYPTO',
      amount: parseFloat(parseFloat(t.balance).toFixed(8)),
      buyingPrice: 0,
    }));

  if (newRows.length === 0) return 0;

  // Merge: update existing rows or append
  newRows.forEach(newRow => {
    const existing = syncHoldings.findIndex(h => h.symbol === newRow.symbol);
    if (existing >= 0) {
      syncHoldings[existing].amount = newRow.amount;
    } else {
      syncHoldings.push(newRow);
    }
  });
  syncRebuildTable();
  return newRows.length;
}

async function fetchEvmWalletHoldings(address) {
  const statusEl = elements.walletFetchStatus;
  const btn = elements.fetchWalletBtn;
  if (!statusEl || !btn) return;

  statusEl.textContent = 'Fetching token balances...';
  statusEl.style.color = 'var(--text-muted)';
  btn.disabled = true;

  try {
    const res = await fetch(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`);
    if (!res.ok) throw new Error('API returned ' + res.status);
    const data = await res.json();

    let found = 0;

    if (data.ETH && data.ETH.balance > 0) {
      const ethBalance = parseFloat(data.ETH.balance);
      if (ethBalance > 0.00001) {
        const existing = syncHoldings.findIndex(h => h.symbol === 'ETH');
        const ethRow = { symbol: 'ETH', assetName: 'Ethereum', assetType: 'CRYPTO', amount: parseFloat(ethBalance.toFixed(8)), buyingPrice: 0 };
        if (existing >= 0) syncHoldings[existing] = ethRow;
        else syncHoldings.push(ethRow);
        found++;
      }
    }

    if (data.tokens && Array.isArray(data.tokens)) {
      data.tokens.forEach(t => {
        const decimals = parseInt(t.tokenInfo.decimals) || 18;
        // The balance might be very large, ethplorer returns it in lowest unit, but sometimes in scientific notation or number directly. 
        // We'll compute the actual token amount.
        const amountStr = t.rawBalance || t.balance.toString();
        // Fallback to their parsed balance which ethplorer computes sometimes as actual human readable if it's small, but rawBalance is best.
        let amount = 0;
        if (t.rawBalance) {
           amount = Number(t.rawBalance) / Math.pow(10, decimals);
        } else {
           // if rawBalance missing (rare), just use their balance scaled
           amount = t.balance / Math.pow(10, decimals);
        }
        
        // Let's use the provided 'balance' directly if it looks already divided. Ethplorer 'balance' field is actually sometimes the floating point value.
        // Actually, in Ethplorer, `balance` is often the raw amount for tokens unless it's very small. Wait, let's use `rawBalance` / 10^decimals, or just their `balance` / 10^decimals if rawBalance doesn't exist. Actually looking at the response, balance = rawBalance. So amount = rawBalance / 10^decimals. But since rawBalance can exceed Number MAX_SAFE_INTEGER, using BigInt if possible, but Number is fine for approximate UI.
        
        amount = Number(t.rawBalance || t.balance) / Math.pow(10, decimals);

        if (amount > 0.000001) {
          const sym = (t.tokenInfo.symbol || '').toUpperCase();
          if (!sym) return;
          const existing = syncHoldings.findIndex(h => h.symbol === sym);
          const row = { symbol: sym, assetName: t.tokenInfo.name || sym, assetType: 'CRYPTO', amount: parseFloat(amount.toFixed(8)), buyingPrice: 0 };
          if (existing >= 0) syncHoldings[existing] = row;
          else syncHoldings.push(row);
          found++;
        }
      });
    }

    syncRebuildTable();

    if (found > 0) {
      statusEl.textContent = `✓ Fetched ${found} token(s). Review amounts below, then click Sync.`;
      statusEl.style.color = 'var(--accent-green)';
    } else {
      statusEl.textContent = 'No non-zero token balances found for this address.';
      statusEl.style.color = 'var(--text-muted)';
    }
  } catch (err) {
    console.error('Wallet fetch error:', err);
    statusEl.textContent = '⚠ Could not fetch wallet data. Network error or address not found.';
    statusEl.style.color = 'var(--accent-red)';
  } finally {
    btn.disabled = false;
  }
}


function setupSyncWalletModal() {
  if (!elements.openSyncWalletBtn) return;

  const openModal = () => {
    syncHoldings = [];
    syncRebuildTable();
    if (elements.syncResultBanner) elements.syncResultBanner.style.display = 'none';
    if (elements.walletFetchStatus) elements.walletFetchStatus.textContent = '';
    if (elements.walletAddressInput) elements.walletAddressInput.value = '';
    // Show wallet tab by default
    switchSyncTab('wallet');
    elements.syncWalletModal.classList.add('active');
  };

  const closeModal = () => {
    elements.syncWalletModal.classList.remove('active');
  };

  elements.openSyncWalletBtn.addEventListener('click', openModal);
  elements.closeSyncWalletBtn.addEventListener('click', closeModal);
  elements.cancelSyncWalletBtn.addEventListener('click', closeModal);
  window.addEventListener('click', e => {
    if (e.target === elements.syncWalletModal) closeModal();
  });

  // Tab switching
  function switchSyncTab(tab) {
    const isWallet = tab === 'wallet';
    elements.syncPanelWallet.style.display = isWallet ? 'block' : 'none';
    elements.syncPanelManual.style.display = isWallet ? 'none' : 'block';
    elements.syncTabWallet.style.borderBottomColor = isWallet ? 'var(--accent-blue)' : 'transparent';
    elements.syncTabWallet.style.color = isWallet ? 'var(--accent-blue)' : 'var(--text-muted)';
    elements.syncTabManual.style.borderBottomColor = !isWallet ? 'var(--accent-blue)' : 'transparent';
    elements.syncTabManual.style.color = !isWallet ? 'var(--accent-blue)' : 'var(--text-muted)';
  }

  elements.syncTabWallet.addEventListener('click', () => switchSyncTab('wallet'));
  elements.syncTabManual.addEventListener('click', () => switchSyncTab('manual'));

  // Fetch from wallet address
  elements.fetchWalletBtn.addEventListener('click', () => {
    const addr = elements.walletAddressInput.value.trim();
    if (!addr || !addr.startsWith('0x') || addr.length < 40) {
      elements.walletFetchStatus.textContent = '⚠ Please enter a valid EVM address (0x...)';
      elements.walletFetchStatus.style.color = 'var(--accent-red)';
      return;
    }
    fetchEvmWalletHoldings(addr);
  });

  // Add empty row
  elements.syncAddRowBtn.addEventListener('click', syncAddEmptyRow);

  // Confirm sync
  elements.confirmSyncWalletBtn.addEventListener('click', async () => {
    // Re-read current input values from DOM before syncing
    const rows = elements.syncHoldingsBody.querySelectorAll('tr');
    const holdings = [];
    rows.forEach((row, i) => {
      const inputs = row.querySelectorAll('input, select');
      const symbol = inputs[0]?.value?.trim().toUpperCase();
      const assetName = inputs[1]?.value?.trim() || symbol;
      const assetType = inputs[2]?.value || 'CRYPTO';
      const amount = parseFloat(inputs[3]?.value) || 0;
      const buyingPrice = parseFloat(inputs[4]?.value) || 0;
      if (symbol && amount >= 0) {
        holdings.push({ symbol, assetName, assetType, amount, buyingPrice });
      }
    });

    if (holdings.length === 0) {
      elements.syncResultBanner.style.display = 'block';
      elements.syncResultBanner.style.background = 'rgba(255,170,0,0.1)';
      elements.syncResultBanner.style.color = '#ffaa00';
      elements.syncResultBanner.textContent = 'Please add at least one holding to sync.';
      return;
    }

    elements.confirmSyncWalletBtn.disabled = true;
    elements.confirmSyncWalletBtn.textContent = 'Syncing...';
    elements.syncResultBanner.style.display = 'none';

    try {
      const res = await fetch(getApiUrl('/api/portfolio/sync-wallet'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      });
      const result = await safeJson(res);

      elements.syncResultBanner.style.display = 'block';

      if (result.success) {
        const d = result.data;
        elements.syncResultBanner.style.background = 'rgba(0,200,100,0.1)';
        elements.syncResultBanner.style.color = 'var(--accent-green)';
        elements.syncResultBanner.innerHTML = `
          <strong>✓ Wallet Sync Complete!</strong><br>
          ${d.added} positions added &nbsp;|&nbsp; ${d.updated} positions updated &nbsp;|&nbsp; ${d.skipped} skipped
        `;
        // Refresh dashboard
        fetchPortfolio();
        // Close modal after 3s
        setTimeout(() => elements.syncWalletModal.classList.remove('active'), 3000);
      } else {
        elements.syncResultBanner.style.background = 'rgba(255,50,50,0.1)';
        elements.syncResultBanner.style.color = 'var(--accent-red)';
        elements.syncResultBanner.textContent = `Error: ${result.error || 'Sync failed'}`;
      }
    } catch (err) {
      console.error('Wallet sync error:', err);
      elements.syncResultBanner.style.display = 'block';
      elements.syncResultBanner.style.background = 'rgba(255,50,50,0.1)';
      elements.syncResultBanner.style.color = 'var(--accent-red)';
      elements.syncResultBanner.textContent = 'Network error: could not reach backend.';
    } finally {
      elements.confirmSyncWalletBtn.disabled = false;
      elements.confirmSyncWalletBtn.textContent = '⟳ Sync to Portfolio';
    }
  });
}

// --- INITIALIZER ---
// Next.js loads this script with strategy="afterInteractive", which means
// DOMContentLoaded has ALREADY fired by the time this script runs.
// We must check readyState and invoke init() immediately in that case.
function initApp() {
  // Initialize Conversation session
  state.conversationId = getConversationId();
  console.log(`Initialized FinPilot Session: ${state.conversationId}`);

  // Set up Tabs & Modals
  setupTabs();
  setupModals();
  setupDocsNav();
  setupSyncWalletModal();

  // Load Initial Data
  fetchGlobalMarketData();
  fetchPortfolio();
  fetchChatHistory();

  // Load existing news immediately via REST (fast, no WS needed)
  fetchNewsFromApi();

  // Connect news streams WebSocket (for live real-time updates)
  connectNewsWebSocket();

  // Maximum loading safety timeout of 6 seconds to fade out loader in case of server failures
  setTimeout(() => {
    const loader = document.getElementById('app-loading-screen');
    if (loader && !loader.classList.contains('fade-out')) {
      console.warn('Loading safety timeout reached. Dismissing loading overlay.');
      loader.classList.add('fade-out');
    }
  }, 6000);
}

// Invoke immediately if DOM is already parsed (afterInteractive case),
// otherwise wait for the event (direct Express serving case).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ==========================================
// DCA SIMULATOR LOGIC
// ==========================================
let dcaChartInstance = null;

const dcaForm = document.getElementById('dca-form');
if (dcaForm) {
  dcaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const symbol = document.getElementById('dca-symbol').value.toUpperCase().trim() || 'BTC';
    const amount = document.getElementById('dca-amount').value || 50;
    const frequency = document.getElementById('dca-frequency').value || 'weekly';
    const duration = document.getElementById('dca-duration').value || 365;
    
    const submitBtn = dcaForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Simulating...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`http://localhost:3000/api/simulation/dca?symbol=${symbol}&amount=${amount}&frequency=${frequency}&durationDays=${duration}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to simulate');
      }
      
      const { summary, timeSeries } = result.data;
      
      // Update Summary Cards
      document.getElementById('dca-val-invested').textContent = '$' + summary.totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      document.getElementById('dca-val-final').textContent = '$' + summary.finalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      
      const profitEl = document.getElementById('dca-val-profit');
      profitEl.textContent = (summary.netProfit >= 0 ? '+$' : '-$') + Math.abs(summary.netProfit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      profitEl.style.color = summary.netProfit >= 0 ? 'var(--trend-up)' : 'var(--trend-down)';
      
      const roiEl = document.getElementById('dca-val-roi');
      roiEl.textContent = (summary.roiPercentage >= 0 ? '+' : '') + summary.roiPercentage.toFixed(2) + '%';
      roiEl.style.color = summary.roiPercentage >= 0 ? 'var(--trend-up)' : 'var(--trend-down)';
      
      // Draw Chart
      const ctx = document.getElementById('dcaChart').getContext('2d');
      if (dcaChartInstance) {
        dcaChartInstance.destroy();
      }
      
      const labels = timeSeries.map(t => t.date);
      const investedData = timeSeries.map(t => t.totalInvested);
      const valueData = timeSeries.map(t => t.portfolioValue);
      
      dcaChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Total Cash Invested',
              data: investedData,
              borderColor: '#888',
              backgroundColor: 'rgba(136, 136, 136, 0.1)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0,
              tension: 0.1
            },
            {
              label: 'Portfolio Value',
              data: valueData,
              borderColor: '#2d6bc4',
              backgroundColor: 'rgba(45, 107, 196, 0.1)',
              borderWidth: 2,
              fill: true,
              pointRadius: 0,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false }
            },
            y: {
              grid: { color: 'rgba(200, 200, 200, 0.1)' },
              ticks: {
                callback: function(value) {
                  return '$' + value;
                }
              }
            }
          }
        }
      });
      
    } catch (err) {
      console.error(err);
      alert('Error running simulation: ' + err.message);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}
