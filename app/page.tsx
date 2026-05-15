"use client";

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

interface StatusResponse {
  whatsapp: {
    state: string;
    qr: string | null;
  };
  logs: Array<{
    timestamp: string;
    type: string;
    direction?: string;
    content: string;
  }>;
  mappings: Record<string, string>;
}

export default function Dashboard() {
  const [data, setData] = useState<StatusResponse | null>(null);

  const [tgIdInput, setTgIdInput] = useState('');
  const [waPhoneInput, setWaPhoneInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgIdInput || !waPhoneInput) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', telegramId: tgIdInput, whatsappJid: waPhoneInput })
      });
      setTgIdInput('');
      setWaPhoneInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMapping = async (tgId: string) => {
    try {
      await fetch('/api/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', telegramId: tgId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 sm:p-6 overflow-hidden flex flex-col relative w-full">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-6xl mx-auto w-full z-10 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 p-[1px] flex-shrink-0">
              <div className="w-full h-full bg-[#020617] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Telegram ↔ WhatsApp Bridge</h1>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">Dashboard to monitor the bridge bot status.</p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Telegram Status</p>
              <div className="flex items-center gap-2 justify-end">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                <span className="text-sm font-semibold text-white">CONNECTED</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">WhatsApp Status</p>
              <div className="flex items-center gap-2 justify-end">
                {data?.whatsapp.state === 'open' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-sm font-semibold text-emerald-400 uppercase">CONNECTED</span>
                  </>
                ) : data?.whatsapp.state === 'connecting' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-sm font-semibold text-amber-500 uppercase">CONNECTING...</span>
                  </>
                ) : data?.whatsapp.state === 'qr' ? (
                   <>
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-sm font-semibold text-amber-500 uppercase">PENDING SCAN</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="text-sm font-semibold text-red-500 uppercase">DISCONNECTED</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Left Panel: Authentication & Config */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
              <p className="text-xs font-mono text-slate-400 mb-6 uppercase tracking-wider">WhatsApp Web Authentication</p>
              
              <div className="flex flex-col items-center z-10 w-full pointer-events-auto">
                {data?.whatsapp.state === 'qr' && data.whatsapp.qr ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative p-3 bg-white rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                      <QRCode value={data.whatsapp.qr} size={200} />
                      <div className="absolute -inset-1 border-2 border-dashed border-sky-500/30 rounded-2xl pointer-events-none"></div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-slate-300 font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full inline-block mb-2">Scan QR Code untuk login</p>
                      <p className="text-xs text-slate-500 italic block mt-2">Waiting for connection via Baileys...</p>
                    </div>
                  </div>
                ) : data?.whatsapp.state === 'open' ? (
                  <div className="w-full flex items-center justify-between p-4 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <span className="font-medium">Terhubung</span>
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                  </div>
                ) : data?.whatsapp.state === 'connecting' ? (
                  <div className="w-full p-4 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20 text-center">
                    Menghubungkan...
                  </div>
                ) : (
                  <div className="w-full p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 text-center">
                    Terputus ({data?.whatsapp.state})
                  </div>
                )}
              </div>
              <div className="mt-8 text-[11px] text-slate-600 text-center z-10">
                * Baileys library digunakan. Risiko logout ditanggung.
              </div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Quick Info</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Storage Engine</p>
                  <p className="text-sm font-mono text-white">mappings.json</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Active Bridges</p>
                  <p className="text-sm font-mono text-white">
                    {data?.mappings ? Object.keys(data.mappings).length : 0} Connections
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Add Manual Connection</p>
              <form onSubmit={handleAddMapping} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Telegram Chat ID</label>
                  <input 
                    type="text" 
                    required
                    value={tgIdInput}
                    onChange={(e) => setTgIdInput(e.target.value)}
                    placeholder="e.g. 123456789"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">WhatsApp Number</label>
                  <input 
                    type="text" 
                    required
                    value={waPhoneInput}
                    onChange={(e) => setWaPhoneInput(e.target.value)}
                    placeholder="e.g. 628123456789"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="mt-1 w-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Mapping'}
                </button>
              </form>
            </div>
          </div>

          {/* Center/Right Panel: Mappings & Logs */}
          <div className="md:col-span-8 flex flex-col gap-6 min-h-0">
            {/* Mappings Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Chat Mappings</h2>
                <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded uppercase">Sync Enabled</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20 flex-1">
                {data?.mappings && Object.keys(data.mappings).length > 0 ? (
                  <div className="overflow-auto max-h-48">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                        <tr className="text-slate-400 border-b border-white/5">
                          <th className="p-3 font-semibold">Telegram Chat ID</th>
                          <th className="p-3 text-center"><svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg></th>
                          <th className="p-3 font-semibold">WhatsApp Target</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {Object.entries(data.mappings).map(([tgId, waJid]) => (
                          <tr key={tgId} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-slate-300">{tgId}</td>
                            <td className="p-3 text-center text-slate-500">↔</td>
                            <td className="p-3 font-mono text-slate-300">{waJid}</td>
                            <td className="p-3 text-sky-400 font-bold">Active</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => handleDeleteMapping(tgId)}
                                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-slate-500 text-sm text-center font-mono">
                    Belum ada mapping chat yang tersimpan. Gunakan /connect di Telegram.
                  </div>
                )}
              </div>
            </div>

            {/* Logs Console */}
            <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 font-mono overflow-hidden flex flex-col relative min-h-[250px]">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Engine Logs</h2>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                </div>
              </div>
              <div className="text-[11px] space-y-1.5 flex-1 overflow-y-auto pr-2 opacity-90 custom-scrollbar">
                {!data?.logs?.length && <div className="text-slate-600 italic">Engine starting... waiting for logs...</div>}
                
                {data?.logs?.map((log, i) => (
                  <div key={i} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors break-words">
                    <span className="text-slate-500 flex-shrink-0 w-20">
                      [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                    </span>
                    <span className={`flex-shrink-0 w-16 ${
                      log.type === 'error' ? 'text-red-400 font-bold' :
                      log.type === 'info' ? 'text-sky-400' : 
                      'text-emerald-400 font-bold'
                    }`}>
                      {log.type.toUpperCase() === 'MESSAGE' ? 'BRIDGE' : log.type.toUpperCase()}
                    </span>
                    {log.direction && (
                      <span className="flex-shrink-0 text-purple-400 w-16 font-semibold">
                        [{log.direction}]
                      </span>
                    )}
                    <span className="text-slate-300 flex-1">{log.content}</span>
                  </div>
                ))}
                {data?.logs?.length ? (
                   <div className="text-emerald-400 animate-pulse mt-2">_</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Commands Reference */}
        <footer className="mt-6 bg-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center border border-white/5 gap-4">
          <div className="flex flex-wrap gap-4 text-[11px] justify-center sm:justify-start">
            <span className="text-slate-500"><b className="text-white bg-white/10 px-1 py-0.5 rounded mr-1">/start</b> Initialize bot</span>
            <span className="text-slate-500"><b className="text-white bg-white/10 px-1 py-0.5 rounded mr-1">/connect [wa]</b> Link current chat</span>
            <span className="text-slate-500"><b className="text-white bg-white/10 px-1 py-0.5 rounded mr-1">/status</b> Check bridge health</span>
            <span className="text-slate-500"><b className="text-white bg-white/10 px-1 py-0.5 rounded mr-1">/disconnect</b> Remove mapping</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 mb-1">BRIDGE ACTIVE</span>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-emerald-500 w-[100%] h-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
