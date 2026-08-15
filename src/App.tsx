/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  ShieldAlert,
  Trophy,
  Award,
  Radio,
  Trash2,
  CloudSun,
  CloudRain,
  Zap,
  Skull,
  Crosshair,
  Volume2,
  VolumeX,
  Target,
  User,
  Crown,
  MapPin,
  Clock
} from 'lucide-react';
import GameCanvas, { LANDMARKS } from './components/GameCanvas';
import RadioPlayer from './components/RadioPlayer';
import MatrixTerminal from './components/MatrixTerminal';
import LandmarkDetails from './components/LandmarkDetails';
import CloudTwinConsole from './components/CloudTwinConsole';
import ForensicAuditDashboard from './components/ForensicAuditDashboard';
import { useGameSync } from './lib/GameSync';
import { GameState, Mission, WeatherType, Weapon, WeaponType } from './types';
import { audio } from './utils/audio';

// Static initial weapons configuration
const INITIAL_WEAPONS: Weapon[] = [
  { type: 'fists', name: '👊 Bare Knuckles', ammo: 1, maxAmmo: 1, cooldown: 300, lastFired: 0, damage: 10 },
  { type: 'pistol', name: '🔫 Walther P99 (Pistol)', ammo: 80, maxAmmo: 150, cooldown: 400, lastFired: 0, damage: 25 },
  { type: 'uzi', name: '💨 MP5 Rapid Uzi', ammo: 240, maxAmmo: 400, cooldown: 120, lastFired: 0, damage: 15 },
  { type: 'rocket', name: '🚀 Panzerfaust (RPG)', ammo: 6, maxAmmo: 10, cooldown: 1600, lastFired: 0, damage: 250 }
];

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'The Golden U Heist',
    description: 'Find a fast sports car (Sports class car) and deliver it securely to the Dortmunder U Art Brewery Tower.',
    reward: 7500,
    status: 'available',
    objectiveType: 'steal_car',
    targetLandmarkId: 'u_tower',
    targetVehicleType: 'sports'
  },
  {
    id: 'm2',
    title: 'Westfalenstadion Safeguard',
    description: 'Steal any Police cruiser vehicle ("POLIZEI") and deliver it directly inside the Western Plaza of Signal Iduna Park Stadium.',
    reward: 10000,
    status: 'locked',
    objectiveType: 'deliver_car',
    targetLandmarkId: 'westfalenstadion',
    targetVehicleType: 'cop'
  },
  {
    id: 'm3',
    title: 'Elite Phoenix Marina Patrol',
    description: 'Drive any vehicle directly up the elite boat harbor and yacht lanes of Phoenix-See lake district to check the surroundings.',
    reward: 5000,
    status: 'locked',
    objectiveType: 'visit_landmarks',
    targetLandmarkId: 'phoenix_see'
  },
  {
    id: 'm4',
    title: 'Five-Star Evader Heat',
    description: 'Trigger a massive shootout or car crash until you obtain at least 3 Wanted Stars (Cop Pursuit level) to showcase your city dominance!',
    reward: 15000,
    status: 'locked',
    objectiveType: 'evade_police',
    scoreRequired: 3
  }
];

export default function App() {
  const { importedAssets } = useGameSync();
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 1550, // Starts center at Hansaplatz
      y: 1100,
      angle: 0,
      speed: 0,
      health: 100,
      maxHealth: 100,
      armor: 100,
      cash: 12500, // starting funds
      weapons: INITIAL_WEAPONS,
      selectedWeaponIndex: 1, // Start held Pistol
      wantedLevel: 0,
      wantedMultiplier: 0,
      currentVehicleId: null,
      copChaseTimer: 0,
      isDead: false,
      isBusted: false,
      hospitalRespawnTimer: 0,
      policeRespawnTimer: 0
    },
    timeState: {
      minutes: 0,
      hours: 9, // Starts at morning 09:00 AM
      dayProgress: 0.375,
      timeOfDay: 'morning'
    },
    weather: 'sunny',
    isMuted: true, // starts muted for browser safety
    score: 0,
    activeMissionId: null,
    compassAngle: 0
  });

  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [cheatCode, setCheatCode] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [recentCompletedMission, setRecentCompletedMission] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'sandbox' | 'audit_report'>('sandbox');

  const handleMuteToggle = (muted: boolean) => {
    setGameState(prev => ({ ...prev, isMuted: muted }));
    audio.setMuted(muted);
  };

  const handleWeatherChange = (newWeather: WeatherType) => {
    setGameState(prev => ({ ...prev, weather: newWeather }));
    audio.playSfx('teleport');
  };

  const triggerMission = (missionId: string) => {
    // If another mission is active, abort it
    setGameState(prev => ({
      ...prev,
      activeMissionId: missionId
    }));

    setMissions(prev =>
      prev.map(m => {
        if (m.id === missionId) {
          return { ...m, status: 'active' };
        }
        return m;
      })
    );
    
    // Play electronic sound
    audio.playSfx('coin');
  };

  const handleMissionComplete = (cashReward: number) => {
    const activeId = gameState.activeMissionId;
    if (!activeId) return;

    audio.playSfx('coin');
    const completedName = mName(activeId);
    setRecentCompletedMission(completedName);

    // Update player cash and reward points
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        cash: prev.player.cash + cashReward
      },
      activeMissionId: null
    }));

    // Unlock next mission cascade
    setMissions(prev => {
      let foundActiveIndex = prev.findIndex(m => m.id === activeId);
      return prev.map((m, idx) => {
        if (m.id === activeId) {
          return { ...m, status: 'completed' };
        }
        // Unlock next
        if (idx === foundActiveIndex + 1 && m.status === 'locked') {
          return { ...m, status: 'available' };
        }
        return m;
      });
    });

    // Auto clear congrats after 4s
    setTimeout(() => {
      setRecentCompletedMission(null);
    }, 4500);
  };

  const mName = (id: string) => {
    const found = INITIAL_MISSIONS.find(m => m.id === id);
    return found ? found.title : 'Mission';
  };

  const handleTeleportPlayer = (x: number, y: number, name: string) => {
    setGameState(prev => {
      // Clear wanted levels on teleport to escape chase
      return {
        ...prev,
        player: {
          ...prev.player,
          x: x,
          y: y,
          wantedLevel: 0,
          copChaseTimer: 0
        }
      };
    });
  };

  const handleRestoreState = (restored: Partial<GameState>) => {
    if (restored.player) {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          ...restored.player
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-yellow-500/30 selection:text-yellow-400">
      
      {/* Visual Header */}
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {/* Glowing launcher indicator */}
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-slate-950 font-mono shadow-lg shadow-yellow-500/10 shrink-0">
            DVB
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold tracking-tight uppercase flex items-center gap-2">
              GTA DORTMUND - ARBEITSTITEL
              <span className="text-[9px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded px-1 py-0.5 tracking-normal">
                CYBER RUHR v4.2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono leading-none">
              Autonomous Digital Twin Navigation Room
            </p>
          </div>
        </div>

        {/* Navigation View Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            id="view-sandbox-btn"
            onClick={() => setCurrentView('sandbox')}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              currentView === 'sandbox'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            🕹️ Cyber Ruhr Sandbox
          </button>
          <button
            id="view-audit-report-btn"
            onClick={() => setCurrentView('audit_report')}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              currentView === 'audit_report'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            📊 Drive Forensic Audit Report
          </button>
        </div>

        {/* Top bar values: Clock and Weather panel */}
        <div className="flex items-center gap-3">
          
          {/* Global Sound Toggles */}
          <button
            id="global-volume-toggle"
            onClick={() => handleMuteToggle(!gameState.isMuted)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              gameState.isMuted
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {gameState.isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                SYSTEM SOUND: MUTED
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                SYSTEM SOUND: LIVE
              </>
            )}
          </button>

          {/* Weather pill matrix */}
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['sunny', 'rainy', 'stormy'] as WeatherType[]).map(w => (
              <button
                key={w}
                id={`weather-btn-${w}`}
                onClick={() => handleWeatherChange(w)}
                className={`px-2.5 py-1 text-[10px] rounded-lg font-mono font-bold transition-all capitalize cursor-pointer ${
                  gameState.weather === w
                    ? 'bg-yellow-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {w === 'sunny' ? '☀️' : w === 'rainy' ? '🌧️' : '⛈️'} {w}
              </button>
            ))}
          </div>

          {/* Coordinates indicator */}
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            09:00 AM • MORNING
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      {currentView === 'audit_report' ? (
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <ForensicAuditDashboard />
        </main>
      ) : (
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left Interactive Game Board (Canvas Column) */}
        <div id="game-canvas-area" className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Active Mission HUD Alert Bar */}
          {gameState.activeMissionId ? (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-4 animate-pulse shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-500 font-mono font-bold uppercase tracking-wider">ACTIVE CONTRACT MISSION</span>
                  <span className="text-white text-xs font-semibold">
                    {mName(gameState.activeMissionId)} — Objective: {
                      gameState.activeMissionId === 'm1' ? 'Find a yellow car and park it near Dortmunder U Art Tower.' :
                      gameState.activeMissionId === 'm2' ? 'Steal a police car and park it inside Westfalenstadion pitch.' :
                      gameState.activeMissionId === 'm3' ? 'Drive any vehicle directly up the water edge at Phoenix-See lakeside.' :
                      'Cause a frenzy and obtain at least 3 Cop Wanted level stars.'
                    }
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 shrink-0">
                PENDING REWARD: ${gameState.activeMissionId === 'm1' ? '7,500' : gameState.activeMissionId === 'm2' ? '10,000' : gameState.activeMissionId === 'm3' ? '5,000' : '15,000'}
              </span>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-400">
                <strong className="text-slate-200">No active sandbox contract.</strong> Accept a payphone contract from Boss <strong>"Der Zweeback"</strong> in the sidebar dashboard below to earn respect and fast cash!
              </p>
            </div>
          )}

          {/* Interactive Game Space Canvas */}
          <div className="flex-1 min-h-[500px] rounded-3xl overflow-hidden border border-white/5 relative flex flex-col shadow-2xl">
            <GameCanvas
              gameState={gameState}
              setGameState={setGameState}
              cheatResponse={cheatCode}
              setCheatResponse={setCheatCode}
              onRequestMissionComplete={handleMissionComplete}
              appliedAssets={importedAssets}
            />

            {/* Weapon Selector tray inside sandbox bottom canvas view */}
            <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-2xl flex gap-1.5 shadow-2xl pointer-events-auto">
              {gameState.player.weapons.map((w, idx) => {
                const isSelected = gameState.player.selectedWeaponIndex === idx;
                return (
                  <button
                    key={w.type}
                    id={`weapon-select-btn-${w.type}`}
                    onClick={() => setGameState(p => ({ ...p, player: { ...p.player, selectedWeaponIndex: idx } }))}
                    className={`px-3 py-2 rounded-xl border text-[11px] font-mono transition-all flex flex-col items-center gap-0.5 cursor-pointer max-w-[84px] truncate ${
                      isSelected
                        ? 'bg-yellow-500 text-slate-950 font-black border-yellow-400 shadow shadow-yellow-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="truncate w-full text-center">{w.name.split(' ')[1]}</span>
                    <span className={`text-[9px] ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>
                      {w.type === 'fists' ? '∞' : w.ammo} rds
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Welcome Intro Help Sheet */}
          {showWelcome && (
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl flex flex-col gap-3 relative shadow-2xl">
              <button
                id="close-welcome-btn"
                onClick={() => setShowWelcome(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white font-mono text-xs"
              >
                Dismiss ✕
              </button>
              <h3 className="text-sm font-extrabold uppercase text-yellow-400 flex items-center gap-2">
                <Crown className="w-4 h-4" /> Welcome to GTA Dortmund - Arbeitstitel
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                You are playing a top-down classic GTA-inspired open-world simulator representing Dortmund monuments! Grab keys to drive any sedan, sportscar, cop cruiser, or high-tech armored tanks on the asphalt. Avoid driving into the Phoenix-See lake or you will drown. Be cautious of Cop Crusaders spawning when people or officers detect gunfire or road incidents!
              </p>
            </div>
          )}
        </div>

        {/* Right Dashboard Column (Bento widgets) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Boss Der Zweeback Mission list */}
          <div id="boss-missions-card" className="bg-slate-900 border border-primary/20 p-5 rounded-3xl shadow-2xl flex flex-col gap-3.5">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400 animate-bounce" />
                <span className="text-xs uppercase font-mono tracking-wider text-slate-300">"Der Zweeback" Contract Jobs</span>
              </div>
              <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                BOSS ONLINE
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {missions.map(m => (
                <div
                  key={m.id}
                  id={`mission-card-${m.id}`}
                  className={`p-3 rounded-2xl border transition-all ${
                    m.status === 'locked'
                      ? 'bg-slate-950/40 border-slate-900 opacity-40'
                      : m.status === 'active'
                      ? 'bg-amber-500/5 border-amber-500/40'
                      : m.status === 'completed'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-white leading-tight">
                      {m.title}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                      +${m.reward.toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-sans">
                    {m.description}
                  </p>

                  <div className="mt-2 flex justify-between items-center gap-4">
                    <span className="text-[10px] font-mono text-slate-500 capitalize">
                      Status: {m.status}
                    </span>

                    {m.status === 'available' && (
                      <button
                        id={`accept-job-${m.id}-btn`}
                        onClick={() => triggerMission(m.id)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-bold uppercase py-1 px-3 rounded-lg transition-all cursor-pointer shadow-lg"
                      >
                        Accept Contract
                      </button>
                    )}
                    {m.status === 'active' && (
                      <span className="text-[10px] text-yellow-400 uppercase font-mono font-bold animate-pulse">
                        🎯 Active Focus...
                      </span>
                    )}
                    {m.status === 'completed' && (
                      <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold flex items-center gap-1">
                        ✓ Respect Earned
                      </span>
                    )}
                    {m.status === 'locked' && (
                      <span className="text-[10px] text-slate-600 uppercase font-mono font-bold">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cloud Twin & Database Control board */}
          <CloudTwinConsole gameState={gameState} onRestoreState={handleRestoreState} />

          {/* Electronic car radio visualizer */}
          <RadioPlayer isMuted={gameState.isMuted} onMuteToggle={handleMuteToggle} />

          {/* Dev-DNA input Mutator */}
          <MatrixTerminal onApplyCheat={setCheatCode} cheatResponse={cheatCode} />

          {/* Biometric gps tourism */}
          <LandmarkDetails
            playerPos={{ x: gameState.player.x, y: gameState.player.y }}
            onTeleport={handleTeleportPlayer}
          />

        </div>
      </main>
      )}

      {/* Full screen Mission Passed congrats overlay animation */}
      {recentCompletedMission && (
        <div id="mission-passed-overlay" className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 animate-fade-in transition-all">
          <div className="bg-slate-900 border border-yellow-500/40 p-8 rounded-3xl max-w-md text-center flex flex-col items-center gap-4 shadow-2xl animate-scale-up">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
            <h2 className="text-3xl font-black tracking-tight text-white font-mono uppercase italic">
              MISSION PASSED!
            </h2>
            <p className="text-yellow-400 font-mono text-sm uppercase tracking-widest font-bold">
              + RESPECT INCREASED
            </p>
            <div className="h-0.5 bg-yellow-500/20 w-32 my-1" />
            <p className="text-slate-300 text-sm font-sans mt-1">
              Successfully executed <strong>{recentCompletedMission}</strong> on behalf of Dortmund Boss Der Zweeback.
            </p>
            <span className="text-emerald-400 font-mono font-black text-2xl mt-2 animate-pulse">
              + CASH CREDITED INTO COGNISYNC
            </span>
          </div>
        </div>
      )}

      {/* Visual footer */}
      <footer className="border-t border-white/5 bg-slate-900/10 py-6 px-6 text-center text-slate-500 text-xs font-mono select-none">
        <p>© 2026 GTA Dortmund - Arbeitstitel OS. Constructed with sovereign HTML5 2D Canvas matrix code.</p>
      </footer>
    </div>
  );
}
