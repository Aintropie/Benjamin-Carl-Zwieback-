import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './firebase.ts';
import { GameState } from '../types.ts';
import { Cloud, Check, Loader2, Database, FolderOpen, RefreshCw, FileText, ToggleLeft, ToggleRight } from 'lucide-react';

interface CloudAsset {
  id: number;
  userId: number;
  fileId: string;
  fileName: string;
  fileType: string;
  downloadUrl: string | null;
  applied: boolean;
  metadata: string | null;
  createdAt: string;
}

interface GameSyncContextType {
  user: User | null;
  token: string | null;
  needsAuth: boolean;
  loading: boolean;
  isLoggingIn: boolean;
  progressSyncing: boolean;
  lastSynced: string | null;
  importedAssets: CloudAsset[];
  syncProgressToCloud: (state: GameState) => Promise<void>;
  loadProgressFromCloud: () => Promise<Partial<GameState> | null>;
  openDrivePicker: () => void;
  scanDriveForAssets: () => Promise<void>;
  toggleAssetApplied: (assetId: number, currentlyApplied: boolean) => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  handleGoogleLogout: () => Promise<void>;
}

const GameSyncContext = createContext<GameSyncContextType | undefined>(undefined);

export const useGameSync = () => {
  const context = useContext(GameSyncContext);
  if (!context) throw new Error('useGameSync must be used within a GameSyncProvider');
  return context;
};

// Global gapi declaration for Google Picker Client
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const GameSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [progressSyncing, setProgressSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [importedAssets, setImportedAssets] = useState<CloudAsset[]>([]);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        setLoading(false);
        // Fetch saved digital twin assets on sign-in
        fetchAssetsFromCloud(currentUser);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch registered assets from Cloud SQL
  const fetchAssetsFromCloud = async (currentUser: User) => {
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/player/assets', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const assets = await res.json();
        setImportedAssets(assets);
      }
    } catch (e) {
      console.error('Failed to load registered assets from PG SQL backend:', e);
    }
  };

  // Google Sign-in Trigger
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        fetchAssetsFromCloud(result.user);
      }
    } catch (err) {
      console.error('Login action failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Sign-out Trigger
  const handleGoogleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setImportedAssets([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Push player coordinates, money & status into PostgreSQL Cloud SQL instance
  const syncProgressToCloud = async (state: GameState) => {
    if (!user) return;
    setProgressSyncing(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/player/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          cash: state.player.cash,
          health: state.player.health,
          weapons: state.player.weapons.map(w => w.type).join(','),
          heat: state.player.wantedLevel,
          posX: state.player.x,
          posY: state.player.y,
          avatarUrl: user.photoURL
        })
      });

      if (res.ok) {
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        console.error('Backend returned save failure:', await res.text());
      }
    } catch (err) {
      console.error('Cloud Sync failed:', err);
    } finally {
      setProgressSyncing(false);
    }
  };

  // Load player progress from Cloud SQL
  const loadProgressFromCloud = async (): Promise<Partial<GameState> | null> => {
    if (!user) return null;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/player/progress', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const progress = await res.json();
        // Convert DB format to partial GameState
        return {
          player: {
            x: progress.posX || 1000,
            y: progress.posY || 1000,
            angle: 0,
            speed: 0,
            health: progress.health || 100,
            maxHealth: 100,
            armor: 50,
            cash: progress.cash || 1000,
            weapons: (progress.weapons || 'Pistol').split(',').map((wName: string) => {
              const cleaned = wName.toLowerCase();
              return {
                type: cleaned,
                name: cleaned.toUpperCase(),
                ammo: 250,
                maxAmmo: 999,
                cooldown: 200,
                lastFired: 0,
                damage: 15
              };
            }),
            selectedWeaponIndex: 0,
            wantedLevel: progress.heat || 0,
            wantedMultiplier: 1.0,
            currentVehicleId: null,
            copChaseTimer: 0,
            isDead: false,
            isBusted: false,
            hospitalRespawnTimer: 0,
            policeRespawnTimer: 0
          }
        } as unknown as Partial<GameState>;
      }
    } catch (e) {
      console.error('Failed to load career data:', e);
    }
    return null;
  };

  // Trigger Google Picker Widget inside authenticated iFrame environment
  const openDrivePicker = () => {
    if (!token) {
      alert('Please connect to Google Drive via GSI sign-in module first!');
      return;
    }

    const openPickerWhenLibrariesReady = () => {
      if (!window.gapi || !window.google) {
        console.warn('Google Libraries missing, retrying dynamically...');
        return;
      }

      window.gapi.load('picker', {
        callback: () => {
          try {
            // Mandated frame security origin calculation
            const pickerOrigin =
              window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
                ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
                : window.location.origin;

            const picker = new window.google.picker.PickerBuilder()
              .addView(window.google.picker.ViewId.DOCS) // Browse Google Drive
              .setOAuthToken(token)
              .setCallback(async (data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                  const file = data.docs[0];
                  console.log('[Picker Success] Selected file: ', file);
                  
                  // Save registered asset in Postgres DB using real API endpoints
                  const idToken = await user!.getIdToken();
                  const registerRes = await fetch('/api/player/assets', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                      fileId: file.id,
                      fileName: file.name,
                      fileType: file.name.endsWith('.glb') ? 'glb' : 'tiles',
                      downloadUrl: file.url || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                      metadata: {
                        mimeType: file.mimeType,
                        sizeBytes: file.sizeBytes,
                        description: file.description || 'Google Drive Digital Twin overlay asset'
                      }
                    })
                  });

                  if (registerRes.ok) {
                    fetchAssetsFromCloud(user!);
                  }
                }
              })
              .setOrigin(pickerOrigin)
              .build();
            picker.setVisible(true);
          } catch (err) {
            console.error('Error launching Google Picker widget:', err);
          }
        }
      });
    };

    // Safe lazy script loader fallback
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => openPickerWhenLibrariesReady();
      document.body.appendChild(script);
    } else {
      openPickerWhenLibrariesReady();
    }
  };

  const scanDriveForAssets = async () => {
    if (!token || !user) {
      alert('Please connect to Google Drive first!');
      return;
    }
    
    try {
      // Find files that are 3D models (.glb) or potential map tiles (images)
      const query = "name contains '.glb' or name contains '.png' or name contains '.jpg'";
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webContentLink,size,description)&pageSize=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to scan drive');
      }
      
      const files = data.files || [];
      if (files.length === 0) {
        alert('No GLB or image tiles found in your Google Drive!');
        return;
      }
      
      const idToken = await user.getIdToken();
      let importedCount = 0;
      
      // Auto-register them all
      for (const file of files) {
        // Skip if already imported
        if (importedAssets.some(a => a.fileId === file.id)) continue;
        
        const fileType = file.name.toLowerCase().endsWith('.glb') ? 'glb' : 'tiles';
        
        await fetch('/api/player/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            fileId: file.id,
            fileName: file.name,
            fileType: fileType,
            downloadUrl: file.webContentLink || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            metadata: {
              mimeType: file.mimeType,
              sizeBytes: file.size,
              description: file.description || 'Auto-scanned Google Drive Digital Twin asset'
            }
          })
        });
        importedCount++;
      }
      
      if (importedCount > 0) {
        fetchAssetsFromCloud(user);
        alert(`Successfully found and synced ${importedCount} new 3D models/tiles from Google Drive!`);
      } else {
        alert('All found files are already synced.');
      }
    } catch (err: any) {
      console.error('Scan failed:', err);
      alert(`Scan failed: ${err.message}`);
    }
  };

  // Toggle asset applied state in Database
  const toggleAssetApplied = async (assetId: number, currentlyApplied: boolean) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/player/assets/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          id: assetId,
          applied: !currentlyApplied
        })
      });

      if (res.ok) {
        fetchAssetsFromCloud(user);
      }
    } catch (e) {
      console.error('Failed to toggle asset application status:', e);
    }
  };

  return (
    <GameSyncContext.Provider
      value={{
        user,
        token,
        needsAuth,
        loading,
        isLoggingIn,
        progressSyncing,
        lastSynced,
        importedAssets,
        syncProgressToCloud,
        loadProgressFromCloud,
        openDrivePicker,
        scanDriveForAssets,
        toggleAssetApplied,
        handleGoogleLogin,
        handleGoogleLogout,
      }}
    >
      {children}
    </GameSyncContext.Provider>
  );
};
