import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuctionsPage.css';
import { API_URL } from '../../config';
import { useSocket } from '../context/SocketContext';

interface Auction {
  id: number;
  auction_item_id: number;
  starting_price: number;
  current_price: number;
  start_time: string;
  end_time: string;
  status: string;
  winner_user_id: number | null;
  bid_count: number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  condition_text: string;
  location_text: string;
  lot_code: string;
  brand: string;
  model: string;
  year_text: string;
  seller_name: string;
  is_featured: boolean;
}

interface Bid {
  id: number;
  auction_id: number;
  user_id: number;
  user_name: string;
  amount: number;
  created_at: string;
}

interface LiveEvent {
  id: number;
  text: string;
}

const CATEGORIES = ['Todos','Arte','Electronica','Vehiculos','Inmuebles','Joyeria','Coleccionables','Moda','Deportes'];

const CASINO_GRADIENTS = [
  'linear-gradient(145deg, #1a0533 0%, #4a0080 50%, #1a0533 100%)',
  'linear-gradient(145deg, #1a0000 0%, #8b0000 50%, #1a0000 100%)',
  'linear-gradient(145deg, #001a33 0%, #003d7a 50%, #001a33 100%)',
  'linear-gradient(145deg, #0d1a00 0%, #1a4a00 50%, #0d1a00 100%)',
  'linear-gradient(145deg, #1a1500 0%, #7a5c00 50%, #1a1500 100%)',
  'linear-gradient(145deg, #1a000d 0%, #800040 50%, #1a000d 100%)',
];

const LIVE_MESSAGES = [
  '🔥 ¡Alguien acaba de superar la puja!',
  '⚡ Nueva oferta en los últimos 30 segundos',
  '🎯 Un pujador anónimo entró a competir',
  '💥 ¡La puja acaba de subir!',
  '🚀 Oferta relámpago registrada',
  '👑 El líder fue desbancado',
];

function getGradient(id: number) { return CASINO_GRADIENTS[id % CASINO_GRADIENTS.length]; }

function useCountdown(endTime: string) {
  const calc = useCallback(() => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, ended: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      total: diff,
      ended: false,
    };
  }, [endTime]);

  const [r, setR] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setR(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);
  return r;
}

function getUrgency(endTime: string, startTime: string): 'critical' | 'hot' | 'warm' | 'cool' {
  const total = new Date(endTime).getTime() - new Date(startTime).getTime();
  const remaining = new Date(endTime).getTime() - Date.now();
  if (remaining <= 0) return 'cool';
  const pct = remaining / total;
  if (remaining < 3600000) return 'critical';   // < 1 hour
  if (pct < 0.25) return 'hot';                 // last 25%
  if (pct < 0.5) return 'warm';
  return 'cool';
}

function getTimeProgress(startTime: string, endTime: string): number {
  const total = new Date(endTime).getTime() - new Date(startTime).getTime();
  const elapsed = Date.now() - new Date(startTime).getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function getUrgencyBadge(urgency: string, bidCount: number, isFeatured: boolean) {
  if (isFeatured) return { label: '⭐ PREMIUM', cls: 'badge-premium' };
  if (urgency === 'critical') return { label: '🔴 ÚLTIMA HORA', cls: 'badge-critical' };
  if (urgency === 'hot' || bidCount > 5) return { label: '🔥 HOT', cls: 'badge-hot' };
  return { label: '🟢 EN VIVO', cls: 'badge-live' };
}

/* ── Casino Countdown (card version) ── */
function CardCountdown({ endTime, startTime }: { endTime: string; startTime: string }) {
  const { days, hours, minutes, seconds, ended } = useCountdown(endTime);
  const urgency = getUrgency(endTime, startTime);
  const progress = getTimeProgress(startTime, endTime);
  const cls = `card-countdown urgency-${urgency}`;

  if (ended) return <div className={cls}><span className="cd-ended">CERRADA</span></div>;

  return (
    <div className={cls}>
      <div className="cd-digits">
        {days > 0 && <><span className="cd-block"><span className="cd-num">{days}</span><span className="cd-unit">d</span></span><span className="cd-sep">:</span></>}
        <span className="cd-block"><span className="cd-num">{String(hours).padStart(2,'0')}</span><span className="cd-unit">h</span></span>
        <span className="cd-sep">:</span>
        <span className="cd-block"><span className="cd-num">{String(minutes).padStart(2,'0')}</span><span className="cd-unit">m</span></span>
        <span className="cd-sep">:</span>
        <span className={`cd-block ${urgency === 'critical' ? 'cd-blink' : ''}`}>
          <span className="cd-num">{String(seconds).padStart(2,'0')}</span>
          <span className="cd-unit">s</span>
        </span>
      </div>
      <div className="cd-bar-wrap">
        <div className="cd-bar" style={{ width: `${progress}%` }} data-urgency={urgency}></div>
      </div>
    </div>
  );
}

/* ── Modal Countdown (large) ── */
function ModalCountdown({ endTime, startTime }: { endTime: string; startTime: string }) {
  const { days, hours, minutes, seconds, ended } = useCountdown(endTime);
  const urgency = getUrgency(endTime, startTime);
  const progress = getTimeProgress(startTime, endTime);

  if (ended) return <div className="modal-countdown-ended">⛔ SUBASTA CERRADA</div>;

  return (
    <div className={`modal-countdown urgency-${urgency}`}>
      <div className="mcd-label">
        <i className="fa-solid fa-hourglass-half"></i> Tiempo restante
      </div>
      <div className="mcd-digits">
        {days > 0 && <><div className="mcd-block"><div className="mcd-num">{days}</div><div className="mcd-unit">DÍAS</div></div><div className="mcd-sep">:</div></>}
        <div className="mcd-block"><div className="mcd-num">{String(hours).padStart(2,'0')}</div><div className="mcd-unit">HORAS</div></div>
        <div className="mcd-sep">:</div>
        <div className="mcd-block"><div className="mcd-num">{String(minutes).padStart(2,'0')}</div><div className="mcd-unit">MIN</div></div>
        <div className="mcd-sep">:</div>
        <div className={`mcd-block ${urgency === 'critical' ? 'mcd-blink' : ''}`}>
          <div className="mcd-num">{String(seconds).padStart(2,'0')}</div>
          <div className="mcd-unit">SEG</div>
        </div>
      </div>
      <div className="mcd-progress-wrap">
        <div className="mcd-progress" style={{ width: `${progress}%` }} data-urgency={urgency}></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */
export const AuctionsPage = () => {
  const [auctions, setAuctions]           = useState<Auction[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedAuction, setSelectedAuction]   = useState<Auction | null>(null);
  const [auctionBids, setAuctionBids]     = useState<Bid[]>([]);
  const [bidAmount, setBidAmount]         = useState('');
  const [bidError, setBidError]           = useState('');
  const [clientPoints, setClientPoints]   = useState<number | null>(null);
  const [bidSending, setBidSending]       = useState(false);
  const [loadingBids, setLoadingBids]     = useState(false);
  const [bidFlash, setBidFlash]           = useState(false);
  const [liveEvents, setLiveEvents]       = useState<LiveEvent[]>([]);
  const [participants, setParticipants]   = useState(0);
  const liveIdRef           = useRef(0);
  const selectedAuctionRef  = useRef<Auction | null>(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  /* Push a random live event */
  const pushLiveEvent = useCallback((custom?: string) => {
    const text = custom ?? LIVE_MESSAGES[Math.floor(Math.random() * LIVE_MESSAGES.length)];
    const id = ++liveIdRef.current;
    setLiveEvents(prev => [{ id, text }, ...prev].slice(0, 4));
    setTimeout(() => setLiveEvents(prev => prev.filter(e => e.id !== id)), 5000);
  }, []);

  /* Simulate random live activity */
  useEffect(() => {
    const t = setInterval(() => { if (Math.random() > 0.5) pushLiveEvent(); }, 7000);
    return () => clearInterval(t);
  }, [pushLiveEvent]);

  /* Keep ref in sync so socket listeners always read current auction */
  useEffect(() => { selectedAuctionRef.current = selectedAuction; }, [selectedAuction]);

  /* Socket: real-time bids + participant counter */
  useEffect(() => {
    if (!socket) return;

    const onNewBid = (data: { auction_id: number; new_price: number; user_id: number; user_name: string }) => {
      const userStr = localStorage.getItem('currentUser');
      const me = userStr ? JSON.parse(userStr) : null;
      const isMine = me && data.user_id === me.id;

      // Update card grid
      setAuctions(prev => prev.map(a =>
        a.id === data.auction_id
          ? { ...a, current_price: data.new_price, bid_count: a.bid_count + 1 }
          : a
      ));

      // Update open modal if it's the same auction and bid is from someone else
      const open = selectedAuctionRef.current;
      if (open && open.id === data.auction_id && !isMine) {
        setSelectedAuction(prev => prev ? { ...prev, current_price: data.new_price, bid_count: prev.bid_count + 1 } : null);
        setBidAmount(String((data.new_price + 1).toFixed(2)));
        fetchBids(data.auction_id);
        setBidFlash(true);
        setTimeout(() => setBidFlash(false), 800);
        pushLiveEvent(`💥 ${data.user_name} pujó $${data.new_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}!`);
      }
    };

    const onParticipants = (data: { auction_id: number; count: number }) => {
      if (selectedAuctionRef.current?.id === data.auction_id) {
        setParticipants(data.count);
      }
    };

    socket.on('new_bid', onNewBid);
    socket.on('participants_update', onParticipants);
    return () => {
      socket.off('new_bid', onNewBid);
      socket.off('participants_update', onParticipants);
    };
  }, [socket, pushLiveEvent]);

  const normalizeAuction = (a: Auction): Auction => ({
    ...a,
    current_price:  parseFloat(String(a.current_price)),
    starting_price: parseFloat(String(a.starting_price)),
    bid_count:      Number(a.bid_count) || 0,
  });

  const fetchAuctions = useCallback(async () => {
    try {
      const params = selectedCategory !== 'Todos' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const res  = await fetch(`${API_URL}/auctions${params}`);
      const data = await res.json();
      if (res.ok) setAuctions((Array.isArray(data) ? data : []).map(normalizeAuction));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedCategory]);

  useEffect(() => { setLoading(true); fetchAuctions(); }, [fetchAuctions]);

  const fetchBids = async (auctionId: number) => {
    setLoadingBids(true);
    try {
      const res  = await fetch(`${API_URL}/auctions/${auctionId}/bids`);
      const data = await res.json();
      if (res.ok) setAuctionBids(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingBids(false); }
  };

  const handleOpenAuction = (auction: Auction) => {
    setSelectedAuction(auction);
    setParticipants(0);
    setBidAmount(String((auction.current_price + 1).toFixed(2)));
    setBidError('');
    fetchBids(auction.id);
    socket?.emit('join_auction', auction.id);
    const userStr2 = localStorage.getItem('currentUser');
    const u = userStr2 ? JSON.parse(userStr2) : null;
    if (u) {
      fetch(`${API_URL}/clients/${u.id}/points`)
        .then(r => r.json())
        .then(d => setClientPoints(d.balance ?? 0))
        .catch(() => setClientPoints(null));
    }
  };

  const handleCloseModal = () => {
    if (selectedAuctionRef.current) socket?.emit('leave_auction', selectedAuctionRef.current.id);
    setSelectedAuction(null);
    setAuctionBids([]);
    setBidAmount('');
    setBidError('');
    setBidSending(false);
    setBidFlash(false);
    setParticipants(0);
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) { alert('Debes iniciar sesion para pujar.'); navigate('/login/client'); return; }
    const user = JSON.parse(userStr);
    if (!selectedAuction) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= selectedAuction.current_price) {
      setBidError(`La puja debe superar: $${selectedAuction.current_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
      return;
    }
    try {
      setBidSending(true);
      const res  = await fetch(`${API_URL}/auctions/${selectedAuction.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.new_balance !== undefined) setClientPoints(data.new_balance);
        setBidFlash(true);
        setTimeout(() => setBidFlash(false), 800);
        setSelectedAuction(prev => prev ? { ...prev, current_price: amount, bid_count: prev.bid_count + 1 } : null);
        setAuctions(prev => prev.map(a => a.id === selectedAuction.id ? { ...a, current_price: amount, bid_count: a.bid_count + 1 } : a));
        setBidAmount(String((amount + 1).toFixed(2)));
        pushLiveEvent(`🎉 ¡${user.name || 'Tú'} acaba de pujar $${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}!`);
        await fetchBids(selectedAuction.id);
        alert('¡PUJA REGISTRADA! Eres el nuevo líder.');
      } else {
        setBidError(data.error || 'No se pudo registrar la puja.');
      }
    } catch { setBidError('Error de conexion. Intenta nuevamente.'); }
    finally { setBidSending(false); }
  };

  const featured = auctions.filter(a => a.is_featured && a.status === 'ACTIVE');
  const regular  = auctions.filter(a => !(a.is_featured && a.status === 'ACTIVE'));

  return (
    <div className="casino-page">

      {/* ── Live Events Feed ── */}
      <div className="live-feed-bar">
        {liveEvents.map(ev => (
          <div key={ev.id} className="live-feed-item">{ev.text}</div>
        ))}
      </div>

      <div className="casino-layout">

        {/* ── Sidebar ── */}
        <aside className="casino-sidebar">
          <div className="cs-logo-block">
            <i className="fa-solid fa-gem"></i>
            <span>SUBASTAS<br/><small>EN VIVO</small></span>
          </div>

          <div className="cs-section-label">CATEGORÍAS</div>
          <ul className="cs-category-list">
            {CATEGORIES.map(cat => (
              <li
                key={cat}
                className={selectedCategory === cat ? 'active' : ''}
                onClick={() => setSelectedCategory(cat)}
              >
                <span>{cat}</span>
                {selectedCategory === cat && <i className="fa-solid fa-chevron-right"></i>}
              </li>
            ))}
          </ul>

          <div className="cs-stats-block">
            <div className="cs-stat">
              <div className="cs-stat-num">{auctions.filter(a => a.status === 'ACTIVE').length}</div>
              <div className="cs-stat-label">Subastas activas</div>
            </div>
            <div className="cs-stat">
              <div className="cs-stat-num">{auctions.reduce((s, a) => s + a.bid_count, 0)}</div>
              <div className="cs-stat-label">Pujas totales</div>
            </div>
          </div>

          <div className="cs-shield">
            <i className="fa-solid fa-shield-halved"></i>
            <div>
              <strong>Plataforma segura</strong>
              <span>Pagos protegidos. Transparencia total en cada puja.</span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="casino-main">

          {/* Hero */}
          <section className="casino-hero">
            <div className="ch-glow-ring"></div>
            <div className="ch-content">
              <div className="ch-badge">
                <span className="pulse-dot"></span> SUBASTAS EN VIVO
              </div>
              <h1 className="ch-title">¡PUJA Y <span>GANA</span>!</h1>
              <p className="ch-sub">Artículos exclusivos. Contadores en tiempo real. El mejor precio es tuyo.</p>
              <div className="ch-actions">
                <a href="#auctions-list" className="ch-btn-primary">
                  <i className="fa-solid fa-gavel"></i> VER SUBASTAS
                </a>
                <a href="#featured" className="ch-btn-secondary">
                  <i className="fa-solid fa-star"></i> DESTACADOS
                </a>
              </div>
            </div>
            <div className="ch-right">
              <div className="ch-stat-grid">
                <div className="ch-tile gold">
                  <div className="ch-tile-num">{auctions.filter(a => a.status === 'ACTIVE').length}</div>
                  <div className="ch-tile-label">EN VIVO</div>
                </div>
                <div className="ch-tile red">
                  <div className="ch-tile-num">{auctions.reduce((s,a) => s + a.bid_count, 0)}</div>
                  <div className="ch-tile-label">PUJAS</div>
                </div>
                <div className="ch-tile purple">
                  <div className="ch-tile-num">{featured.length}</div>
                  <div className="ch-tile-label">PREMIUM</div>
                </div>
                <div className="ch-tile blue">
                  <div className="ch-tile-num">100%</div>
                  <div className="ch-tile-label">SEGURO</div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured */}
          {featured.length > 0 && (
            <section id="featured" className="casino-section">
              <div className="casino-section-header">
                <span className="casino-eyebrow gold">⭐ SUBASTAS PREMIUM</span>
                <h2>Artículos Destacados</h2>
              </div>
              <div className="featured-grid">
                {featured.map(auction => {
                  const urgency = getUrgency(auction.end_time, auction.start_time);
                  const badge   = getUrgencyBadge(urgency, auction.bid_count, true);
                  return (
                    <article
                      key={auction.id}
                      className={`casino-card featured-casino-card urgency-border-${urgency}`}
                      onClick={() => handleOpenAuction(auction)}
                    >
                      <div className="cc-glow-border"></div>
                      <div className="cc-image" style={{ background: getGradient(auction.id) }}>
                        {auction.image_url
                          ? <img src={auction.image_url} alt={auction.title} className="cc-img" />
                          : <i className="fa-solid fa-gem cc-placeholder"></i>
                        }
                        <span className={`cc-badge ${badge.cls}`}>{badge.label}</span>
                        <div className="cc-shine"></div>
                      </div>
                      <div className="cc-body">
                        <CardCountdown endTime={auction.end_time} startTime={auction.start_time} />
                        <div className="cc-tags">
                          {auction.category && <span className="cc-tag">{auction.category}</span>}
                          {auction.condition_text && <span className="cc-tag">{auction.condition_text}</span>}
                          {auction.lot_code && <span className="cc-tag gold-tag">#{auction.lot_code}</span>}
                        </div>
                        <h3 className="cc-title">{auction.title}</h3>
                        <p className="cc-desc">{auction.description}</p>
                        <div className="cc-meta">
                          {auction.seller_name && <span><i className="fa-solid fa-user"></i> {auction.seller_name}</span>}
                          <span><i className="fa-solid fa-gavel"></i> {auction.bid_count} pujas</span>
                        </div>
                        <div className="cc-footer">
                          <div className="cc-price-block">
                            <div className="cc-price-label">PUJA ACTUAL</div>
                            <div className="cc-price">${auction.current_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                            <div className="cc-base-price">Inicio: ${auction.starting_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                          </div>
                          <button className="cc-bid-btn">
                            <i className="fa-solid fa-gavel"></i>
                            <span>PUJAR</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* All auctions */}
          <section id="auctions-list" className="casino-section">
            <div className="casino-section-header">
              <span className="casino-eyebrow">
                {selectedCategory !== 'Todos' ? `📂 ${selectedCategory}` : '🎰 TODAS LAS SUBASTAS'}
              </span>
              <h2>Subastas Disponibles</h2>
              <div className="casino-count-badge">{auctions.length} subastas</div>
            </div>

            {loading ? (
              <div className="casino-loading">
                <div className="loading-reel">
                  <i className="fa-solid fa-gem"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-crown"></i>
                </div>
                <p>Cargando subastas...</p>
              </div>
            ) : auctions.length === 0 ? (
              <div className="casino-empty">
                <i className="fa-solid fa-dice"></i>
                <p>No hay subastas en esta categoría.</p>
              </div>
            ) : (
              <div className="casino-grid">
                {auctions.map(auction => {
                  const urgency = getUrgency(auction.end_time, auction.start_time);
                  const badge   = getUrgencyBadge(urgency, auction.bid_count, auction.is_featured);
                  return (
                    <article
                      key={auction.id}
                      className={`casino-card urgency-border-${urgency}`}
                      onClick={() => handleOpenAuction(auction)}
                    >
                      <div className="cc-glow-border"></div>
                      <div className="cc-image" style={{ background: getGradient(auction.id) }}>
                        {auction.image_url
                          ? <img src={auction.image_url} alt={auction.title} className="cc-img" />
                          : <i className="fa-solid fa-gavel cc-placeholder"></i>
                        }
                        {auction.status === 'ACTIVE'
                          ? <span className={`cc-badge ${badge.cls}`}>{badge.label}</span>
                          : <span className="cc-badge badge-ended">⛔ CERRADA</span>
                        }
                        <div className="cc-shine"></div>
                      </div>
                      <div className="cc-body">
                        {auction.status === 'ACTIVE'
                          ? <CardCountdown endTime={auction.end_time} startTime={auction.start_time} />
                          : <div className="cd-ended-label">Subasta finalizada</div>
                        }
                        <div className="cc-tags">
                          {auction.category && <span className="cc-tag">{auction.category}</span>}
                        </div>
                        <h3 className="cc-title">{auction.title}</h3>
                        <p className="cc-desc">{auction.description}</p>
                        <div className="cc-meta">
                          <span><i className="fa-solid fa-gavel"></i> {auction.bid_count} pujas</span>
                          {auction.seller_name && <span><i className="fa-solid fa-user"></i> {auction.seller_name}</span>}
                        </div>
                        <div className="cc-footer">
                          <div className="cc-price-block">
                            <div className="cc-price-label">PUJA ACTUAL</div>
                            <div className="cc-price">${auction.current_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                          </div>
                          {auction.status === 'ACTIVE'
                            ? <button className="cc-bid-btn"><i className="fa-solid fa-gavel"></i><span>PUJAR</span></button>
                            : <span className="cc-ended-tag">CERRADA</span>
                          }
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ══════════ BID MODAL ══════════ */}
      {selectedAuction && (
        <div className={`casino-overlay ${bidFlash ? 'bid-flash' : ''}`} onClick={e => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="casino-modal">
            <div className="casino-modal-inner">
            <button className="cm-close" onClick={handleCloseModal}><i className="fa-solid fa-xmark"></i></button>

            {/* Modal header image */}
            <div className="cm-image-wrap" style={{ background: getGradient(selectedAuction.id) }}>
              {selectedAuction.image_url
                ? <img src={selectedAuction.image_url} alt={selectedAuction.title} className="cm-img" />
                : <i className="fa-solid fa-gem cm-img-icon"></i>
              }
              <div className="cm-image-overlay"></div>
              <div className="cm-header-info">
                {getUrgencyBadge(getUrgency(selectedAuction.end_time, selectedAuction.start_time), selectedAuction.bid_count, selectedAuction.is_featured) &&
                  <span className={`cc-badge ${getUrgencyBadge(getUrgency(selectedAuction.end_time, selectedAuction.start_time), selectedAuction.bid_count, selectedAuction.is_featured).cls}`}>
                    {getUrgencyBadge(getUrgency(selectedAuction.end_time, selectedAuction.start_time), selectedAuction.bid_count, selectedAuction.is_featured).label}
                  </span>
                }
              </div>
            </div>

            <div className="cm-body">
              {/* Countdown */}
              {selectedAuction.status === 'ACTIVE' && (
                <ModalCountdown endTime={selectedAuction.end_time} startTime={selectedAuction.start_time} />
              )}

              {/* Title & info */}
              <div className="cm-tags">
                {selectedAuction.category && <span className="cc-tag">{selectedAuction.category}</span>}
                {selectedAuction.condition_text && <span className="cc-tag">{selectedAuction.condition_text}</span>}
                {selectedAuction.lot_code && <span className="cc-tag gold-tag">#{selectedAuction.lot_code}</span>}
              </div>

              <div className="cm-title-row">
                <h2 className="cm-title">{selectedAuction.title}</h2>
                {participants > 0 && (
                  <div className="cm-participants">
                    <span className="cm-part-dot"></span>
                    <i className="fa-solid fa-eye"></i>
                    <span>{participants} {participants === 1 ? 'viendo' : 'viendo'}</span>
                  </div>
                )}
              </div>
              {selectedAuction.description && (
                <p className="cm-desc">{selectedAuction.description}</p>
              )}

              {/* Details grid */}
              {(selectedAuction.brand || selectedAuction.model || selectedAuction.year_text || selectedAuction.seller_name) && (
                <div className="cm-details">
                  {selectedAuction.brand       && <div><span>Marca</span><strong>{selectedAuction.brand}</strong></div>}
                  {selectedAuction.model       && <div><span>Modelo</span><strong>{selectedAuction.model}</strong></div>}
                  {selectedAuction.year_text   && <div><span>Año</span><strong>{selectedAuction.year_text}</strong></div>}
                  {selectedAuction.seller_name && <div><span>Vendedor</span><strong>{selectedAuction.seller_name}</strong></div>}
                  {selectedAuction.location_text && <div><span>Ubicación</span><strong>{selectedAuction.location_text}</strong></div>}
                </div>
              )}

              {/* Price summary */}
              <div className="cm-price-row">
                <div className="cm-price-tile">
                  <div className="cm-price-label">PRECIO INICIAL</div>
                  <div className="cm-price-val">${selectedAuction.starting_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="cm-price-tile gold-tile">
                  <div className="cm-price-label">PUJA ACTUAL</div>
                  <div className="cm-price-val gold">${selectedAuction.current_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="cm-price-tile">
                  <div className="cm-price-label">TOTAL PUJAS</div>
                  <div className="cm-price-val">{selectedAuction.bid_count}</div>
                </div>
              </div>

              {/* Bid form */}
              {selectedAuction.status === 'ACTIVE' ? (
                <form onSubmit={handlePlaceBid} className="cm-bid-form">
                  <label className="cm-bid-label">TU OFERTA (USD)</label>
                  <div className="cm-bid-input-wrap">
                    <span className="cm-currency">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={selectedAuction.current_price + 0.01}
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      placeholder={`Mín. $${(selectedAuction.current_price + 1).toFixed(2)}`}
                      required
                    />
                  </div>
                  {bidError && <div className="cm-error"><i className="fa-solid fa-triangle-exclamation"></i> {bidError}</div>}
                  {clientPoints !== null && (
                    <div className="cm-points-balance">
                      <i className="fa-solid fa-coins"></i>
                      <span>Tu saldo: <strong>{clientPoints.toLocaleString('es-ES')} pts</strong></span>
                      {parseFloat(bidAmount) > clientPoints && (
                        <span className="cm-pts-warn">Insuficiente</span>
                      )}
                    </div>
                  )}
                  <button type="submit" className={`cm-bid-btn ${bidSending ? 'sending' : ''}`} disabled={bidSending}>
                    {bidSending
                      ? <><i className="fa-solid fa-spinner fa-spin"></i> REGISTRANDO...</>
                      : <><i className="fa-solid fa-gavel"></i> ¡CONFIRMAR PUJA!</>
                    }
                  </button>
                </form>
              ) : (
                <div className="cm-ended-notice">
                  <i className="fa-solid fa-lock"></i>
                  <span>Esta subasta ha finalizado.</span>
                </div>
              )}

              {/* Bid history */}
              <div className="cm-bid-history">
                <div className="cm-bh-header">
                  <i className="fa-solid fa-list-ul"></i> HISTORIAL DE PUJAS
                </div>
                {loadingBids ? (
                  <p className="cm-bh-empty"><i className="fa-solid fa-spinner fa-spin"></i> Cargando...</p>
                ) : auctionBids.length === 0 ? (
                  <p className="cm-bh-empty">Sin pujas aún. ¡Sé el primero en ofertar!</p>
                ) : (
                  <ul className="cm-bid-list">
                    {auctionBids.map((bid, idx) => (
                      <li key={bid.id} className={`cm-bid-item ${idx === 0 ? 'top-bid' : ''}`}>
                        <div className="cm-bid-avatar">
                          {(bid.user_name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="cm-bid-info">
                          <span className="cm-bid-name">{bid.user_name || `Usuario #${bid.user_id}`}</span>
                          {idx === 0 && <span className="cm-leader-tag"><i className="fa-solid fa-crown"></i> LÍDER</span>}
                        </div>
                        <div className="cm-bid-amount">${Number(bid.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                        <div className="cm-bid-time">{new Date(bid.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </div>{/* casino-modal-inner */}
          </div>
        </div>
      )}
    </div>
  );
};
