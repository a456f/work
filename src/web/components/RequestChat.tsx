import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../../config';
import './RequestChat.css';

interface Message {
  id?: number;
  sender_id: number;
  sender_name: string;
  message: string;
  created_at?: string;
}

interface RequestChatProps {
  requestId: number;
  currentUserId: number;
  title: string;
  onClose: () => void;
}

export const RequestChat = ({ requestId, currentUserId, title, onClose }: RequestChatProps) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar historial y conectar socket
  useEffect(() => {
    fetchMessages();
    
    if (socket) {
      socket.emit('join_chat', requestId);
      
      const messageHandler = (msg: Message) => {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      };

      const typingStartHandler = () => setIsOtherUserTyping(true);
      const typingStopHandler = () => setIsOtherUserTyping(false);

      socket.on('receive_message', messageHandler);
      socket.on('user_is_typing', typingStartHandler);
      socket.on('user_stopped_typing', typingStopHandler);

      return () => {
        socket.off('receive_message', messageHandler);
        socket.off('user_is_typing', typingStartHandler);
        socket.off('user_stopped_typing', typingStopHandler);
      };
    }

  }, [requestId, socket]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/service-requests/${requestId}/messages`);
      if (res.ok) {
        setMessages(await res.json());
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socket) {
      // Notificar que se está escribiendo
      socket.emit('typing_start', { requestId });

      // Limpiar timeout anterior y establecer uno nuevo para "dejar de escribir"
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { requestId });
      }, 2000); // Considera "dejó de escribir" tras 2 segundos de inactividad
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Enviar a la API (que guardará y emitirá por socket)
      const res = await fetch(`${API_URL}/request-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          sender_id: currentUserId,
          message: newMessage
        })
      });

      // Notificar que se dejó de escribir al enviar
      if (socket) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', { requestId });
      }

      if (res.ok) {
        setNewMessage('');
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo enviar el mensaje.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al enviar mensaje.');
    }
  };

  return (
    <div className="request-chat-overlay">
      <div className="request-chat-window">
        <div className="chat-window-header">
          <div>
            <h4>Chat del Proyecto</h4>
            <span style={{fontSize:'0.8rem', opacity: 0.8}}>{title}</span>
          </div>
          <button onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        
        <div className="chat-window-messages">
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId;
            const isSystem = msg.message.startsWith('[SYSTEM] ');
            const cleanMessage = isSystem ? msg.message.replace('[SYSTEM] ', '') : msg.message;

            if (isSystem) {
              return (
                <div key={idx} className="chat-system-message">
                  <span>{cleanMessage}</span>
                  <span style={{fontSize:'0.6rem', opacity:0.7, marginLeft:'5px'}}>{new Date(msg.created_at || '').toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              );
            }

            return (
              <div key={idx} className={`chat-bubble ${isMe ? 'chat-me' : 'chat-other'}`}>
                <div className="chat-bubble-header">
                  <span className="chat-sender-name">{isMe ? 'Tú' : msg.sender_name}</span>
                  <span className="chat-timestamp">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="chat-text">{msg.message}</div>
              </div>
            );
          })}
          {isOtherUserTyping && <div className="typing-indicator"><span></span><span></span><span></span></div>}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-window-input" onSubmit={handleSend}>
          <input 
            value={newMessage} 
            onChange={handleInputChange}
            placeholder="Escribe un mensaje..." 
          />
          <button type="submit"><i className="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
    </div>
  );
};
