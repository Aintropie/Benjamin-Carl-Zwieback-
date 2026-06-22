export type TimeOfDay = 'morning' | 'noon' | 'sunset' | 'night';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy';

export interface Position {
  x: number;
  y: number;
}

export interface Landmark {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  description: string;
  iconName: string;
}

export type WeaponType = 'fists' | 'pistol' | 'uzi' | 'rocket';

export interface Weapon {
  type: WeaponType;
  name: string;
  ammo: number;
  maxAmmo: number;
  cooldown: number; // in ms
  lastFired: number;
  damage: number;
}

export type VehicleType = 'sports' | 'sedan' | 'suv' | 'cop' | 'tram' | 'tank';

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  x: number;
  y: number;
  angle: number; // in radians
  speed: number;
  maxSpeed: number;
  maxReverseSpeed: number;
  acceleration: number;
  braking: number;
  handling: number; // steering responsiveness
  friction: number;
  health: number;
  maxHealth: number;
  color: string;
  width: number;
  length: number;
  isDrivingAI: boolean;
  aiWaypointIndex?: number;
  isTorn?: boolean; // blown up
}

export interface Pedestrian {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  state: 'walking' | 'fleeing' | 'dead';
  color: string;
  health: number;
  aiWaypointIndex: number;
  fleeTimer: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
  type: 'smoke' | 'spark' | 'blood' | 'splash' | 'explosion' | 'rain' | 'text';
  text?: string;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  firedByPlayer: boolean;
  angle: number;
  rangeRemaining: number;
  isRocket?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: 'locked' | 'available' | 'active' | 'completed' | 'failed';
  objectiveType: 'steal_car' | 'deliver_car' | 'evade_police' | 'visit_landmarks' | 'defend_area';
  targetLandmarkId?: string;
  targetVehicleType?: VehicleType;
  timeLimit?: number; // in seconds
  timeLeft?: number;
  scoreRequired?: number;
  currentProgress?: number;
}

export interface GameState {
  player: {
    x: number;
    y: number;
    angle: number;
    speed: number;
    health: number;
    maxHealth: number;
    armor: number;
    cash: number;
    weapons: Weapon[];
    selectedWeaponIndex: number;
    wantedLevel: number; // 0 to 5
    wantedMultiplier: number; // triggers higher heat
    currentVehicleId: string | null; // null if on foot
    copChaseTimer: number;
    isDead: boolean;
    isBusted: boolean;
    hospitalRespawnTimer: number;
    policeRespawnTimer: number;
  };
  timeState: {
    minutes: number;
    hours: number;
    dayProgress: number; // 0 to 1
    timeOfDay: TimeOfDay;
  };
  weather: WeatherType;
  isMuted: boolean;
  score: number;
  activeMissionId: string | null;
  compassAngle: number;
}

