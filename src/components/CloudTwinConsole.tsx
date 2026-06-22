import React, { useState } from 'react';
import { useGameSync } from '../lib/GameSync.tsx';
import { GameState } from '../types.ts';
import { 
  Cloud, 
  Database, 
  FolderOpen, 
  MapPin, 
  RefreshCw, 
  LogOut, 
  Check, 
  AlertCircle,
  HelpCircle,
  FileCode,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface CloudTwinConsoleProps {
  gameState: GameState;
  onRestoreState: (state: Partial<GameState>) => void;
}

export const CloudTwinConsole: React.FC<CloudTwinConsoleProps> = ({ gameState, onRestoreState }) => {
  const {
    user,
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
    handleGoogleLogout
  } = useGameSync();

  const [localSavingMsg, setLocalSavingMsg] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    setLocalSavingMsg('Syncing Career State...');
    await syncProgressToCloud(gameState);
    setLocalSavingMsg('Synced successfully!');
    setTimeout(() => setLocalSavingMsg(null), 3000);
  };

  const handleLoadBackup = async () => {
    setLocalSavingMsg('Reading Cloud PostgreSQL Database...');
    const result = await loadProgressFromCloud();
    if (result) {
      onRestoreState(result);
      setLocalSavingMsg('Career progress recovered!');
    } else {
      setLocalSavingMsg('No database backup detected.');
    }
    setTimeout(() => setLocalSavingMsg(null), 3000);
  };

  // Place picked GLB asset at current GPS player position
  const handlePlaceAssetAtPlayer = async (assetId: number, currentApplied: boolean) => {
    if (!user) return;
    setLocalSavingMsg('Mapping digital twins...');
    try {
      const idToken = await user.getIdToken();
      // Patch database entry with the current player coordinates in metadata
      const res = await fetch('/api/player/assets/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          id: assetId,
          metadata: {
            posX: Math.round(gameState.player.x),
            posY: Math.round(gameState.player.y),
            placedAt: new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        setLocalSavingMsg('Telemetry mapped successfully!');
      } else {
        setLocalSavingMsg('Failed mapping telemetry.');
      }
    } catch (e) {
      console.error(e);
      setLocalSavingMsg('Error writing coordinate mapping.');
    }
    setTimeout(() => setLocalSavingMsg(null), 3000);
  };

  // Adjust tile size
  const handleUpdateTileSize = async (assetId: number, currentMeta: any, newSize: number) => {
    if (!user) return;
    try {
      const meta = typeof currentMeta === 'string' ? JSON.parse(currentMeta) : currentMeta || {};
      const res = await fetch('/api/player/assets/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          id: assetId,
          metadata: {
            ...meta,
            width: newSize,
            height: newSize,
          }
        })
      });

      if (res.ok) {
        // Refresh triggers on page component auth check updates
        setLocalSavingMsg(`Tile size set to ${newSize}m`);
        setTimeout(() => setLocalSavingMsg(null), 1500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col items-center justify-center min-h-[180px]">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
        <span className="text-xs font-mono text-slate-400">Loading Cloud Services Hub...</span>
      </div>
    );
  }

  return (
    <div id="cloud-system-card" className="bg-slate-900 border border-cyan-500/20 p-5 rounded-3xl shadow-2xl flex flex-col gap-4">
      {/* Header with connection indicators */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-100 font-bold">
            Cloud Twin & Sync Controller
          </h3>
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
          needsAuth 
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
            : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
        }`}>
          {needsAuth ? '● DISCONNECTED' : '● ONLINE (POSTGRES)'}
        </span>
      </div>

      {needsAuth ? (
        /* Sign-In Module */
        <div className="flex flex-col gap-3.5 py-2">
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Connect your workspace profile via Google Single Sign-In to auto-restore progress checkpoints and overlay <strong>Google Drive 3D GLB/Landscapes</strong> onto the Dortmund coordinates tree.
          </p>

          <button
            id="gsi-login-btn"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3.5 bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-all font-sans font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-xl border border-white disabled:opacity-50"
          >
            {isLoggingIn ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            Sign in with Google OAuth
          </button>
        </div>
      ) : (
        /* Authenticated Dashboard Panel */
        <div className="flex flex-col gap-4">
          
          {/* Diagnostic messages display */}
          {localSavingMsg && (
            <div className="bg-cyan-950/40 border border-cyan-500/20 p-2.5 rounded-xl text-[10px] font-mono text-cyan-400 flex items-center gap-2 animate-pulse">
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>{localSavingMsg}</span>
            </div>
          )}

          {/* User Bio Profile widget */}
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.photoURL ? (
                <img referrerPolicy="no-referrer" src={user.photoURL} alt="User Avatar" className="w-8 h-8 rounded-full border border-slate-700 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 shrink-0 font-mono">
                  PP
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-slate-100 font-bold truncate">
                  {user.displayName || 'Ruhr Explorer'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              id="user-logout-btn"
              onClick={handleGoogleLogout}
              className="text-slate-500 hover:text-red-400 font-mono text-[10px] hover:bg-slate-900 border border-transparent hover:border-slate-800 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
              title="Disconnect OAuth Core"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress DB checkpoints section */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500">
              PostgreSQL DB Career Persistence
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="cloud-db-backup-btn"
                onClick={handleCreateBackup}
                disabled={progressSyncing}
                className="bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 font-bold text-slate-950 text-[11px] uppercase py-2 px-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/5 duration-100 flex items-center justify-center gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                Backup Save
              </button>
              <button
                id="cloud-db-recover-btn"
                onClick={handleLoadBackup}
                className="bg-slate-950 hover:bg-slate-900 text-cyan-400 font-bold text-[11px] uppercase py-2 px-2.5 rounded-xl transition-all border border-cyan-500/20 cursor-pointer flex items-center justify-center gap-1.5 hover:border-cyan-400"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                Restore Save
              </button>
            </div>
            {lastSynced && (
              <span className="text-[9px] font-mono text-slate-500 text-center mt-1">
                Last checked checkpoint: <strong className="text-cyan-400">{lastSynced}</strong>
              </span>
            )}
          </div>

          {/* Google Picker and Google Drive assets hub */}
          <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500">
                Google Drive Twin Assets
              </span>
              <div className="flex gap-2">
                <button
                  onClick={scanDriveForAssets}
                  className="text-cyan-400 hover:text-cyan-300 font-bold text-[10px] font-mono flex items-center gap-1 cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-cyan-500/10 px-2 py-1 rounded"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Scan Everything
                </button>
                <button
                  id="open-google-picker-btn"
                  onClick={openDrivePicker}
                  className="text-cyan-400 hover:text-cyan-300 font-bold text-[10px] font-mono flex items-center gap-1 cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-cyan-500/10 px-2 py-1 rounded"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Add from Drive
                </button>
              </div>
            </div>

            {importedAssets.length === 0 ? (
              <div className="py-4 text-center text-slate-600 text-[10px] font-mono leading-relaxed border border-dashed border-slate-800 rounded-xl">
                No Drive assets registered in database.<br />Click <strong>Add from Drive</strong> to fetch a Dortmund 3D .glb or tile asset!
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[175px] overflow-y-auto pr-1">
                {importedAssets.map((asset) => {
                  let mappedPos: {x?: number; y?: number; width?: number; height?: number} = {};
                  if (asset.metadata) {
                    try {
                      mappedPos = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata;
                    } catch (e) {}
                  }

                  return (
                    <div
                      key={asset.id}
                      className={`p-2 rounded-xl border flex flex-col gap-1.5 transition-all text-xs ${
                        asset.applied 
                          ? 'bg-cyan-950/15 border-cyan-500/30 text-slate-200'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${asset.applied ? 'text-cyan-400' : 'text-slate-600'}`} />
                          <span className="font-bold truncate" title={asset.fileName}>
                            {asset.fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleAssetApplied(asset.id, asset.applied)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-all shrink-0 cursor-pointer text-slate-900 font-bold ${
                            asset.applied 
                              ? 'bg-cyan-400 hover:bg-cyan-300' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {asset.applied ? 'LIVE ON MAP' : 'INACTIVE'}
                        </button>
                      </div>

                      {/* Info on coordinates placement */}
                      <div className="flex justify-between items-center mt-1 text-[9px] font-mono border-t border-slate-850/50 pt-1.5 gap-2">
                        <span className="text-slate-500 text-[8px] truncate">
                          ID: {asset.fileId.substring(0, 10)}...
                        </span>
                        
                        <div className="flex gap-1.5 shrink-0">
                          {mappedPos.x !== undefined && mappedPos.y !== undefined ? (
                            <span className="text-cyan-400 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              X:{mappedPos.x} Y:{mappedPos.y}
                            </span>
                          ) : (
                            <span className="text-amber-500/70">Unassigned Coordinates</span>
                          )}

                          <button
                            onClick={() => handlePlaceAssetAtPlayer(asset.id, asset.applied)}
                            className="bg-slate-900 hover:bg-slate-850 text-[8px] px-1 py-0.5 rounded border border-slate-800 text-slate-300 hover:text-white shrink-0 cursor-pointer"
                            title="Place customized asset model overlay coordinates at player's current GPS location"
                          >
                            Set Here
                          </button>
                        </div>
                      </div>

                      {/* Size controllers for terrain overlays / maptiles */}
                      {asset.fileType === 'tiles' && asset.applied && (
                        <div className="flex items-center justify-between border-t border-slate-850/30 pt-1.5 mt-1">
                          <span className="text-slate-500 text-[8px] font-mono">TILE SPAN:</span>
                          <div className="flex gap-1">
                            {[200, 450, 800, 1200].map((size) => {
                              const currentSize = mappedPos.width || 450;
                              const isActive = currentSize === size;
                              return (
                                <button
                                  key={size}
                                  onClick={() => handleUpdateTileSize(asset.id, asset.metadata, size)}
                                  className={`text-[8px] font-mono font-bold px-1 rounded cursor-pointer transition-all ${
                                    isActive
                                      ? 'bg-cyan-400 text-slate-950 font-extrabold'
                                      : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white'
                                  }`}
                                >
                                  {size}m
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default CloudTwinConsole;
