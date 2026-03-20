interface TopbarProps { title: string; subtitle?: string; }

export const Topbar = ({ title, subtitle }: TopbarProps) => {
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="adm-topbar">
      <div className="adm-topbar-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="adm-topbar-right">
        <div className="adm-topbar-chip">
          <i className="fa-regular fa-calendar"></i>
          {today.charAt(0).toUpperCase() + today.slice(1)}
        </div>
      </div>
    </header>
  );
};
