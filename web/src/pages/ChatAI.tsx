import React, { useEffect, useRef, useState } from 'react';
import { aiService } from '../services/ai.service';
import { farmService } from '../services/farm.service';
import { Send, Loader2, User, Bot, Sparkles, Mic, MicOff, Waves, ShieldAlert, Lightbulb } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { QuickActionCard } from '../components/QuickActionCard';
import { EmptyState } from '../components/EmptyState';

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

const QUICK_PROMPTS = [
  { icon: <Waves size={18} />, label: 'Độ mặn hôm nay', text: 'Độ mặn hôm nay của trang trại này đang ở mức nào?' },
  { icon: <ShieldAlert size={18} />, label: 'Rủi ro hiện tại', text: 'Hiện tại trang trại này có rủi ro gì cần chú ý?' },
  { icon: <Lightbulb size={18} />, label: 'Nên làm gì bây giờ?', text: 'Tôi nên làm gì ngay bây giờ để vận hành an toàn hơn?' },
];

export const ChatAI: React.FC = () => {
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: 'Xin chào bà con! Tôi là trợ lý Mekong AI. Tôi có thể hỗ trợ về độ mặn, rủi ro và gợi ý vận hành tôm - lúa theo dữ liệu AI1, AI2, AI3.',
      timestamp: new Date(),
    },
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

  const sendText = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await aiService.chat(text, undefined, selectedFarm || undefined);
      if (data.success) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: `Xin lỗi, hệ thống đang gặp lỗi khi kết nối trợ lý AI. Vui lòng thử lại sau. ${err.message || ''}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendText(input);
  };

  return (
    <div className="chat-page" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHero
        chip="Trợ lý AI đồng hành"
        title="Trợ lý ảo Mekong AI"
        description="Hỏi bằng ngôn ngữ tự nhiên để nhận trả lời dễ hiểu về độ mặn, rủi ro và cách vận hành phù hợp với trang trại đang chọn."
        aside={
          <div className="chat-hero-aside">
            <div className="chat-context-card">
              <label htmlFor="chat-farm-select">Trang trại ngữ cảnh cho AI</label>
              <select id="chat-farm-select" value={selectedFarm} onChange={(e) => setSelectedFarm(e.target.value)}>
                {farms.length === 0 ? (
                  <option value="">Chưa có trang trại</option>
                ) : (
                  farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.farm_name}
                    </option>
                  ))
                )}
              </select>
              <button type="button" className={`ph-btn ${listening ? 'ph-btn-outline' : 'ph-btn-secondary'}`} onClick={toggleMic}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
                {listening ? 'Dừng ghi âm' : 'Ghi âm giọng nói'}
              </button>
            </div>
          </div>
        }
      />

      <div className="chat-quick-grid">
        {QUICK_PROMPTS.map((prompt) => (
          <QuickActionCard
            key={prompt.label}
            icon={prompt.icon}
            title={prompt.label}
            description={prompt.text}
            action={
              <button className="ph-btn ph-btn-secondary" onClick={() => sendText(prompt.text)} disabled={loading}>
                Hỏi ngay
              </button>
            }
          />
        ))}
      </div>

      <div className="chat-shell card glass-card">
        <div className="chat-shell-head">
          <div>
            <h2>Cuộc trò chuyện với trợ lý AI</h2>
            <p>Trợ lý sẽ trả lời theo bối cảnh trang trại đang chọn để bà con dễ áp dụng hơn.</p>
          </div>
          <div className="chat-power-pill">
            <Sparkles size={16} />
            Hỗ trợ bởi Gemini
          </div>
        </div>

        <div className="chat-thread">
          {messages.length === 0 ? (
            <EmptyState
              icon={<Bot size={24} />}
              title="Hãy bắt đầu cuộc trò chuyện"
              description="Bạn có thể hỏi về độ mặn, nguy cơ hiện tại hoặc cách vận hành phù hợp với vụ tôm - lúa."
            />
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.role === 'user' ? 'is-user' : 'is-bot'}`}>
                <div className="chat-message-meta">
                  <div className="chat-message-avatar">
                    {msg.role === 'bot' ? <Bot size={18} color="white" /> : <User size={18} color="var(--primary-green)" />}
                  </div>
                  <span>{msg.role === 'bot' ? 'Mekong AI' : 'Bạn'}</span>
                </div>
                <div className="chat-message-bubble">{msg.text}</div>
                <span className="chat-message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}

          {loading && (
            <div className="chat-message is-bot">
              <div className="chat-message-meta">
                <div className="chat-message-avatar">
                  <Bot size={18} color="white" />
                </div>
                <span>Mekong AI</span>
              </div>
              <div className="chat-message-bubble loading-bubble">
                <Loader2 className="animate-spin" size={18} color="var(--primary-green)" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-shell">
          <form onSubmit={handleSend} className="chat-input-form">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về độ mặn, rủi ro, vận hành hoặc mùa vụ..."
              className="chat-input-box"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button type="submit" className="ph-btn ph-btn-primary" disabled={loading || !input.trim()}>
              <Send size={18} />
              Gửi câu hỏi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
