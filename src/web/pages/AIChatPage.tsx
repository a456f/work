import { useState, useRef, useEffect } from 'react';
import './AIChatPage.css';
import { API_URL } from '../../config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de arquitectura y diseño. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }) // Enviamos historial completo para contexto
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al conectar con el servidor. ' + (data.error || '') }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Asegúrate de que el servidor backend esté corriendo.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <i className="fa-solid fa-robot"></i>
          <div>
            <h2>Asistente Virtual</h2>
            <span style={{fontSize: '0.8rem', color: '#666'}}>Powered by Claude 3</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && <div className="message assistant">Escribiendo... <i className="fa-solid fa-spinner fa-spin"></i></div>}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <input 
            className="chat-input" 
            placeholder="Escribe tu consulta sobre diseño o arquitectura..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-send" disabled={loading}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};