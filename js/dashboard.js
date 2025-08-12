// Dashboard Application - Optimized JavaScript
class DashboardApp {
  constructor() {
    this.currentConversationId = null;
    this.conversations = [];
    this.filteredConversations = [];
    this.searchTerm = '';
    this.elements = this.initializeElements();
    this.bindEvents();
    this.loadConversations();
  }

  initializeElements() {
    return {
      conversationsList: document.getElementById('conversations-list'),
      conversationDetails: document.getElementById('conversation-details'),
      conversationsSection: document.getElementById('conversations-section'),
      messagesContainer: document.getElementById('messages-container'),
      conversationTitle: document.getElementById('conversation-title'),
      backToChatBtn: document.getElementById('back-to-chat'),
      backToListBtn: document.getElementById('back-to-list'),
      refreshBtn: document.getElementById('refresh-conversations'),
      searchInput: document.getElementById('search-conversations'),
      clearSearchBtn: document.getElementById('clear-search'),
      analysisSection: document.getElementById('analysis-section'),
      analysisContent: document.getElementById('analysis-content'),
      analyzeBtn: document.getElementById('analyze-conversation')
    };
  }

  bindEvents() {
    // Navigation buttons
    this.elements.backToChatBtn?.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    this.elements.backToListBtn?.addEventListener('click', () => {
      this.showConversationsList();
    });

    // Refresh button
    this.elements.refreshBtn?.addEventListener('click', () => {
      this.loadConversations();
    });

    // Search functionality
    this.elements.searchInput?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase().trim();
      this.filterConversations();
    });

    this.elements.clearSearchBtn?.addEventListener('click', () => {
      this.elements.searchInput.value = '';
      this.searchTerm = '';
      this.filterConversations();
    });

    // Analyze button
    this.elements.analyzeBtn?.addEventListener('click', () => {
      this.elements.analysisSection.style.display = 'block';
      this.analyzeConversation(this.currentConversationId);
    });
  }

  async loadConversations() {
    try {
      this.showLoading('conversations-loading');
      
      // Use persistent server for local development
      const apiUrl = 'http://localhost:3001/api/conversations';
      
      console.log('🔗 Fetching conversations from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const conversations = await response.json();
      console.log('📦 Conversations loaded:', conversations);
      
      this.hideLoading('conversations-loading');
      this.displayConversations(conversations);
      
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      this.hideLoading('conversations-loading');
      this.showError('Failed to load conversations. Please try again.');
    }
  }

  filterConversations() {
    if (!this.searchTerm) {
      this.filteredConversations = [...this.conversations];
      this.elements.clearSearchBtn.style.display = 'none';
    } else {
      this.filteredConversations = this.conversations.filter(conv => {
        // Search in conversation ID
        if (conv.id.toLowerCase().includes(this.searchTerm)) return true;
        
        // Search in preview text
        if (conv.preview.toLowerCase().includes(this.searchTerm)) return true;
        
        // Search in analysis data if available
        if (conv.analysis) {
          const analysisFields = [
            'customerName', 'customerEmail', 'customerPhone', 
            'customerIndustry', 'customerProblem'
          ];
          
          return analysisFields.some(field => 
            conv.analysis[field] && 
            conv.analysis[field].toLowerCase().includes(this.searchTerm)
          );
        }
        
        return false;
      });
      this.elements.clearSearchBtn.style.display = 'block';
    }
    
    this.displayConversations(this.filteredConversations);
  }

  displayConversations(conversations) {
    this.hideLoading('conversations-loading');
    
    if (conversations.length === 0) {
      this.elements.conversationsList.innerHTML = `
        <div class="empty-state">
          <p>No conversations found</p>
          <p>Start chatting to see conversations here</p>
        </div>
      `;
      return;
    }

    this.elements.conversationsList.innerHTML = conversations.map(conv => {
      let formattedDate = 'Unknown';
      let formattedTime = 'Unknown';
      
      try {
        if (conv.createdAt) {
          const date = new Date(conv.createdAt);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString();
            formattedTime = date.toLocaleTimeString();
          }
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }
      
      // Safely handle conversation ID
      const conversationId = conv.id || conv.conversation_id || 'unknown';
      const preview = conv.lastMessage || conv.preview || 'No messages';
      const messageCount = conv.messageCount || 0;
      const updatedAt = conv.updatedAt || conv.createdAt;
      
      return `
        <div class="conversation-item" data-id="${conversationId}">
          <div class="conversation-preview">
            <div class="conversation-header">
              <div class="conversation-id">ID: ${conversationId.substring(0, 8)}...</div>
              <div class="conversation-datetime">
                <span class="date">${formattedDate}</span>
                <span class="time">${formattedTime}</span>
              </div>
            </div>
            <div class="preview-text">${this.escapeHtml(preview)}</div>
            <div class="conversation-meta">
              <span class="message-count">${messageCount} messages</span>
              <span class="timestamp">${this.formatTimestamp(updatedAt)}</span>
            </div>
          </div>
          <div class="conversation-actions">
            <div class="conversation-arrow">→</div>
            <button class="analyze-btn" data-id="${conversationId}" title="Analyze conversation" aria-label="Analyze conversation">
              <span>🔍</span>
            </button>
            <button class="delete-btn" data-id="${conversationId}" title="Delete conversation" aria-label="Delete conversation">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.addConversationEventListeners();
  }

  addConversationEventListeners() {
    // Add click listeners for conversation items
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on delete or analyze button
        if (e.target.closest('.delete-btn') || e.target.closest('.analyze-btn')) {
          return;
        }
        const conversationId = item.dataset.id;
        this.loadConversationDetails(conversationId);
      });
    });

    // Add delete button listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const conversationId = btn.dataset.id;
        this.deleteConversation(conversationId);
      });
    });

    // Add analyze button listeners
    document.querySelectorAll('.analyze-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const conversationId = btn.dataset.id;
        // Load conversation details first, then analyze
        this.loadConversationDetails(conversationId).then(() => {
          this.analyzeConversation(conversationId);
        });
      });
    });
  }

  async loadConversationDetails(conversationId) {
    this.currentConversationId = conversationId;
    
    try {
      this.showLoading('messages-loading');
      
      // Detect the correct API URL based on current environment
      let apiUrl;
      const currentHostname = window.location.hostname;
      
      if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
        // Local development - use port 3001 for backend
        apiUrl = `http://${currentHostname}:3001/api/conversations/${conversationId}`;
      } else {
        // Production - use relative URL
        apiUrl = `/api/conversations/${conversationId}`;
      }
      
      console.log('🔗 Fetching conversation details from:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (response.ok) {
        this.displayConversationDetails(data);
        return data;
      } else {
        this.showError('Failed to load conversation details');
        return null;
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
      this.showError('Failed to load conversation details');
      return null;
    }
  }

  displayConversationDetails(data) {
    this.hideLoading('messages-loading');
    
    // Handle both conversationId and conversation_id formats
    const conversationId = data.conversationId || data.conversation_id;
    if (conversationId) {
      this.elements.conversationTitle.textContent = `Conversation ${conversationId.substring(0, 8)}...`;
    } else {
      this.elements.conversationTitle.textContent = 'Conversation Details';
    }
    
    if (!data.messages || data.messages.length === 0) {
      this.elements.messagesContainer.innerHTML = `
        <div class="empty-state">
          <p>No messages in this conversation</p>
        </div>
      `;
    } else {
      this.elements.messagesContainer.innerHTML = data.messages.map(msg => `
        <div class="message-item ${msg.role}">
          <div class="message-content">
            <div class="message-text">${this.escapeHtml(msg.content)}</div>
            <div class="message-role">${msg.role === 'user' ? 'You' : 'AI Assistant'}</div>
          </div>
        </div>
      `).join('');
    }
    
    // Hide analysis section by default
    this.elements.analysisSection.style.display = 'none';
    
    this.showConversationDetails();
  }

  showConversationDetails() {
    this.elements.conversationsSection.style.display = 'none';
    this.elements.conversationDetails.style.display = 'block';
  }

  showConversationsList() {
    this.elements.conversationDetails.style.display = 'none';
    this.elements.conversationsSection.style.display = 'block';
    this.currentConversationId = null;
  }

  async deleteConversation(conversationId) {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      // Detect the correct API URL based on current environment
      let apiUrl;
      const currentHostname = window.location.hostname;
      
      if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
        // Local development - use port 3001 for backend
        apiUrl = `http://${currentHostname}:3001/api/conversations/${conversationId}`;
      } else {
        // Production - use relative URL
        apiUrl = `/api/conversations/${conversationId}`;
      }
      
      console.log('🗑️ Deleting conversation from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local array
        this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
        
        // Reload conversations list
        this.loadConversations();
        
        // If we're viewing the deleted conversation, go back to list
        if (this.currentConversationId === conversationId) {
          this.showConversationsList();
        }
      } else {
        const data = await response.json();
        alert(`Failed to delete conversation: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  }

  async analyzeConversation(conversationId) {
    try {
      // Show analysis section if not already visible
      this.elements.analysisSection.style.display = 'block';
      this.showLoading('analysis-loading');
      
      // Detect the correct API URL based on current environment
      let apiUrl;
      const currentHostname = window.location.hostname;
      
      if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
        // Local development - use port 3001 for backend
        apiUrl = `http://${currentHostname}:3001/api/conversations/${conversationId}/analyze`;
      } else {
        // Production - use relative URL
        apiUrl = `/api/conversations/${conversationId}/analyze`;
      }
      
      console.log('🔍 Analyzing conversation from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.displayAnalysis(data.analysis);
        
        // Update local conversations array
        const convIndex = this.conversations.findIndex(conv => conv.id === conversationId);
        if (convIndex !== -1) {
          this.conversations[convIndex].analysis = data.analysis;
        }
      } else {
        const data = await response.json();
        alert(`Failed to analyze conversation: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      alert('Failed to analyze conversation. Please try again.');
    } finally {
      this.hideLoading('analysis-loading');
    }
  }

  displayAnalysis(analysis) {
    // Handle both string and object analysis data
    if (typeof analysis === 'string') {
      // API returns a string analysis
      this.elements.analysisContent.innerHTML = `
        <div class="analysis-simple">
          <h5>Conversation Analysis</h5>
          <div class="analysis-text">
            <p>${this.escapeHtml(analysis)}</p>
          </div>
        </div>
      `;
      return;
    }
    
    // Validate analysis object data
    if (!analysis || typeof analysis !== 'object') {
      console.error('Invalid analysis data:', analysis);
      this.elements.analysisContent.innerHTML = `
        <div class="error-state">
          <p>Invalid analysis data received</p>
        </div>
      `;
      return;
    }
    
    // Safely handle leadQuality
    const leadQuality = analysis.leadQuality || 'unknown';
    const leadQualityClass = leadQuality === 'good' ? 'quality-good' : 
                            leadQuality === 'ok' ? 'quality-ok' : 'quality-spam';
    
    this.elements.analysisContent.innerHTML = `
      <div class="analysis-grid">
        <div class="analysis-card">
          <h5>Customer Information</h5>
          <div class="analysis-field">
            <label>Name:</label>
            <span>${analysis.customerName || 'Not provided'}</span>
          </div>
          <div class="analysis-field">
            <label>Email:</label>
            <span>${analysis.customerEmail || 'Not provided'}</span>
          </div>
          <div class="analysis-field">
            <label>Phone:</label>
            <span>${analysis.customerPhone || 'Not provided'}</span>
          </div>
          <div class="analysis-field">
            <label>Industry:</label>
            <span>${analysis.customerIndustry || 'Not specified'}</span>
          </div>
        </div>
        
        <div class="analysis-card">
          <h5>Business Details</h5>
          <div class="analysis-field">
            <label>Problems/Needs:</label>
            <span>${analysis.customerProblem || 'Not specified'}</span>
          </div>
          <div class="analysis-field">
            <label>Availability:</label>
            <span>${analysis.customerAvailability || 'Not specified'}</span>
          </div>
          <div class="analysis-field">
            <label>Consultation Booked:</label>
            <span>${analysis.customerConsultation ? 'Yes' : 'No'}</span>
          </div>
        </div>
        
        <div class="analysis-card">
          <h5>Lead Assessment</h5>
          <div class="analysis-field">
            <label>Lead Quality:</label>
            <span class="lead-quality ${leadQualityClass}">${leadQuality.toUpperCase()}</span>
          </div>
          <div class="analysis-field">
            <label>Special Notes:</label>
            <span>${analysis.specialNotes || 'None'}</span>
          </div>
        </div>
      </div>
    `;
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    
    try {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    } catch (error) {
      console.error('Error escaping HTML:', error);
      return String(text).replace(/[&<>"']/g, function(match) {
        const escape = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return escape[match];
      });
    }
  }

  showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'flex';
    }
  }

  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'none';
    }
  }

  showError(message) {
    this.elements.conversationsList.innerHTML = `
      <div class="error-state">
        <p>${message}</p>
        <button onclick="dashboardApp.loadConversations()">Try Again</button>
      </div>
    `;
  }
}

// Initialize the dashboard when DOM is loaded
let dashboardApp;
document.addEventListener('DOMContentLoaded', () => {
  dashboardApp = new DashboardApp();
}); 