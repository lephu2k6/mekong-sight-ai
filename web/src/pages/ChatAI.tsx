import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/ai.service';
import { Send, Loader2, User, Bot, Sparkles, X, Paperclip } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    image?: string;
    timestamp: Date;
}

export const ChatAI: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            text: 'Xin chào bà con! Tôi là trợ lý ảo Mekong AI. Tôi có thể giúp bà con chẩn đoán bệnh tôm, lúa qua hình ảnh hoặc giải đáp các thắc mắc về kỹ thuật canh tác. Bà con cần giúp gì không?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !image) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            image: preview || undefined,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        const currentImage = image;

        setInput('');
        removeImage();
        setLoading(true);

        try {
            const data = await aiService.chat(currentInput, currentImage || undefined);

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
        <div style={{ animation: 'fadeIn 0.5s ease-out', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.2rem' }}>Trợ lý ảo Mekong AI</h1>
                    <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Sử dụng công nghệ Gemini 2.5 Flash để chẩn đoán và tư vấn kỹ thuật.</p>
                </div>
                <div className="flex items-center gap-2" style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-green)'
                }}>
                    <Sparkles size={16} color="var(--primary-green)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-green)' }}>Powered by Gemini</span>
                </div>
            </div>

            <div className="card" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                background: 'white',
                border: '2px solid var(--border-light)'
            }}>
                {/* Chat Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    background: 'var(--bg-light)'
                }}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
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
                                    border: msg.role === 'user' ? 'none' : '2px solid var(--border-light)',
                                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: msg.role === 'bot' ? 'var(--shadow-sm)' : 'var(--shadow-md)'
                                }}
                            >
                                {msg.image && (
                                    <img
                                        src={msg.image}
                                        alt="Uploaded"
                                        style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '0.8rem', display: 'block', border: '2px solid var(--border-light)' }}
                                    />
                                )}
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
                    padding: '1.5rem',
                    borderTop: '2px solid var(--border-light)',
                    background: 'white'
                }}>
                    {preview && (
                        <div style={{ position: 'relative', width: 'fit-content', marginBottom: '1rem' }}>
                            <img src={preview} alt="Preview" style={{
                                height: 80,
                                borderRadius: '12px',
                                border: '2px solid var(--primary-green)',
                                boxShadow: 'var(--shadow-md)'
                            }} />
                            <button
                                onClick={removeImage}
                                style={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    padding: 6,
                                    borderRadius: '50%',
                                    background: 'var(--danger)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-md)'
                                }}
                            >
                                <X size={14} color="white" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                padding: '12px',
                                borderRadius: '12px',
                                background: 'var(--bg-green-subtle)',
                                border: '2px solid var(--border-green)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Paperclip size={20} color="var(--primary-green)" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Hỏi tôi về kỹ thuật, bệnh tôm lúa..."
                            style={{
                                flex: 1,
                                background: 'white',
                                border: '2px solid var(--border-light)',
                                borderRadius: '16px',
                                padding: '0.875rem 1.25rem',
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem',
                                resize: 'none',
                                minHeight: '48px',
                                maxHeight: '120px',
                                fontFamily: 'var(--font-main)',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-green)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
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
                            disabled={loading || (!input.trim() && !image)}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '16px',
                                opacity: (loading || (!input.trim() && !image)) ? 0.5 : 1
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
