import { useState, useEffect, useRef } from 'react';
import { Radio, Music2, Volume2, VolumeX, Shuffle } from 'lucide-react';
import { audio } from '../utils/audio';

interface RadioStation {
  name: string;
  genre: string;
  description: string;
  color: string;
}

const STATIONS: RadioStation[] = [
  {
    name: "Retro Synthwave 80s",
    genre: "Synthwave / Outrun",
    description: "Classic neon baseline arpeggios crafted in nostalgic virtual synthesizers.",
    color: "from-pink-500 to-purple-600"
  },
  {
    name: "Dortmund Minimal Techno",
    genre: "Heavy Industrial Minimal",
    description: "Dark, moody basslines from underground boiler rooms of the Ruhr area.",
    color: "from-amber-500 to-red-600"
  },
  {
    name: "Phoenix-See Chillout FM",
    genre: "Ambient / Lofi Oasis",
    description: "Peaceful slow-wave pads mirroring the shimmering sun of Dortmund marina.",
    color: "from-sky-500 to-cyan-500"
  },
  {
    name: "Westfalen Stadium Rock",
    genre: "Hard Hooligan Guitars",
    description: "Heavy distorted arps capturing energy of the south wall yell crowd.",
    color: "from-yellow-500 to-red-600"
  }
];

interface RadioPlayerProps {
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
}

export default function RadioPlayer({ isMuted, onMuteToggle }: RadioPlayerProps) {
  const [activeStation, setActiveStation] = useState<number>(-1);
  const [frequencies, setFrequencies] = useState<number[]>(Array(10).fill(5));
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Generate procedurally bouncing visualizer bars for the active radio
    if (activeStation !== -1 && !isMuted) {
      const updateBars = () => {
        setFrequencies(prev => prev.map(() => Math.floor(Math.random() * 24 + 4)));
        animFrameRef.current = requestAnimationFrame(updateBars);
      };
      animFrameRef.current = requestAnimationFrame(updateBars);
    } else {
      setFrequencies(Array(10).fill(3));
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeStation, isMuted]);

  const selectStation = (index: number) => {
    if (activeStation === index) {
      // Toggle off
      setActiveStation(-1);
      audio.stopRadio();
    } else {
      setActiveStation(index);
      if (isMuted) {
        onMuteToggle(false);
      }
      audio.startRadio(index);
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    onMuteToggle(nextMute);
    if (nextMute) {
      audio.stopRadio();
    } else if (activeStation !== -1) {
      audio.startRadio(activeStation);
    }
  };

  return (
    <div id="radio-deck-widget" className="bg-slate-900 border border-primary/20 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-yellow-400 animate-pulse" />
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Dortmund FM Car Radio</span>
        </div>
        
        <button
          id="toggle-mute-audio-btn"
          onClick={toggleMute}
          className={`p-1.5 rounded-lg border transition-all ${
            isMuted 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
          title={isMuted ? "Unmute Radio & Engine Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Screen view */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between min-h-[56px]">
        {activeStation === -1 || isMuted ? (
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-mono">RADIO TUNER</span>
            <span className="text-slate-400 text-xs italic font-serif">OFFLINE — SELECT STATION BELOW</span>
          </div>
        ) : (
          <div className="flex flex-col max-w-[210px] overflow-hidden truncate">
            <span className="text-yellow-400 text-[10px] font-mono font-black animate-pulse">PLAYING NOW</span>
            <span className="text-white text-xs font-semibold truncate">{STATIONS[activeStation].name}</span>
            <span className="text-slate-400 text-[10px] uppercase font-mono truncate">{STATIONS[activeStation].genre}</span>
          </div>
        )}

        {/* Bouncing spectrum bar */}
        <div className="flex gap-0.5 items-end justify-end h-8 overflow-hidden pr-1">
          {frequencies.map((height, idx) => (
            <div
              key={idx}
              className={`w-1.5 rounded-t-sm transition-all duration-75 ${
                activeStation !== -1 && !isMuted ? 'bg-yellow-400' : 'bg-slate-800'
              }`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-2 gap-2">
        {STATIONS.map((station, idx) => {
          const isSelected = activeStation === idx && !isMuted;
          return (
            <button
              key={idx}
              id={`station-select-${idx}`}
              onClick={() => selectStation(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected 
                  ? 'bg-slate-800 border-yellow-400 shadow-lg shadow-yellow-500/5' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col relative z-10">
                <span className={`text-[11px] font-bold ${isSelected ? 'text-yellow-400' : 'text-slate-300'}`}>
                  {station.name.substring(0, 18)}...
                </span>
                <span className="text-[9px] text-slate-500 font-mono italic tracking-wide mt-0.5">
                  {station.genre}
                </span>
              </div>
              
              {/* Colored active border accent */}
              {isSelected && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${station.color}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-500 font-mono italic leading-relaxed text-center px-1">
        Synthesizing 8-bit procedural sounds safely inside your browser session sandbox.
      </div>
    </div>
  );
}
