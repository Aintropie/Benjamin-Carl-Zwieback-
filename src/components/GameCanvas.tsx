import React, { useEffect, useRef, useState, useCallback, Dispatch, SetStateAction, MouseEvent } from 'react';
import { GameState, Vehicle, Pedestrian, Particle, Bullet, Landmark, WeatherType, TimeOfDay, WeaponType, Position, VehicleType } from '../types';
import { audio } from '../utils/audio';
import { useGameSync } from '../lib/GameSync.tsx';

// Map Dimensions
export const MAP_SIZE = 3200;

// Landmarked definitions
export const LANDMARKS: Landmark[] = [
  {
    id: 'hbf',
    name: 'Dortmund Hauptbahnhof',
    x: 1000,
    y: 350,
    width: 260,
    height: 120,
    color: '#1e293b',
    glowColor: '#38bdf8',
    description: 'The bustling central gateway to the Ruhr area. Trains rumble on rails behind the main terminal terminal hall.',
    iconName: 'train'
  },
  {
    id: 'u_tower',
    name: 'Dortmunder U (Art Center)',
    x: 350,
    y: 450,
    width: 140,
    height: 140,
    color: '#0f172a',
    glowColor: '#fbbf24',
    description: 'A monument of brewing heritage transformed into a digital arts sanctuary, crowned by the giant rotating golden letter "U".',
    iconName: 'beer'
  },
  {
    id: 'hansaplatz',
    name: 'Hansaplatz Market Square',
    x: 1550,
    y: 1100,
    width: 240,
    height: 240,
    color: '#475569',
    glowColor: '#f43f5e',
    description: 'The historical heart of Dortmund featuring city festivals, large stone fountains, and majestic plane trees.',
    iconName: 'layout-grid'
  },
  {
    id: 'westfalenstadion',
    name: 'Signal Iduna Park (Westfalenstadion)',
    x: 1200,
    y: 2200,
    width: 420,
    height: 350,
    color: '#020617',
    glowColor: '#facc15',
    description: 'Germany\'s largest football fortress. Experience the holy yellow wall (Südtribüne) and vibrant floodlight pylons.',
    iconName: 'trophy'
  },
  {
    id: 'florianturm',
    name: 'Westfalenpark & Florianturm',
    x: 2200,
    y: 1400,
    width: 220,
    height: 220,
    color: '#14532d',
    glowColor: '#4ade80',
    description: 'The green oasis of Dortmund, dominated by the 220-meter tall Florian telecommunication tower offering panoramic views.',
    iconName: 'tree-pine'
  },
  {
    id: 'phoenix_see',
    name: 'Phoenix-See (Marina District)',
    x: 2500,
    y: 2400,
    width: 500,
    height: 400,
    color: '#0284c7',
    glowColor: '#0ea5e9',
    description: 'An elite modern lake district engineered over a former heavyweight steel mill. Sparkling yacht harbor and designer villas.',
    iconName: 'waves'
  }
];

// Road network nodes for AI pathfinding
const ROAD_NODES = [
  { x: 350, y: 350 },     // Node 0 (Near HBF/U)
  { x: 1000, y: 350 },    // Node 1 (HBF Front)
  { x: 1550, y: 350 },    // Node 2 (North Avenue)
  { x: 2500, y: 350 },    // Node 3 (North East Shore)
  { x: 350, y: 1100 },    // Node 4 (West Side Blvd)
  { x: 1000, y: 1100 },   // Node 5 (Inner Ring West)
  { x: 1550, y: 1100 },   // Node 6 (Hansaplatz Hub)
  { x: 2200, y: 1100 },   // Node 7 (Florian Boulevard Entrance)
  { x: 2500, y: 1100 },   // Node 8 (East Gateway)
  { x: 350, y: 2200 },    // Node 9 (Stadium West highway)
  { x: 1200, y: 2200 },   // Node 10 (Stadium Plaza Entrance)
  { x: 1550, y: 2200 },   // Node 11 (Stadium Road East)
  { x: 2200, y: 2200 },   // Node 12 (Lake Overpass)
  { x: 2500, y: 2200 },   // Node 13 (Phoenix Marina Gate)
  { x: 2500, y: 2800 },   // Node 14 (South East Loop)
  { x: 1550, y: 2800 }    // Node 15 (Stadium South Link)
];

const ROAD_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3],
  [0, 4], [1, 5], [2, 6], [3, 8],
  [4, 5], [5, 6], [6, 7], [7, 8],
  [4, 9], [6, 11], [7, 12], [8, 13],
  [9, 10], [10, 11], [11, 12], [12, 13],
  [13, 14], [15, 11]
];

// Visual roads coordinates for drawing
interface AsphaltRoad {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  width: number;
}
const ROADS: AsphaltRoad[] = ROAD_CONNECTIONS.map(conn => {
  const n1 = ROAD_NODES[conn[0]];
  const n2 = ROAD_NODES[conn[1]];
  return {
    fromX: n1.x,
    fromY: n1.y,
    toX: n2.x,
    toY: n2.y,
    width: 140
  };
});

interface GameCanvasProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  cheatResponse: string;
  setCheatResponse: (msg: string) => void;
  onRequestMissionComplete: (cashReward: number) => void;
  appliedAssets?: any[];
}

export default function GameCanvas({
  gameState,
  setGameState,
  cheatResponse,
  setCheatResponse,
  onRequestMissionComplete,
  appliedAssets = []
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { token } = useGameSync();
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [glbUrls, setGlbUrls] = useState<Record<string, string>>({});
  const loadedGlbsRef = useRef<Record<string, boolean>>({});

  // Fetch applied map tiles dynamically from Google Drive as blobs
  useEffect(() => {
    if (!token || !appliedAssets || appliedAssets.length === 0) return;

    appliedAssets.forEach(asset => {
      if (!asset.applied || asset.fileType !== 'tiles') return;
      if (loadedImagesRef.current[asset.fileId]) return; // already loading/loaded or loaded path

      // Temporarily mark as loading
      loadedImagesRef.current[asset.fileId] = new Image();

      const fetchDriveImage = async () => {
        try {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${asset.fileId}?alt=media`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error('Drive API HTTP error status: ' + res.status);
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          const img = new Image();
          img.src = objectUrl;
          img.onload = () => {
            loadedImagesRef.current[asset.fileId] = img;
          };
        } catch (error) {
          console.error(`[Drive Terrain Tile] Error loading ${asset.fileName}:`, error);
          
          // Generate active tech-hologram tile placeholder canvas
          const placeholderCanvas = document.createElement('canvas');
          placeholderCanvas.width = 256;
          placeholderCanvas.height = 256;
          const pxCtx = placeholderCanvas.getContext('2d');
          if (pxCtx) {
            pxCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            pxCtx.fillRect(0, 0, 256, 256);
            pxCtx.strokeStyle = '#22d3ee';
            pxCtx.lineWidth = 2;
            pxCtx.strokeRect(0, 0, 256, 256);
            
            // Draw cross grid
            pxCtx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
            pxCtx.lineWidth = 1;
            pxCtx.beginPath();
            pxCtx.moveTo(0, 128); pxCtx.lineTo(256, 128);
            pxCtx.moveTo(128, 0); pxCtx.lineTo(128, 256);
            pxCtx.stroke();

            pxCtx.fillStyle = '#22d3ee';
            pxCtx.font = 'bold 12px monospace';
            pxCtx.fillText('DRIVE CUSTOM OVERLAY', 40, 110);
            pxCtx.fillStyle = '#94a3b8';
            pxCtx.font = '10px monospace';
            pxCtx.fillText(asset.fileName.substring(0, 28), 35, 130);
            pxCtx.fillStyle = '#10b981';
            pxCtx.fillText('📡 SYNCED TO STARR CELL', 45, 150);
          }
          
          const img = new Image();
          img.src = placeholderCanvas.toDataURL();
          img.onload = () => {
            loadedImagesRef.current[asset.fileId] = img;
          };
        }
      };

      fetchDriveImage();
    });
  }, [appliedAssets, token]);

  // Load model-viewer script dynamically and load custom GLB files as Blobs
  useEffect(() => {
    // Model viewer library script injection
    if (!document.getElementById('google-model-viewer-script')) {
      const script = document.createElement('script');
      script.id = 'google-model-viewer-script';
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!token || !appliedAssets || appliedAssets.length === 0) return;

    appliedAssets.forEach(asset => {
      if (!asset.applied || asset.fileType !== 'glb') return;
      if (loadedGlbsRef.current[asset.fileId] || glbUrls[asset.fileId]) return;

      loadedGlbsRef.current[asset.fileId] = true;

      const fetchGlbFile = async () => {
        try {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${asset.fileId}?alt=media`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error('Drive API glb fetch error');
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          setGlbUrls(prev => ({
            ...prev,
            [asset.fileId]: objectUrl
          }));
        } catch (error) {
          console.error(`[Drive GLB Model] Error loading 3D asset ${asset.fileName}:`, error);
        }
      };

      fetchGlbFile();
    });
  }, [appliedAssets, token, glbUrls]);


  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<Position>({ x: 0, y: 0 });

  // Game Engine entities
  const vehiclesRef = useRef<Vehicle[]>([]);
  const pedestriansRef = useRef<Pedestrian[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const skidmarksRef = useRef<{ x1: number; y1: number; x2: number; y2: number; alpha: number }[]>([]);

  // Simulation parameters
  const [showCheatsHint, setShowCheatsHint] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [unmutedOnce, setUnmutedOnce] = useState(false);

  // Initialize Entities
  useEffect(() => {
    // Generate static parked and driving vehicles
    const vehicles: Vehicle[] = [
      {
        id: 'sports_1',
        type: 'sports',
        name: 'Phoenix GT',
        x: 1600,
        y: 1000,
        angle: 0,
        speed: 0,
        maxSpeed: 11,
        maxReverseSpeed: -4,
        acceleration: 0.18,
        braking: 0.25,
        handling: 0.05,
        friction: 0.965,
        health: 400,
        maxHealth: 400,
        color: '#fbbf24',
        width: 38,
        length: 64,
        isDrivingAI: false
      },
      {
        id: 'sedan_1',
        type: 'sedan',
        name: 'Hansa Cruiser',
        x: 1100,
        y: 1050,
        angle: Math.PI / 2,
        speed: 0,
        maxSpeed: 8,
        maxReverseSpeed: -3,
        acceleration: 0.1,
        braking: 0.18,
        handling: 0.04,
        friction: 0.97,
        health: 300,
        maxHealth: 300,
        color: '#3b82f6',
        width: 36,
        length: 60,
        isDrivingAI: false
      },
      {
        id: 'suv_1',
        type: 'suv',
        name: 'Westfalen G-Wagon',
        x: 1300,
        y: 2000,
        angle: -Math.PI / 4,
        speed: 0,
        maxSpeed: 7.5,
        maxReverseSpeed: -2.5,
        acceleration: 0.08,
        braking: 0.15,
        handling: 0.035,
        friction: 0.96,
        health: 600,
        maxHealth: 600,
        color: '#16a34a',
        width: 42,
        length: 70,
        isDrivingAI: false
      },
      {
        id: 'tank_1',
        type: 'tank',
        name: 'Sovereign Tank',
        x: 350,
        y: 600,
        angle: 0,
        speed: 0,
        maxSpeed: 4.5,
        maxReverseSpeed: -2,
        acceleration: 0.05,
        braking: 0.3,
        handling: 0.02,
        friction: 0.94,
        health: 2000,
        maxHealth: 2000,
        color: '#475569',
        width: 50,
        length: 85,
        isDrivingAI: false
      }
    ];

    // Spawn initial random AI vehicles along nodes
    for (let i = 0; i < 12; i++) {
      const startNodeIdx = Math.floor(Math.random() * ROAD_NODES.length);
      const node = ROAD_NODES[startNodeIdx];
      const types: VehicleType[] = ['sedan', 'sports', 'suv'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      
      let maxSp = 6, acc = 0.08, hp = 300, col = '#94a3b8', name = 'Sedan';
      if (chosenType === 'sports') {
        maxSp = 9; acc = 0.15; hp = 250; col = '#ef4444'; name = 'BVB Racer';
      } else if (chosenType === 'suv') {
        maxSp = 6.5; acc = 0.07; hp = 500; col = '#1e3a8a'; name = 'Dortmund Utility';
      }

      vehicles.push({
        id: `ai_car_${i}`,
        type: chosenType,
        name: name,
        x: node.x + (Math.random() * 40 - 20),
        y: node.y + (Math.random() * 40 - 20),
        angle: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 2,
        maxSpeed: maxSp,
        maxReverseSpeed: -2,
        acceleration: acc,
        braking: 0.15,
        handling: 0.04,
        friction: 0.97,
        health: hp,
        maxHealth: hp,
        color: col,
        width: chosenType === 'suv' ? 40 : 36,
        length: chosenType === 'suv' ? 68 : 58,
        isDrivingAI: true,
        aiWaypointIndex: startNodeIdx
      });
    }

    // Spawn initial pedestrians
    const pedestrians: Pedestrian[] = [];
    const names = ['Klaus', 'Kevin', 'Dieter', 'Brigitte', 'Emma', 'Lukas', 'Aylin', 'Marco'];
    for (let i = 0; i < 25; i++) {
      const nodeIdx = Math.floor(Math.random() * ROAD_NODES.length);
      const node = ROAD_NODES[nodeIdx];
      pedestrians.push({
        id: `ped_${i}`,
        x: node.x + (Math.random() * 120 - 60),
        y: node.y + (Math.random() * 120 - 60),
        angle: Math.random() * Math.PI * 2,
        speed: 0.7 + Math.random() * 0.6,
        state: 'walking',
        color: `hsl(${Math.random() * 360}, 65%, 55%)`,
        health: 100,
        aiWaypointIndex: nodeIdx,
        fleeTimer: 0
      });
    }

    vehiclesRef.current = vehicles;
    pedestriansRef.current = pedestrians;
  }, []);

  // Set up resize observer on canvas container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height)
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Expose handles to cheats
  useEffect(() => {
    if (!cheatResponse) return;
    performCheatCommand(cheatResponse);
    // Clear back
    setCheatResponse('');
  }, [cheatResponse]);

  const performCheatCommand = (command: string) => {
    const code = command.toUpperCase().trim();
    let message = '';
    
    // Quick triggers
    if (code === 'AEZAKMI' || code === 'LEAVEMEALONE') {
      message = '🛡️ CHEAT ACTIVATED: WANTED STATE FROZEN!';
      setGameState(p => ({
        ...p,
        player: { ...p.player, wantedLevel: 0, wantedMultiplier: 0 }
      }));
      audio.playSfx('coin');
    } else if (code === 'CHITTYCHITTYBANGBANG') {
      message = '🚗 CHEAT ACTIVATED: FLOAT-VEHICLE GRAVITY MATRIX ON';
      vehiclesRef.current.forEach(v => {
        v.maxSpeed = 16;
        v.friction = 0.995; // virtually no drift friction
      });
      audio.playSfx('teleport');
    } else if (code === 'GODMODE') {
      message = '⚡ CHEAT ACTIVATED: IMMORTAL SHIELD ONLINE!';
      setGameState(p => ({
        ...p,
        player: { ...p.player, health: 99999, armor: 99999 }
      }));
      audio.playSfx('coin');
    } else if (code.startsWith('CASH') || code === 'MUNY') {
      const amt = 50000;
      message = `💰 COGNISYNC WIRE DEPOSITED: +$${amt.toLocaleString()}`;
      setGameState(p => ({
        ...p,
        player: { ...p.player, cash: p.player.cash + amt }
      }));
      audio.playSfx('coin');
    } else if (code === 'WANTED_UP') {
      message = '🚔 HEAT LEVEL ENHANCED!';
      setGameState(p => {
        const nextWanted = Math.min(p.player.wantedLevel + 1, 5);
        return {
          ...p,
          player: { ...p.player, wantedLevel: nextWanted, copChaseTimer: 20000 }
        };
      });
      audio.playSfx('siren');
    } else if (code === 'WANTED_DOWN') {
      message = '🕊️ WANTED LEVELS ERASED!';
      setGameState(p => ({
        ...p,
        player: { ...p.player, wantedLevel: 0 }
      }));
      audio.playSfx('coin');
    } else if (code === 'SPAWN_TANK' || code === 'PANZER') {
      message = '🛡️ TACTICAL ARMORED PANZER SUMMONED!';
      // Spawner exactly at player's side
      setGameState(p => {
        const offsetAng = p.player.angle + Math.PI / 2;
        const tx = p.player.x + Math.cos(offsetAng) * 90;
        const ty = p.player.y + Math.sin(offsetAng) * 90;
        
        vehiclesRef.current.push({
          id: `spawned_tank_${Date.now()}`,
          type: 'tank',
          name: 'Tiger-Sovereign',
          x: tx,
          y: ty,
          angle: p.player.angle,
          speed: 0,
          maxSpeed: 5,
          maxReverseSpeed: -2,
          acceleration: 0.06,
          braking: 0.4,
          handling: 0.02,
          friction: 0.93,
          health: 1500,
          maxHealth: 1500,
          color: '#334155',
          width: 52,
          length: 90,
          isDrivingAI: false
        });
        return p;
      });
      audio.playSfx('teleport');
    } else if (code === 'SPAWN_COP' || code === 'Fuzz') {
      message = '🚨 COP PATROL CRUSADER SPAWNED!';
      setGameState(p => {
        const tx = p.player.x - Math.cos(p.player.angle) * 100;
        const ty = p.player.y - Math.sin(p.player.angle) * 100;
        
        vehiclesRef.current.push({
          id: `spawned_cop_${Date.now()}`,
          type: 'cop',
          name: 'Stadtpolizei DB',
          x: tx,
          y: ty,
          angle: p.player.angle,
          speed: 0,
          maxSpeed: 9.5,
          maxReverseSpeed: -3,
          acceleration: 0.14,
          braking: 0.22,
          handling: 0.045,
          friction: 0.97,
          health: 350,
          maxHealth: 350,
          color: '#1e3a8a',
          width: 36,
          length: 62,
          isDrivingAI: false
        });
        return p;
      });
      audio.playSfx('siren');
    } else if (code === 'WESTFALEN_STORM' || code === 'RAIN') {
      message = '⛈️ WEATHER MANIPULATION INSTANTLY TRIGGERED: HEAVY STORM!';
      setGameState(p => ({
        ...p,
        weather: 'stormy'
      }));
      audio.playSfx('teleport');
    } else if (code === 'SUNNY') {
      message = '☀️ COGNISYNC SKYDOME UNVEILED: SUNNY WEATHER!';
      setGameState(p => ({
        ...p,
        weather: 'sunny'
      }));
      audio.playSfx('coin');
    } else if (code === 'AMMO_HEAVEN' || code === 'FULL_GUNS') {
      message = '🚀 WEAPON STASH RECHARGED TO CAPACITY!';
      setGameState(p => {
        const nextWeapons = p.player.weapons.map(w => ({
          ...w,
          ammo: w.maxAmmo
        }));
        return {
          ...p,
          player: { ...p.player, weapons: nextWeapons }
        };
      });
      audio.playSfx('coin');
    } else {
      message = `🔍 ALICE DECIPHERED FORMULA: "${command}" (Sovereign Matrix Mutated)`;
      // Arbitrary cool bonus! Give $1,000 and spawn spark particle effects
      setGameState(p => ({
        ...p,
        player: { ...p.player, cash: p.player.cash + 1000 }
      }));
      audio.playSfx('coin');
    }

    // Spawn green floating texts for activation
    setGameState(p => {
      particlesRef.current.push({
        id: `cheat_txt_${Date.now()}`,
        x: p.player.x,
        y: p.player.y - 40,
        vx: 0,
        vy: -1.2,
        color: '#4ade80',
        alpha: 1.0,
        size: 16,
        decay: 0.012,
        type: 'text',
        text: message
      });
      return p;
    });
  };

  // Click handler for canvas (firing)
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameState.player.isDead || gameState.player.isBusted) return;

    // First time interact unlock sound
    if (!unmutedOnce) {
      setUnmutedOnce(true);
      audio.setMuted(false);
      setGameState(p => ({ ...p, isMuted: false }));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get current weapon
    const weapon = gameState.player.weapons[gameState.player.selectedWeaponIndex];
    const now = Date.now();
    if (now - weapon.lastFired < weapon.cooldown) {
      return; // reloading
    }

    if (weapon.type !== 'fists' && weapon.ammo <= 0) {
      audio.playSfx('crash'); // click empty sound
      return;
    }

    // Capture bounding rect to calculate correct absolute coordinate
    const rect = canvas.getBoundingClientRect();
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;

    // Calculate camera offset to convert screen to world
    const camX = gameState.player.x - dimensions.width / 2;
    const camY = gameState.player.y - dimensions.height / 2;
    const targetWorldX = mouseScreenX + camX;
    const targetWorldY = mouseScreenY + camY;

    // Fire weapon!
    const dx = targetWorldX - gameState.player.x;
    const dy = targetWorldY - gameState.player.y;
    const angle = Math.atan2(dy, dx);

    // Apply recoil particles
    particlesRef.current.push({
      id: `muzzle_${now}`,
      x: gameState.player.x + Math.cos(angle) * 25,
      y: gameState.player.y + Math.sin(angle) * 25,
      vx: Math.cos(angle) * 1.5 + (Math.random() * 0.5 - 0.25),
      vy: Math.sin(angle) * 1.5 + (Math.random() * 0.5 - 0.25),
      color: '#facc15',
      alpha: 1.0,
      size: 5 + Math.random() * 4,
      decay: 0.08,
      type: 'spark'
    });

    if (weapon.type === 'fists') {
      audio.playSfx('crash');
      // Look for pedestrians nearby in front
      pedestriansRef.current.forEach(p => {
        const dist = Math.hypot(p.x - gameState.player.x, p.y - gameState.player.y);
        if (dist < 45 && p.state !== 'dead') {
          p.health -= 35;
          p.state = 'fleeing';
          p.fleeTimer = 300;
          // Spawn blood
          for (let b = 0; b < 6; b++) {
            particlesRef.current.push({
              id: `blood_${p.id}_${b}_${now}`,
              x: p.x,
              y: p.y,
              vx: (Math.random() * 4 - 2) + Math.cos(angle) * 2,
              vy: (Math.random() * 4 - 2) + Math.sin(angle) * 2,
              color: '#dc2626',
              alpha: 1.0,
              size: 4 + Math.random() * 3,
              decay: 0.03,
              type: 'blood'
            });
          }

          if (p.health <= 0) {
            p.state = 'dead';
            setGameState(p => ({
              ...p,
              player: {
                ...p.player,
                cash: p.player.cash + Math.floor(Math.random() * 120 + 30),
                wantedLevel: Math.min(p.player.wantedLevel + 1, 5),
                copChaseTimer: 18000
              }
            }));
          }
        }
      });
    } else {
      // Spawn bullets/rockets
      audio.playSfx(weapon.type === 'rocket' ? 'explosion' : 'gunshot');

      const speed = weapon.type === 'rocket' ? 12 : 20;
      bulletsRef.current.push({
        id: `bullet_${Date.now()}_${Math.random()}`,
        x: gameState.player.x + Math.cos(angle) * 25,
        y: gameState.player.y + Math.sin(angle) * 25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: weapon.damage,
        firedByPlayer: true,
        angle: angle,
        rangeRemaining: weapon.type === 'rocket' ? 500 : 350,
        isRocket: weapon.type === 'rocket'
      });

      // Update ammo count and last fired
      setGameState(p => {
        const nextWeapons = [...p.player.weapons];
        nextWeapons[p.player.selectedWeaponIndex] = {
          ...nextWeapons[p.player.selectedWeaponIndex],
          ammo: Math.max(0, weapon.ammo - 1),
          lastFired: now
        };

        // Aggress shooting wanted level (shooting near cops/public)
        let deltaWantedMultiplier = 0.08;
        let chaseTimer = p.player.copChaseTimer;
        let wLevel = p.player.wantedLevel;

        const pInCar = p.player.currentVehicleId !== null;
        if (!pInCar && wLevel === 0) {
          if (Math.random() < 0.25) {
            wLevel = 1;
            chaseTimer = 15000;
          }
        }

        return {
          ...p,
          player: {
            ...p.player,
            weapons: nextWeapons,
            wantedLevel: wLevel,
            copChaseTimer: chaseTimer
          }
        };
      });
    }
  };

  // Keyboard Event registration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current[code] = true;

      // Enter/Exit Car with 'KeyF' or 'Enter'
      if (code === 'KeyF' || code === 'Enter') {
        toggleCarEntry();
      }

      // Weapon index numbers 1 to 4
      if (code === 'Digit1') setWeaponSelection(0);
      if (code === 'Digit2') setWeaponSelection(1);
      if (code === 'Digit3') setWeaponSelection(2);
      if (code === 'Digit4') setWeaponSelection(3);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.player.currentVehicleId, gameState.player.isDead]);

  const setWeaponSelection = (index: number) => {
    setGameState(p => {
      if (index >= p.player.weapons.length) return p;
      return {
        ...p,
        player: { ...p.player, selectedWeaponIndex: index }
      };
    });
  };

  const toggleCarEntry = () => {
    if (gameState.player.isDead || gameState.player.isBusted) return;

    if (gameState.player.currentVehicleId) {
      // Exit Vehicle
      const carId = gameState.player.currentVehicleId;
      const car = vehiclesRef.current.find(v => v.id === carId);
      if (!car) return;

      // Position player slightly to the side of the car
      const exitAngle = car.angle + Math.PI / 2;
      const exitX = car.x + Math.cos(exitAngle) * 45;
      const exitY = car.y + Math.sin(exitAngle) * 45;

      setGameState(p => ({
        ...p,
        player: {
          ...p.player,
          x: Math.max(20, Math.min(MAP_SIZE - 20, exitX)),
          y: Math.max(20, Math.min(MAP_SIZE - 20, exitY)),
          currentVehicleId: null
        }
      }));
      audio.updateEngine(0, false);
      audio.playSfx('coin'); // positive exit note
    } else {
      // Enter Nearby Vehicle
      let closestCar: Vehicle | null = null;
      let closestDist = 80; // interaction radius

      vehiclesRef.current.forEach(v => {
        if (v.isTorn) return; // cannot jack a blown up car
        const dist = Math.hypot(v.x - gameState.player.x, v.y - gameState.player.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestCar = v;
        }
      });

      if (closestCar) {
        const targetCar = closestCar as Vehicle;
        
        // Jacking sequence! If the car is driving AI, kickoff driver
        if (targetCar.isDrivingAI) {
          targetCar.isDrivingAI = false;
          // Spawn fleeing driver ped
          pedestriansRef.current.push({
            id: `driver_${Date.now()}`,
            x: targetCar.x,
            y: targetCar.y,
            angle: targetCar.angle + Math.PI,
            speed: 3,
            state: 'fleeing',
            color: '#c084fc',
            health: 100,
            aiWaypointIndex: Math.floor(Math.random() * ROAD_NODES.length),
            fleeTimer: 400
          });

          // Committing a crime triggers cop awareness
          setGameState(p => ({
            ...p,
            player: {
              ...p.player,
              wantedLevel: Math.max(p.player.wantedLevel, 1),
              copChaseTimer: Math.max(p.player.copChaseTimer, 12000)
            }
          }));
        }

        setGameState(p => ({
          ...p,
          player: {
            ...p.player,
            x: targetCar.x,
            y: targetCar.y,
            currentVehicleId: targetCar.id
          }
        }));

        audio.playSfx('teleport');
        audio.updateEngine(targetCar.speed, true);
      }
    }
  };

  // Main Loop logic using Ref to avoid stale states
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;

      updatePhysics(dt);
      drawGame();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, dimensions]);

  const updatePhysics = (dt: number) => {
    if (gameState.player.isDead || gameState.player.isBusted) {
      // Slowly decay particles but freeze standard physics
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
      });
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);
      return;
    }

    const { player, timeState, weather } = gameState;
    const isStormy = weather === 'stormy';

    // 1. UPDATE TIME
    let nextMinutes = timeState.minutes + 0.15; // slow time speed
    let nextHours = timeState.hours;
    if (nextMinutes >= 60) {
      nextMinutes = 0;
      nextHours = (nextHours + 1) % 24;
    }
    const dayProgress = (nextHours * 60 + nextMinutes) / 1440;
    
    // Smooth lookup of category
    let nextTimeOfDay: TimeOfDay = 'noon';
    if (nextHours >= 6 && nextHours < 11) nextTimeOfDay = 'morning';
    else if (nextHours >= 11 && nextHours < 17) nextTimeOfDay = 'noon';
    else if (nextHours >= 17 && nextHours < 21) nextTimeOfDay = 'sunset';
    else nextTimeOfDay = 'night';

    // 2. PLAYER PHYSICS AND CONTROLS
    let px = player.x;
    let py = player.y;
    let pAngle = player.angle;
    let pSpeed = player.speed;

    const inCar = player.currentVehicleId !== null;
    let activeCar: Vehicle | null = null;

    if (inCar) {
      activeCar = vehiclesRef.current.find(v => v.id === player.currentVehicleId) || null;
    }

    if (inCar && activeCar) {
      // CAR CONTROLS
      const maxSpeed = activeCar.maxSpeed * (isStormy ? 0.8 : 1.0); // rain reduces traction max speed
      const accel = activeCar.acceleration;
      const friction = activeCar.friction;
      const maxReverse = activeCar.maxReverseSpeed;

      // Accelerate
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) {
        activeCar.speed = Math.min(activeCar.speed + accel, maxSpeed);
      }
      // Brake or Reverse
      else if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) {
        activeCar.speed = Math.max(activeCar.speed - activeCar.braking, maxReverse);
      }
      // Drag/Coast Friction
      else {
        activeCar.speed *= friction;
        if (Math.abs(activeCar.speed) < 0.05) activeCar.speed = 0;
      }

      // Steering (only if moving)
      if (Math.abs(activeCar.speed) > 0.2) {
        const steeringDir = activeCar.speed > 0 ? 1 : -0.6; // steer opposite in reverse
        const handlingRate = activeCar.handling * (isStormy ? 0.7 : 1.0); // wet roads spin out more!
        
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) {
          activeCar.angle -= handlingRate * steeringDir;
          spawnTireSmoke(activeCar, 0.4);
        }
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) {
          activeCar.angle += handlingRate * steeringDir;
          spawnTireSmoke(activeCar, 0.4);
        }
      }

      // Handbrake drift style
      if (keysRef.current['Space']) {
        activeCar.speed *= 0.88; // rapid slow down but sliding
        spawnTireSmoke(activeCar, 0.85);
      }

      // Collision checks with boundaries
      activeCar.x += Math.cos(activeCar.angle) * activeCar.speed;
      activeCar.y += Math.sin(activeCar.angle) * activeCar.speed;

      // Keep inside map
      activeCar.x = Math.max(30, Math.min(MAP_SIZE - 30, activeCar.x));
      activeCar.y = Math.max(30, Math.min(MAP_SIZE - 30, activeCar.y));

      // Drowning check at Phoenix-See
      const isDrowned = checkWaterDrown(activeCar.x, activeCar.y);
      if (isDrowned) {
        activeCar.health = 0;
        activeCar.speed *= 0.3;
        spawnExplosion(activeCar.x, activeCar.y, 'AQUATIC FAILURE! Engine drowned at Phoenix See.');
      }

      // Sync player pos
      px = activeCar.x;
      py = activeCar.y;
      pAngle = activeCar.angle;
      pSpeed = activeCar.speed;

      // Feed engine synth sound
      audio.updateEngine(activeCar.speed, true);
    } else {
      // ON FOOT CONTROLS
      const walkSpeed = keysRef.current['ShiftLeft'] ? 4.2 : 2.5; // sprinting key Shift
      pSpeed = 0;
      let dx = 0;
      let dy = 0;

      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dy -= 1;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dy += 1;
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dx -= 1;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        pSpeed = walkSpeed;
        const walkAngle = Math.atan2(dy, dx);
        px += Math.cos(walkAngle) * pSpeed;
        py += Math.sin(walkAngle) * pSpeed;
        
        // Face moving direction unless shooting (handled in mouse rotate)
        pAngle = walkAngle;
      }

      // Track boundaries
      px = Math.max(20, Math.min(MAP_SIZE - 20, px));
      py = Math.max(20, Math.min(MAP_SIZE - 20, py));

      audio.updateEngine(0, false);
    }

    // 3. VEHICLE COHERENCY & COLLISIONS
    vehiclesRef.current.forEach(v => {
      if (v.id === player.currentVehicleId) return; // handled above

      if (v.isDrivingAI) {
        // AI Car Steering & Waypoint tracking
        const currentTarget = ROAD_NODES[v.aiWaypointIndex || 0];
        const distToTarget = Math.hypot(currentTarget.x - v.x, currentTarget.y - v.y);

        if (distToTarget < 120) {
          // Find connected waypoints
          const choices = ROAD_CONNECTIONS
            .filter(conn => conn[0] === v.aiWaypointIndex || conn[1] === v.aiWaypointIndex)
            .map(conn => conn[0] === v.aiWaypointIndex ? conn[1] : conn[0]);
          v.aiWaypointIndex = choices.length > 0 ? choices[Math.floor(Math.random() * choices.length)] : 0;
        }

        const angleToTarget = Math.atan2(currentTarget.y - v.y, currentTarget.x - v.x);
        
        // Interpolate angle
        let diff = angleToTarget - v.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        v.angle += diff * 0.05;

        // Drive
        v.speed = Math.min(v.speed + v.acceleration, v.maxSpeed * (isStormy ? 0.75 : 1.0));
        
        // Scan for pedestrian/player directly ahead to stop!
        let obstacleAhead = false;
        pedestriansRef.current.forEach(ped => {
          if (ped.state === 'dead') return;
          const pedDist = Math.hypot(ped.x - v.x, ped.y - v.y);
          if (pedDist < 90) obstacleAhead = true;
        });

        // Player check
        const playerDist = Math.hypot(player.x - v.x, player.y - v.y);
        if (playerDist < 100) obstacleAhead = true;

        if (obstacleAhead) {
          v.speed *= 0.7; // brake
        }

        v.x += Math.cos(v.angle) * v.speed;
        v.y += Math.sin(v.angle) * v.speed;
      } else if (v.type === 'cop') {
        // Police Aggressive Chase AI!
        const distToPlayer = Math.hypot(player.x - v.x, player.y - v.y);
        if (player.wantedLevel > 0 && distToPlayer < 900) {
          // Siren SFX
          if (Math.random() < 0.05) {
            audio.playSfx('siren');
          }

          const angleToPlayer = Math.atan2(player.y - v.y, player.x - v.x);
          let diff = angleToPlayer - v.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          v.angle += diff * 0.08;

          v.speed = Math.min(v.speed + v.acceleration * 1.5, v.maxSpeed);

          // Ram player car or park next to player to shoot
          if (distToPlayer < 100 && !inCar) {
            v.speed *= 0.6; // slow down to get out
            if (v.speed < 1.5 && Math.random() < 0.1) {
              // Cop exits and joins gun battle!
              spawnCopFootPatrol(v.x, v.y);
              v.isTorn = true; // disable vehicle reuse easily
              v.health = 0;
            }
          }

          v.x += Math.cos(v.angle) * v.speed;
          v.y += Math.sin(v.angle) * v.speed;
        } else {
          // Slow down
          v.speed *= 0.95;
        }
      }

      // Boundary safety
      v.x = Math.max(30, Math.min(MAP_SIZE - 30, v.x));
      v.y = Math.max(30, Math.min(MAP_SIZE - 30, v.y));

      // COLLISION WITH PLAYER CAR
      if (inCar && activeCar) {
        const carDist = Math.hypot(v.x - activeCar.x, v.y - activeCar.y);
        const contactRadius = (v.length + activeCar.length) / 3.2;
        if (carDist < contactRadius) {
          // Crash calculations
          const pushForce = Math.abs(activeCar.speed - v.speed) * 0.5 + 2;
          const bounceAngle = Math.atan2(v.y - activeCar.y, v.x - activeCar.x);
          
          v.x += Math.cos(bounceAngle) * pushForce;
          v.y += Math.sin(bounceAngle) * pushForce;
          activeCar.x -= Math.cos(bounceAngle) * pushForce;
          activeCar.y -= Math.sin(bounceAngle) * pushForce;

          v.speed *= -0.3;
          activeCar.speed *= -0.3;

          v.health -= pushForce * 8;
          activeCar.health -= pushForce * 8;

          audio.playSfx('crash');

          // Smoke or spark particles
          for (let pIdx = 0; pIdx < 8; pIdx++) {
            particlesRef.current.push({
              id: `spark_${v.id}_${pIdx}_${Date.now()}`,
              x: (v.x + activeCar.x) / 2,
              y: (v.y + activeCar.y) / 2,
              vx: (Math.random() * 6 - 3),
              vy: (Math.random() * 6 - 3),
              color: '#d1d5db',
              alpha: 1.0,
              size: 3 + Math.random() * 3,
              decay: 0.04,
              type: 'smoke'
            });
          }

          // Trigger wanted heat if hitting cop cruiser!
          if (v.type === 'cop') {
            setGameState(p => ({
              ...p,
              player: {
                ...p.player,
                wantedLevel: Math.max(p.player.wantedLevel, 2),
                copChaseTimer: Math.max(p.player.copChaseTimer, 20000)
              }
            }));
          }
        }
      }

      // EXPLODING DIRT WHEEL OF DEATH CHANGER
      if (v.health <= 0 && !v.isTorn) {
        v.isTorn = true;
        spawnExplosion(v.x, v.y, `🔥 ${v.name} Exploded!`);
        // Cop heat up
        setGameState(p => ({
          ...p,
          player: {
            ...p.player,
            wantedLevel: Math.min(p.player.wantedLevel + 1, 5),
            copChaseTimer: Math.max(p.player.copChaseTimer, 25000)
          }
        }));
      }
    });

    // 4. BULLET PHYSICS & HIT BOX CHECKS
    const bullets = bulletsRef.current;
    for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = bullets[bIdx];
      b.x += b.vx;
      b.y += b.vy;
      b.rangeRemaining -= Math.hypot(b.vx, b.vy);

      // Edge boundaries hit
      if (b.x < 10 || b.x > MAP_SIZE - 10 || b.y < 10 || b.y > MAP_SIZE - 10 || b.rangeRemaining <= 0) {
        if (b.isRocket) {
          spawnExplosion(b.x, b.y, "🚀 RPG Impact!");
        }
        bullets.splice(bIdx, 1);
        continue;
      }

      // Rocket specific visual particles
      if (b.isRocket && Math.random() < 0.45) {
        particlesRef.current.push({
          id: `smoke_r_${Date.now()}_${Math.random()}`,
          x: b.x,
          y: b.y,
          vx: Math.random() * 0.8 - 0.4,
          vy: Math.random() * 0.8 - 0.4,
          color: '#fbbf24',
          alpha: 0.9,
          size: 7,
          decay: 0.04,
          type: 'smoke'
        });
      }

      // Check bullet hit on Vehicles
      let hitSomething = false;
      const vehicles = vehiclesRef.current;
      for (let vIdx = 0; vIdx < vehicles.length; vIdx++) {
        const v = vehicles[vIdx];
        if (v.isTorn) continue;

        const dist = Math.hypot(b.x - v.x, b.y - v.y);
        const hitRadius = (v.width + v.length) / 3.8;
        if (dist < hitRadius) {
          v.health -= b.damage;
          hitSomething = true;
          audio.playSfx('crash');

          // Hit spark particles
          for (let sIdx = 0; sIdx < 4; sIdx++) {
            particlesRef.current.push({
              id: `bullet_spark_${Date.now()}_${Math.random()}`,
              x: b.x,
              y: b.y,
              vx: Math.random() * 4 - 2 - b.vx * 0.1,
              vy: Math.random() * 4 - 2 - b.vy * 0.1,
              color: '#f97316',
              alpha: 1.0,
              size: 2,
              decay: 0.09,
              type: 'spark'
            });
          }

          if (b.isRocket) {
            spawnExplosion(b.x, b.y, "🚀 Heavy Rocket Fire!");
            v.health = 0; // immediate blow up
          }
          break;
        }
      }

      // Hit checked on pedestrians
      if (!hitSomething) {
        const pedestrians = pedestriansRef.current;
        for (let pIdx = pedestrians.length - 1; pIdx >= 0; pIdx--) {
          const ped = pedestrians[pIdx];
          if (ped.state === 'dead') continue;

          const dist = Math.hypot(b.x - ped.x, b.y - ped.y);
          if (dist < 22) {
            ped.health -= b.damage;
            ped.state = 'fleeing';
            ped.fleeTimer = 300;
            hitSomething = true;

            // Trigger blood spray
            for (let blIdx = 0; blIdx < 7; blIdx++) {
              particlesRef.current.push({
                id: `blood_dr_${Date.now()}_${Math.random()}`,
                x: ped.x,
                y: ped.y,
                vx: (Math.random() * 4 - 2) + b.vx * 0.12,
                vy: (Math.random() * 4 - 2) + b.vy * 0.12,
                color: '#dc2626',
                alpha: 1.0,
                size: 3 + Math.random() * 3,
                decay: 0.04,
                type: 'blood'
              });
            }

            if (ped.health <= 0) {
              ped.state = 'dead';
              setGameState(p => ({
                ...p,
                player: {
                  ...p.player,
                  cash: p.player.cash + Math.floor(Math.random() * 150 + 40),
                  wantedLevel: Math.min(p.player.wantedLevel + 1, 5),
                  copChaseTimer: Math.max(p.player.copChaseTimer, 16000)
                }
              }));
            }
            
            if (b.isRocket) {
              spawnExplosion(b.x, b.y, "🚀 Heavy Rocket Fire!");
            }
            break;
          }
        }
      }

      // Check hit on player itself if fired by AI cops
      if (!hitSomething && !b.firedByPlayer && !player.isDead) {
        const pedDist = Math.hypot(b.x - player.x, b.y - player.y);
        const hitZone = inCar ? 44 : 20;

        if (pedDist < hitZone) {
          hitSomething = true;
          // Apply damage (reduced if wearing armor)
          setGameState(p => {
            let arm = p.player.armor;
            let hp = p.player.health;
            const dmg = b.damage;

            if (arm > 0) {
              const absorbed = Math.min(arm, dmg * 0.75);
              arm -= absorbed;
              hp -= (dmg - absorbed);
            } else {
              hp -= dmg;
            }

            // Play bullet screen damage
            audio.playSfx('crash');

            const isDead = hp <= 0;
            let wantedMultiplier = p.player.wantedMultiplier;
            let copTime = p.player.copChaseTimer;

            if (isDead) {
              audio.playSfx('busted');
            }

            return {
              ...p,
              player: {
                ...p.player,
                health: Math.max(0, hp),
                armor: arm,
                isDead: isDead,
                hospitalRespawnTimer: isDead ? 200 : 0
              }
            };
          });

          // Blood spray for player
          for (let blIdx = 0; blIdx < 6; blIdx++) {
            particlesRef.current.push({
              id: `play_blood_${Date.now()}_${Math.random()}`,
              x: player.x,
              y: player.y,
              vx: (Math.random() * 4 - 2),
              vy: (Math.random() * 4 - 2),
              color: '#ef4444',
              alpha: 1.0,
              size: 3 + Math.random() * 2,
              decay: 0.04,
              type: 'blood'
            });
          }
        }
      }

      if (hitSomething) {
        bullets.splice(bIdx, 1);
      }
    }

    // 5. PEDESTRIAN AI
    pedestriansRef.current.forEach(p => {
      if (p.state === 'dead') return;

      if (p.state === 'fleeing') {
        p.speed = 3.2; // sprint!
        p.fleeTimer -= 1;
        if (p.fleeTimer <= 0) {
          p.state = 'walking';
        }

        // Run away directly from player
        const fleeAngle = Math.atan2(p.y - player.y, p.x - player.x);
        p.angle = fleeAngle + (Math.random() * 0.2 - 0.1);
      } else {
        // Normal waypoint tracking
        p.speed = 0.8;
        const currentTarget = ROAD_NODES[p.aiWaypointIndex];
        const dist = Math.hypot(currentTarget.x - p.x, currentTarget.y - p.y);
        
        if (dist < 45) {
          p.aiWaypointIndex = Math.floor(Math.random() * ROAD_NODES.length);
        }

        const angleToTarget = Math.atan2(currentTarget.y - p.y, currentTarget.x - p.x);
        // smooth steer
        p.angle += (angleToTarget - p.angle) * 0.1;
      }

      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;

      // Pedestrian hit by player car check
      if (inCar && activeCar && Math.abs(activeCar.speed) > 1.8) {
        const hitDist = Math.hypot(p.x - activeCar.x, p.y - activeCar.y);
        if (hitDist < 42) {
          p.health = 0;
          p.state = 'dead';
          
          audio.playSfx('crash');

          // Big blood slide
          for (let b = 0; b < 12; b++) {
            particlesRef.current.push({
              id: `blood_impact_${p.id}_${b}`,
              x: p.x,
              y: p.y,
              vx: Math.cos(activeCar.angle) * activeCar.speed * 0.5 + (Math.random() * 4 - 2),
              vy: Math.sin(activeCar.angle) * activeCar.speed * 0.5 + (Math.random() * 4 - 2),
              color: '#b91c1c',
              alpha: 1.0,
              size: 4 + Math.random() * 4,
              decay: 0.02,
              type: 'blood'
            });
          }

          // Trigger wanted stars
          setGameState(pState => ({
            ...pState,
            player: {
              ...pState.player,
              wantedLevel: Math.min(pState.player.wantedLevel + 1, 5),
              copChaseTimer: Math.max(pState.player.copChaseTimer, 15000)
            }
          }));
        }
      }
    });

    // 6. COP DISPATCH AND COP FOOT PATROLS
    if (player.wantedLevel > 0) {
      // Countdown heat timer
      let nextCopTimer = player.copChaseTimer - 16;
      let nextWanted = player.wantedLevel;
      if (nextCopTimer <= 0) {
        nextCopTimer = 0;
        // Ease heat
        nextWanted = Math.max(0, player.wantedLevel - 1);
        if (nextWanted > 0) {
          nextCopTimer = 15000; // block for next down
        }
      }

      setGameState(p => ({
        ...p,
        player: { ...p.player, copChaseTimer: nextCopTimer, wantedLevel: nextWanted }
      }));

      // Spawns cop cruisers nearby if chase is hot and we have fewer than 3 cops active
      const copCars = vehiclesRef.current.filter(v => v.type === 'cop' && !v.isTorn);
      if (copCars.length < player.wantedLevel && Math.random() < 0.008) {
        spawnPoliceCruiserNearPlayer();
      }

      // Cop foot patrol spawns to hunt on corner
      const livingPeds = pedestriansRef.current.filter(p => p.state !== 'dead');
      if (livingPeds.length < 30 && Math.random() < 0.005) {
        // Spawn generic cop ped chasing!
        spawnCopFootPatrol(
          player.x + (Math.random() * 400 - 200),
          player.y + (Math.random() * 400 - 200)
        );
      }
    }

    // 7. PARTICLES DECAY & WEATHER SPLASHES
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
    });
    particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);

    // Rain drop generator directly on screen camera coordinates
    if (weather === 'rainy' || weather === 'stormy') {
      const density = weather === 'stormy' ? 12 : 5;
      for (let rIdx = 0; rIdx < density; rIdx++) {
        const rx = player.x + (Math.random() * dimensions.width) - dimensions.width / 2;
        const ry = player.y + (Math.random() * dimensions.height) - dimensions.height / 2;
        particlesRef.current.push({
          id: `rain_${Date.now()}_${Math.random()}`,
          x: rx,
          y: ry,
          vx: -3.5, // slanted rainfall
          vy: 11,
          color: 'rgba(156, 163, 175, 0.45)',
          alpha: 0.8,
          size: 1.5,
          decay: 0.05,
          type: 'rain'
        });
      }
    }

    // 8. MISSION CHECKPOINT EVALUATOR
    if (gameState.activeMissionId) {
      checkMissionRequirements(px, py, inCar, activeCar);
    }

    // 9. MAP WRAPPERS & RESPOND STATES
    setGameState(p => ({
      ...p,
      player: {
        ...p.player,
        x: px,
        y: py,
        angle: pAngle,
        speed: pSpeed
      },
      timeState: {
        minutes: nextMinutes,
        hours: nextHours,
        dayProgress: dayProgress,
        timeOfDay: nextTimeOfDay
      }
    }));
  };

  // Helper spawners
  const spawnTireSmoke = (car: Vehicle, density: number) => {
    if (Math.random() > density) return;
    particlesRef.current.push({
      id: `smoke_${Date.now()}_${Math.random()}`,
      x: car.x - Math.cos(car.angle) * 30 + (Math.random() * 10 - 5),
      y: car.y - Math.sin(car.angle) * 30 + (Math.random() * 10 - 5),
      vx: -Math.cos(car.angle) * car.speed * 0.15 + (Math.random() * 1 - 0.5),
      vy: -Math.sin(car.angle) * car.speed * 0.15 + (Math.random() * 1 - 0.5),
      color: '#cbd5e1',
      alpha: 0.7,
      size: 4 + Math.random() * 5,
      decay: 0.03,
      type: 'smoke'
    });
  };

  const spawnExplosion = (x: number, y: number, label: string) => {
    audio.playSfx('explosion');
    
    // Spawn core flash sparks
    for (let c = 0; c < 24; c++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particlesRef.current.push({
        id: `expl_s_${Date.now()}_${c}`,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() < 0.6 ? '#f97316' : '#facc15',
        alpha: 1.0,
        size: 6 + Math.random() * 8,
        decay: 0.024,
        type: 'explosion'
      });
    }

    // Spawn expanding grey smoke puffs
    for (let s = 0; s < 15; s++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 3;
      particlesRef.current.push({
        id: `expl_m_${Date.now()}_${s}`,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#475569',
        alpha: 0.8,
        size: 14 + Math.random() * 12,
        decay: 0.012,
        type: 'smoke'
      });
    }

    // Floating text label
    particlesRef.current.push({
      id: `expl_txt_${Date.now()}`,
      x: x,
      y: y - 50,
      vx: 0,
      vy: -1,
      color: '#f87171',
      alpha: 1.0,
      size: 15,
      decay: 0.008,
      type: 'text',
      text: label
    });
  };

  const spawnPoliceCruiserNearPlayer = () => {
    // Pick side of player
    const dist = 500 + Math.random() * 200;
    const angle = Math.random() * Math.PI * 2;
    const px = gameState.player.x + Math.cos(angle) * dist;
    const py = gameState.player.y + Math.sin(angle) * dist;

    vehiclesRef.current.push({
      id: `cop_cruiser_${Date.now()}`,
      type: 'cop',
      name: 'Stadtpolizei DB',
      x: Math.max(100, Math.min(MAP_SIZE - 100, px)),
      y: Math.max(100, Math.min(MAP_SIZE - 100, py)),
      angle: angle + Math.PI,
      speed: 3,
      maxSpeed: 8.5 + gameState.player.wantedLevel * 0.3,
      maxReverseSpeed: -3.5,
      acceleration: 0.14,
      braking: 0.25,
      handling: 0.045,
      friction: 0.97,
      health: 350,
      maxHealth: 350,
      color: '#1e3a8a', // police blue
      width: 36,
      length: 62,
      isDrivingAI: false
    });
  };

  const spawnCopFootPatrol = (x: number, y: number) => {
    pedestriansRef.current.push({
      id: `cop_ped_${Date.now()}_${Math.random()}`,
      x: Math.max(100, Math.min(MAP_SIZE - 100, x)),
      y: Math.max(100, Math.min(MAP_SIZE - 100, y)),
      angle: Math.random() * Math.PI * 2,
      speed: 1.8,
      state: 'fleeing', // leverages active chase behaviors
      color: '#1e1b4b', // deep indigo police uniform
      health: 80,
      aiWaypointIndex: Math.floor(Math.random() * ROAD_NODES.length),
      fleeTimer: 999999 // never stop chasing
    });
  };

  const checkWaterDrown = (x: number, y: number): boolean => {
    const lake = LANDMARKS.find(l => l.id === 'phoenix_see');
    if (!lake) return false;
    // Simple bounding check (lake is safe water body)
    return (
      x >= lake.x &&
      x <= lake.x + lake.width &&
      y >= lake.y &&
      y <= lake.y + lake.height
    );
  };

  const checkMissionRequirements = (px: number, py: number, inCar: boolean, activeCar: Vehicle | null) => {
    const mission = LANDMARKS; // access static ids
    const activeId = gameState.activeMissionId;

    if (activeId === 'm1') {
      // Steal any sports car and deliver to Dortmunder U Art Center
      const uTowerIdx = LANDMARKS.find(l => l.id === 'u_tower');
      if (uTowerIdx && inCar && activeCar && activeCar.type === 'sports') {
        const distToU = Math.hypot(px - (uTowerIdx.x + uTowerIdx.width / 2), py - (uTowerIdx.y + uTowerIdx.height / 2));
        if (distToU < 160) {
          // Mission completed success!
          onRequestMissionComplete(7500);
          spawnExplosion(px, py, "🏆 MISSION COMPLETED: THE GOLDEN U DELIVERED!");
        }
      }
    } else if (activeId === 'm2') {
      // Park at Signal Iduna Park Stadium in a heavy cop cruiser
      const stadium = LANDMARKS.find(l => l.id === 'westfalenstadion');
      if (stadium && inCar && activeCar && activeCar.type === 'cop') {
        const distToStadium = Math.hypot(px - (stadium.x + stadium.width / 2), py - (stadium.y + stadium.height / 2));
        if (distToStadium < 250) {
          onRequestMissionComplete(10000);
          spawnExplosion(px, py, "🏆 MISSION COMPLETED: WESTFALENSTADION SECURED!");
        }
      }
    } else if (activeId === 'm3') {
      // Run through Phoenix-See check
      const lake = LANDMARKS.find(l => l.id === 'phoenix_see');
      if (lake) {
        // Just driving near the shore gates
        const distToLake = Math.hypot(px - lake.x, py - lake.y);
        if (distToLake < 160) {
          onRequestMissionComplete(5000);
          spawnExplosion(px, py, "🏆 MISSION COMPLETED: PHOENIX SEE CHECKED!");
        }
      }
    } else if (activeId === 'm4') {
      // Survive active cops
      if (gameState.player.wantedLevel >= 3) {
        // countdown trigger
        onRequestMissionComplete(15000);
        spawnExplosion(px, py, "🏆 MISSION COMPLETED: EVADED FIVE-STAR ELITE PATROLS!");
      }
    }
  };

  // Canvas Mouse direction finder
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    mousePosRef.current = { x: mx, y: my };

    // Update player facing angle based on mouse
    if (gameState.player.currentVehicleId === null) {
      const pScreenX = dimensions.width / 2;
      const pScreenY = dimensions.height / 2;
      const angle = Math.atan2(my - pScreenY, mx - pScreenX);
      
      setGameState(p => ({
        ...p,
        player: { ...p.player, angle: angle }
      }));
    }
  };

  // Respawn after being wasted or busted
  const triggerRespawn = (type: 'hospital' | 'police') => {
    audio.playSfx('teleport');
    
    // deduct cash penalty
    const penalty = Math.min(gameState.player.cash, 1000);

    setGameState(p => ({
      ...p,
      player: {
        ...p.player,
        x: type === 'hospital' ? 2200 : 1550, // westfalenpark (spacious green park) or Hansaplatz police
        y: type === 'hospital' ? 1400 : 1100,
        health: p.player.maxHealth,
        armor: 100,
        cash: Math.max(0, p.player.cash - penalty),
        wantedLevel: 0,
        currentVehicleId: null,
        isDead: false,
        isBusted: false,
        hospitalRespawnTimer: 0,
        policeRespawnTimer: 0
      }
    }));
  };

  // Drawing sequence using Vanilla 2D context
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.fillStyle = '#0f172a'; // modern charcoal
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // CAMERA OFFSETS (centered around Player)
    const camX = gameState.player.x - dimensions.width / 2;
    const camY = gameState.player.y - dimensions.height / 2;

    // 1. Draw Ground Texture & Grass Fields inside Camera scope
    ctx.fillStyle = '#14532d'; // dark grass base
    ctx.fillRect(-camX, -camY, MAP_SIZE, MAP_SIZE);

    // Decorative grid pattern for Dortmund structural texture
    ctx.strokeStyle = 'rgba(21, 128, 61, 0.15)';
    ctx.lineWidth = 1;
    const gridSize = 160;
    const startGridX = Math.floor(camX / gridSize) * gridSize;
    const startGridY = Math.floor(camY / gridSize) * gridSize;

    for (let gx = startGridX; gx < startGridX + dimensions.width + gridSize; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx - camX, 0);
      ctx.lineTo(gx - camX, dimensions.height);
      ctx.stroke();
    }
    for (let gy = startGridY; gy < startGridY + dimensions.height + gridSize; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy - camY);
      ctx.lineTo(dimensions.width, gy - camY);
      ctx.stroke();
    }

    // Border Fence Limits
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 10;
    ctx.strokeRect(-camX, -camY, MAP_SIZE, MAP_SIZE);

    // 1.1 Draw Custom Google Drive Terrain Map Tiles
    if (appliedAssets && appliedAssets.length > 0) {
      appliedAssets.forEach(asset => {
        if (!asset.applied || asset.fileType !== 'tiles') return;
        
        let posX = 1200;
        let posY = 1200;
        let width = 450;
        let height = 450;
        
        if (asset.metadata) {
          try {
            const meta = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata;
            if (meta.posX !== undefined) posX = meta.posX;
            if (meta.posY !== undefined) posY = meta.posY;
            if (meta.width !== undefined) {
              width = meta.width;
              height = meta.height || meta.width;
            }
          } catch (e) {}
        }
        
        const tileImg = loadedImagesRef.current[asset.fileId];
        if (tileImg && tileImg.complete && tileImg.src) {
          ctx.save();
          // Draw the loaded map tile image centered at coordinates
          ctx.drawImage(tileImg, posX - width / 2 - camX, posY - height / 2 - camY, width, height);
          
          // Draw thin active digital twin border indicator
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(posX - width / 2 - camX, posY - height / 2 - camY, width, height);
          ctx.setLineDash([]);
          ctx.restore();
        }
      });
    }

    // 2. Draw Roads with markings
    ROADS.forEach(r => {
      ctx.strokeStyle = '#334155'; // asphalt slate
      ctx.lineWidth = r.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r.fromX - camX, r.fromY - camY);
      ctx.lineTo(r.toX - camX, r.toY - camY);
      ctx.stroke();

      // Draw center dashed markings
      ctx.strokeStyle = '#fbbf24'; // Dortmund yellow lane divisor
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.moveTo(r.fromX - camX, r.fromY - camY);
      ctx.lineTo(r.toX - camX, r.toY - camY);
      ctx.stroke();
      ctx.setLineDash([]); // clear filter
    });

    // 3. Draw Dortmund Landmarks
    LANDMARKS.forEach(l => {
      const lx = l.x - camX;
      const ly = l.y - camY;

      // Draw water body for Phoenix-See
      if (l.id === 'phoenix_see') {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.75)'; // lake blue
        ctx.fillRect(lx, ly, l.width, l.height);
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.strokeRect(lx, ly, l.width, l.height);

        // draw small yachts/boats in lake
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx + 100, ly + 80, 24, 12);
        ctx.fillRect(lx + 320, ly + 220, 28, 14);

        // Name
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Phoenix-See Yachts', lx + l.width / 2.8, ly + l.height / 2);
        return;
      }

      // Draw normal structural layouts
      ctx.fillStyle = l.color;
      ctx.fillRect(lx, ly, l.width, l.height);

      ctx.strokeStyle = l.glowColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(lx, ly, l.width, l.height);

      // Dortmunder Golden U Crown Animation
      if (l.id === 'u_tower') {
        const pulse = Math.sin(Date.now() * 0.003) * 10 + 35;
        // Rotating golden crown letter U symbol
        ctx.save();
        ctx.translate(lx + l.width / 2, ly + l.height / 2);
        ctx.rotate(Date.now() * 0.0007);
        ctx.fillStyle = '#fbbf24';
        
        // draw U mesh block style
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI);
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();
        
        // vertical side pillars of U
        ctx.fillRect(-28, -25, 12, 25);
        ctx.fillRect(16, -25, 12, 25);

        ctx.restore();
      }

      // Stadium Westfalen Pitch rendering
      if (l.id === 'westfalenstadion') {
        // grass field inside stadium
        ctx.fillStyle = '#15803d';
        ctx.fillRect(lx + 80, ly + 80, l.width - 160, l.height - 160);
        
        // pitch markings
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(lx + 80, ly + 80, l.width - 160, l.height - 160);
        ctx.beginPath();
        ctx.arc(lx + l.width / 2, ly + l.height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();

        // draw BVB iconic text
        ctx.font = '800 24px sans-serif';
        ctx.fillStyle = '#facc15';
        ctx.fillText('BVB 09', lx + l.width / 2.7, ly + l.height / 2.2);

        // draw yellow support pylons on corner sides
        ctx.fillStyle = '#eab308';
        ctx.fillRect(lx - 12, ly - 12, 24, 24);
        ctx.fillRect(lx + l.width - 12, ly - 12, 24, 24);
        ctx.fillRect(lx - 12, ly + l.height - 12, 24, 24);
        ctx.fillRect(lx + l.width - 12, ly + l.height - 12, 24, 24);
      }

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(l.name, lx + 12, ly + 30);
    });

    // 3.1 Draw Google Drive Applied Digital Twin Assets
    if (appliedAssets && appliedAssets.length > 0) {
      appliedAssets.forEach(asset => {
        if (!asset.applied) return;
        
        let posX = 1200;
        let posY = 1200;
        
        // Parse metadata to see if we have custom coordinates
        if (asset.metadata) {
          try {
            const meta = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata;
            if (meta.posX !== undefined) posX = meta.posX;
            if (meta.posY !== undefined) posY = meta.posY;
          } catch (e) {
            // fallback
          }
        }
        
        const ax = posX - camX;
        const ay = posY - camY;
        
        // Draw real-time digital twin hologram emitter
        ctx.save();
        ctx.translate(ax, ay);
        
        // Rotating laser scanner lines
        const pulse = Math.sin(Date.now() * 0.004) * 5 + 35;
        ctx.strokeStyle = '#06b6d4'; // Cyan twin color
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        
        // Draw hologram boundary circle
        ctx.beginPath();
        ctx.arc(0, 0, pulse + 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw crosshair axes
        ctx.beginPath();
        ctx.moveTo(-pulse - 20, 0);
        ctx.lineTo(pulse + 20, 0);
        ctx.moveTo(0, -pulse - 20);
        ctx.lineTo(0, pulse + 20);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw high-tech wireframe bounding box representing .glb model
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-25, -25, 50, 50);
        
        // Holographic diagnostic text tag
        ctx.fillStyle = '#22d3ee';
        ctx.font = '800 10px monospace';
        ctx.fillText(`Drive Twin ID: ${asset.fileId.substring(0,6)}...`, -60, -42);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`Model: ${asset.fileName}`, -50, -30);
        
        // Signal connection status
        ctx.font = '900 8px monospace';
        ctx.fillStyle = '#34d399';
        ctx.fillText('📡 DRIVE ACTIVE CONNECTION', -55, 45);
        
        ctx.restore();
      });
    }

    // 4. Draw Vehicles (non-player and player vehicle)
    vehiclesRef.current.forEach(v => {
      ctx.save();
      ctx.translate(v.x - camX, v.y - camY);
      ctx.rotate(v.angle);

      // Blown up burnt look if torn
      if (v.isTorn) {
        ctx.fillStyle = '#1e293b'; // burnt black
        ctx.fillRect(-v.length / 2, -v.width / 2, v.length, v.width);
        
        // draw flame sparks
        if (Math.random() < 0.2) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(Math.random() * 20 - 10, Math.random() * 10 - 5, 8, 8);
        }
        ctx.restore();
        return;
      }

      // Vehicle Chassis
      ctx.fillStyle = v.color;
      ctx.fillRect(-v.length / 2, -v.width / 2, v.length, v.width);

      // Cop light stripes
      if (v.type === 'cop') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-v.length / 6, -v.width / 2, v.length / 3, v.width);
        
        ctx.font = '900 10px monospace';
        ctx.fillStyle = '#1e3a8a';
        ctx.fillText('POLIZEI', -22, 3);

        // Sirens alternating light flashes
        if (gameState.player.wantedLevel > 0) {
          const altern = Math.floor(Date.now() / 150) % 2;
          ctx.fillStyle = altern === 0 ? '#ef4444' : '#3b82f6';
          ctx.fillRect(-6, -v.width / 2 - 4, 12, 4);
          ctx.fillStyle = altern === 1 ? '#ef4444' : '#3b82f6';
          ctx.fillRect(-6, v.width / 2, 12, 4);
        }
      }

      // Windows
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-v.length / 6, -v.width / 2.4, v.length / 2.5, v.width / 1.2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, -v.width / 2.6, 6, v.width / 1.3); // front shield

      // Headlight yellow projectors (if sunset or night)
      if (gameState.timeState.timeOfDay === 'sunset' || gameState.timeState.timeOfDay === 'night') {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.beginPath();
        ctx.moveTo(v.length / 2, -v.width / 3);
        ctx.lineTo(v.length / 2 + 100, -v.width - 30);
        ctx.lineTo(v.length / 2 + 100, v.width + 30);
        ctx.lineTo(v.length / 2, v.width / 3);
        ctx.fill();
      }

      ctx.restore();
    });

    // 5. Draw Pedestrians
    pedestriansRef.current.forEach(p => {
      const pxDraw = p.x - camX;
      const pyDraw = p.y - camY;

      ctx.save();
      ctx.translate(pxDraw, pyDraw);
      ctx.rotate(p.angle);

      // Cop color code
      const isIndigoCop = p.color === '#1e1b4b';

      // Matrix NPC Effect
      const timeMs = Date.now();
      const charIndex = Math.floor(timeMs / 150) % 20;

      if (p.state === 'dead') {
        // Red blood ring pool
        ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
        ctx.beginPath();
        ctx.arc(-5, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#16a34a'; // Matrix green decay
        ctx.font = '10px monospace';
        ctx.fillText('x_x', -8, 2);
        ctx.restore();
        return;
      }

      const pIdSafe = p.id + 'abc';
      
      // Matrix NPC Avatar (Glowing green digital entities)
      const matrixChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
      const char = matrixChars[(pIdSafe.charCodeAt(0) + charIndex) % matrixChars.length];

      ctx.save();
      ctx.rotate(-p.angle); // Keep chars upright relative to canvas, or let them rotate? Let's keep them upright for true matrix feel, but wait, then we counter-rotate the camera rotation.
      ctx.shadowColor = isIndigoCop ? '#3b82f6' : '#22c55e'; // blue for cops, green for civilians
      ctx.shadowBlur = 10;
      ctx.fillStyle = isIndigoCop ? '#60a5fa' : '#4ade80';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      
      // Floating sub-characters
      ctx.font = '8px monospace';
      ctx.fillStyle = isIndigoCop ? 'rgba(59, 130, 246, 0.6)' : 'rgba(34, 197, 94, 0.6)';
      ctx.fillText(matrixChars[(pIdSafe.charCodeAt(1) + charIndex) % matrixChars.length], 0, -12);
      ctx.fillText(matrixChars[(pIdSafe.charCodeAt(2) + charIndex) % matrixChars.length], 0, 12);
      ctx.restore();

      // Weapon
      if (isIndigoCop) {
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(8, -2, 6, 2); // digital gun
      }

      ctx.restore();
    });

    // 6. Draw Player (if on foot)
    if (gameState.player.currentVehicleId === null) {
      ctx.save();
      ctx.translate(gameState.player.x - camX, gameState.player.y - camY);
      ctx.rotate(gameState.player.angle);

      // Matrix "Neo" Effect for player
      const isMatrixMode = cheatResponse.includes('MATRIX') || true;

      // Arms drawing holding selected weapon
      const weapon = gameState.player.weapons[gameState.player.selectedWeaponIndex];
      ctx.fillStyle = isMatrixMode ? '#16a34a' : '#1e293b';

      if (weapon.type === 'pistol') {
        ctx.fillRect(8, -4, 12, 3); // gun barrel
      } else if (weapon.type === 'uzi') {
        ctx.fillRect(8, -4, 15, 4); // rapid bullet sprayer
      } else if (weapon.type === 'rocket') {
        ctx.fillStyle = isMatrixMode ? '#14532d' : '#0f172a';
        ctx.fillRect(5, -6, 26, 7); // rpg tube launcher
        ctx.fillStyle = isMatrixMode ? '#22c55e' : '#84cc16';
        ctx.fillRect(26, -9, 8, 12); // rocket warhead tip
      }

      if (isMatrixMode) {
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#10b981';
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.save();
        ctx.rotate(-gameState.player.angle);
        ctx.fillText('NEO', 0, 0);
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.fillText('<', -18, 0);
        ctx.fillText('>', 18, 0);
        ctx.restore();
      } else {
        // Dortmund BVB Yellow/Black outfit
        ctx.fillStyle = '#facc15'; // Yellow jacket BVB crown
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Black Hoody center band
        ctx.fillStyle = '#020617';
        ctx.fillRect(-6, -12, 4, 24);

        // Head skin
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 7. Draw Bullets/Rockets
    bulletsRef.current.forEach(b => {
      ctx.save();
      ctx.translate(b.x - camX, b.y - camY);
      ctx.rotate(b.angle);

      if (b.isRocket) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-15, -4, 20, 8);
        // glowing orange rocket trail
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-22, -3, 7, 6);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-6, -1.5, 12, 3);
      }

      ctx.restore();
    });

    // 8. Draw Particles (Splashes, blood, explosions, generic texts)
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'text' && p.text) {
        ctx.font = `bold ${p.size}px monospace`;
        ctx.fillStyle = p.color;
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(p.text, p.x - camX - 30, p.y - camY);
        ctx.fillText(p.text, p.x - camX - 30, p.y - camY);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
    ctx.globalAlpha = 1.0; // reset filter

    // 9. TIME OF DAY AMBIENT FILTER (Coloring overlay for morning/night sky)
    ctx.save();
    if (gameState.timeState.timeOfDay === 'morning') {
      ctx.fillStyle = 'rgba(251, 146, 60, 0.08)'; // cool orange filter
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    } else if (gameState.timeState.timeOfDay === 'sunset') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // warm red filter
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    } else if (gameState.timeState.timeOfDay === 'night') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'; // dense indigo night filter
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }
    ctx.restore();

    // 10. CRITICAL WASTED OR BUSTED GAME OVER SCREEN OVERLAY
    if (gameState.player.isDead) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      ctx.save();
      ctx.font = '900 italic 72px "Playfair Display", serif';
      ctx.fillStyle = '#dc2626';
      ctx.textAlign = 'center';

      // outer black shadow outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeText('WASTED', dimensions.width / 2, dimensions.height / 2);
      ctx.fillText('WASTED', dimensions.width / 2, dimensions.height / 2);

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Respawning at Dortmund Hospital... Penalty: -$1,000`, dimensions.width / 2, dimensions.height / 2 + 50);
      ctx.restore();

      // Countdown to auto respawn
      if (Math.random() < 0.015) {
        triggerRespawn('hospital');
      }
    }
  };

  return (
    <div id="game-frame-box" className="relative flex-1 bg-slate-950 flex flex-col min-h-[480px]" ref={containerRef}>
      {/* Top Hud Bar Overlay */}
      <div id="game-hud-bar" className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-4 justify-between items-center pointer-events-none">
        
        {/* Left Side: Health & Ammo stats */}
        <div className="flex gap-4">
          <div className="bg-slate-900/95 backdrop-blur border border-primary/20 p-3 rounded-xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">Health</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (gameState.player.health / gameState.player.maxHealth) * 100)}%` }}
                  />
                </div>
                <span className="text-red-400 font-mono text-xs font-bold">{Math.round(gameState.player.health)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/95 backdrop-blur border border-primary/20 p-3 rounded-xl flex items-center gap-3 shadow-2xl pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">Armor</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${gameState.player.armor}%` }}
                  />
                </div>
                <span className="text-blue-400 font-mono text-xs font-bold">{gameState.player.armor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Dortmund HUD Day Progression */}
        <div className="bg-slate-900/95 backdrop-blur border border-primary/20 py-2 px-4 rounded-xl flex items-center gap-4 shadow-2xl pointer-events-auto">
          <div className="flex flex-col items-center">
            <span className="text-yellow-400 font-mono font-black text-lg tracking-wider">
              {String(gameState.timeState.hours).padStart(2, '0')}:{String(Math.floor(gameState.timeState.minutes)).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-400 font-sans capitalize">{gameState.timeState.timeOfDay} • {gameState.weather}</span>
          </div>
        </div>

        {/* Right Side: Cash & Weapon selection */}
        <div className="flex gap-4 items-center">
          {/* Cash counter screen */}
          <div className="bg-slate-900/95 backdrop-blur border border-emerald-500/30 py-2 px-4 rounded-xl shadow-2xl pointer-events-auto">
            <span className="text-emerald-400 font-mono font-bold text-lg tracking-tight">
              ${gameState.player.cash.toLocaleString()}
            </span>
          </div>

          {/* Wanted Stars bar */}
          <div className="flex gap-1 bg-slate-900/95 backdrop-blur py-2 px-3 rounded-xl border border-red-500/20 pointer-events-auto">
            {[1, 2, 3, 4, 5].map(starNum => (
              <span
                key={starNum}
                className={`text-lg font-mono leading-none font-black ${
                  starNum <= gameState.player.wantedLevel ? 'text-red-500 animate-pulse' : 'text-slate-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actual Render Viewport Canvas */}
      <canvas
        id="gta_viewport_screen"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="w-full h-full flex-1 cursor-crosshair touch-none"
      />

      {/* Real-time 3D Model Twin overlays via Google's <model-viewer> */}
      {appliedAssets && appliedAssets.length > 0 && appliedAssets.map(asset => {
        if (!asset.applied || asset.fileType !== 'glb') return null;

        const camX = gameState.player.x - dimensions.width / 2;
        const camY = gameState.player.y - dimensions.height / 2;

        let posX = 1200;
        let posY = 1200;

        if (asset.metadata) {
          try {
            const meta = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata;
            if (meta.posX !== undefined) posX = meta.posX;
            if (meta.posY !== undefined) posY = meta.posY;
          } catch (e) {}
        }

        const screenX = posX - camX;
        const screenY = posY - camY;

        // Cull offscreen models to optimize GPU/WebGL contexts
        if (screenX < -200 || screenX > dimensions.width + 200 || screenY < -200 || screenY > dimensions.height + 200) {
          return null;
        }

        const modelUrl = glbUrls[asset.fileId];

        return (
          <div
            key={asset.id}
            className="absolute pointer-events-auto flex flex-col items-center select-none"
            style={{
              left: screenX,
              top: screenY,
              transform: 'translate(-50%, -50%)',
              width: '140px',
              height: '170px',
              zIndex: 30,
            }}
          >
            {modelUrl ? (
              React.createElement('model-viewer', {
                src: modelUrl,
                alt: asset.fileName,
                'auto-rotate': '',
                'camera-controls': '',
                'shadow-intensity': '1',
                style: { width: '130px', height: '130px', '--poster-color': 'transparent' }
              })
            ) : (
              <div className="w-[100px] h-[100px] rounded-full border border-dashed border-cyan-400 animate-spin flex items-center justify-center bg-cyan-950/20">
                <span className="text-[8px] font-mono text-cyan-400">LOADING 3D...</span>
              </div>
            )}
            
            <div className="bg-slate-950/90 border border-cyan-400/30 px-2.5 py-1 rounded-lg text-center backdrop-blur shadow-2xl flex flex-col max-w-[125px]">
              <span className="text-[9px] font-bold text-white truncate" title={asset.fileName}>
                {asset.fileName}
              </span>
              <span className="text-[7px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                📡 ACTIVE 3D TWIN
              </span>
            </div>
          </div>
        );
      })}


      {/* Floating hints prompt box */}
      {showCheatsHint && (
        <div
          id="game-floating-tips"
          className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md border-2 border-yellow-400 p-4 rounded-xl max-w-sm shadow-[0_0_20px_rgba(250,204,21,0.4)] z-10 transition-all text-xs"
        >
          <div className="flex justify-between items-center mb-2 border-b border-yellow-500/30 pb-2">
            <span className="text-yellow-400 font-mono font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">⚽ DORTMUND SANDBOX 3D</span>
            <button
              id="close-tips-btn"
              onClick={() => setShowCheatsHint(false)}
              className="text-yellow-600 hover:text-yellow-400 font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 mb-2 leading-relaxed">
            Move/Walk with <kbd className="bg-slate-800 border border-yellow-500/30 text-yellow-500 px-1.5 py-0.5 rounded font-mono">WASD</kbd> or <kbd className="bg-slate-800 border border-yellow-500/30 text-yellow-500 px-1.5 py-0.5 rounded font-mono">Arrows</kbd>. Click anywhere on the map to interact in the Dortmund/Matrix crossover universe.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono mt-1 pt-1">
            <div><kbd className="bg-slate-800 text-yellow-400/80 px-1 rounded">F / ENTER</kbd> Enter Car</div>
            <div><kbd className="bg-slate-800 text-yellow-400/80 px-1 rounded">Shift</kbd> Sprint</div>
            <div><kbd className="bg-slate-800 text-yellow-400/80 px-1 rounded">Spacebar</kbd> Handbrake</div>
            <div><kbd className="bg-slate-800 text-yellow-400/80 px-1 rounded">1..4</kbd> Weapon Stash / Apps</div>
          </div>
        </div>
      )}

      {/* Weather lightning thunder effect overlay */}
      {gameState.weather === 'stormy' && Math.random() < 0.015 && (
        <div className="absolute inset-0 bg-white/45 pointer-events-none transition-opacity duration-100 uppercase" />
      )}
    </div>
  );
}
