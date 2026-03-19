import { useState, useRef, useEffect } from 'react';
import './AIChatPage.css';
import { API_URL } from '../../config';
import { useWebNotification } from '../context/WebNotificationContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type AssistantMode = 'chat' | 'image';

export const AIChatPage = () => {
  const { notify } = useWebNotification();
  const [mode, setMode] = useState<AssistantMode>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hola. Puedo ayudarte con ideas de diseño, arquitectura y tambien generar prompts o conceptos visuales.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lastImagePrompt, setLastImagePrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendChat = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat-openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'No se pudo conectar con la IA.' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error de conexión con el servidor.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    setLoading(true);
    setGeneratedImage(null);
    setLastImagePrompt(prompt);

    try {
      const res = await fetch(`${API_URL}/chat-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      if (res.ok && data.image) {
        setGeneratedImage(data.image);
        notify('Imagen generada', 'La imagen se generó correctamente.', 'success');
      } else {
        notify('Imagen IA', data.error || 'No se pudo generar la imagen.', 'error');
      }
    } catch (error) {
      console.error(error);
      notify('Imagen IA', 'Error de conexión al generar la imagen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput('');

    if (mode === 'image') {
      await handleGenerateImage(content);
      return;
    }

    await handleSendChat(content);
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-copy">
            <h2>Asistente IA</h2>
            <span>{mode === 'chat' ? 'Consultas creativas y técnicas' : 'Generación de imágenes por prompt'}</span>
          </div>

          <div className="chat-mode-switch">
            <button type="button" className={mode === 'chat' ? 'active' : ''} onClick={() => setMode('chat')}>
              Chat
            </button>
            <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}>
              Imagen
            </button>
          </div>
        </div>

        {mode === 'chat' ? (
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="message assistant">Pensando...</div>}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="image-mode-body">
            <div className="image-mode-intro">
              <span className="eyebrow">Generación visual</span>
              <h3>Crea conceptos, mockups y escenas para tus ideas.</h3>
              <p>Ejemplo: "Un estudio de arquitectura minimalista, luz natural, render editorial, tonos neutros".</p>
            </div>

            <div className="image-preview-shell">
              {loading ? (
                <div className="image-placeholder">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Generando imagen...</span>
                </div>
              ) : generatedImage ? (
                <div className="generated-image-card">
                  <img src={generatedImage} alt={lastImagePrompt || 'Imagen generada por IA'} />
                  <p>{lastImagePrompt}</p>
                </div>
              ) : (
                <div className="image-placeholder">
                  <i className="fa-regular fa-image"></i>
                  <span>Tu imagen aparecerá aquí.</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form className="chat-input-area" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            placeholder={mode === 'chat' ? 'Escribe tu consulta sobre diseño o arquitectura...' : 'Describe la imagen que quieres generar...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-send" disabled={loading}>
            <i className={mode === 'chat' ? 'fa-solid fa-paper-plane' : 'fa-solid fa-wand-magic-sparkles'}></i>
          </button>
        </form>
      </div>
    </div>
  );
};
