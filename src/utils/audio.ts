// Simple synthesizer helper utilizing Web Audio API for robust, procedural game sounds and procedural music.

class AudioSystem {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private radioInterval: number | null = null;
  private currentStationIndex: number = -1;
  private isMuted: boolean = true;
  private sfxVolume: number = 0.4;
  private musicVolume: number = 0.25;

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.setupEngine();
    } catch (e) {
      console.error("Web Audio API not supported in this frame environment", e);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    this.init();
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    if (this.engineGain) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.03, this.ctx?.currentTime || 0);
    }
    if (muted) {
      this.stopRadio();
    } else if (this.currentStationIndex !== -1) {
      this.startRadio(this.currentStationIndex);
    }
  }

  private setupEngine() {
    if (!this.ctx || this.isMuted) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);
      
      // Filter for engine warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);
      
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      
      this.engineGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      this.engineOsc.start();
    } catch(e) {
      console.error("Engine sound setup failed", e);
    }
  }

  updateEngine(speed: number, inCar: boolean) {
    this.init();
    if (!this.ctx || this.isMuted || !this.engineOsc || !this.engineGain) return;
    
    // Smoothly update engine pitch based on speed
    const normalizedSpeed = Math.abs(speed);
    const targetFreq = inCar ? 35 + normalizedSpeed * 12 : 0;
    const targetGain = inCar ? Math.min(0.03 + normalizedSpeed * 0.005, 0.05) : 0;
    
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.15);
  }

  playSfx(type: 'gunshot' | 'explosion' | 'crash' | 'siren' | 'coin' | 'busted' | 'teleport') {
    this.init();
    if (!this.ctx || this.isMuted) return;

    // Direct user action resume
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    
    switch (type) {
      case 'gunshot': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);
        
        gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      }
      case 'crash': {
        const osc = this.ctx.createOscillator();
        const noiseGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(30, t + 0.2);
        
        noiseGain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        
        osc.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }
      case 'explosion': {
        // Deep booming sound
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(15, t + 0.6);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(10, t + 0.6);
        
        gain.gain.setValueAtTime(this.sfxVolume * 1.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);
        break;
      }
      case 'siren': {
        // Modulating dual pitch siren
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(900, t + 0.15);
        osc.frequency.linearRampToValueAtTime(600, t + 0.3);
        
        gain.gain.setValueAtTime(this.sfxVolume * 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.31);
        break;
      }
      case 'coin': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, t); // B5
        osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, t); // D6
        osc2.frequency.setValueAtTime(1567.98, t + 0.08); // G6
        
        gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.start(t);
        osc1.stop(t + 0.3);
        osc2.start(t);
        osc2.stop(t + 0.3);
        break;
      }
      case 'busted': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.6);
        
        gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.7);
        break;
      }
      case 'teleport': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(2000, t + 0.5);
        
        gain.gain.setValueAtTime(this.sfxVolume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
        break;
      }
    }
  }

  // Generates procedurally looping electronic music based on the radio station selection
  startRadio(stationIndex: number) {
    this.stopRadio();
    this.currentStationIndex = stationIndex;
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    
    let noteIndex = 0;
    
    // Synth chords/base note definitions for different flavors
    const synthwaveScale = [110, 130.81, 146.83, 164.81, 196.00, 220, 261.63]; // A-minor-ish
    const technoScale = [55, 65.41, 73.42, 82.41, 98, 110]; // Low heavy bass
    const ambientScale = [220, 246.94, 293.66, 329.63, 392, 440]; // Lofi vibe
    const rockScale = [73.42, 82.41, 98.00, 110.00, 123.47]; // Heavy riffs
    
    const playStep = () => {
      if (!this.ctx || this.isMuted) return;
      
      const t = this.ctx.currentTime;
      let notes = synthwaveScale;
      let waveType: OscillatorType = 'triangle';
      let speedMs = 150;
      
      if (this.currentStationIndex === 0) { // Retro Synthwave
        notes = synthwaveScale;
        waveType = 'sawtooth';
        speedMs = 125;
      } else if (this.currentStationIndex === 1) { // Dortmund Tech-Minimal
        notes = technoScale;
        waveType = 'triangle';
        speedMs = 140;
      } else if (this.currentStationIndex === 2) { // Phoenix See Ambient
        notes = ambientScale;
        waveType = 'sine';
        speedMs = 400;
      } else if (this.currentStationIndex === 3) { // Westfalen Hooligan Rock
        notes = rockScale;
        waveType = 'sawtooth';
        speedMs = 180;
      }
      
      const note = notes[noteIndex % notes.length];
      
      // Pitch modifier based on steps to make a melody
      let mult = 1;
      if (noteIndex % 4 === 0) mult = 1;
      else if (noteIndex % 4 === 1) mult = 1.25;
      else if (noteIndex % 4 === 2) mult = 1.5;
      else if (noteIndex % 8 === 7) mult = 2;
      
      const freq = note * mult;
      
      // Create synthesizer notes
      try {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, t);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.currentStationIndex === 1 ? 250 : 800, t);
        
        gain.gain.setValueAtTime(this.musicVolume * 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + (speedMs/1000) * 0.9);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(t);
        osc.stop(t + (speedMs/1000));
        
        // Add electronic drum tick for beat
        if (noteIndex % 4 === 0 && this.currentStationIndex !== 2) { // Kick beat
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          
          kickOsc.frequency.setValueAtTime(140, t);
          kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
          
          kickGain.gain.setValueAtTime(this.musicVolume * 0.4, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          
          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);
          
          kickOsc.start(t);
          kickOsc.stop(t + 0.12);
        }
      } catch (e) {
        // Catch gracefully
      }
      
      noteIndex++;
      this.radioInterval = window.setTimeout(playStep, speedMs);
    };
    
    playStep();
  }

  stopRadio() {
    if (this.radioInterval) {
      clearTimeout(this.radioInterval);
      this.radioInterval = null;
    }
  }
}

export const audio = new AudioSystem();
