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
      const response = await fetch('http://localhost:3001/api/conversations');
      const data = await response.json();
      
      if (response.ok) {
        this.conversations = data.conversations;
        this.filteredConversations = [...this.conversations];
        this.displayConversations(this.filteredConversations);
      } else {
        this.showError('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      this.showError('Failed to load conversations');
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
      const date = new Date(conv.createdAt);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();
      
      return `
        <div class="conversation-item" data-id="${conv.id}">
          <div class="conversation-preview">
            <div class="conversation-header">
              <div class="conversation-id">ID: ${conv.id.substring(0, 8)}...</div>
              <div class="conversation-datetime">
                <span class="date">${formattedDate}</span>
                <span class="time">${formattedTime}</span>
              </div>
            </div>
            <div class="preview-text">${conv.preview}</div>
            <div class="conversation-meta">
              <span class="message-count">${conv.messageCount} messages</span>
              <span class="timestamp">${this.formatTimestamp(conv.updatedAt)}</span>
            </div>
          </div>
          <div class="conversation-actions">
            <div class="conversation-arrow">→</div>
            <button class="analyze-btn" data-id="${conv.id}" title="Analyze conversation" aria-label="Analyze conversation">
              <span>🔍</span>
            </button>
            <button class="delete-btn" data-id="${conv.id}" title="Delete conversation" aria-label="Delete conversation">
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
      const response = await fetch(`http://localhost:3001/api/conversations/${conversationId}`);
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
    
    this.elements.conversationTitle.textContent = `Conversation ${data.conversationId.substring(0, 8)}...`;
    
    if (data.messages.length === 0) {
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
      const response = await fetch(`http://localhost:3001/api/conversations/${conversationId}`, {
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
      
      const response = await fetch(`http://localhost:3001/api/conversations/${conversationId}/analyze`, {
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
    const leadQualityClass = analysis.leadQuality === 'good' ? 'quality-good' : 
                            analysis.leadQuality === 'ok' ? 'quality-ok' : 'quality-spam';
    
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
            <span class="lead-quality ${leadQualityClass}">${analysis.leadQuality.toUpperCase()}</span>
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
    const date = new Date(timestamp);
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
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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