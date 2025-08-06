// Voice Manager Class
class VoiceManager {
  constructor() {
    this.speechRecognition = null;
    this.speechSynthesis = window.speechSynthesis;
    this.isRecording = false;
    this.isVoiceOutputEnabled = false;
    this.recognition = null;
    this.initializeSpeechRecognition();
  }

  initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'vi-VN'; // Default to Vietnamese
      
      this.recognition.onstart = () => {
        this.isRecording = true;
        this.updateVoiceInputButton(true);
      };
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.onVoiceInputResult(transcript);
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.showVoiceIndicator('Lỗi nhận dạng giọng nói');
        this.stopRecording();
      };
      
      this.recognition.onend = () => {
        this.stopRecording();
      };
    } else {
      console.warn('Speech recognition not supported');
    }
  }

  startRecording() {
    if (!this.recognition) {
      this.showVoiceIndicator('Trình duyệt không hỗ trợ nhận dạng giọng nói');
      return;
    }
    
    try {
      this.recognition.start();
      this.showVoiceIndicator('Đang nghe...');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.showVoiceIndicator('Không thể bắt đầu ghi âm');
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      this.updateVoiceInputButton(false);
    }
  }

  updateVoiceInputButton(isRecording) {
    const voiceInputBtn = document.getElementById('voice-input-btn');
    if (voiceInputBtn) {
      if (isRecording) {
        voiceInputBtn.classList.add('recording');
      } else {
        voiceInputBtn.classList.remove('recording');
      }
    }
  }

  toggleVoiceOutput() {
    this.isVoiceOutputEnabled = !this.isVoiceOutputEnabled;
    const voiceOutputBtn = document.getElementById('voice-output-btn');
    if (voiceOutputBtn) {
      if (this.isVoiceOutputEnabled) {
        voiceOutputBtn.classList.add('active');
      } else {
        voiceOutputBtn.classList.remove('active');
      }
    }
    
    const message = this.isVoiceOutputEnabled ? 'Đã bật giọng nói' : 'Đã tắt giọng nói';
    this.showVoiceIndicator(message);
  }

  speak(text) {
    if (!this.isVoiceOutputEnabled || !this.speechSynthesis) return;
    
    // Stop any current speech
    this.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.detectLanguage(text);
    utterance.rate = 0.9; // Slightly slower for better understanding
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    this.speechSynthesis.speak(utterance);
  }

  detectLanguage(text) {
    // Simple language detection
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseChars.test(text) ? 'vi-VN' : 'en-US';
  }

  showVoiceIndicator(message) {
    // Remove existing indicator
    const existingIndicator = document.querySelector('.voice-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'voice-indicator';
    indicator.textContent = message;
    document.body.appendChild(indicator);
    
    // Remove after animation
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 2000);
  }

  onVoiceInputResult(transcript) {
    // This will be set by the main chatbot app
    if (this.onVoiceResultCallback) {
      this.onVoiceResultCallback(transcript);
    }
  }
}

// Chatbot Application - Optimized JavaScript
class ChatbotApp {
  constructor() {
    this.isChatOpen = false;
    this.isMinimized = false;
    this.sessionId = this.generateSessionId();
    this.elements = this.initializeElements();
    this.voiceManager = new VoiceManager();
    this.bindEvents();
    this.initializeNavEffects();
    
    // Connect voice manager to chatbot
    this.voiceManager.onVoiceResultCallback = (transcript) => {
      this.handleVoiceInput(transcript);
    };

    // Start conversation when chatbot is initialized
    this.startConversation();
  }

  async startConversation() {
    try {
      console.log('🆕 Starting new conversation...');
      
      const response = await fetch('http://localhost:3001/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionId = data.conversation_id;
      
      console.log('✅ Conversation started:', this.sessionId);
      
      // Store session ID in localStorage
      localStorage.setItem('chatSessionId', this.sessionId);
      
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      
      // Fallback to local session ID
      this.sessionId = this.generateSessionId();
      console.log('🔄 Using fallback session ID:', this.sessionId);
    }
  }

  generateSessionId() {
    const sessionId = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', sessionId);
    return sessionId;
  }

  initializeElements() {
    return {
      chatWindow: document.getElementById('chat-window'),
      chatInputContainer: document.querySelector('.chat-input-container'),
      chatForm: document.getElementById('chat-form'),
      userInput: document.getElementById('user-input'),
      sendButton: document.getElementById('send-button'),
      closeChatBtn: document.getElementById('close-chat'),
      dashboardBtn: document.getElementById('dashboard-btn'),
      chatbotContainer: document.querySelector('.chatbot-container'),
      vImg: document.querySelector('.v'),
      nioImg: document.querySelector('.nio'),
      // Compact mode elements
      closeChatCompactBtn: document.getElementById('close-chat-compact'),
      minimizeChatBtn: document.getElementById('minimize-chat'),
      chatToggle: document.getElementById('chat-toggle'),
      chatHeaderAvatar: document.getElementById('chat-header-avatar'),
      // Voice control elements
      voiceInputBtn: document.getElementById('voice-input-btn'),
      voiceOutputBtn: document.getElementById('voice-output-btn')
    };
  }

  bindEvents() {
    // Close chat
    this.elements.closeChatBtn?.addEventListener('click', () => this.closeChat());
    
    // Compact mode controls
    this.elements.closeChatCompactBtn?.addEventListener('click', () => this.closeChat());
    this.elements.minimizeChatBtn?.addEventListener('click', () => this.toggleMinimize());
    
    // Toggle button
    this.elements.chatToggle?.addEventListener('click', () => this.toggleChat());
    
    // Chat header avatar close
    this.elements.chatHeaderAvatar?.addEventListener('click', () => this.closeChat());
    
    // Dashboard button
    this.elements.dashboardBtn?.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });

    // Form submission
    this.elements.chatForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    
    // Input focus
    this.elements.userInput?.addEventListener('focus', () => this.handleInputFocus());
    
    // Enter key
    this.elements.userInput?.addEventListener('keypress', (e) => this.handleKeyPress(e));
    
    // Auto resize textarea
    this.elements.userInput?.addEventListener('input', () => this.autoResizeTextarea());
    
    // Voice control events
    this.elements.voiceInputBtn?.addEventListener('click', () => this.handleVoiceInputClick());
    this.elements.voiceOutputBtn?.addEventListener('click', () => this.handleVoiceOutputClick());
    
    // Close chat when clicking outside
    document.addEventListener('click', (e) => this.handleOutsideClick(e));
  }

  initializeNavEffects() {
    const navLinks = document.querySelectorAll('nav a');
    const navUnderline = document.querySelector('.nav-underline');
    const nav = document.querySelector('nav');

    if (!navLinks.length || !navUnderline || !nav) return;

    navLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const linkRect = link.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        
        const left = linkRect.left - navRect.left;
        const width = linkRect.width;
        
        navUnderline.style.left = `${left}px`;
        navUnderline.style.width = `${width}px`;
      });
    });

    nav.addEventListener('mouseleave', () => {
      navUnderline.style.width = '0';
    });
  }

  toggleChat() {
    if (!this.isChatOpen) {
      this.openChat();
    } else {
      this.closeChat();
    }
  }

  openChat() {
    const { chatbotContainer, chatWindow, chatInputContainer, userInput, closeChatBtn, dashboardBtn, vImg, nioImg, chatToggle } = this.elements;

    // Add compact class for the new compact mode
    chatbotContainer?.classList.add('compact');
    chatbotContainer?.classList.remove('fullscreen');
    
    // Ensure chat window and input are visible (CSS will handle the display)
    if (chatWindow) {
      chatWindow.classList.add('active');
    }
    
    this.isChatOpen = true;
    this.isMinimized = false;
    userInput?.focus();
    
    // Hide toggle button when chat is open
    if (chatToggle) chatToggle.style.display = 'none';
    
    // Hide original fullscreen buttons
    if (closeChatBtn) closeChatBtn.style.display = 'none';
    if (dashboardBtn) dashboardBtn.style.display = 'none';
    
    // Scroll to bottom when chat opens
    setTimeout(() => {
      const messagesContainer = chatWindow?.querySelector('.messages-container');
      if (messagesContainer) {
        this.scrollToBottom(messagesContainer);
      } else if (chatWindow) {
        this.scrollToBottom(chatWindow);
      }
    }, 100);
  }

  closeChat() {
    const { chatbotContainer, chatWindow, chatInputContainer, chatToggle, closeChatBtn, dashboardBtn } = this.elements;

    // Remove compact class
    chatbotContainer?.classList.remove('compact', 'minimized');
    chatbotContainer?.classList.remove('fullscreen');
    
    // Hide chat window and input (CSS will handle the display)
    if (chatWindow) {
      chatWindow.classList.remove('active');
    }
    
    this.isChatOpen = false;
    this.isMinimized = false;
    
    // Show toggle button when chat is closed
    if (chatToggle) {
      chatToggle.style.display = 'flex';
      chatToggle.classList.remove('active');
    }
    
    // Show original fullscreen buttons
    if (closeChatBtn) closeChatBtn.style.display = 'block';
    if (dashboardBtn) dashboardBtn.style.display = 'block';
  }

  toggleMinimize() {
    const { chatbotContainer, minimizeChatBtn, chatInputContainer, userInput, chatHeaderAvatar } = this.elements;
    
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      chatbotContainer?.classList.add('minimized');
      if (minimizeChatBtn) minimizeChatBtn.innerHTML = '<span>□</span>';
      // CSS will handle the display of chat input container
    } else {
      chatbotContainer?.classList.remove('minimized');
      if (minimizeChatBtn) minimizeChatBtn.innerHTML = '<span>−</span>';
      userInput?.focus();
    }
    
    // Add click sound effect
    this.playClickSound();
  }

  handleOutsideClick(e) {
    const { chatbotContainer, chatToggle } = this.elements;
    
    // Only handle outside clicks if chat is open in compact mode
    if (!this.isChatOpen || !chatbotContainer?.classList.contains('compact')) {
      return;
    }
    
    // Check if click is outside the chat container and not on the toggle button
    if (!chatbotContainer.contains(e.target) && !chatToggle?.contains(e.target)) {
      this.closeChat();
    }
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const message = this.elements.userInput?.value.trim();
    if (!message) return;
    
    this.addMessage(message, 'user');
    this.elements.userInput.value = '';
    
    // Reset textarea height after sending
    if (this.elements.userInput) {
      this.elements.userInput.style.height = 'auto';
    }
    
    this.getOpenAIResponse(message);
  }

  handleInputFocus() {
    if (this.elements.chatWindow?.classList.contains('active')) {
      const welcomeMessage = document.querySelector('.welcome-message');
      if (welcomeMessage) {
        welcomeMessage.style.opacity = '0';
        setTimeout(() => welcomeMessage.remove(), 300);
      }
    }
  }

  handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.elements.chatForm?.dispatchEvent(new Event('submit'));
    }
  }

  autoResizeTextarea() {
    const textarea = this.elements.userInput;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight
    const newHeight = Math.min(textarea.scrollHeight, textarea.classList.contains('compact') ? 80 : 120);
    textarea.style.height = newHeight + 'px';
  }

  playClickSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  addMessage(text, sender) {
    if (!this.elements.chatWindow) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    // Display message immediately without typing effect
    bubble.textContent = text;
    msgDiv.appendChild(bubble);
    
    // In compact mode, append to messages-container
    const messagesContainer = this.elements.chatWindow.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.appendChild(msgDiv);
      this.scrollToBottom(messagesContainer);
    } else {
      // Fallback to original behavior
      this.elements.chatWindow.appendChild(msgDiv);
      this.scrollToBottom(this.elements.chatWindow);
    }
    
    this.playClickSound();
  }

  scrollToBottom(element) {
    // Smooth scroll to bottom
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  }

  setLoadingState(isLoading) {
    const { sendButton } = this.elements;
    const sendIcon = document.querySelector('.send-icon');
    
    if (isLoading) {
      if (sendIcon) sendIcon.style.visibility = 'hidden';
      if (sendButton) sendButton.disabled = true;
    } else {
      if (sendIcon) sendIcon.style.visibility = 'visible';
      if (sendButton) sendButton.disabled = false;
    }
  }

  async getOpenAIResponse(message) {
    this.setLoadingState(true);
    
    try {
      // Ensure we have a session ID
      if (!this.sessionId) {
        console.log('🔄 No session ID, starting new conversation...');
        await this.startConversation();
      }
      
      // Use persistent server for local development
      const apiUrl = 'http://localhost:3001/api/chat';
      
      console.log('🌐 Calling API:', apiUrl, 'with sessionId:', this.sessionId);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message, sessionId: this.sessionId })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      this.setLoadingState(false);
      
      if (data.response) {
        // Add message immediately without delay
        this.addMessage(data.response, 'bot');
        // Speak the response if voice output is enabled
        this.voiceManager.speak(data.response);
      } else {
        this.addMessage('I apologize, but I encountered an issue processing your request. Please try again.', 'bot');
      }
    } catch (err) {
      this.setLoadingState(false);
      
      console.error('❌ API Error:', err);
      
      // Fallback response for testing typing effect when server is down
      const fallbackResponses = [
        "Hello! I'm NiO Assistant. How can I help you today?",
        "I understand your question. Let me think about that...",
        "That's an interesting point. Here's what I think about it.",
        "Thank you for your message. I'm here to assist you with any questions you might have.",
        "I'm currently in demo mode since the server is offline, but I can still show you the typing effect!"
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      this.addMessage(randomResponse, 'bot');
      // Speak the response if voice output is enabled
      this.voiceManager.speak(randomResponse);
      
      console.warn('Server connection failed, using fallback response:', err);
    } finally {
      this.setLoadingState(false);
    }
  }

  handleVoiceInputClick() {
    if (this.voiceManager.isRecording) {
      this.voiceManager.stopRecording();
    } else {
      this.voiceManager.startRecording();
    }
  }

  handleVoiceOutputClick() {
    this.voiceManager.toggleVoiceOutput();
  }

  handleVoiceInput(transcript) {
    const message = transcript.trim();
    if (!message) return;

    this.addMessage(message, 'user');
    this.elements.userInput.value = '';

    // Reset textarea height after sending
    if (this.elements.userInput) {
      this.elements.userInput.style.height = 'auto';
    }

    this.getOpenAIResponse(message);
  }
}

// Initialize the chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatbotApp();
}); 