import { useState, useRef, useEffect, FormEvent } from 'react';
import { Terminal, Send, HelpCircle, Shield, Sparkles } from 'lucide-react';

interface MatrixTerminalProps {
  onApplyCheat: (code: string) => void;
  cheatResponse: string;
}

const CLASSIC_CHEATS = [
  { code: "AEZAKMI", desc: "Freeze & deactivate Cop wanted state" },
  { code: "GODMODE", desc: "Invulnerability shield bypass" },
  { code: "CASH_HEX", desc: "Sovereign wire transfer: +$50,000" },
  { code: "SPAWN_TANK", desc: "Spawn Tiger armored heavy vehicle" },
  { code: "Fuzz", desc: "Dispatch a Cop Crusader on the fly" },
  { code: "WESTFALEN_STORM", desc: "Trigger thunder heavy rainfall" },
  { code: "SUNNY", desc: "Restore clear sun skies" },
  { code: "AMMO_HEAVEN", desc: "Reload all weapons to max capacity" }
];

export default function MatrixTerminal({ onApplyCheat, cheatResponse }: MatrixTerminalProps) {
  const [inputText, setInputText] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "🟢 COGNISYNC DNA INTEGRATION HUB [V4.2.0]",
    "SYSTEM: Zero-Trust Sovereign layer loaded successfully.",
    "ENTER MUTATOR CODES OR DESIRED CITY FORMULAS...",
    "TYPE 'Sanskrit' OR CHEAT WORDS BELOW TO STREAM MUTATIONS."
  ]);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const command = inputText.trim();
    // Add command to logs
    setTerminalLogs(prev => [...prev, `> ${command}`]);
    
    // Broadcast trigger
    onApplyCheat(command);

    // Instant automated cybernetic response
    const codeUpper = command.toUpperCase();
    let reply = `🔍 SYNTAX MUTATED: ${command}...`;
    
    if (codeUpper === 'AEZAKMI') {
      reply = "✓ OK: COPS CHASE BLOCK ATTACHED. LAW ENFORCEMENT DISARMED.";
    } else if (codeUpper === 'GODMODE') {
      reply = "✓ OK: ENFORCED BIOMETRIC BARRIER. HEALTH STATE LOCKED TO 99999.";
    } else if (codeUpper === 'CASH_HEX' || codeUpper === 'MUNY') {
      reply = "✓ OK: COGNISYNC LIQUID WIRE INBOUND: +$50,000 DIRECT TRANSITION.";
    } else if (codeUpper === 'SPAWN_TANK') {
      reply = "✓ OK: TACTICAL ARMORED VEHICLE SUMMONED TO THE CORNER NEIGHBORHOOD.";
    } else if (codeUpper === 'WESTFALEN_STORM' || codeUpper === 'RAIN') {
      reply = "✓ OK: WEAPONIZED IONOSPHERIC HEAVY ION COUPLING. HEAVY RAIN TRIGGERED.";
    } else if (codeUpper === 'SUNNY') {
      reply = "✓ OK: REGIONAL SKYDOME ENVELOPS REGION: CLEAR GOTHIC HORIZON.";
    } else if (codeUpper === 'AMMO_HEAVEN') {
      reply = "✓ OK: SEED ARSENAL FULLY ENGAGED.";
    } else {
      reply = `✓ DECODED COGNISYNC DNA VECTOR: [g:0005, s:98%, m:FFFF] State evolved.`;
    }

    setTerminalLogs(prev => [...prev, reply]);
    setInputText('');
  };

  const handleQuickCheat = (code: string) => {
    setTerminalLogs(prev => [...prev, `> QuickInject: ${code}`]);
    onApplyCheat(code);
    setInputText('');
  };

  return (
    <div id="matrix-terminal-card" className="bg-slate-900 border border-primary/20 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Cognisync DNA Console</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
          <Shield className="w-3 h-3" />
          Zero-Trust
        </div>
      </div>

      {/* Retro scrolling terminal screen */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 h-40 overflow-y-auto font-mono text-xs flex flex-col gap-1 text-emerald-400 custom-scrollbar">
        {terminalLogs.map((log, idx) => (
          <div key={idx} className="leading-relaxed break-words">
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="matrix-cheat-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter cheat code (e.g., AEZAKMI)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          id="submit-cheat-btn"
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all shadow-lg flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Quick click cheat grid */}
      <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-800 pt-2">
        <span className="text-[10px] uppercase font-mono tracking-wide text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          Sovereign Quick Mutators:
        </span>
        <div className="grid grid-cols-4 gap-1">
          {CLASSIC_CHEATS.slice(0, 4).map(c => (
            <button
              key={c.code}
              id={`quick-inject-${c.code}`}
              type="button"
              onClick={() => handleQuickCheat(c.code)}
              className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded p-1 text-center font-mono hover:text-emerald-400 transition-all cursor-pointer font-bold truncate"
              title={c.desc}
            >
              {c.code}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {CLASSIC_CHEATS.slice(4, 8).map(c => (
            <button
              key={c.code}
              id={`quick-inject-${c.code}`}
              type="button"
              onClick={() => handleQuickCheat(c.code)}
              className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded p-1 text-center font-mono hover:text-emerald-400 transition-all cursor-pointer font-bold truncate"
              title={c.desc}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
