import { Landmark, GameState } from '../types';
import { MapPin, Navigation, Landmark as LandmarkIcon, Info } from 'lucide-react';
import { LANDMARKS } from './GameCanvas';
import { audio } from '../utils/audio';

interface LandmarkDetailsProps {
  onTeleport: (x: number, y: number, name: string) => void;
  playerPos: { x: number; y: number };
}

export default function LandmarkDetails({ onTeleport, playerPos }: LandmarkDetailsProps) {

  const handleTeleportClick = (l: Landmark) => {
    // Add offset slightly so player spawns outside absolute center of structures
    const offsetSpawnX = l.x + l.width / 2;
    const offsetSpawnY = l.y + l.height + 40;
    
    // Play sound
    audio.playSfx('teleport');

    onTeleport(offsetSpawnX, offsetSpawnY, l.name);
  };

  return (
    <div id="landmark-tour-widget" className="bg-slate-900 border border-primary/20 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <LandmarkIcon className="w-5 h-5 text-yellow-400" />
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Dortmund Landmark GPS Tourism</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1 standard-scrollbar">
        {LANDMARKS.map(l => {
          const dist = Math.round(Math.hypot(playerPos.x - l.x, playerPos.y - l.y));
          
          return (
            <div
              key={l.id}
              id={`gps-card-${l.id}`}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 hover:border-slate-700 transition-all relative overflow-hidden group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold leading-tight group-hover:text-yellow-400 transition-all">
                    {l.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Co-rds: X:{l.x}, Y:{l.y} • {dist}m away
                  </span>
                </div>

                <button
                  id={`teleport-to-${l.id}-btn`}
                  onClick={() => handleTeleportClick(l)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-lg"
                  title="Biometric Teleport"
                >
                  <Navigation className="w-2.5 h-2.5 fill-current" />
                  Teleport
                </button>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed font-sans mt-0.5 flex gap-1.5 items-start">
                <div className="p-0.5 rounded bg-slate-800/80 text-slate-400 shrink-0 mt-0.5">
                  <Info className="w-3 h-3" />
                </div>
                {l.description}
              </div>

              {/* Landmark ambient light decoration */}
              <div
                className="absolute right-0 bottom-0 w-8 h-8 opacity-10 rounded-full blur-xl pointer-events-none"
                style={{ backgroundColor: l.glowColor }}
              />
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-500 font-mono italic text-center leading-relaxed">
        Teleportation resets active police pursuit and wanted heat levels instantly.
      </div>
    </div>
  );
}
