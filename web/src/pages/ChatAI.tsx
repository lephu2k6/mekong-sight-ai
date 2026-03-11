import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/ai.service';
import { farmService } from '../services/farm.service';
import { Send, Loader2, User, Bot, Sparkles, Mic, MicOff } from 'lucide-react';

declare global {
    interface Window {
        SpeechRecognition?: any;
        webkitSpeechRecognition?: any;
    }
}

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

export const ChatAI: React.FC = () => {
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarm, setSelectedFarm] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            text: 'Xin chào bà con! Tôi là trợ lý ảo Mekong AI. Tôi hỗ trợ trả lời về độ mặn, rủi ro và vận hành tôm-lúa theo dữ liệu AI1/AI2/AI3. Bà con cần tôi hỗ trợ gì?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const loadFarms = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const role = userStr ? JSON.parse(userStr).role : 'farmer';
                const farmData = role === 'admin' ? await farmService.getAllFarms() : await farmService.getMyFarms();
                const farmList = farmData?.data || [];
                setFarms(farmList);
                if (farmList.length > 0) {
                    setSelectedFarm(farmList[0].id);
                }
            } catch (error) {
                console.error(error);
                setFarms([]);
                setSelectedFarm('');
            }
        };
        loadFarms();
    }, []);

    useEffect(() => {
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) return;
        const recog: any = new SpeechRecognitionCtor();
        recog.lang = 'vi-VN';
        recog.continuous = false;
        recog.interimResults = true;
        recog.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                transcript += event.results[i][0].transcript;
            }
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };
        recog.onend = () => setListening(false);
        recognitionRef.current = recog;
    }, []);

    const toggleMic = () => {
        const recog = recognitionRef.current;
        if (!recog) {
            alert('Trình duyệt không hỗ trợ ghi âm giọng nói.');
            return;
        }
        if (listening) {
            recog.stop();
            setListening(false);
        } else {
            try {
                recog.start();
                setListening(true);
            } catch {
                setListening(false);
            }
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;

        setInput('');
        setLoading(true);

        try {
            const data = await aiService.chat(currentInput, undefined, selectedFarm || undefined);

            if (data.success) {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'bot',
                    text: data.reply,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error(data.message);
            }
        } catch (err: any) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: 'Xin lỗi, có lỗi xảy ra khi kết nối với Gemini. Vui lòng kiểm tra API Key hoặc thử lại sau. ' + (err.message || ''),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', minHeight: 'calc(100vh - 120px)' }}>
            <div
                style={{
                    width: '100%',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
            >
            <div
                className="glass-card"
                style={{
                    marginBottom: '0.25rem',
                    padding: '1.15rem 1.4rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '18px',
                    background: 'linear-gradient(130deg, rgba(16,185,129,0.10), rgba(20,184,166,0.06) 35%, rgba(255,255,255,0.82) 100%)',
                }}
            >
                <div className="flex justify-between items-center" style={{ gap: '0.9rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ marginBottom: '0.15rem', letterSpacing: '-0.02em' }}>Trợ lý ảo Mekong AI</h1>
                    <p className="text-secondary" style={{ fontSize: '0.92rem' }}>
                        Khung chat ngôn ngữ tự nhiên cho bà con, trả lời theo ngữ cảnh farm và dữ liệu AI.
                    </p>
                </div>
                <div className="flex items-center gap-2" style={{
                    padding: '0.55rem 1rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 184, 166, 0.12) 100%)',
                    borderRadius: '999px',
                    border: '1px solid var(--border-green)',
                    whiteSpace: 'nowrap',
                }}>
                    <Sparkles size={16} color="var(--primary-green)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-green)' }}>Powered by Gemini</span>
                </div>
            </div>
            </div>

            <div
                className="card glass-card"
                style={{
                    marginBottom: '0.25rem',
                    padding: '0.9rem 1rem',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    display: 'grid',
                    gap: '0.8rem',
                    gridTemplateColumns: 'minmax(220px, 1fr) auto',
                    alignItems: 'end',
                }}
            >
                <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>
                    Farm ngữ cảnh cho AI (AI1/AI2/AI3)
                </label>
                <select value={selectedFarm} onChange={(e) => setSelectedFarm(e.target.value)} style={{ marginBottom: 0 }}>
                    {farms.length === 0 ? (
                        <option value="">Chưa có farm</option>
                    ) : (
                        farms.map((farm) => (
                            <option key={farm.id} value={farm.id}>
                                {farm.farm_name}
                            </option>
                        ))
                    )}
                </select>
                </div>
                <button
                    type="button"
                    className="secondary"
                    onClick={toggleMic}
                    style={{
                        width: 'fit-content',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.65rem 0.9rem',
                        borderRadius: '12px',
                        borderColor: listening ? 'var(--danger)' : 'var(--border-green)',
                        color: listening ? 'var(--danger)' : 'var(--primary-green)',
                    }}
                >
                    {listening ? <MicOff size={16} /> : <Mic size={16} />}
                    {listening ? 'Dừng ghi âm' : 'Ghi âm giọng nói'}
                </button>
            </div>

            <div className="card" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                background: 'white',
                border: '1px solid var(--border-light)',
                borderRadius: '22px',
                minHeight: '70vh',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.10)'
            }}>
                {/* Chat Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.35rem 1.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.1rem',
                    background: 'radial-gradient(circle at 15% 15%, rgba(16,185,129,0.08), transparent 40%), radial-gradient(circle at 90% 0%, rgba(20,184,166,0.07), transparent 45%), #f7fbfa'
                }}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '74%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <div className="flex items-center gap-2">
                                {msg.role === 'bot' && (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: 'var(--shadow-md)'
                                    }}>
                                        <Bot size={18} color="white" />
                                    </div>
                                )}
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    {msg.role === 'bot' ? 'Mekong AI' : 'Bạn'}
                                </span>
                                {msg.role === 'user' && (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'var(--bg-green-subtle)',
                                        border: '2px solid var(--primary-green)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <User size={18} color="var(--primary-green)" />
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)'
                                        : 'white',
                                    border: msg.role === 'user' ? 'none' : '1px solid rgba(15, 23, 42, 0.10)',
                                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                    fontSize: '0.98rem',
                                    lineHeight: '1.62',
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: msg.role === 'bot' ? '0 8px 24px rgba(15, 23, 42, 0.08)' : '0 12px 24px rgba(5, 150, 105, 0.22)'
                                }}
                            >
                                {msg.text}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'var(--shadow-md)'
                            }}>
                                <Bot size={18} color="white" />
                            </div>
                            <div style={{
                                padding: '0.8rem 1.2rem',
                                background: 'white',
                                borderRadius: '4px 18px 18px 18px',
                                border: '2px solid var(--border-light)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <Loader2 className="animate-spin" size={18} color="var(--primary-green)" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '1rem 1.2rem 1.25rem',
                    borderTop: '1px solid var(--border-light)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.95), #ffffff)'
                }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Hỏi tôi về độ mặn, rủi ro, vận hành..."
                            style={{
                                flex: 1,
                                background: 'white',
                                border: '1px solid rgba(15,23,42,0.15)',
                                borderRadius: '14px',
                                padding: '0.88rem 1rem',
                                color: 'var(--text-primary)',
                                fontSize: '0.96rem',
                                resize: 'none',
                                minHeight: '48px',
                                maxHeight: '140px',
                                fontFamily: 'var(--font-main)',
                                outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--primary-green)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(15,23,42,0.15)';
                                e.target.style.boxShadow = 'none';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            className="primary"
                            disabled={loading || !input.trim()}
                            style={{
                                padding: '0.85rem 1.15rem',
                                borderRadius: '12px',
                                opacity: (loading || !input.trim()) ? 0.5 : 1
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
            </div>
        </div>
    );
};
