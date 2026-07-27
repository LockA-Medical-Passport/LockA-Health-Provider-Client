import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LockaLogo } from './LockaLogo';
import { Spinner } from './Spinner';
import { truncateAddress } from '../lib/format';
import type { WalletStatus } from '../hooks/useWallet';
import {
  AccessIcon,
  AuditIcon,
  DashboardIcon,
  MenuIcon,
  CloseIcon,
  ProviderIcon,
  RecordsIcon,
  SearchIcon,
} from './Icons';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/search', label: 'Patient Search', icon: SearchIcon },
  { to: '/records', label: 'Medical Records', icon: RecordsIcon },
  { to: '/access', label: 'Access Management', icon: AccessIcon },
  { to: '/audit', label: 'Audit Log', icon: AuditIcon },
  { to: '/profile', label: 'Provider Profile', icon: ProviderIcon },
];

interface NavbarProps {
  walletStatus: WalletStatus;
  address: string | null;
  network: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Navbar({ walletStatus, address, network, onConnect, onDisconnect }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="glass-bright sticky top-0 z-40 border-b border-blue-900/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <LockaLogo size={38} />
            <div className="flex flex-col leading-none">
              <div className="text-sm font-bold tracking-tight">
                <span className="text-white">Lock</span>
                <span className="gradient-text">A</span>
              </div>
              <div className="text-[0.6rem] uppercase tracking-widest text-slate-400 mt-0.5">
                Provider Client
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
              >
                <item.icon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {walletStatus === 'connected' && address ? (
              <>
                <div className="hidden sm:flex items-center gap-2 glass rounded-lg px-3 py-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: '#10b981', animation: 'pulse 2s ease-in-out infinite' }}
                  />
                  <span className="text-xs font-mono text-slate-300">{truncateAddress(address, 6)}</span>
                  {network && <span className="text-xs text-slate-500">{network}</span>}
                </div>
                <button onClick={onDisconnect} className="btn-secondary text-xs px-3 py-1.5 rounded-lg">
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                disabled={walletStatus === 'connecting' || walletStatus === 'unavailable'}
                className="btn-primary text-sm px-4 py-2 rounded-lg flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0066ff, #00d4ff)' }}
                title={walletStatus === 'unavailable' ? 'Freighter wallet extension not detected' : undefined}
              >
                {walletStatus === 'connecting' ? (
                  <>
                    <Spinner size={14} />
                    Connecting…
                  </>
                ) : walletStatus === 'unavailable' ? (
                  'Install Freighter'
                ) : (
                  'Connect Wallet'
                )}
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden btn-secondary p-2 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-blue-900/30 py-3 animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`nav-link w-full text-left mb-1 ${location.pathname === item.to ? 'active' : ''}`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
