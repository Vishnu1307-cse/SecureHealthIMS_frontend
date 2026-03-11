import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { MessageSquare, X, Send, Mic, MicOff, Bot, ArrowRight } from 'lucide-react';
import './ChatBot.css';

const ChatBot = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [confirmingBooking, setConfirmingBooking] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Build conversation history for the API
    const getConversationHistory = useCallback(() => {
        return messages.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
        }));
    }, [messages]);

    // Handle navigation actions from the bot
    const handleAction = useCallback(
        (action) => {
            if (!action) return;

            if (action.action === 'navigate') {
                navigate(action.target);
            } else if (action.action === 'set_tab') {
                // Dispatch a custom event for dashboard components to listen to
                window.dispatchEvent(
                    new CustomEvent('chatbot-set-tab', { detail: { tab: action.target } })
                );
            }
        },
        [navigate]
    );

    // Don't render if not logged in (after all hooks)
    if (!user) return null;

    // Simple markdown-to-HTML renderer
    const escapeHtml = (str) =>
        str.replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&#39;');

    const renderMarkdown = (text) => {
        if (!text) return '';

        let html = escapeHtml(text)
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Unordered lists
            .replace(/^[-•]\s+(.*)/gm, '<li>$1</li>')
            // Numbered lists
            .replace(/^\d+\.\s+(.*)/gm, '<li>$1</li>')
            // Wrap consecutive <li> in <ul>
            .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
            // Line breaks
            .replace(/\n/g, '<br/>');

        return html;
    };

    // ---- Text Chat ----
    const handleSendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage = { role: 'user', content: trimmed };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/chatbot/message', {
                message: trimmed,
                conversationHistory: getConversationHistory(),
            });

            if (res.data.success) {
                const { response, action, pendingBooking } = res.data.data;

                if (pendingBooking) {
                    // Show confirmation message with Yes/No buttons
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'bot',
                            content: response,
                            pendingBooking,
                        },
                    ]);
                } else {
                    setMessages((prev) => [
                        ...prev,
                        { role: 'bot', content: response, action },
                    ]);
                    if (action) {
                        setTimeout(() => handleAction(action), 800);
                    }
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: 'Sorry, I could not process your request. Please try again.' },
                ]);
            }
        } catch (err) {
            console.error('Chat error:', err);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'bot',
                    content: 'Oops! Something went wrong. Please check your connection and try again.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // ---- Voice Recording ----
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm',
            });

            audioChunksRef.current = [];
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                await sendVoiceMessage(audioBlob, mediaRecorder.mimeType);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Timer for recording duration (max 30s)
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= 29) {
                        stopRecording();
                        return 30;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error('Microphone access error:', err);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'bot',
                    content:
                        '🎤 Could not access your microphone. Please allow microphone permissions and try again.',
                },
            ]);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const sendVoiceMessage = async (audioBlob, mimeType) => {
        setIsLoading(true);

        // Add a "voice message" indicator with a special flag
        setMessages((prev) => [...prev, { role: 'user', isVoiceReq: true, content: 'Listening...' }]);

        try {
            const formData = new FormData();
            const ext = mimeType?.includes('webm') ? 'webm' : 'wav';
            formData.append('audio', audioBlob, `recording.${ext}`);
            formData.append('conversationHistory', JSON.stringify(getConversationHistory()));

            const res = await api.post('/chatbot/voice', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                const { transcript, response, action, language_code, audioBase64 } = res.data.data;

                // Auto-play the audio response if available
                if (audioBase64) {
                    try {
                        const snd = new Audio(`data:audio/wav;base64,${audioBase64}`);
                        snd.play().catch(e => console.error('Audio play failed:', e));
                    } catch (e) {
                        console.error('Audio setup failed:', e);
                    }
                }

                // Update the voice placeholder with the actual transcript
                setMessages((prev) => {
                    const updated = [...prev];
                    // Find and update the last user message
                    for (let i = updated.length - 1; i >= 0; i--) {
                        if (updated[i].role === 'user' && updated[i].isVoiceReq) {
                            updated[i] = {
                                role: 'user',
                                isVoiceReq: true,
                                content: transcript,
                                language_code: language_code, // Store separately instead of appending to text
                            };
                            break;
                        }
                    }
                    return [...updated, { role: 'bot', content: response, action }];
                });

                if (action) {
                    setTimeout(() => handleAction(action), 800);
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: 'Sorry, I could not understand the audio. Please try again.' },
                ]);
            }
        } catch (err) {
            console.error('Voice chat error:', err);
            setMessages((prev) => [
                ...prev,
                { role: 'bot', content: 'Failed to process voice message. Please try again.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // ---- Confirm / Cancel Booking ----
    const handleConfirmBooking = async (pendingBooking) => {
        setConfirmingBooking(true);
        // Disable the buttons on the message that triggered this
        setMessages((prev) => prev.map((m) =>
            m.pendingBooking === pendingBooking ? { ...m, bookingResolved: true } : m
        ));
        try {
            const res = await api.post('/chatbot/confirm-booking', pendingBooking);
            if (res.data.success) {
                const apt = res.data.data;
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'bot',
                        content: `✅ **Appointment confirmed!**\n\nYour appointment with **Dr. ${apt.doctor_name}** on **${apt.date}** at **${apt.time}** has been booked. Status: **Pending** — the doctor will confirm it shortly.`,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'bot', content: `❌ Booking failed: ${res.data.error?.message || 'Please try again.'}` },
                ]);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: 'bot', content: `❌ Booking failed: ${err.response?.data?.error?.message || 'Please try again.'}` },
            ]);
        }
        setConfirmingBooking(false);
    };

    const handleCancelBooking = (pendingBooking) => {
        setMessages((prev) => prev.map((m) =>
            m.pendingBooking === pendingBooking ? { ...m, bookingResolved: true } : m
        ));
        setMessages((prev) => [
            ...prev,
            { role: 'bot', content: 'No problem! The appointment was **not** booked. Let me know if you want to try a different time or doctor.' },
        ]);
    };

    // ---- UI Handlers ----
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 280);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSuggestionClick = (text) => {
        setInput(text);
        // Immediately send
        setTimeout(() => {
            const userMessage = { role: 'user', content: text };
            setMessages((prev) => [...prev, userMessage]);
            setInput('');
            setIsLoading(true);

            api
                .post('/chatbot/message', {
                    message: text,
                    conversationHistory: getConversationHistory(),
                })
                .then((res) => {
                    if (res.data.success) {
                        const { response, action } = res.data.data;
                        setMessages((prev) => [...prev, { role: 'bot', content: response, action }]);
                        if (action) setTimeout(() => handleAction(action), 800);
                    }
                })
                .catch(() => {
                    setMessages((prev) => [
                        ...prev,
                        { role: 'bot', content: 'Sorry, something went wrong.' },
                    ]);
                })
                .finally(() => setIsLoading(false));
        }, 50);
    };

    // ---- Suggestions based on role ----
    const getSuggestions = () => {
        const base = ['What departments are available?', 'Go to my profile'];
        if (user.role === 'patient') {
            return [...base, 'Show my prescriptions', 'How many visits do I have?'];
        }
        if (user.role === 'doctor') {
            return [...base, 'Show my appointments', 'Search for a patient'];
        }
        if (user.role === 'admin') {
            return [...base, 'How many doctors are registered?', 'Open admin dashboard'];
        }
        return base;
    };

    // ---- Render ----
    if (!isOpen) {
        return (
            <button
                className="chatbot-fab"
                onClick={() => setIsOpen(true)}
                aria-label="Open AI Assistant"
                id="chatbot-fab"
            >
                <MessageSquare size={26} />
            </button>
        );
    }

    return (
        <div className={`chatbot-panel ${isClosing ? 'closing' : ''}`} id="chatbot-panel">
            {/* Header */}
            <div className="chatbot-header">
                <div className="chatbot-header-info">
                    <div className="chatbot-avatar">
                        <Bot size={22} />
                    </div>
                    <div className="chatbot-header-text">
                        <h3>CuraLink AI</h3>
                        <span>Online</span>
                    </div>
                </div>
                <button className="chatbot-close-btn" onClick={handleClose} aria-label="Close chat">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
                {messages.length === 0 && (
                    <div className="chatbot-welcome">
                        <h4>👋 Hi, {user?.name?.split(' ')[0] || 'there'}!</h4>
                        <p>
                            I'm your AI health assistant. Ask me about the hospital, your records, or I can
                            navigate you to any section.
                        </p>
                        <div className="chatbot-suggestions">
                            {getSuggestions().map((s, i) => (
                                <button
                                    key={i}
                                    className="chatbot-suggestion-chip"
                                    onClick={() => handleSuggestionClick(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`chatbot-msg ${msg.role === 'user' ? 'user' : 'bot'} ${msg.isVoiceReq ? 'voice-pill' : ''}`}>
                        {msg.role === 'bot' ? (
                            <>
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                                {msg.pendingBooking && !msg.bookingResolved && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <button
                                            onClick={() => handleConfirmBooking(msg.pendingBooking)}
                                            disabled={confirmingBooking}
                                            style={{
                                                padding: '8px 20px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                backgroundColor: 'var(--success, #34c759)',
                                                color: '#fff',
                                                fontWeight: 700,
                                                cursor: confirmingBooking ? 'not-allowed' : 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {confirmingBooking ? 'Booking...' : '✓ Yes, Book It'}
                                        </button>
                                        <button
                                            onClick={() => handleCancelBooking(msg.pendingBooking)}
                                            disabled={confirmingBooking}
                                            style={{
                                                padding: '8px 20px',
                                                borderRadius: '20px',
                                                border: '1px solid var(--border, #ccc)',
                                                backgroundColor: 'transparent',
                                                color: 'var(--text-primary, #333)',
                                                fontWeight: 600,
                                                cursor: confirmingBooking ? 'not-allowed' : 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            ✕ No, Cancel
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            // For user messages, check if it was a voice request
                            msg.isVoiceReq ? (
                                <div className="chatbot-voice-content">
                                    <Mic className="voice-icon-small" size={14} />
                                    <span>{msg.content}</span>
                                    {msg.language_code && <span className="lang-badge">{msg.language_code.split('-')[0]}</span>}
                                </div>
                            ) : (
                                msg.content
                            )
                        )}
                        {msg.action && (
                            <div className="chatbot-action">
                                <ArrowRight size={12} />
                                Navigating to {msg.action.target}
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="chatbot-typing">
                        <span />
                        <span />
                        <span />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chatbot-input-area">
                {isRecording ? (
                    <>
                        <div className="chatbot-recording-bar">
                            <div className="rec-dot" />
                            <span>Recording... {recordingTime}s</span>
                        </div>
                        <button
                            className="chatbot-mic-btn recording"
                            onClick={stopRecording}
                            aria-label="Stop recording"
                        >
                            <MicOff size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            id="chatbot-input"
                        />
                        <button
                            className="chatbot-mic-btn"
                            onClick={startRecording}
                            disabled={isLoading}
                            aria-label="Record voice"
                            id="chatbot-mic-btn"
                        >
                            <Mic size={20} />
                        </button>
                        <button
                            className="chatbot-send-btn"
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            aria-label="Send message"
                            id="chatbot-send-btn"
                        >
                            <Send size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatBot;
