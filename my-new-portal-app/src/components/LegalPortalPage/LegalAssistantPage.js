import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPaperPlane, FaMicrophone, FaStop, FaPaperclip, FaRobot,
  FaCopy, FaDownload, FaTimes, FaFilePdf, FaPenFancy,
  FaChevronDown, FaBars, FaPlus, FaGem, FaSync, FaShieldAlt,
  FaFileContract,
  FaWhatsapp, FaFileWord, FaExclamationTriangle, FaWallet, FaHeadset, FaArrowDown
} from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import './LegalAssistantPage.css';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3000/api';

const GEMINI_MODELS = [
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Complex Legal Reasoning', context: '1M' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Fast Citation & Research', context: '1M' },
  { id: 'gemini-ultra', name: 'Gemini Ultra', desc: 'Deep Legacy Analysis', context: '32k' },
];

const USERS = ['Counsel_A', 'Associate_B', 'Partner_C'];

const LEGAL_TEMPLATES = [
  {
    id: 'nda', label: 'Non-Disclosure Agreement', icon: '🔒',
    prompt: "Draft a comprehensive Non-Disclosure Agreement (NDA) between [Disclosing Party] and [Receiving Party]. \nJurisdiction: [State/Country]. \nKey Terms: \n1. Definition of Confidential Information: [Broad/Specific] \n2. Duration: [Number] years \n3. Exclusions: Standard exclusions. \n4. Purpose: [Describe Purpose, e.g., Mergers & Acquisitions discussion]."
  },
  {
    id: 'employment', label: 'Employment Contract', icon: '💼',
    prompt: "Draft a full-time Employment Contract for the position of [Job Title]. \nEmployer: [Company Name] \nEmployee: [Employee Name] \nJurisdiction: [State/Country] \nKey Terms: \n1. Salary: [Amount] per annum \n2. Start Date: [Date] \n3. Probation Period: [Number] months \n4. Termination Notice: [Number] weeks."
  },
  {
    id: 'cease', label: 'Cease & Desist Letter', icon: '🛑',
    prompt: "Draft a formal Cease and Desist letter addressed to [Infringer Name] regarding the unauthorized use of [Protected Work/IP]. \nCopyright/Trademark Details: [Registration Number/Description]. \nDemands: \n1. Stop all use immediately. \n2. Remove content from [Platform/Website]. \n3. Confirm compliance by [Date]. \nTone: Firm and authoritative."
  },
  {
    id: 'lease', label: 'Commercial Lease', icon: '🏢',
    prompt: "Draft a Commercial Lease Agreement for property located at [Address]. \nLandlord: [Name] \nTenant: [Name] \nRent: [Amount] per month \nTerm: [Number] years starting [Date]. \nUse of Premises: [Office/Retail/Industrial]. \nSecurity Deposit: [Amount]."
  },
  {
    id: 'memo', label: 'Legal Memo', icon: '📝',
    prompt: "Draft a Legal Memorandum analyzing the issue of [Legal Issue, e.g., Wrongful Termination] under [Jurisdiction] law. \nFacts: [Briefly state key facts]. \nQuestion Presented: [Specific legal question]. \nConclusion: [Brief conclusion if known, or ask AI to conclude]."
  },
  {
    id: 'client-letter', label: 'Client Explanation Letter', icon: '✉',
    prompt: "Draft a clear, plain-English letter to my client [Client Name] explaining the attached legal document [Document Name]. \nKey Points to Highlight: \n1. [Point 1] \n2. [Point 2] \nTone: Professional, reassuring, and easy to understand. Avoid legal jargon."
  }
];

// --- Storage Helper Replaced with API ---
const apiStorage = {
  fetchHistory: async (userId) => {
    try {
      const token = localStorage.getItem('lexai_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Use /history endpoint
      const res = await fetch(`${API_BASE_URL}/chat/history`, { headers });
      if (res.ok) {
        const rawData = await res.json();
        // Backend now returns Session Objects: { id, title, messages: [], timestamp }
        return rawData.map(session => ({
          id: session.id,
          title: session.title || 'New Conversation',
          date: session.timestamp,
          messages: session.messages || []
        }));
      }
      return [];
    } catch (e) {
      console.error("Fetch history failed", e);
      return [];
    }
  },

  deleteChat: async (chatId) => {
    try {
      const token = localStorage.getItem('lexai_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // If we are deleting a SESSION, we might need a different endpoint?
      // Assuming existing endpoint can handle session ID deletion if updated.
      // Or we can just use the provided ID.
      // Wait, deleteChat in controller does "deleteMessage". I might need to update that to delete session.
      // But for now, let's keep it.
      await fetch(`${API_BASE_URL}/chat/history/${chatId}`, { method: 'DELETE', headers });
      return true;
    } catch (e) { return false; }
  },

  fetchReports: async (userId, type) => {
    try {
      const token = localStorage.getItem('lexai_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API_BASE_URL}/reports?limit=50`;
      if (type) url += `&type=${type}`;

      const res = await fetch(url, { headers });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error("Fetch reports failed", e);
      return [];
    }
  }
};

// --- API Service Extended ---
const apiService = {
  // Auth to get userId (Login)
  login: async (username) => {
    const pwd = 'securepassword123';
    try {
      // Logic: If we are calling login here, it's likely a forced re-auth or demo fallback.
      // But we should try to use real login endpoint.
      let res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pwd })
      });

      // Auto-Register if user missing (for demo purposes)
      if (!res.ok && res.status !== 500) {
        const regRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email: `${username.toLowerCase()}@lexai.demo`,
            password: pwd,
            profession: 'lawyer',
            mobile: '9999999999',
            whatsapp: '9999999999',
            termsAgreed: 'true'
          })
        });
        if (regRes.ok) {
          res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pwd })
          });
        }
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('lexai_token', data.token);
        localStorage.setItem('lexai_userid', data.userId);
        return data.userId;
      }
      return null;
    } catch (error) {
      console.error("Auth Error:", error);
      return null;
    }
  },

  getTokenUsage: async (userId) => {
    try {
      const token = localStorage.getItem('lexai_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // If userId is passed, fine. If not, use 'me' or just rely on backend extraction if route supports it.
      // Backend route is /token/:userId
      const target = userId || 'me';
      const res = await fetch(`${API_BASE_URL}/chat/token/${target}`, { headers });
      const data = await res.json();
      return data.totalTokens || 0;
    } catch (e) {
      return 0;
    }
  },

  // Streaming Chat & Persistence
  generateStream: async (prompt, userId, chatId, mode, file, onStream, onComplete, onBilling, onAnalysis, onPDF) => {
    try {
      const controller = new AbortController();
      const token = localStorage.getItem('lexai_token');
      const headers = {}; // Let browser set Content-Type for FormData
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let body;
      if (file) {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('chatId', chatId);
        formData.append('message', prompt);
        formData.append('mode', mode);
        formData.append('file', file);
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          userId,
          chatId,
          message: prompt,
          mode: mode
        });
      }

      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      });

      if (!response.ok) {
        let errDetails = "Backend connection failed";
        try { errDetails = await response.text(); } catch (e) { }
        throw new Error(`Backend Error ${response.status}: ${errDetails}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let receivedSessionId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          // Check for Billing Event
          if (line.startsWith('event: billing')) {
            // Next line should be data
            continue;
          }

          // Check for Analysis Event (Futuristic UX)
          if (line.startsWith('event: analysis')) {
            continue;
          }

          // Check for PDF Event
          if (line.startsWith('event: pdf')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') break;
            try {
              const data = JSON.parse(jsonStr);

              // Handle Billing Data
              if (data.cost !== undefined && onBilling) {
                onBilling(data);
              }

              // Handle Analysis Data
              if (data.intent && onAnalysis) {
                onAnalysis(data);
              }

              // Handle PDF Data
              if (data.file && onPDF) {
                onPDF(data.file, data.filename);
              }

              if (data.sessionId) {
                receivedSessionId = data.sessionId;
              }

              if (data.text) {
                fullText += data.text;
                onStream(fullText);
              }
            } catch (e) {
              // ignore partial json
            }
          }
        }
      }
      onComplete(fullText, mode, receivedSessionId);

    } catch (error) {
      console.error("Stream Error:", error);
      onComplete(`Connection Error: ${error.message}`, mode, null);
    }
  },

  fetchTemplates: async () => {
    try {
      const token = localStorage.getItem('lexai_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/content/templates`, { headers });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.error("Template Fetch Error", e);
      return [];
    }
  },

  fetchConfig: async () => {
    try {
      const token = localStorage.getItem('lexai_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`; // Config is protected

      const res = await fetch(`${API_BASE_URL}/users/config`, { headers });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      console.error("System Config Fetch Error", e);
      return null;
    }
  }
};

// --- Components ---

const Toast = ({ message, show }) => (
  <div className={`toast-notification ${show ? 'show' : ''}`}>
    {message}
  </div>
);

// --- New Futuristic UI Components ---

const ThinkingBubble = () => (
  <motion.div
    className="msg-row msg-ai"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="msg-avatar"><FaGem /></div>
    <div className="msg-bubble thinking-bubble">
      <div className="thinking-dots">
        <span></span><span></span><span></span>
      </div>
      <span className="thinking-text">Analyzing Legal Precedents...</span>
    </div>
  </motion.div>
);

const LegalRenderer = {
  code: ({ node, inline, className, children, ...props }) => {
    const text = String(children);
    const isLegal = /Section|Act|Article|Case|vs\.|v\./i.test(text);
    if (inline && isLegal) {
      return (
        <span
          className="legal-citation"
          title="Click to view statute source"
          style={{ cursor: 'pointer', borderBottom: '1px dotted #D4AF37' }}
          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(text + ' Indian Law')}`, '_blank')}
        >
          {children}
        </span>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },
  a: ({ node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="md-link"
      style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 'bold' }}
    >
      {props.children} <span style={{ fontSize: '0.7em' }}>↗</span>
    </a>
  ),
  h1: ({ node, ...props }) => <h2 className="heading-text" {...props}>{props.children}</h2>,
  h2: ({ node, ...props }) => <h3 className="heading-text" {...props}>{props.children}</h3>,
  h3: ({ node, ...props }) => <strong className="heading-text" style={{ display: 'block' }} {...props}>{props.children}</strong>,
  blockquote: ({ node, ...props }) => <div className="quote-text">{props.children}</div>,
  table: ({ node, ...props }) => <div className="table-responsive"><table {...props} /></div>
};

const MessageBubble = ({ message, isLast, onCopy, onDownload, onRegenerate, onWhatsapp, onShare, onOpenDraft, generatedPdf }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      className={`msg-row ${isUser ? 'msg-user' : 'msg-ai'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isUser && <div className="msg-avatar"><FaGem /></div>}
      <div className="msg-content-wrapper">
        {!isUser && <span className="ai-badge"><FaRobot size={10} /> AI Generated</span>}
        <div className="msg-bubble">
          <div className="msg-text">
            {message.file && <div className="msg-file"><FaFilePdf /> {message.file.name}</div>}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={LegalRenderer}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          <div className="msg-actions">
            {/* Common Actions */}
            <button onClick={() => onCopy(message.content)} title="Copy Text" className="action-btn"><FaCopy /></button>
            <button onClick={() => onWhatsapp(message.content)} title="Share on WhatsApp" className="action-btn"><FaWhatsapp /></button>
            <button onClick={() => onShare(message.content)} title="Share" className="action-btn"><FaPaperPlane style={{ transform: 'rotate(-45deg)', fontSize: '0.8em' }} /></button>

            {/* AI-Only Actions */}
            {!isUser && (
              <>
                <button
                  onClick={() => {
                    if (generatedPdf) {
                      // Download High-Quality Backend PDF
                      const link = document.createElement('a');
                      link.href = `data:application/pdf;base64,${generatedPdf.file}`;
                      link.download = generatedPdf.filename || 'LexAI_Document.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      // Fallback to basic frontend PDF
                      onDownload(message.content);
                    }
                  }}
                  title={generatedPdf ? "Download Official PDF" : "Download PDF"}
                  className="action-btn"
                  style={generatedPdf ? { color: '#ef4444', borderColor: '#ef4444' } : {}}
                >
                  <FaFilePdf />
                </button>
                <button onClick={() => onOpenDraft(message.content)} title="Open in Draft Editor" className="action-btn"><FaPenFancy /></button>
                {message.content.includes('Legal Certainty Level') && (
                  <button onClick={() => window.handleOpenResearch(message.content)} title="Open Research Studio" className="action-btn" style={{ color: '#8b5cf6' }}>
                    <FaGem />
                  </button>
                )}
                {isLast && <button onClick={onRegenerate} title="Regenerate Response" className="action-btn"><FaSync /></button>}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Logic Handlers (Helpers) ---

const parseDraftResponse = (text) => {
  // Regex to extract the Content between "Draft Content" and "Draft Review Notes"
  // Based on draft.md structure
  const contentRegex = /###\s*2️⃣\s*Draft\s*Content([\s\S]*?)###\s*3️⃣/;
  const contentMatch = text.match(contentRegex);

  if (contentMatch && contentMatch[1]) {
    // We found the document content
    const cleanDraft = contentMatch[1].trim();

    return {
      draft: cleanDraft,
      analysis: text // For now, keep full context available
    };
  }

  return { draft: text, analysis: null };
};

// --- Main Page ---
const LegalAssistantPage = () => {
  const navigate = useNavigate();

  // Config from Subscription
  const { currentPlan, getModelAccess } = useSubscription();

  // App State
  const [currentUser] = useState(() => {
    return localStorage.getItem('lexai_username') || USERS[0];
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed as requested
  const [canvasOpen, setCanvasOpen] = useState(false);

  // Effect: Auto-hide sidebar when canvas opens
  useEffect(() => {
    if (canvasOpen) setSidebarOpen(false);
  }, [canvasOpen]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const [toast, setToast] = useState({ show: false, msg: '' });
  // const [userProfileOpen, setUserProfileOpen] = useState(false); // Unused
  // const [userPortals, setUserPortals] = useState([]); // Unused
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [chatMode, setChatMode] = useState('advice'); // 'advice', 'draft', 'compare'
  const [dbTemplates, setDbTemplates] = useState([]);

  // Fetch Templates
  useEffect(() => {
    const loadTemplates = async () => {
      const t = await apiService.fetchTemplates();
      setDbTemplates(t);
    };
    loadTemplates();
  }, []);

  // Chat Data State
  const [history, setHistory] = useState([]);
  const [reportsHistory, setReportsHistory] = useState([]); // New Report History
  const [viewMode, setViewMode] = useState('chats'); // 'chats' | 'audits'

  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [availableModels, setAvailableModels] = useState(GEMINI_MODELS); // Dynamic Models
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [lastTx, setLastTx] = useState(null);

  // Fetch System Config (Models)
  useEffect(() => {
    const loadConfig = async () => {
      const config = await apiService.fetchConfig();
      if (config && config.supported_models) {
        setAvailableModels(config.supported_models);
        // If current selected is not in new list, default to first
        // We'll let the validation effect handle this or do it here? 
        // Validation effect handles it.
      }
    };
    loadConfig();
  }, []);


  // Input State
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // New State
  const [showCommands, setShowCommands] = useState(false); // Command Palette
  const [streamText, setStreamText] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState('');
  const [adviceAnalysis, setAdviceAnalysis] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState(null); // New: Intent/Context Analysis
  const [activeTab, setActiveTab] = useState('document'); // 'document', 'risk', 'research_analysis', 'research_sources'
  // const [totalTokens, setTotalTokens] = useState(0); // Unused in UI
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN'); // Default Hinglish/Indian English
  const [showScrollButton, setShowScrollButton] = useState(false); // Scroll Button State
  /* Helper for AI Completion */
  const chatBodyRef = useRef(null);
  const recognitionRef = useRef(null);
  const tempPdfRef = useRef(null); // Store streaming PDF temporarily

  const handleAICompletion = useCallback((finalContent, finalMode, receivedSessionId) => {
    setIsStreaming(false);
    setStreamText('');

    const newMessage = {
      role: 'ai',
      content: finalContent,
      timestamp: Date.now()
    };

    // Attach PDF if generated during stream
    if (tempPdfRef.current) {
      newMessage.generatedPdf = tempPdfRef.current;
      tempPdfRef.current = null; // Consume
    }

    setMessages(prev => [...prev, newMessage]);

    // const realSessionId = receivedSessionId || currentChatId;
    if (receivedSessionId && receivedSessionId !== currentChatId) {
      setCurrentChatId(receivedSessionId);
    }


    if (finalMode === 'draft') {
      // parseDraftResponse might not be init yet if const. Ensure it is available.
      // We will access it from component scope.
      const { draft, analysis } = parseDraftResponse(finalContent);
      setDraftContent(draft);
      setRiskAnalysis(analysis || finalContent);
      setCanvasOpen(true);
      setActiveTab('document');
    } else if (finalMode === 'risk_check') {
      setRiskAnalysis(finalContent);
      setActiveTab('risk');
      setCanvasOpen(true);
    } else if (finalMode === 'draft_analysis') {
      setAdviceAnalysis(finalContent);
      setActiveTab('research_analysis');
      setCanvasOpen(true);
    }

    // Refresh history
    setTimeout(async () => {
      try {
        const freshHistory = await apiStorage.fetchHistory(currentUserId);
        if (freshHistory.length) setHistory(freshHistory);

        // Also refresh reports if applicable
        if (['risk_check', 'draft_analysis'].includes(finalMode)) {
          const freshReports = await apiStorage.fetchReports(currentUserId);
          if (freshReports) setReportsHistory(freshReports);
        }
      } catch (e) { }
    }, 2000);
  }, [currentChatId, currentUserId]);

  const [socket, setSocket] = useState(null);

  // Socket Initialization
  useEffect(() => {
    // Connect to Root URL (remove /api)
    const socketUrl = API_BASE_URL.replace('/api', '');
    const newSocket = io(socketUrl, {
      transports: ['websocket'], // Force WebSocket
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log("Socket Connected:", newSocket.id);
    });

    newSocket.on('ai_thinking', () => {
      setIsThinking(true);
      setIsStreaming(true);
      setStreamText('');
    });

    newSocket.on('ai_stream_chunk', (data) => {
      setStreamText(prev => prev + data.text);
      // Note: Using functional update to avoid missing chars, but strictly, we might want fullText from server to be safe.
      // Server sends fullText as option.
      // if (data.fullText) setStreamText(data.fullText);
    });

    // We handle completion in a separate listener that calls our logic
    // But we need access to the latest state (messages, modes). 
    // This is tricky in useEffect with empty deps.
    // Solution: We'll put the completion logic in a separate function wrapped in useCallback or just refs.

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Socket Completion Handler (Needs access to current state context)
  useEffect(() => {
    if (!socket) return;

    const onComplete = (data) => {
      const { fullText, mode, chatId } = data;
      handleAICompletion(fullText, mode, chatId);
    };

    const onError = (data) => {
      setIsThinking(false);
      setIsStreaming(false);
      setStreamText(`Error: ${data.error}`);
    };

    socket.on('ai_stream_complete', onComplete);
    socket.on('ai_error', onError);

    return () => {
      socket.off('ai_stream_complete', onComplete);
      socket.off('ai_error', onError);
    };
  }, [socket, messages, currentChatId, activeTab, handleAICompletion]); // Re-bind on state change to ensure closure freshness

  // Validate Model selection against Plan
  useEffect(() => {
    const allowed = getModelAccess();
    if (allowed && !allowed.includes(selectedModel.id)) {
      // If current selected model is not allowed, switch to the first allowed one
      const validModelId = allowed[0];
      const validModel = availableModels.find(m => m.id === validModelId);
      if (validModel) setSelectedModel(validModel);
    }
  }, [currentPlan, selectedModel, getModelAccess, availableModels]);

  // Auth & Init
  useEffect(() => {
    const initUser = async () => {
      // 1. Check for Real Global Auth first
      let uid = localStorage.getItem('lexai_userid');

      // If no global auth, try the demo/legacy specific key (fallback)
      if (!uid) {
        uid = localStorage.getItem(`lexai_userid_${currentUser}`);
      }

      // If still no ID, and we are in demo mode (currentUser is one of the demos), try to login/reg
      if (!uid && USERS.includes(currentUser)) {
        uid = await apiService.login(currentUser);
      }

      setCurrentUserId(uid);

      // 2. Fetch History from DB
      if (uid) {
        const dbHistory = await apiStorage.fetchHistory(uid);
        setHistory(dbHistory);

        // Fetch Reports
        const dbReports = await apiStorage.fetchReports(uid);
        if (dbReports) setReportsHistory(dbReports);

        setMessages([]);
        setCurrentChatId(null);
        setCanvasOpen(false);

        // Fetch Wallet & Transactions
        try {
          let token = localStorage.getItem('lexai_token');
          let headers = { 'Authorization': `Bearer ${token}` };

          // 1. Fetch Balance (Auth Check)
          let balRes = await fetch(`${API_BASE_URL}/wallet/balance`, { headers });

          // If Auth Failed (Stale Token/User Deleted), Re-Login/Register
          if ((balRes.status === 401 || balRes.status === 404) && USERS.includes(currentUser)) {
            console.warn("Session stale, attempting auto-recovery for demo user...");
            const newUid = await apiService.login(currentUser);
            if (newUid) {
              token = localStorage.getItem('lexai_token'); // Get new token
              headers = { 'Authorization': `Bearer ${token}` };
              // Retry Balance
              balRes = await fetch(`${API_BASE_URL}/wallet/balance`, { headers });
            }
          }

          if (balRes.ok) {
            const data = await balRes.json();
            setWalletBalance(data.balance || 0);
          }

          // 2. Fetch Transactions (Independent)
          try {
            const txRes = await fetch(`${API_BASE_URL}/wallet/transactions`, { headers });
            if (txRes.ok) {
              const txData = await txRes.json();
              if (Array.isArray(txData)) {
                // setTransactions(txData);
                if (txData.length > 0) setLastTx(txData[0]);
              }
            }
          } catch (txErr) {
            console.error("Tx Fetch Error", txErr);
          }
        } catch (e) {
          console.error("Failed to fetch wallet data", e);
        }
      }
    };
    initUser();
  }, [currentUser]);

  // Remove local storage effect

  // Refresh tokens periodically if active - Disabled as unused
  /*
  useEffect(() => {
    if (!currentUserId) return;
    const interval = setInterval(async () => {
      const t = await apiService.getTokenUsage(currentUserId);
      setTotalTokens(t);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUserId]);
  */

  // Fetch user-specific portals on load - Disabled as unused
  /*
  useEffect(() => {
    const fetchUserPortals = async () => { ... };
    if (currentUserId) fetchUserPortals();
  }, [currentUserId]);
  */

  // --- Logic Handlers ---



  // Scroll Logic
  const scrollToBottom = () => {
    // Scroll the chat container itself, not the window
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show button if we are scrolled up more than 300px from bottom
    if (scrollHeight - scrollTop - clientHeight > 300) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  // Auto-scroll on new messages (if already near bottom or just sent)
  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages, isThinking]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setDraftContent('');
    setCurrentAnalysis(null);
    setCanvasOpen(false);
  };

  const handleLoadChat = (chatId) => {
    const chat = history.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setCanvasOpen(false);
      const lastAiMsg = [...chat.messages].reverse().find(m => m.role === 'ai');
      if (lastAiMsg && (lastAiMsg.content.toLowerCase().includes('agreement') || lastAiMsg.content.includes('Contract'))) {
        setDraftContent(lastAiMsg.content);
      }
    }
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();
    const success = await apiStorage.deleteChat(chatId);
    if (success) {
      const newHistory = history.filter(c => c.id !== chatId);
      setHistory(newHistory);
      if (currentChatId === chatId) handleNewChat();
      showToast("Chat deleted from DB");
    } else {
      showToast("Failed to delete chat");
    }
  };

  const handleLoadReport = (report) => {
    // Determine type and set content
    if (report.type === 'RISK_CHECK') {
      setRiskAnalysis(report.rawContent);
      setActiveTab('risk');
      setCanvasOpen(true);
      showToast("Loaded Risk Audit Report");
    } else {
      setAdviceAnalysis(report.rawContent);
      setActiveTab('research_analysis');
      setCanvasOpen(true);
      showToast("Loaded Draft Analysis Report");
    }
    // Close sidebar on mobile/if needed
    // setSidebarOpen(false); 
  };

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  const handleDownload = async (content, filename = 'lexai-draft') => {
    // Dynamic import to avoid SSR/Initial load issues
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Create a temporary container for HTML rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm'; // A4 width
      container.style.padding = '20mm';
      container.style.backgroundColor = '#fff';
      container.style.fontFamily = '"Times New Roman", "Nirmala UI", "Mangal", serif'; // Legal fonts with Hindi support
      container.style.fontSize = '12pt';
      container.style.lineHeight = '1.6';
      container.style.color = '#000';
      container.style.whiteSpace = 'pre-wrap'; // Preserve newlines

      // Enhanced Formatting for PDF
      // 1. Headers
      let formattedHtml = content
        .replace(/^### (.*$)/gim, '<h3 style="font-size: 14pt; margin-top: 15px; margin-bottom: 10px; font-weight: bold;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size: 16pt; margin-top: 20px; margin-bottom: 15px; font-weight: bold; border-bottom: 1px solid #eee;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="font-size: 20pt; text-align: center; margin-bottom: 25px; font-weight: bold;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/\*(.*?)\*/g, '<i>$1</i>'); // Italic

      container.innerHTML = `
        <div style="margin-bottom: 30px; text-align: right; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">
             <span style="font-size: 14pt; font-weight: bold; color: #2c3e50;">LexAI Legal Draft</span><br>
             <span style="font-size: 9pt; color: #7f8c8d;">Ref: ${Date.now().toString().slice(-8)} | Generated by ${currentUser.replace('_', ' ')}</span>
        </div>
        <div>${formattedHtml}</div>
        <div style="margin-top: 50px; text-align: center; font-size: 9pt; color: #bdc3c7;">
          Generated by LexAI - Confidential & Privileged
        </div>
      `;

      document.body.appendChild(container);

      // Generate Canvas
      const canvas = await html2canvas(container, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Handle Multi-page PDF
      let heightRemaining = imgHeight;
      let currentPosition = 0;

      // Add the first page content
      pdf.addImage(imgData, 'PNG', 0, currentPosition, pdfWidth, imgHeight);
      heightRemaining -= pdfHeight;

      // Add subsequent pages if content overflows
      while (heightRemaining > 0) {
        pdf.addPage();
        currentPosition -= pdfHeight; // Shift the image up for the new page
        pdf.addImage(imgData, 'PNG', 0, currentPosition, pdfWidth, imgHeight);
        heightRemaining -= pdfHeight;
      }

      pdf.save(`${filename}-${Date.now()}.pdf`);
      document.body.removeChild(container);
      showToast("PDF Downloaded successfully");

    } catch (e) {
      console.error("PDF Generation Failed", e);
      // Fallback to text file
      const element = document.createElement("a");
      const fileBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = `${filename}.txt`;
      document.body.appendChild(element);
      element.click();
      showToast("Downloaded as Text (PDF Error)");
    }
  };

  // Removed duplicate handleDownload

  const handleWhatsapp = (text) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShare = (text) => {
    if (navigator.share) {
      navigator.share({
        title: 'LexAI Legal Advice',
        text: text,
      }).catch(console.error);
    } else {
      handleCopy(text);
      showToast("Sharing not supported, text copied.");
    }
  };

  const handleOpenDraft = (text) => {
    setDraftContent(text);
    setCanvasOpen(true);
    showToast("Opened in Draft Editor");
  };

  // Duplicates removed

  const handleSend = async (overrideInput = null) => {
    const textToSend = overrideInput || input;
    if ((!textToSend.trim() && !file) || isStreaming) return;

    // Command Handling & Mode Switching
    let mode = chatMode;
    if (textToSend.startsWith('/draft')) { mode = 'draft'; setChatMode('draft'); }
    if (textToSend.startsWith('/case')) { mode = 'advice'; setChatMode('advice'); }
    if (textToSend.startsWith('/compare')) { mode = 'compare'; setChatMode('compare'); }

    if (!currentUserId) {
      showToast("Connecting to server...");
      const id = await apiService.login(currentUser);
      if (!id) return showToast("Server Offline");
      setCurrentUserId(id);
    }

    // 1. Prepare User Message
    const newMessage = { role: 'user', content: textToSend, file: file ? { name: file.name } : null, timestamp: Date.now() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setFile(null);
    setShowCommands(false); // Hide palette

    // 2. Start Thinking
    setIsThinking(true);
    setIsStreaming(true);
    setStreamText('');
    tempPdfRef.current = null; // Reset for new message

    // 2b. API Call Preparation
    const activeChatId = currentChatId || Date.now().toString();
    if (!currentChatId) setCurrentChatId(activeChatId);

    // Artificial Delay for "Thinking" UX
    setTimeout(async () => {
      setIsThinking(false);

      // FORCE HTTP STREAMING (Socket disabled to ensure billing visibility)
      if (false && socket && socket.connected) {
        socket.emit('ask_question', {
          message: textToSend,
          userId: currentUserId,
          chatId: activeChatId,
          mode: mode,
          history: updatedMessages
        });
      } else {
        await apiService.generateStream(
          textToSend, currentUserId, activeChatId, mode, file,
          (text) => setStreamText(text),
          (finalContent, finalMode, receivedSessionId) => {
            handleAICompletion(finalContent, finalMode, receivedSessionId);
          },
          (billingData) => {
            if (billingData.remainingBalance !== undefined) {
              setWalletBalance(billingData.remainingBalance);
            }
            if (billingData.cost) {
              showToast(`Usage: ₹${billingData.cost.toFixed(4)} (${billingData.inTokens + billingData.outTokens}tok)`);
            }
          },
          (analysisData) => {
            setCurrentAnalysis(analysisData);
          },
          (pdfBase64, filename) => {
            // New: Store PDF for manual download instead of auto-downloading
            tempPdfRef.current = {
              file: pdfBase64,
              filename: filename
            };
            showToast("PDF Draft Ready (Click PDF icon to download)");
          }
        );
      }
    }, 1500); // 1.5s thinking time
  };

  // Command Palette Logic
  useEffect(() => {
    setShowCommands(input.startsWith('/'));
  }, [input]);

  const handleCommandClick = (cmd) => {
    setInput(cmd + ' ');
    const inputEl = document.querySelector('.input-box');
    if (inputEl) inputEl.focus();
    setShowCommands(false);
  };

  const toggleVoice = () => {
    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast("Voice input not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (e) => {
        let finalChunk = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalChunk += e.results[i][0].transcript;
          }
        }

        if (finalChunk) {
          setInput(prev => {
            const current = prev || '';
            // Avoid double spacing if trailing space exists
            return current + (current.endsWith(' ') ? '' : ' ') + finalChunk.trim();
          });
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          showToast("Please allow microphone access");
          setListening(false);
        }
        // Handle 'no-speech' by ignoring or stopping? 
        // Usually steady state 'no-speech' might fire, we can ignore.
      };

      recognition.onend = () => {
        // Only turn off if user explicitly stopped or a fatal error occurred
        // With continuous, it might stop on meaningful silence or network error
        // checking ref to see if we should still be listening?
        // specific browser behaviors vary. Safest is to just sync state.
        setListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setListening(false);
      }
    }
  };

  const handleApplyTemplate = (template) => {
    // If it's a backend Document Template (has content)
    if (template.content && !template.prompt) {
      setDraftContent(template.content);
      setTemplateMenuOpen(false);
      setCanvasOpen(true);
      setActiveTab('document');
      showToast(`Loaded Template: ${template.title}`);
      return;
    }

    // Otherwise it's a Prompt Template
    setInput(template.prompt || template.content);
    setTemplateMenuOpen(false);
    const textarea = document.querySelector('.input-box');
    if (textarea) textarea.focus();
  };

  // New Handlers for User Profile
  // Unused handlers removed to fix lint warnings
  // handleUpdateProfile, handleDeleteAccount

  /* --- New Draft Actions --- */
  const handleDocxDownload = async (content, filename = 'lexai-draft') => {
    try {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const { saveAs } = await import('file-saver');

      const doc = new Document({
        sections: [{
          properties: {},
          children: content.split('\n').map(line => new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 120 }
          }))
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${filename}.docx`);
      showToast("DOCX Downloaded successfully");
    } catch (e) {
      console.error("DOCX Failed", e);
      showToast("Failed to generate DOCX");
    }
  };

  const handleRiskCheck = async () => {
    if (!draftContent) return showToast("No draft to analyze!");

    setCanvasOpen(true);
    setActiveTab('risk');
    setRiskAnalysis('Generating Risk Audit...');
    setIsStreaming(true); // Start Scanner

    const riskPrompt = `PERFORM RISK AUDIT ON:\n\n${draftContent}\n\nOUTPUT FORMAT STRICTLY:\n| Audit Point | Risk Description | Score (1-10) |\n|---|---|---|\n| ... | ... | ... |`;

    await apiService.generateStream(
      riskPrompt,
      currentUserId,
      currentChatId,
      'risk_check',
      null, // No file
      (text) => setRiskAnalysis(text),
      (finalText) => {
        setRiskAnalysis(finalText);
        setIsStreaming(false); // Stop Scanner
      }
    );
  };

  const handleDraftAnalysis = async () => {
    if (!draftContent) return showToast("No draft to analyze!");

    setCanvasOpen(true);
    setActiveTab('research_analysis');
    setAdviceAnalysis('Analyzing Legal Precedents & Draft Quality...');
    setIsStreaming(true); // Start Scanner

    const analysisPrompt = `ANALYZE DRAFT FOR QUALITY. OUTPUT FORMAT:\n\nDRAFT_SCORE: <0-100>\nLEGAL_CERTAINTY: <High/Medium/Low>\n\n### ANALYSIS\n<Full markdown analysis here>\n\n### KEY CITATIONS\n- <Case Law 1>\n- <Case Law 2>`;

    await apiService.generateStream(
      analysisPrompt,
      currentUserId,
      currentChatId,
      'draft_analysis',
      null, // No file
      (text) => setAdviceAnalysis(text),
      (finalText) => {
        setAdviceAnalysis(finalText);
        setIsStreaming(false); // Stop Scanner
      }
    );
  };




  // --- Advice Parsing Helper ---
  const parseAdviceResponse = (text) => {
    if (!text) return null;

    const data = {
      certainty: { level: 'Unknown', color: '#64748b', icon: '❓' },
      score: 0,
      caseLaws: [],
      fullText: text
    };

    // Extract Score
    const scoreMatch = text.match(/DRAFT_SCORE:\s*(\d+)/i);
    if (scoreMatch) data.score = parseInt(scoreMatch[1], 10);

    // Extract Certainty
    if (text.match(/CERTAINTY:\s*High/i) || text.includes('🟢') || text.includes('Settled Law')) {
      data.certainty = { level: 'High Certainty', color: '#22c55e', icon: '🟢' };
      if (!data.score) data.score = 85;
    }
    else if (text.match(/CERTAINTY:\s*Medium/i) || text.includes('🟡')) {
      data.certainty = { level: 'Medium Certainty', color: '#eab308', icon: '🟡' };
      if (!data.score) data.score = 65;
    }
    else if (text.match(/CERTAINTY:\s*Low/i) || text.includes('🔴')) {
      data.certainty = { level: 'Low Certainty', color: '#ef4444', icon: '🔴' };
      if (!data.score) data.score = 40;
    }

    // Extract Case Laws
    const lines = text.split('\n');
    let inCaseSection = false;
    for (const line of lines) {
      if (line.includes('KEY CITATIONS') || line.includes('Key Case Laws')) { inCaseSection = true; continue; }
      if (line.startsWith('### ANALYSIS')) { inCaseSection = false; continue; }

      if (inCaseSection && (line.trim().startsWith('-') || line.trim().startsWith('*'))) {
        data.caseLaws.push(line.replace(/[-*]/g, '').trim());
      }
    }

    return data;
  };

  const handleOpenResearch = (text) => {
    setAdviceAnalysis(text);
    setCanvasOpen(true);
    setActiveTab('research_analysis');
  };

  // Expose to window for external component access
  useEffect(() => {
    window.handleOpenResearch = handleOpenResearch;
    return () => { delete window.handleOpenResearch; };
  }, []);



  // handleAddPortal removed

  return (
    <div className="lex-container" onContextMenu={(e) => e.preventDefault()}>
      <Toast message={toast.msg} show={toast.show} />

      {/* --- Sidebar --- */}
      {/* --- Sidebar --- */}
      <motion.aside
        className={`lex-sidebar ${sidebarOpen ? '' : 'closed'}`}
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
      >
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="logo-icon-wrap"><FaShieldAlt /></div>
            <span className="logo-text">LexAI</span>
            <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <button className="btn-new" onClick={handleNewChat}>
            <FaPlus /> New Case
          </button>

          {/* Sidebar Tabs */}
          <div className="sidebar-tabs" style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '10px' }}>
            <button
              onClick={() => setViewMode('chats')}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: viewMode === 'chats' ? '#3b82f6' : '#94a3b8',
                borderBottom: viewMode === 'chats' ? '2px solid #3b82f6' : 'transparent',
                padding: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Chats
            </button>
            <button
              onClick={() => setViewMode('audits')}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: viewMode === 'audits' ? '#ef4444' : '#94a3b8',
                borderBottom: viewMode === 'audits' ? '2px solid #ef4444' : 'transparent',
                padding: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Audits
            </button>
          </div>

          <div className="history-section">
            <div className="label">{viewMode === 'chats' ? `Your Cases (${history.length})` : `Audit Reports (${reportsHistory.length})`}</div>

            {viewMode === 'chats' ? (
              /* CHAT LIST */
              history.length === 0 ? (
                <div style={{ color: '#64748b', padding: '0 10px', fontSize: '0.9rem' }}>No active cases.</div>
              ) : (
                history.slice(0, 10).map(chat => (
                  <div
                    key={chat.id}
                    className={`history-card ${currentChatId === chat.id ? 'active' : ''}`}
                    onClick={() => handleLoadChat(chat.id)}
                  >
                    <div className="h-left">
                      <span>{chat.title}</span>
                    </div>
                    <button className="close-icon" onClick={(e) => deleteChat(e, chat.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                      <FaTimes />
                    </button>
                  </div>
                ))
              )
            ) : (
              /* AUDIT REPORT LIST */
              reportsHistory.length === 0 ? (
                <div style={{ color: '#64748b', padding: '0 10px', fontSize: '0.9rem' }}>No saved reports.</div>
              ) : (
                reportsHistory.map((report) => (
                  <div
                    key={report.id}
                    className={`history-card`}
                    onClick={() => handleLoadReport(report)}
                    style={{ borderLeft: report.type === 'RISK_CHECK' ? '3px solid #ef4444' : '3px solid #8b5cf6' }}
                  >
                    <div className="h-left" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600' }}>{report.title}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                        {report.summary || report.type}
                      </span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          <div className="sidebar-footer">
            <div className="user-pill">
              <div className="avatar">{currentUser.charAt(0)}</div>
              <div className="user-info">
                <span className="u-name">{currentUser.replace('_', ' ')}</span>
                <div
                  className="u-role wallet-pill-active"
                  onClick={(e) => { e.stopPropagation(); navigate('/wallet'); }}
                  title={lastTx ? `Last: ${lastTx.type === 'CREDIT' ? '+' : '-'}₹${Number(lastTx.amount || 0).toFixed(2)} (${lastTx.description || lastTx.category})` : 'View Transaction History'}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginTop: '2px' }}
                >
                  <FaWallet size={10} color="#fbbf24" />
                  <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>₹{Number(walletBalance || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* --- Main Workspace --- */}
      <main className="lex-main">
        <header className="lex-header">
          <div className="header-left">
            {!sidebarOpen && <button className="icon-btn toggle-btn" onClick={() => setSidebarOpen(true)}><FaBars /></button>}
            <div className="case-title">
              {currentChatId ? history.find(h => h.id === currentChatId)?.title : 'New Legal Consultation'}
            </div>

            {/* Navigation Tabs */}
            <div className="glass-nav">
              <nav className="mode-nav" style={{ display: 'flex', gap: '5px' }}>
                <button
                  className={chatMode === 'advice' ? 'active' : ''}
                  onClick={() => setChatMode('advice')}
                >
                  <FaGem /> Advice
                </button>
                <button
                  className={chatMode === 'draft' ? 'active' : ''}
                  onClick={() => setChatMode('draft')}
                >
                  <FaPenFancy /> Draft
                </button>
                <button
                  className={chatMode === 'compare' ? 'active' : ''}
                  onClick={() => setChatMode('compare')}
                >
                  <FaSync /> Compare
                </button>
              </nav>
            </div>
          </div>

          <div className="header-right">

            <div className="wallet-pill-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '12px', background: 'rgba(255,255,255,0.9)', padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <FaWallet color="#fbbf24" size={14} />
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>₹{Number(walletBalance || 0).toFixed(2)}</span>
            </div>

            <div className="model-select" onClick={() => setModelDropdownOpen(!modelDropdownOpen)}>
              <div className="model-icon"><FaGem /></div>
              <span>{selectedModel.name}</span>
              <FaChevronDown size={10} />

              {modelDropdownOpen && (
                <div className="model-dropdown">
                  {availableModels.map(m => {
                    const allowedModels = getModelAccess() || [];
                    const isLocked = !allowedModels.includes(m.id);
                    return (
                      <div key={m.id}
                        className={`model-option ${selectedModel.id === m.id ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) {
                            setSelectedModel(m);
                            setModelDropdownOpen(false);
                          } else {
                            setToast({ show: true, msg: `Upgrade to ${m.name}` });
                          }
                        }}
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          opacity: isLocked ? 0.6 : 1,
                          display: 'flex', flexDirection: 'column'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.85rem' }}>
                          {m.name} {isLocked && <FaShieldAlt size={10} />}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.desc}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Neural Context Bar (Futuristic UX) */}
        <AnimatePresence>
          {currentAnalysis && (
            <motion.div
              className="neural-context-bar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: currentAnalysis.urgency === 'HIGH_CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 20px',
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaShieldAlt color={currentAnalysis.urgency === 'HIGH_CRITICAL' ? '#ef4444' : '#3b82f6'} />
                <span style={{ fontWeight: 600, color: currentAnalysis.urgency === 'HIGH_CRITICAL' ? '#ef4444' : '#e2e8f0' }}>
                  {currentAnalysis.intent?.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ width: '1px', height: '12px', background: '#334155' }}></div>
              <div>
                <span style={{ opacity: 0.7 }}>User Level:</span> <span style={{ color: '#fbbf24' }}>{currentAnalysis.userExpertise}</span>
              </div>
              {currentAnalysis.urgency === 'HIGH_CRITICAL' && (
                <div style={{ marginLeft: 'auto', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaExclamationTriangle /> CRITICAL URGENCY DETECTED
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        <div className="chat-body" onScroll={handleScroll} ref={chatBodyRef}>
          {/* Laser Scanner Effect Overlay */}
          {isThinking && (
            chatMode === 'draft' ||
            chatMode === 'compare' ||
            messages[messages.length - 1]?.content.toLowerCase().includes('risk') ||
            messages[messages.length - 1]?.content.toLowerCase().includes('analy') ||
            messages[messages.length - 1]?.content.toLowerCase().includes('draft')
          ) && (
              <div className="laser-scanner-overlay">
                <div className="scan-grid"></div>
                <div className="laser-beam"></div>
                <div className="scan-status">
                  <span>AI ANALYZING DOCUMENT STRUCTURE...</span>
                </div>
              </div>
            )}
          {messages.length === 0 && (
            <div className="welcome-hero">
              <div className="hero-logo"><FaShieldAlt /></div>
              <h1>LexAI Intelligence</h1>
              <p>Select a capability to begin your legal workflow.</p>

              <div className="suggested-grid">
                <div className="suggested-card" onClick={() => handleSend("Draft a generic NDA")}>
                  <div className="sc-icon"><FaPenFancy /></div>
                  <h4>Draft Agreement</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Create standard contracts instantly.</span>
                </div>
                <div className="suggested-card" onClick={() => handleSend("Analyze risks in a lease")}>
                  <div className="sc-icon"><FaShieldAlt /></div>
                  <h4>Risk Analysis</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Identify liabilities in documents.</span>
                </div>
                <div className="suggested-card" onClick={() => handleSend("Summarize recent IP case law")}>
                  <div className="sc-icon"><FaGem /></div>
                  <h4>Case Research</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Deep dive into legal precedents.</span>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                isLast={i === messages.length - 1}
                onCopy={handleCopy}
                onDownload={(content) => handleDownload(content)}
                onWhatsapp={handleWhatsapp}
                onShare={handleShare}
                onOpenDraft={handleOpenDraft}
                generatedPdf={m.generatedPdf}
              />
            ))}

            {isThinking && <ThinkingBubble />}

            {!isThinking && isStreaming && (
              <div className="msg-row msg-ai streaming">
                <div className="msg-avatar"><FaGem /></div>
                <div className="msg-bubble">
                  {/* Reuse LegalRenderer for streaming to keep look consistent */}
                  <ReactMarkdown components={LegalRenderer}>{streamText}</ReactMarkdown>
                  <span className="cursor-blink">|</span>
                </div>
              </div>
            )}
          </AnimatePresence>
          <div id="messagesEnd" style={{ float: "left", clear: "both" }}></div>

        </div>

        {/* Scroll To Bottom Button - Placed outside chat-body so it doesn't scroll with content */}
        <button
          className={`scroll-bottom-btn ${showScrollButton ? 'visible' : ''}`}
          onClick={scrollToBottom}
          title="Scroll to Recent"
        >
          <FaArrowDown />
        </button>

        {/* Input Area */}
        {/* Input Area */}
        <div className="input-area">
          {showCommands && (
            <div className="command-palette">
              <div className="cmd-item" onClick={() => handleCommandClick('/draft')}>
                <span className="cmd-key">/draft</span> Evaluate & Draft Contract
              </div>
              <div className="cmd-item" onClick={() => handleCommandClick('/case')}>
                <span className="cmd-key">/case</span> Search Case Law Precedents
              </div>
              <div className="cmd-item" onClick={() => handleCommandClick('/compare')}>
                <span className="cmd-key">/compare</span> Compare IPC vs BNS
              </div>
            </div>
          )}

          {file && (
            <div className="file-chip">
              <FaFilePdf /> {file.name}
              <button onClick={() => setFile(null)}><FaTimes /></button>
            </div>
          )}
          <div className="input-wrapper">
            <label className="icon-btn upload">
              <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
              <FaPaperclip />
            </label>
            <textarea
              placeholder={`Message ${selectedModel.name}... (Type / for commands)`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              rows={1}
              className="input-box"
            />
            <button
              className="lang-toggle-btn"
              onClick={() => {
                const langs = ['en-IN', 'hi-IN', 'en-US'];
                const next = langs[(langs.indexOf(voiceLang) + 1) % langs.length];
                setVoiceLang(next);
                showToast(`Voice Language: ${next === 'en-IN' ? 'English (India)' : next === 'hi-IN' ? 'Hindi' : 'English (US)'}`);
              }}
              title="Switch Language: EN-IN (Hinglish) / HI (Hindi) / EN-US"
            >
              {voiceLang === 'en-IN' ? 'IN' : voiceLang === 'hi-IN' ? 'HI' : 'US'}
            </button>
            <button className={`icon-btn voice ${listening ? 'active' : ''}`} onClick={toggleVoice} title={`Voice Dictation (${voiceLang})`}>
              {listening ? <FaStop /> : <FaMicrophone />}
            </button>
            <button className="icon-btn voice-agent" onClick={() => navigate('/voice-agent')} title="Live Voice Agent" style={{ color: '#00d2ff' }}>
              <FaHeadset />
            </button>
            <div className="template-wrapper" style={{ position: 'relative' }}>
              <button
                className={`icon-btn template ${templateMenuOpen ? 'active' : ''}`}
                onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
                title="Legal Templates"
              >
                <FaFileContract />
              </button>
              {templateMenuOpen && (
                <div className="template-popup">
                  <h4><FaFileContract /> Templates</h4>
                  <div className="template-list">
                    <div className="template-list">
                      <div className="t-category-label">Quick Prompts</div>
                      {LEGAL_TEMPLATES.map(t => (
                        <div key={t.id} className="template-item" onClick={() => handleApplyTemplate(t)}>
                          <span className="t-icon">{t.icon}</span>
                          <span className="t-label">{t.label}</span>
                        </div>
                      ))}
                      {dbTemplates.length > 0 && (
                        <>
                          <div className="t-category-label" style={{ marginTop: '8px' }}>Library Documents</div>
                          {dbTemplates.map(t => (
                            <div key={t._id} className="template-item" onClick={() => handleApplyTemplate(t)}>
                              <span className="t-icon"><FaFileContract /></span>
                              <span className="t-label">{t.title}</span>
                              {t.isPremium && <span style={{ fontSize: '0.6rem', background: '#D4AF37', color: 'black', padding: '1px 4px', borderRadius: '4px', marginLeft: 'auto' }}>PRO</span>}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button className="send-btn" onClick={() => handleSend()} disabled={!input && !file}>
              <FaPaperPlane />
            </button>
          </div>
          <div className="input-footer">
            LexAI may display inaccurate info, including about people, so double-check its responses. Confidential & Privileged.
          </div>
        </div>

        {/* Document Canvas - Overlay Mode */}
        <AnimatePresence>
          {canvasOpen && (
            <motion.div className="canvas-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="canvas-window"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <div className="canvas-header">
                  <div className="ch-left">
                    <div style={{ background: '#0B1120', padding: '5px', borderRadius: '4px', color: '#D4AF37' }}>
                      {activeTab.startsWith('research') ? <FaGem size={14} /> : <FaPenFancy size={14} />}
                    </div>
                    <h2>{activeTab.startsWith('research') ? 'Research Studio' : 'Draft Studio'}</h2>

                    {/* TABS */}
                    <div className="canvas-tabs">
                      <button className={`c-tab ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}><FaFileContract /> Document</button>
                      <button className={`c-tab ${activeTab === 'risk' ? 'active' : ''}`} onClick={() => setActiveTab('risk')}><FaShieldAlt /> Risks</button>
                      <button className={`c-tab ${activeTab === 'research_analysis' ? 'active' : ''}`} onClick={() => setActiveTab('research_analysis')}><FaGem /> Draft Analysis</button>
                      {activeTab.startsWith('research') && (
                        <button className={`c-tab ${activeTab === 'research_sources' ? 'active' : ''}`} onClick={() => setActiveTab('research_sources')}><FaFilePdf /> Sources</button>
                      )}
                    </div>
                  </div>

                  <div className="controls">
                    {/* Consolidated Controls */}
                    {activeTab === 'document' && (
                      <>
                        <button className="btn-word" onClick={() => handleDocxDownload(draftContent)} style={{ color: '#2563eb', borderColor: '#2563eb' }}>
                          <FaFileWord /> DOCX
                        </button>
                        <button className="btn-word" onClick={() => handleDownload(draftContent)}><FaDownload /> PDF</button>
                      </>
                    )}
                    {activeTab === 'risk' && (
                      <button className="btn-word" onClick={() => handleDownload(riskAnalysis, 'Risk-Assessment-Report')} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                        <FaDownload /> Download Report
                      </button>
                    )}
                    {activeTab === 'research_analysis' && (
                      <button className="btn-word" onClick={() => handleDownload(adviceAnalysis, 'Legal-Analysis-Report')} style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}>
                        <FaDownload /> Download Analysis
                      </button>
                    )}
                    <button className="btn-word" onClick={() => handleCopy(draftContent || adviceAnalysis)}><FaCopy /> Copy</button>
                    <button className="btn-close" onClick={() => setCanvasOpen(false)}><FaTimes /></button>
                  </div>
                </div>

                <div className="paper-container">
                  {activeTab === 'document' && (
                    <div className="a4-paper">
                      <textarea className="a4-editor" value={draftContent} onChange={(e) => setDraftContent(e.target.value)} placeholder="Legal draft..." />
                    </div>
                  )}

                  {activeTab === 'risk' && (
                    <div className="risk-dashboard-container" style={{ position: 'relative' }}>
                      {riskAnalysis ? (
                        (() => {
                          const isLoading = isThinking || isStreaming || riskAnalysis.includes('Generating') || riskAnalysis.includes('Analyzing');

                          const parseRiskData = (report) => {
                            const data = {
                              stats: { score: 100, high: 0, medium: 0 },
                              highRisks: [],
                              medRisks: []
                            };

                            let maxRisk = 0;
                            const lines = report.split('\n');
                            let foundTable = false;

                            for (const line of lines) {
                              // Legacy/Fallback Score Parse
                              if (line.includes('Safety Score:')) {
                                const m = line.match(/(\d+)%/);
                                if (m) data.stats.score = parseInt(m[1]);
                              }

                              // Flexible Table Parsing
                              if (line.includes('|')) {
                                const parts = line.split('|').map(s => s.trim()).filter(s => s.length > 0);
                                // Skip headers or dividers
                                if (parts.length < 2 || line.includes('---')) continue;
                                if (['audit', 'risk', 'score', 'ऑडिट', 'जोखिम'].some(k => parts[0].toLowerCase().includes(k))) continue;

                                foundTable = true;

                                // Heuristics for columns
                                // Usually | Point | Description | Score |
                                const scoreContent = parts[parts.length - 1]; // Last column
                                const findingContent = parts.length > 2 ? parts[1] : parts[0]; // Mid or First

                                const scoreMatch = scoreContent.match(/(\d+)/);
                                const riskVal = scoreMatch ? parseInt(scoreMatch[1]) : 0;
                                const isFatal = scoreContent.toLowerCase().includes('fatal') || riskVal >= 8;
                                const isHigh = scoreContent.toLowerCase().includes('high') || (riskVal >= 5 && riskVal < 8);

                                if (riskVal > maxRisk) maxRisk = riskVal;

                                const cleanFinding = findingContent.replace(/\*\*/g, '').replace(/\[.*?\]/g, '');

                                if (isFatal) {
                                  data.stats.high++;
                                  data.highRisks.push(`${cleanFinding} (Score: ${riskVal})`);
                                } else if (isHigh) {
                                  data.stats.medium++;
                                  data.medRisks.push(`${cleanFinding} (Score: ${riskVal})`);
                                }
                              }
                            }

                            if (foundTable) {
                              // Score = 100 - (Total Severity Deduced)
                              // Only update if we found table data to avoid overriding default 100
                              data.stats.score = Math.max(0, 100 - (data.stats.high * 15) - (data.stats.medium * 5));
                            }

                            return data;
                          };

                          const data = parseRiskData(riskAnalysis);
                          return (
                            <div className="risk-dashboard">
                              {/* Header Stats */}
                              <div className="rd-header">
                                <div className="score-ring-wrap">
                                  <div className="score-ring" style={{
                                    background: `conic-gradient(${data.stats.score > 80 ? '#22c55e' : data.stats.score > 50 ? '#eab308' : '#ef4444'} ${data.stats.score}%, #e2e8f0 0)`
                                  }}>
                                    <div className="score-inner">
                                      <span className="sc-val">{data.stats.score}%</span>
                                      <span className="sc-lbl">Safety Score</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="rd-stats">
                                  <div className="stat-card" style={{ borderColor: '#ef4444' }}>
                                    <h3>{data.stats.high}</h3>
                                    <span>Critical Risks</span>
                                  </div>
                                  <div className="stat-card" style={{ borderColor: '#eab308' }}>
                                    <h3>{data.stats.medium}</h3>
                                    <span>Warnings</span>
                                  </div>
                                  <button className="re-analyze-btn" onClick={handleRiskCheck}>
                                    <FaSync /> Re-Run Analysis
                                  </button>
                                </div>
                              </div>

                              <div className="rd-grid">
                                <div className="rd-col critical">
                                  <h4><FaShieldAlt /> Critical Issues</h4>
                                  {data.highRisks.length > 0 ? (
                                    <ul>{data.highRisks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                  ) : <div className="empty-state">No critical risks detected.</div>}
                                </div>
                                <div className="rd-col warning">
                                  <h4><FaExclamationTriangle /> Advisories</h4>
                                  {data.medRisks.length > 0 ? (
                                    <ul>{data.medRisks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                  ) : <div className="empty-state">No advisories.</div>}
                                </div>
                              </div>

                              {/* Laser Scanner - Overlay on Report Generation */}
                              {isLoading && (
                                <div className="laser-scanner-overlay" style={{ borderRadius: '12px' }}>
                                  <div className="scan-grid"></div>
                                  <div className="laser-beam"></div>
                                  <div className="scan-status" style={{ bottom: '50%' }}>
                                    <span>AI RISK AUDIT IN PROGRESS...</span>
                                  </div>
                                </div>
                              )}

                              <div className="rd-full-report">
                                <h4>Full Compliance Report</h4>
                                <div className="markdown-body">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={LegalRenderer}
                                  >
                                    {riskAnalysis}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="risk-empty">
                          <div className="pulse-ring"></div>
                          <FaShieldAlt size={50} style={{ color: '#64748b', zIndex: 2 }} />
                          <h3>AI Legal Risk Guard</h3>
                          <p>Run a comprehensive analysis to detect liabilities, missing clauses, and compliance gaps.</p>
                          <button className="run-risk-btn" onClick={handleRiskCheck}>
                            <FaShieldAlt /> Run Risk Check
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {activeTab === 'research_analysis' && (
                    <div className="risk-dashboard-container" style={{ position: 'relative' }}>
                      {adviceAnalysis ? (() => {
                        const isLoading = isThinking || isStreaming || adviceAnalysis.includes('Analyzing') || adviceAnalysis.includes('Generating') || adviceAnalysis.length < 50;

                        const data = parseAdviceResponse(adviceAnalysis);
                        return (
                          <div className="risk-dashboard">
                            {/* Header */}
                            <div className="rd-header">
                              <div className="score-ring-wrap">
                                <div className="score-ring" style={{
                                  background: `conic-gradient(${data.score > 80 ? '#8b5cf6' : data.score > 50 ? '#eab308' : '#ef4444'} ${data.score}%, #e2e8f0 0)`
                                }}>
                                  <div className="score-inner">
                                    <span className="sc-val">{data.score}</span>
                                    <span className="sc-lbl">Quality Score</span>
                                  </div>
                                </div>
                              </div>
                              <div className="rd-stats">
                                <div className="stat-card" style={{ borderColor: data.certainty.color }}>
                                  <h3 style={{ fontSize: '1.5rem' }}>{data.certainty.icon}</h3>
                                  <span>{data.certainty.level.replace(' Certainty', '')}</span>
                                </div>
                                <div className="stat-card" style={{ borderColor: '#3b82f6' }}>
                                  <h3>{data.caseLaws.length}</h3>
                                  <span>Citations</span>
                                </div>
                                <button className="re-analyze-btn" onClick={handleDraftAnalysis}>
                                  <FaSync /> Re-Analyze
                                </button>
                              </div>
                            </div>

                            {/* Laser Scanner - Overlay */}
                            {isLoading && (
                              <div className="laser-scanner-overlay" style={{ borderRadius: '12px' }}>
                                <div className="scan-grid"></div>
                                <div className="laser-beam"></div>
                                <div className="scan-status" style={{ bottom: '50%' }}>
                                  <span>AI PRECEDENT ANALYSIS...</span>
                                </div>
                              </div>
                            )}

                            <div className="rd-grid">
                              <div className="rd-col" style={{ gridColumn: '1 / -1', borderTop: '4px solid #8b5cf6' }}>
                                <h4><FaGem /> Legal Analysis</h4>
                                <div className="markdown-body">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={LegalRenderer}
                                  >
                                    {adviceAnalysis.replace(/Legal Certainty Level.*/, '')}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="risk-empty">
                          <div className="pulse-ring"></div>
                          <FaGem size={50} style={{ color: '#64748b', zIndex: 2 }} />
                          <h3>AI Document Critic</h3>
                          <p>Analyze your draft for quality, citations, and legal soundness.</p>
                          <button className="run-risk-btn" style={{ background: '#8b5cf6' }} onClick={handleDraftAnalysis}>
                            <FaGem /> Run Draft Analysis
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'research_sources' && adviceAnalysis && (
                    <div className="risk-dashboard-container">
                      <div className="rd-col" style={{ borderTop: '4px solid #3b82f6' }}>
                        <h4><FaFileContract /> Sources & Citations</h4>
                        {(() => {
                          const data = parseAdviceResponse(adviceAnalysis);
                          return (
                            <div>
                              {data.caseLaws.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                  {data.caseLaws.map((c, i) => (
                                    <li key={i} style={{ background: '#f8fafc', padding: '15px', borderBottom: '1px solid #e2e8f0', marginBottom: '10px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                      <FaFilePdf color="#ef4444" />
                                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{c}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : <p>No specific case laws cited in this section.</p>}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main >
    </div >
  );
};

export default LegalAssistantPage;
