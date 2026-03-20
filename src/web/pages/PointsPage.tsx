import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PointsPage.css';
import { API_URL } from '../../config';

interface Package {
  id: number;
  name: string;
  points: number;
  bonus_points: number;
  price_usd: number;
  is_featured: boolean;
}

interface Transaction {
  id: number;
  type: 'PURCHASE' | 'BID_PLACED' | 'BID_REFUND' | 'BONUS';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface PointsData {
  balance: number;
  total_earned: number;
  total_spent: number;
  transactions: Transaction[];
}

const TYPE_LABELS: Record<string, { label: string; cls: string; icon: string }> = {
  PURCHASE:  { label: 'Recarga',   cls: 'tx-purchase', icon: 'fa-solid fa-circle-plus' },
  BID_PLACED:{ label: 'Puja',      cls: 'tx-bid',      icon: 'fa-solid fa-gavel' },
  BID_REFUND:{ label: 'Reembolso', cls: 'tx-refund',   icon: 'fa-solid fa-rotate-left' },
  BONUS:     { label: 'Bonus',     cls: 'tx-bonus',    icon: 'fa-solid fa-gift' },
};

export const PointsPage = () => {
  const navigate   = useNavigate();
  const userStr    = localStorage.getItem('currentUser');
  const user       = userStr ? JSON.parse(userStr) : null;

  const [data, setData]           = useState<PointsData | null>(null);
  const [packages, setPackages]   = useState<Package[]>([]);
  const [loading, setLoading]     = useState(true);
  const [buying, setBuying]       = useState<Package | null>(null);
  const [cardNum, setCardNum]     = useState('');
  const [expiry, setExpiry]       = useState('');
  const [cvv, setCvv]             = useState('');
  const [cardName, setCardName]   = useState('');
  const [paying, setPaying]       = useState(false);
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'CLIENT') { navigate('/login/client'); return; }
    Promise.all([
      fetch(`${API_URL}/clients/${user.id}/points`).then(r => r.json()),
      fetch(`${API_URL}/points/packages`).then(r => r.json()),
    ]).then(([pts, pkgs]) => {
      setData(pts);
      setPackages(Array.isArray(pkgs) ? pkgs : []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshPoints = async () => {
    const res  = await fetch(`${API_URL}/clients/${user.id}/points`);
    const json = await res.json();
    setData(json);
  };

  const openBuy = (pkg: Package) => {
    setBuying(pkg);
    setCardNum(''); setExpiry(''); setCvv(''); setCardName('');
    setSuccess(false);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buying) return;
    setPaying(true);
    try {
      await new Promise(r => setTimeout(r, 1400)); // simulate processing
      const res  = await fetch(`${API_URL}/clients/${user.id}/points/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: buying.id }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess(true);
        await refreshPoints();
        setTimeout(() => { setBuying(null); setSuccess(false); }, 2200);
      } else {
        alert(json.error || 'Error al procesar el pago.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setPaying(false);
    }
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExpiry = (v: string) =>
    v.replace(/\D/g,'').slice(0,4).replace(/^(.{2})(.+)/,'$1/$2');

  if (loading) return (
    <div className="pts-loading">
      <i className="fa-solid fa-spinner fa-spin"></i>
      <span>Cargando puntos...</span>
    </div>
  );

  return (
    <div className="pts-page">
      <div className="pts-container">

        {/* ── Header ── */}
        <div className="pts-page-header">
          <div>
            <span className="eyebrow"><i className="fa-solid fa-coins"></i> Mis puntos</span>
            <h1 className="pts-heading">Centro de Puntos</h1>
          </div>
        </div>

        {/* ── Balance banner ── */}
        <div className="pts-balance-banner">
          <div className="pts-balance-left">
            <div className="pts-balance-icon"><i className="fa-solid fa-coins"></i></div>
            <div>
              <div className="pts-balance-label">Saldo disponible</div>
              <div className="pts-balance-num">{(data?.balance ?? 0).toLocaleString('es-ES')} <span>pts</span></div>
              <div className="pts-balance-eq">≈ ${(data?.balance ?? 0).toFixed(2)} USD de poder de puja</div>
            </div>
          </div>
          <div className="pts-balance-stats">
            <div className="pts-mini-stat">
              <i className="fa-solid fa-circle-plus"></i>
              <div>
                <div className="pts-mini-num">{(data?.total_earned ?? 0).toLocaleString('es-ES')}</div>
                <div className="pts-mini-label">Total ganados</div>
              </div>
            </div>
            <div className="pts-mini-stat">
              <i className="fa-solid fa-gavel"></i>
              <div>
                <div className="pts-mini-num">{(data?.total_spent ?? 0).toLocaleString('es-ES')}</div>
                <div className="pts-mini-label">Total usados</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Info strip ── */}
        <div className="pts-info-strip">
          <i className="fa-solid fa-circle-info"></i>
          <span><strong>1 punto = $1 USD</strong> de puja en subastas. Los puntos se descuentan al pujar y se reembolsan si eres superado.</span>
        </div>

        {/* ── Packages ── */}
        <section className="pts-section">
          <h2 className="pts-section-title">Recargar puntos</h2>
          <div className="pts-packages-grid">
            {packages.map(pkg => {
              const total = pkg.points + pkg.bonus_points;
              return (
                <div key={pkg.id} className={`pts-pkg-card ${pkg.is_featured ? 'featured' : ''}`}>
                  {pkg.is_featured && <div className="pts-pkg-ribbon">Más popular</div>}
                  <div className="pts-pkg-name">{pkg.name}</div>
                  <div className="pts-pkg-points">
                    {pkg.points.toLocaleString('es-ES')}
                    {pkg.bonus_points > 0 && <span className="pts-pkg-bonus">+{pkg.bonus_points} bonus</span>}
                  </div>
                  <div className="pts-pkg-total">{total.toLocaleString('es-ES')} pts en total</div>
                  <div className="pts-pkg-price">${Number(pkg.price_usd).toFixed(2)} <span>USD</span></div>
                  <button className="pts-pkg-btn" onClick={() => openBuy(pkg)}>
                    <i className="fa-solid fa-credit-card"></i> Comprar
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Transaction history ── */}
        <section className="pts-section">
          <h2 className="pts-section-title">Historial de movimientos</h2>
          {(!data?.transactions || data.transactions.length === 0) ? (
            <div className="pts-tx-empty">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <p>Aún no tienes movimientos. ¡Recarga puntos para comenzar a pujar!</p>
            </div>
          ) : (
            <div className="pts-tx-list">
              {data.transactions.map(tx => {
                const meta = TYPE_LABELS[tx.type] ?? TYPE_LABELS['BONUS'];
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className={`pts-tx-item ${meta.cls}`}>
                    <div className="pts-tx-icon"><i className={meta.icon}></i></div>
                    <div className="pts-tx-info">
                      <div className="pts-tx-desc">{tx.description}</div>
                      <div className="pts-tx-meta">
                        <span className={`pts-tx-type-badge ${meta.cls}`}>{meta.label}</span>
                        <span className="pts-tx-date">
                          {new Date(tx.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className={`pts-tx-amount ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{tx.amount.toLocaleString('es-ES')} pts
                    </div>
                    <div className="pts-tx-balance">{tx.balance_after.toLocaleString('es-ES')} pts</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* ── Payment modal ── */}
      {buying && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !paying) setBuying(null); }}>
          <div className="modal-content pts-pay-modal">
            {!success ? (
              <>
                <button className="modal-close-btn" onClick={() => setBuying(null)} disabled={paying}>&times;</button>
                <span className="eyebrow"><i className="fa-solid fa-lock"></i> Pago seguro simulado</span>
                <h3>Comprar paquete {buying.name}</h3>
                <div className="pts-pay-summary">
                  <span>{buying.points + buying.bonus_points} puntos</span>
                  <span className="pts-pay-price">${Number(buying.price_usd).toFixed(2)} USD</span>
                </div>
                <form onSubmit={handlePurchase} className="pts-pay-form">
                  <div className="pts-pay-group">
                    <label>Nombre en la tarjeta</label>
                    <input type="text" placeholder="JUAN PÉREZ" value={cardName}
                      onChange={e => setCardName(e.target.value)} required />
                  </div>
                  <div className="pts-pay-group">
                    <label>Número de tarjeta</label>
                    <div className="pts-card-input-wrap">
                      <i className="fa-regular fa-credit-card"></i>
                      <input type="text" placeholder="1234 5678 9012 3456"
                        value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} required maxLength={19} />
                    </div>
                  </div>
                  <div className="pts-pay-row">
                    <div className="pts-pay-group">
                      <label>Vencimiento</label>
                      <input type="text" placeholder="MM/AA"
                        value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} required maxLength={5} />
                    </div>
                    <div className="pts-pay-group">
                      <label>CVV</label>
                      <input type="text" placeholder="123"
                        value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} required maxLength={4} />
                    </div>
                  </div>
                  <div className="pts-pay-notice">
                    <i className="fa-solid fa-shield-halved"></i>
                    Este es un entorno de demostración. No se realizará ningún cobro real.
                  </div>
                  <button type="submit" className="pts-pay-btn" disabled={paying}>
                    {paying
                      ? <><i className="fa-solid fa-spinner fa-spin"></i> Procesando pago...</>
                      : <><i className="fa-solid fa-lock"></i> Pagar ${Number(buying.price_usd).toFixed(2)} USD</>
                    }
                  </button>
                </form>
              </>
            ) : (
              <div className="pts-pay-success">
                <div className="pts-success-icon"><i className="fa-solid fa-circle-check"></i></div>
                <h3>¡Pago exitoso!</h3>
                <p>Se acreditaron <strong>{buying.points + buying.bonus_points} puntos</strong> a tu cuenta.</p>
                <p className="pts-new-balance">Nuevo saldo: <strong>{data?.balance.toLocaleString('es-ES')} pts</strong></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
