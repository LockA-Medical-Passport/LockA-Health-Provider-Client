import { useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LockaLogo } from './LockaLogo';
import { Spinner } from './Spinner';
import { truncateAddress } from '../lib/format';
import type { WalletStatus } from '../hooks/useWallet';
import { ROLE_LABELS, useCurrentRole } from '../lib/roleContext';
import { EXPECTED_NETWORK_LABEL, isExpectedNetwork } from '../lib/network';
import {
  AccessIcon,
  AuditIcon,
  DashboardIcon,
  MenuIcon,
  CloseIcon,
  ProviderIcon,
  RecordsIcon,
  SearchIcon,
  AlertIcon,
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
  onCheckNetwork?: () => void;
  networkChecking?: boolean;
  networkError?: string | null;
}

export function Navbar({ walletStatus, address, network, onConnect, onDisconnect, onCheckNetwork, networkChecking = false, networkError }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [networkHelpOpen, setNetworkHelpOpen] = useState(false);
  const mobileMenuId = useId();
  const location = useLocation();
  const { role } = useCurrentRole();
  const networkMismatch = walletStatus === 'connected' && network !== null && !isExpectedNetwork(network);

  return (
    <nav className="glass-bright sticky top-0 z-40 border-b border-blue-900/30">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center justify-between min-h-16 gap-2 py-2">
          <Link to="/" aria-label="LockA Provider Client home" className="flex items-center gap-3 flex-shrink-0">
            <LockaLogo size={38} />
            <div className="hidden min-[400px]:flex flex-col leading-none">
              <div className="text-sm font-bold tracking-tight">
                <span className="text-white">Lock</span>
                <span className="gradient-text">A</span>
              </div>
              <div className="text-[0.6rem] uppercase tracking-widest text-slate-400 mt-0.5">
                Provider Client
              </div>
            </div>
          </Link>

          <div className="hidden 2xl:flex items-center gap-1">
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
                {role && <span className="text-xs text-cyan-300" aria-label={`Current role: ${ROLE_LABELS[role]}`}>{ROLE_LABELS[role]}</span>}
                <div className="hidden sm:flex items-center gap-2 glass rounded-lg px-3 py-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: '#10b981', animation: 'pulse 2s ease-in-out infinite' }}
                  />
                  <span className="text-xs font-mono text-slate-300">{truncateAddress(address, 6)}</span>
                  {network && <span className="text-xs text-slate-500">{network}</span>}
                </div>
                <button onClick={onDisconnect} className="btn-secondary min-h-11 text-xs px-3 py-1.5 rounded-lg">
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                disabled={walletStatus === 'checking' || walletStatus === 'connecting' || walletStatus === 'unavailable'}
                className="btn-primary min-h-11 text-sm px-4 py-2 rounded-lg flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0066ff, #00d4ff)' }}
                title={walletStatus === 'unavailable' ? 'Freighter wallet extension not detected' : undefined}
              >
                {walletStatus === 'checking' || walletStatus === 'connecting' ? (
                  <>
                    <Spinner size={14} />
                    {walletStatus === 'checking' ? 'Restoring…' : 'Connecting…'}
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
              className="2xl:hidden btn-secondary p-2 min-w-11 min-h-11 rounded-lg flex items-center justify-center"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
            >
              {mobileOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {walletStatus === 'connected' && (networkMismatch || networkError) && (
          <div role="alert" className="border-t border-amber-500/30 py-3 text-sm text-amber-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="flex items-center gap-2 min-w-0">
                <AlertIcon aria-hidden="true" className="w-5 h-5 shrink-0" />
                <span>{networkError || `Wrong network: ${network}. This app uses ${EXPECTED_NETWORK_LABEL}.`}</span>
              </p>
              {networkMismatch && <button type="button" className="btn-amber rounded-lg px-4 py-2" onClick={() => setNetworkHelpOpen(true)}>
                Switch to {EXPECTED_NETWORK_LABEL}
              </button>}
            </div>
            {(networkHelpOpen || networkError) && (
              <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-slate-300">Open Freighter, use its network selector to choose {EXPECTED_NETWORK_LABEL}, then check the network here.</p>
                <button type="button" className="btn-secondary rounded-lg px-4 py-2 flex items-center gap-2" disabled={networkChecking || !onCheckNetwork} onClick={onCheckNetwork}>
                  {networkChecking && <Spinner size={14} />}
                  {networkChecking ? 'Checking network…' : 'Check network'}
                </button>
              </div>
            )}
          </div>
        )}

        {mobileOpen && (
          <div id={mobileMenuId} className="2xl:hidden border-t border-blue-900/30 py-3 animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`nav-link min-h-11 w-full text-left mb-1 ${location.pathname === item.to ? 'active' : ''}`}
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
