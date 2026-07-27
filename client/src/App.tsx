import { Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { GlassCard } from './components/GlassCard';
import { ProviderIcon } from './components/Icons';
import { useWallet } from './hooks/useWallet';
import { Dashboard } from './pages/Dashboard';
import { PatientSearch } from './pages/PatientSearch';
import { RecordsPage } from './pages/RecordsPage';
import { AccessManagement } from './pages/AccessManagement';
import { AuditLog } from './pages/AuditLog';
import { ProviderProfile } from './pages/ProviderProfile';

function App() {
  const { status, address, network, error, connect, disconnect } = useWallet();
  const connected = status === 'connected' && !!address;

  return (
    <>
      <Navbar
        walletStatus={status}
        address={address}
        network={network}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <main className="pb-16">
        {!connected ? (
          <div className="max-w-2xl mx-auto px-4 py-16">
            <GlassCard className="p-12 text-center glow-blue">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,.2), rgba(6,182,212,.2))',
                  border: '1px solid rgba(59,130,246,.3)',
                }}
              >
                <ProviderIcon className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Connect Wallet to Access Provider Portal</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                LockA verifies your provider identity and patient consent through your Stellar wallet. Connect
                Freighter to manage access requests, view approved records, and upload treatment notes.
              </p>
              <button
                onClick={connect}
                disabled={status === 'connecting' || status === 'unavailable'}
                className="btn-primary rounded-lg px-6 py-2.5"
                style={{ background: 'linear-gradient(135deg, #0066ff, #00d4ff)' }}
              >
                {status === 'unavailable' ? 'Install Freighter Wallet' : 'Connect Wallet'}
              </button>
              {status === 'unavailable' && (
                <p className="text-xs text-slate-500 mt-4">
                  No Stellar wallet extension detected.{' '}
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Get Freighter
                  </a>
                </p>
              )}
              {error && <p className="text-xs text-red-400 mt-4">{error}</p>}
            </GlassCard>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<PatientSearch />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/access" element={<AccessManagement />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/profile" element={<ProviderProfile />} />
          </Routes>
        )}
      </main>
    </>
  );
}

export default App;
