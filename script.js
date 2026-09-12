/**
 * TINY CITY — "MESS WITH IT."
 * A stylized miniature animated city web toy.
 * 
 * Recruitment Project for:
 * GitHub Community SRM (GCSRM) 2026 Technical Track – Web Development
 * 
 * Pure Vanilla JavaScript:
 * - Single source of truth state machine
 * - Autonomous vehicle & pedestrian simulation loops
 * - Strict SVG-coordinate boundary enforcement (cars & pedestrians never leave city)
 * - Zero-dependency Web Audio procedural synthesizer
 * - Discovery tracking with LocalStorage persistence
 */

'use strict';

/* ==========================================================================
   1. GLOBAL CITY STATE & CONFIGURATION
   ========================================================================== */
const cityState = {
  weather: 'sunny',     // 'sunny' | 'rain' | 'storm'
  time: 'day',          // 'day' | 'sunset' | 'night'
  traffic: 'normal',    // 'low' | 'normal' | 'chaos'
  wind: 'gust',         // 'breeze' | 'gust' | 'gale'
  chaosActive: false,
  activeChaosEvent: null,
  activeBalloons: 0,
  chaosScore: 14,
  soundEnabled: false,
  themeMode: 'light',   // 'light' | 'dark'
  discoveries: []
};

// Storage Keys
const STORAGE_DISCOVERIES_KEY = 'tiny_city_discoveries_v4';
const STORAGE_SOUND_KEY = 'tiny_city_sound_v4';
const STORAGE_VISITS_KEY = 'tiny_city_visits_v4';
const STORAGE_THEME_KEY = 'tiny_city_theme_mode';

// Exactly 10 Discoveries (Preserving original 01-06 + adding 07-10)
const DISCOVERY_DEFINITIONS = [
  {
    id: 'FIRST_RAIN',
    code: '01',
    name: 'Downpour Dispatch',
    desc: 'Summoned rainfall or a stormy tempest over the miniature avenues.',
    hint: 'Try changing the weather controls.'
  },
  {
    id: 'NIGHT_SHIFT',
    code: '02',
    name: 'Midnight Glow',
    desc: 'Switched the city to night mode and watched the windows illuminate.',
    hint: 'Let the sun go down or click the sky.'
  },
  {
    id: 'BALLOON_POP',
    code: '03',
    name: 'Aero Burst',
    desc: 'Tapped and successfully popped an airborne balloon.',
    hint: 'Release a balloon and tap it.'
  },
  {
    id: 'BALLOON_FRENZY',
    code: '04',
    name: 'Sky Swarm',
    desc: 'Spawned a cluster of 6 or more balloons into the miniature sky.',
    hint: 'Keep dropping balloons without popping them.'
  },
  {
    id: 'TRAFFIC_JAM',
    code: '05',
    name: 'Signal Conductor',
    desc: 'Manually tapped a traffic signal to halt or guide commuter lanes.',
    hint: 'Click directly on a traffic light post.'
  },
  {
    id: 'THE_HONK',
    code: '06',
    name: 'Commuter Beep',
    desc: 'Clicked on a moving vehicle to make it honk and surge forward.',
    hint: 'Click any car driving down the street.'
  },
  {
    id: 'SECRET_DOG',
    code: '07',
    name: 'The Good Dog',
    desc: 'Spotted and patted the neighborhood stray dog running along the sidewalk.',
    hint: 'Watch the sidewalk carefully for a running four-legged friend.'
  },
  {
    id: 'RAIN_DANCE',
    code: '08',
    name: 'Rain Dance',
    desc: 'Tapped a commuter carrying an umbrella during the downpour.',
    hint: 'Make it rain and tap a pedestrian holding an umbrella.'
  },
  {
    id: 'AFTER_MIDNIGHT',
    code: '09',
    name: 'After Midnight',
    desc: 'Stayed in night mode until the rooftop alley cat made an appearance under the stars.',
    hint: 'Let night linger over the city and inspect the rooftops.'
  },
  {
    id: 'CITY_SURVIVOR',
    code: '10',
    name: 'City Survivor',
    desc: 'Triggered Cause Chaos and successfully brought the city back to peace and order.',
    hint: 'Unleash chaos and successfully restore the city to normal.'
  },
  {
    id: 'DURGA_SWAMI',
    code: '11',
    name: 'Durga Swami Store',
    desc: 'Visited the beloved neighborhood provisions shop and said hello to the shopkeeper.',
    hint: 'Look for the charming store with the striped green awning on the left.'
  },
  {
    id: 'SRM_LANDMARK',
    code: '12',
    name: 'SRM Clock Tower',
    desc: 'Visited the iconic university clock tower standing proud on the traffic roundabout.',
    hint: 'Tap the classical domed ivory clock tower in the center of the road.'
  }
];

// Warm, Playful City Status Messages
const STATUS_BANTER = [
  "Everything seems normal.",
  "Traffic is getting suspicious.",
  "WHO ORDERED THIS MUCH RAIN?",
  "Everything is fine. Probably.",
  "That was unnecessary.",
  "Why did you press that?",
  "City management has been notified.",
  "Someone is late for their data structures lecture.",
  "Local bakery reports 47 croissants ordered.",
  "A squirrel was spotted inspecting the crosswalk.",
  "Weather sensors report 100% chance of messing with things.",
  "The municipal clock is ticking right on schedule.",
  "Remember: do not feed the stray dog pizza.",
  "Durga Swami General Store is open for fresh groceries.",
  "Fresh Alphonso mangoes just arrived at Durga Swami!",
  "Hot cutting chai brewing at the corner kiosk.",
  "Silence in the SRM Community Library: hackathon teams coding."
];

/* ==========================================================================
   2. PROCEDURAL LAYERED WEB AUDIO SYNTHESIZER
   Zero external dependencies — pure Web Audio API synthesis
   ========================================================================== */
class CitySoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientRainGain = null;
    this.ambientStormGain = null;
    this.ambientNightGain = null;
    this.trafficGain = null;
    this.sfxGain = null;

    this.rainSource = null;
    this.stormNoiseSource = null;
    this.lastCarHonkTime = 0;
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // Master Volume Node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(cityState.soundEnabled ? 0.7 : 0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Layer Gains
    this.ambientRainGain = this.ctx.createGain();
    this.ambientRainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambientRainGain.connect(this.masterGain);

    this.ambientStormGain = this.ctx.createGain();
    this.ambientStormGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambientStormGain.connect(this.masterGain);

    this.ambientNightGain = this.ctx.createGain();
    this.ambientNightGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambientNightGain.connect(this.masterGain);

    this.trafficGain = this.ctx.createGain();
    this.trafficGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    this.trafficGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    // Setup 2-second looped noise buffer for continuous rain & storm wind
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Rain Ambience Loop (Lowpass filtered gentle noise)
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = noiseBuffer;
      this.rainSource.loop = true;
      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      this.rainSource.connect(rainFilter);
      rainFilter.connect(this.ambientRainGain);
      this.rainSource.start();

      // Storm Wind Rumble Loop (Bandpass filtered resonant noise)
      this.stormNoiseSource = this.ctx.createBufferSource();
      this.stormNoiseSource.buffer = noiseBuffer;
      this.stormNoiseSource.loop = true;
      const stormFilter = this.ctx.createBiquadFilter();
      stormFilter.type = 'bandpass';
      stormFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
      stormFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);
      this.stormNoiseSource.connect(stormFilter);
      stormFilter.connect(this.ambientStormGain);
      this.stormNoiseSource.start();
    } catch (e) {
      console.warn('Audio buffer setup notice:', e);
    }

    // Procedural Ambient Traffic Scheduler
    setInterval(() => {
      if (!cityState.soundEnabled || !this.ctx) return;
      this.triggerAmbientTraffic();
    }, 1100);

    // Procedural Crickets Scheduler
    setInterval(() => {
      if (!cityState.soundEnabled || !this.ctx) return;
      if (cityState.time === 'night' || cityState.time === 'sunset') {
        this.triggerCricketChirp();
      }
    }, 2400);

    this.initialized = true;
    this.updateAmbience();
  }

  setMasterEnabled(enabled) {
    if (!this.ctx || !this.masterGain) return;
    const target = enabled ? 0.7 : 0;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  updateAmbience() {
    if (!this.ctx || !this.initialized) return;
    const now = this.ctx.currentTime;

    // 1. Rain & Storm Ambience
    if (cityState.weather === 'rain') {
      this.ambientRainGain.gain.setTargetAtTime(0.12, now, 0.4);
      this.ambientStormGain.gain.setTargetAtTime(0.0001, now, 0.4);
    } else if (cityState.weather === 'storm') {
      this.ambientRainGain.gain.setTargetAtTime(0.22, now, 0.4);
      this.ambientStormGain.gain.setTargetAtTime(0.26, now, 0.5);
    } else {
      this.ambientRainGain.gain.setTargetAtTime(0.0001, now, 0.5);
      this.ambientStormGain.gain.setTargetAtTime(0.0001, now, 0.5);
    }

    // 2. Night Ambience
    if (cityState.time === 'night') {
      this.ambientNightGain.gain.setTargetAtTime(0.16, now, 0.5);
    } else if (cityState.time === 'sunset') {
      this.ambientNightGain.gain.setTargetAtTime(0.05, now, 0.6);
    } else {
      this.ambientNightGain.gain.setTargetAtTime(0.0001, now, 0.5);
    }

    // 3. Traffic Hum Density
    if (cityState.traffic === 'low') {
      this.trafficGain.gain.setTargetAtTime(0.03, now, 0.4);
    } else if (cityState.traffic === 'normal') {
      this.trafficGain.gain.setTargetAtTime(0.07, now, 0.4);
    } else if (cityState.traffic === 'chaos') {
      this.trafficGain.gain.setTargetAtTime(0.18, now, 0.3);
    }
  }

  triggerCricketChirp() {
    if (!cityState.soundEnabled || !this.ctx || !this.ambientNightGain) return;
    if (Math.random() > 0.65) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 4400 + Math.random() * 400;
      [0, 0.05].forEach(offset => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(0.03, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.035);
        osc.connect(gain);
        gain.connect(this.ambientNightGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.04);
      });
    } catch (e) {}
  }

  triggerAmbientTraffic() {
    if (!cityState.soundEnabled || !this.ctx || !this.trafficGain) return;
    let chance = 0.25; // Normal: ~3-4s
    if (cityState.traffic === 'low') chance = 0.12; // Low: ~8s
    if (cityState.traffic === 'chaos') chance = 0.75; // Chaos: ~1-1.5s
    if (Math.random() > chance) return;

    try {
      const now = this.ctx.currentTime;
      const isHonk = cityState.traffic === 'chaos' ? (Math.random() > 0.4) : (Math.random() > 0.75);
      if (isHonk) {
        const freqs = [380, 440, 510, 580];
        const freq = freqs[Math.floor(Math.random() * freqs.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.trafficGain);
        osc.start(now);
        osc.stop(now + 0.13);
      } else {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const startFreq = 80 + Math.random() * 40;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(startFreq + 30, now + 0.3);
        osc.frequency.linearRampToValueAtTime(startFreq - 20, now + 0.6);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.trafficGain);
        osc.start(now);
        osc.stop(now + 0.65);
      }
    } catch (e) {}
  }

  // Car horn response per model with cooldown
  playCarHorn(templateType) {
    if (!cityState.soundEnabled || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastCarHonkTime < 220) return;
    this.lastCarHonkTime = now;

    try {
      const ct = this.ctx.currentTime;
      switch (templateType) {
        case 'taxi': {
          [480, 600].forEach(f => {
            [0, 0.08].forEach(off => {
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(f, ct + off);
              gain.gain.setValueAtTime(0.08, ct + off);
              gain.gain.exponentialRampToValueAtTime(0.001, ct + off + 0.06);
              osc.connect(gain);
              gain.connect(this.sfxGain);
              osc.start(ct + off);
              osc.stop(ct + off + 0.07);
            });
          });
          break;
        }
        case 'sports': {
          [620, 780].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, ct);
            osc.frequency.linearRampToValueAtTime(f * 0.92, ct + 0.14);
            gain.gain.setValueAtTime(0.09, ct);
            gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.14);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(ct);
            osc.stop(ct + 0.15);
          });
          break;
        }
        case 'van': {
          [340, 420].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, ct);
            gain.gain.setValueAtTime(0.08, ct);
            gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.18);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(ct);
            osc.stop(ct + 0.19);
          });
          break;
        }
        case 'bus': {
          [220, 277].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, ct);
            gain.gain.setValueAtTime(0.12, ct);
            gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.24);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(ct);
            osc.stop(ct + 0.25);
          });
          break;
        }
        case 'scooter': {
          [740, 880].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, ct);
            gain.gain.setValueAtTime(0.06, ct);
            gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.1);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(ct);
            osc.stop(ct + 0.11);
          });
          break;
        }
        case 'compact': {
          [520, 660].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, ct);
            gain.gain.setValueAtTime(0.07, ct);
            gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.13);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(ct);
            osc.stop(ct + 0.14);
          });
          break;
        }
        case 'sedan':
        default: {
          [440, 554].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, ct);
            gain.gain.setValueAtTime(0.08, ct);
            gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.16);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(ct);
            osc.stop(ct + 0.17);
          });
          break;
        }
      }
    } catch (e) {}
  }

  // Soft tactile UI click
  playClick() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // Crisp electronic signal click
  playSignalClick() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.setValueAtTime(1180, now + 0.02);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  // Crisp balloon pop
  playPop() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1350, now);
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
    } catch (e) {}
  }

  // Thunder rumble
  playThunder() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.9);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      osc.connect(gain);
      gain.connect(this.ambientStormGain);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {}
  }

  // Lightning crackle
  playLightning() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.035;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientStormGain);
      noise.start(now);
    } catch (e) {}
  }

  // Major triad chime for discoveries
  playDiscoveryChime() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [1046.5, 1318.5, 1567.98];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.09, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.45);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.45);
      });
    } catch (e) {}
  }

  // Chaos alert chord
  playChaosSiren() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [330, 440, 550, 660, 880];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } catch (e) {}
  }

  // Sweet rooftop cat meow
  playCatMeow() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.linearRampToValueAtTime(840, now + 0.12);
      osc.frequency.linearRampToValueAtTime(680, now + 0.28);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.29);
    } catch (e) {}
  }

  // Friendly dog bark
  playDogBark() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.14);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Resonant campus clock tower bell chime
  playTowerChime() {
    if (!cityState.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Synthesize realistic bell harmonics: Hum (293.6Hz), Prime (587.3Hz), Tierce (740Hz), Quint (880Hz), Octave (1174.7Hz)
      const harmonics = [
        { freq: 293.66, gain: 0.12, decay: 2.2, type: 'sine' },
        { freq: 587.33, gain: 0.22, decay: 1.8, type: 'sine' },
        { freq: 739.99, gain: 0.14, decay: 1.4, type: 'sine' },
        { freq: 880.00, gain: 0.10, decay: 1.2, type: 'sine' },
        { freq: 1174.66, gain: 0.08, decay: 0.9, type: 'triangle' }
      ];

      harmonics.forEach(h => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = h.type;
        osc.frequency.setValueAtTime(h.freq, now);
        // Slight natural frequency dip on strike
        osc.frequency.exponentialRampToValueAtTime(h.freq * 0.996, now + h.decay);

        gain.gain.setValueAtTime(h.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + h.decay + 0.05);
      });
    } catch (e) {}
  }
}

const soundEngine = new CitySoundEngine();

/* ==========================================================================
   3. MULTI-LANE VEHICLE SIMULATION & COLLISION-FREE TRAFFIC ENGINE
   ========================================================================== */

const LANE_CONFIG = {
  1: { id: 1, direction: 1, y: 506, name: 'Eastbound Outer' },
  2: { id: 2, direction: 1, y: 534, name: 'Eastbound Inner' },
  3: { id: 3, direction: -1, y: 576, name: 'Westbound Inner' },
  4: { id: 4, direction: -1, y: 606, name: 'Westbound Outer' }
};

const VEHICLE_TEMPLATES = [
  {
    type: 'compact',
    name: 'Compact Hatchback',
    width: 38,
    height: 20,
    hornSound: "Toot-toot! 🚗✨",
    render: (color = '#10B981') => `
      <rect x="2" y="7" width="34" height="11" fill="${color}" rx="3"/>
      <path d="M8,7 L14,2 L26,2 L32,7 Z" fill="${color}"/>
      <polygon points="10,7 15,3 20,3 20,7" fill="#1E293B"/>
      <polygon points="22,7 22,3 25,3 29,7" fill="#1E293B"/>
      <circle cx="10" cy="18" r="4" fill="#1F2937"/>
      <circle cx="10" cy="18" r="1.8" fill="#E5E7EB"/>
      <circle cx="28" cy="18" r="4" fill="#1F2937"/>
      <circle cx="28" cy="18" r="1.8" fill="#E5E7EB"/>
    `
  },
  {
    type: 'scooter',
    name: 'Scooter / Moped',
    width: 26,
    height: 23,
    hornSound: "Meep-meep! 🛵",
    render: (color = '#06B6D4') => `
      <!-- Rider & Helmet -->
      <circle cx="15" cy="5" r="3.2" fill="#E11D48"/>
      <rect x="12" y="8" width="6" height="7" fill="#1E293B" rx="1"/>
      <!-- Scooter Body -->
      <path d="M4,18 L8,11 L18,12 L24,18 Z" fill="${color}"/>
      <rect x="10" y="11" width="7" height="3" fill="#78350F" rx="0.8"/>
      <!-- Wheels -->
      <circle cx="6" cy="19" r="3.2" fill="#1F2937"/>
      <circle cx="6" cy="19" r="1.4" fill="#CBD5E1"/>
      <circle cx="21" cy="19" r="3.2" fill="#1F2937"/>
      <circle cx="21" cy="19" r="1.4" fill="#CBD5E1"/>
      <!-- Handlebars -->
      <line x1="18" y1="11" x2="18" y2="7" stroke="#475569" stroke-width="1.2"/>
      <line x1="16" y1="7" x2="20" y2="7" stroke="#1E293B" stroke-width="1.4"/>
    `
  },
  {
    type: 'taxi',
    name: 'City Taxi',
    width: 48,
    height: 22,
    hornSound: "Beep-beep! 🚕",
    render: () => `
      <rect x="2" y="7" width="44" height="13" fill="#FBBF24" rx="3"/>
      <rect x="12" y="2" width="22" height="8" fill="#F59E0B" rx="2"/>
      <rect x="15" y="3" width="7" height="6" fill="#1E293B" rx="1"/>
      <rect x="24" y="3" width="8" height="6" fill="#1E293B" rx="1"/>
      <rect x="18" y="0" width="10" height="3" fill="#111827" rx="1"/>
      <line x1="4" y1="12" x2="46" y2="12" stroke="#111827" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="10" cy="20" r="4.5" fill="#1F2937"/>
      <circle cx="10" cy="20" r="2" fill="#E5E7EB"/>
      <circle cx="38" cy="20" r="4.5" fill="#1F2937"/>
      <circle cx="38" cy="20" r="2" fill="#E5E7EB"/>
    `
  },
  {
    type: 'sports',
    name: 'Sports Coupe',
    width: 46,
    height: 20,
    hornSound: "Vroom! 🏎️",
    render: (color = '#EF4444') => `
      <path d="M2,18 L7,8 L20,5 L36,7 L44,14 L44,18 Z" fill="${color}"/>
      <polygon points="12,8 20,6 30,7 28,10 14,10" fill="#1E293B"/>
      <circle cx="11" cy="18" r="4.5" fill="#111827"/>
      <circle cx="11" cy="18" r="2" fill="#9CA3AF"/>
      <circle cx="35" cy="18" r="4.5" fill="#111827"/>
      <circle cx="35" cy="18" r="2" fill="#9CA3AF"/>
    `
  },
  {
    type: 'sedan',
    name: 'City Sedan',
    width: 50,
    height: 22,
    hornSound: "Honk-honk! 🚗",
    render: (color = '#0EA5E9') => `
      <rect x="2" y="8" width="46" height="12" fill="${color}" rx="3"/>
      <path d="M12,8 L18,2 L32,2 L38,8 Z" fill="${color}"/>
      <polygon points="14,8 19,3 24,3 24,8" fill="#1E293B"/>
      <polygon points="26,8 26,3 31,3 36,8" fill="#1E293B"/>
      <circle cx="12" cy="20" r="4.5" fill="#1F2937"/>
      <circle cx="12" cy="20" r="2" fill="#E5E7EB"/>
      <circle cx="38" cy="20" r="4.5" fill="#1F2937"/>
      <circle cx="38" cy="20" r="2" fill="#E5E7EB"/>
    `
  },
  {
    type: 'van',
    name: 'Delivery Van',
    width: 56,
    height: 26,
    hornSound: "Beep! 🚐",
    render: (color = '#64748B') => `
      <rect x="2" y="6" width="52" height="18" fill="${color}" rx="3"/>
      <polygon points="36,6 48,10 48,16 36,16" fill="#1E293B"/>
      <line x1="14" y1="12" x2="32" y2="12" stroke="#00BF56" stroke-width="2.2"/>
      <circle cx="14" cy="24" r="5" fill="#1F2937"/>
      <circle cx="14" cy="24" r="2.2" fill="#CBD5E1"/>
      <circle cx="42" cy="24" r="5" fill="#1F2937"/>
      <circle cx="42" cy="24" r="2.2" fill="#CBD5E1"/>
    `
  },
  {
    type: 'bus',
    name: 'City Bus',
    width: 78,
    height: 30,
    hornSound: "HOOONK! 🚌",
    render: () => `
      <rect x="2" y="4" width="74" height="24" fill="#3B82F6" rx="3"/>
      <rect x="8" y="7" width="10" height="8" fill="#1E293B" rx="1"/>
      <rect x="22" y="7" width="10" height="8" fill="#1E293B" rx="1"/>
      <rect x="36" y="7" width="10" height="8" fill="#1E293B" rx="1"/>
      <rect x="50" y="7" width="10" height="8" fill="#1E293B" rx="1"/>
      <rect x="64" y="7" width="8" height="12" fill="#1E293B" rx="1"/>
      <line x1="4" y1="18" x2="74" y2="18" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="16" cy="28" r="5" fill="#111827"/>
      <circle cx="16" cy="28" r="2" fill="#93C5FD"/>
      <circle cx="60" cy="28" r="5" fill="#111827"/>
      <circle cx="60" cy="28" r="2" fill="#93C5FD"/>
    `
  }
];

class VehicleManager {
  constructor(container) {
    this.container = container;
    this.bgLayer = document.getElementById('vehicles-bg-layer') || container;
    this.fgLayer = document.getElementById('vehicles-fg-layer') || container;
    this.vehicles = [];
    this.targetCount = 5;
    this.MIN_X = 20;
    this.MAX_X = 1180;
    this.nextVehicleId = 1;
  }

  init() {
    this.updateTargetCount();
    // Non-overlapping initial placement across distinct lanes
    const initialSlots = [
      { lane: 1, x: 180 },
      { lane: 2, x: 520 },
      { lane: 3, x: 880 },
      { lane: 4, x: 340 },
      { lane: 1, x: 740 },
      { lane: 3, x: 1080 }
    ];

    const toSpawn = Math.min(this.targetCount, initialSlots.length);
    for (let i = 0; i < toSpawn; i++) {
      const slot = initialSlots[i];
      this.spawnVehicle(slot.lane, slot.x);
    }
  }

  updateTargetCount() {
    if (cityState.chaosActive) {
      this.targetCount = 10;
    } else if (cityState.traffic === 'low') {
      this.targetCount = 4;
    } else if (cityState.traffic === 'normal') {
      this.targetCount = 7;
    } else {
      this.targetCount = 7;
    }
  }

  canSpawnInLane(laneId) {
    const laneConfig = LANE_CONFIG[laneId];
    if (!laneConfig) return false;

    // Eastbound: check entry threshold on left (x < MIN_X + 130)
    if (laneConfig.direction === 1) {
      return !this.vehicles.some(v => v.lane === laneId && v.x < this.MIN_X + 130);
    }
    // Westbound: check entry threshold on right (x > MAX_X - 130)
    if (laneConfig.direction === -1) {
      return !this.vehicles.some(v => v.lane === laneId && v.x > this.MAX_X - 130);
    }
    return false;
  }

  spawnVehicle(forcedLane = null, initialX = null) {
    let laneId = forcedLane;

    if (!laneId) {
      // Find lanes with a clear entry
      const clearLanes = [1, 2, 3, 4].filter(id => this.canSpawnInLane(id));
      if (clearLanes.length === 0) return null; // No room to safely spawn this frame
      laneId = clearLanes[Math.floor(Math.random() * clearLanes.length)];
    }

    const laneConfig = LANE_CONFIG[laneId];
    const template = VEHICLE_TEMPLATES[Math.floor(Math.random() * VEHICLE_TEMPLATES.length)];

    // Color variations
    const palette = ['#10B981', '#0EA5E9', '#EF4444', '#F59E0B', '#8B5CF6', '#64748B', '#0D9488', '#EC4899'];
    const chosenColor = palette[Math.floor(Math.random() * palette.length)];

    const direction = laneConfig.direction;
    const laneY = laneConfig.y;

    let startX;
    if (initialX !== null) {
      startX = initialX;
    } else {
      startX = direction === 1 
        ? (this.MIN_X - template.width - 5) 
        : (this.MAX_X + 5);
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'sim-vehicle');
    g.setAttribute('cursor', 'pointer');
    g.setAttribute('title', 'Click to honk!');

    // Inner suspension group handles bounce/dip animation without overriding outer world coordinate transform
    const suspensionG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    suspensionG.setAttribute('class', 'vehicle-suspension');

    // Headlight cone
    const headlight = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    headlight.setAttribute('class', 'vehicle-headlight headlight-beam');
    if (direction === 1) {
      headlight.setAttribute('points', `${template.width - 2},12 ${template.width + 55},-2 ${template.width + 55},28`);
      headlight.setAttribute('fill', 'url(#headlight-beam-right)');
    } else {
      headlight.setAttribute('points', `2,12 -55,-2 -55,28`);
      headlight.setAttribute('fill', 'url(#headlight-beam-left)');
    }
    headlight.style.opacity = getComputedStyle(document.body).getPropertyValue('--headlight-opacity') || '0';

    // Vehicle body
    const bodyG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bodyG.setAttribute('class', 'vehicle-body');
    if (direction === -1) {
      bodyG.setAttribute('transform', `translate(${template.width}, 0) scale(-1, 1)`);
    }
    bodyG.innerHTML = template.render(chosenColor);

    suspensionG.appendChild(headlight);
    suspensionG.appendChild(bodyG);
    g.appendChild(suspensionG);
    const targetLayer = direction === 1 ? (this.bgLayer || this.container) : (this.fgLayer || this.container);
    targetLayer.appendChild(g);

    const baseSpeed = (1.4 + Math.random() * 0.65);

    const vehicle = {
      id: this.nextVehicleId++,
      el: g,
      suspensionEl: suspensionG,
      bodyG: bodyG,
      headlightEl: headlight,
      template: template,
      lane: laneId,
      direction: direction,
      x: startX,
      y: laneY,
      width: template.width,
      baseSpeed: baseSpeed,
      speed: baseSpeed,
      targetSpeed: baseSpeed,
      boost: 1,
      isStopping: false
    };

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      this.honkVehicle(vehicle);
    });

    this.vehicles.push(vehicle);
    return vehicle;
  }

  honkVehicle(vehicle) {
    soundEngine.playCarHorn(vehicle.template.type);
    vehicle.boost = 1.9;
    setTimeout(() => { vehicle.boost = 1; }, 700);

    // Immediate tactile chassis dip and headlight flash on inner suspension group (preserves world position)
    const animTarget = vehicle.suspensionEl || vehicle.el;
    animTarget.classList.remove('car-clicked-bounce');
    void animTarget.offsetWidth;
    animTarget.classList.add('car-clicked-bounce');
    setTimeout(() => animTarget.classList.remove('car-clicked-bounce'), 360);

    const speech = vehicle.template.hornSound || "Beep! 📯";
    showContextMessage(vehicle.el, speech);
    unlockDiscovery('THE_HONK');
    updateStatusTicker("Someone got honked at!");
    renderChaosMetric();
  }

  update(delta) {
    this.updateTargetCount();

    const tl1State = trafficLights[0] ? trafficLights[0].state : 'green';
    const tl2State = trafficLights[1] ? trafficLights[1].state : 'green';

    const trafficMultiplier = cityState.traffic === 'chaos' ? 2.0 : (cityState.traffic === 'low' ? 0.78 : 1.15);
    const DESIRED_GAP = cityState.traffic === 'chaos' ? 40 : (cityState.traffic === 'low' ? 80 : 58);
    const STOP_GAP = 22;

    const toRemove = [];

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];

      // 1. Find the vehicle ahead in the SAME lane
      let lead = null;
      let leadGap = 9999;

      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const o = this.vehicles[j];
        if (o.lane !== v.lane) continue;

        if (v.direction === 1) {
          if (o.x > v.x) {
            const gap = o.x - (v.x + v.width);
            if (gap < leadGap) {
              leadGap = gap;
              lead = o;
            }
          }
        } else {
          if (o.x < v.x) {
            const gap = v.x - (o.x + o.width);
            if (gap < leadGap) {
              leadGap = gap;
              lead = o;
            }
          }
        }
      }

      // 2. Check Traffic Signal Stop Lines
      let signalGap = 9999;
      if (!cityState.chaosActive) {
        if (v.direction === 1) {
          // Approaching Light 1 stop line (x ~ 202, before crosswalk 1)
          if (tl1State !== 'green' && (v.x + v.width) <= 210 && (v.x + v.width) > 90) {
            signalGap = Math.max(0, 202 - (v.x + v.width));
          }
          // Approaching Light 2 stop line (x ~ 822, before crosswalk 2)
          if (tl2State !== 'green' && (v.x + v.width) <= 832 && (v.x + v.width) > 710) {
            signalGap = Math.max(0, 822 - (v.x + v.width));
          }
        } else {
          // Approaching Light 2 stop line (x ~ 935, before crosswalk 2)
          if (tl2State !== 'green' && v.x >= 925 && v.x < 1045) {
            signalGap = Math.max(0, v.x - 935);
          }
          // Approaching Light 1 stop line (x ~ 315, before crosswalk 1)
          if (tl1State !== 'green' && v.x >= 305 && v.x < 425) {
            signalGap = Math.max(0, v.x - 315);
          }
        }
      }

      // 3. Determine Effective Gap & Target Speed
      const effectiveGap = Math.min(leadGap, signalGap);
      const cruiseSpeed = v.baseSpeed * trafficMultiplier * v.boost;

      if (effectiveGap <= STOP_GAP) {
        v.targetSpeed = 0;
      } else if (effectiveGap < DESIRED_GAP) {
        const ratio = (effectiveGap - STOP_GAP) / (DESIRED_GAP - STOP_GAP);
        v.targetSpeed = cruiseSpeed * Math.max(0, Math.min(1, ratio));
      } else {
        v.targetSpeed = cruiseSpeed;
      }

      // 4. Smooth Acceleration & Deceleration
      if (v.speed > v.targetSpeed) {
        const brakeRate = effectiveGap < 35 ? 0.32 : 0.14;
        v.speed += (v.targetSpeed - v.speed) * brakeRate;
      } else {
        v.speed += (v.targetSpeed - v.speed) * 0.08;
      }

      // 5. Advance Position
      v.x += v.direction * v.speed;

      // 6. ABSOLUTE HARD SAFETY CLAMP: NEVER PHYSICALLY OVERLAP
      if (lead) {
        if (v.direction === 1) {
          const overlapDist = lead.x - (v.x + v.width);
          if (overlapDist < 12) {
            v.x = lead.x - v.width - 12;
            v.speed = Math.min(v.speed, lead.speed);
          }
        } else {
          const overlapDist = v.x - (lead.x + lead.width);
          if (overlapDist < 12) {
            v.x = lead.x + lead.width + 12;
            v.speed = Math.min(v.speed, lead.speed);
          }
        }
      }

      // 7. Edge Wrap-Around & Recycling Logic
      // Eastbound car exits right side -> recycle into clear Westbound lane
      if (v.direction === 1 && v.x >= this.MAX_X + 15) {
        let recycled = false;
        const wbLanes = [3, 4];
        for (const wbLane of wbLanes) {
          if (this.canSpawnInLane(wbLane)) {
            v.lane = wbLane;
            v.direction = -1;
            v.y = LANE_CONFIG[wbLane].y;
            v.x = this.MAX_X + 10;
            v.speed = v.baseSpeed;
            v.bodyG.setAttribute('transform', `translate(${v.width}, 0) scale(-1, 1)`);
            v.headlightEl.setAttribute('points', `2,12 -55,-2 -55,28`);
            v.headlightEl.setAttribute('fill', 'url(#headlight-beam-left)');
            if (this.fgLayer && v.el.parentNode !== this.fgLayer) {
              this.fgLayer.appendChild(v.el);
            }
            recycled = true;
            break;
          }
        }
        if (!recycled) {
          toRemove.push(v);
        }
      } 
      // Westbound car exits left side -> recycle into clear Eastbound lane
      else if (v.direction === -1 && v.x <= this.MIN_X - v.width - 15) {
        let recycled = false;
        const ebLanes = [1, 2];
        for (const ebLane of ebLanes) {
          if (this.canSpawnInLane(ebLane)) {
            v.lane = ebLane;
            v.direction = 1;
            v.y = LANE_CONFIG[ebLane].y;
            v.x = this.MIN_X - v.width - 10;
            v.speed = v.baseSpeed;
            v.bodyG.removeAttribute('transform');
            v.headlightEl.setAttribute('points', `${v.width - 2},12 ${v.width + 55},-2 ${v.width + 55},28`);
            v.headlightEl.setAttribute('fill', 'url(#headlight-beam-right)');
            if (this.bgLayer && v.el.parentNode !== this.bgLayer) {
              this.bgLayer.appendChild(v.el);
            }
            recycled = true;
            break;
          }
        }
        if (!recycled) {
          toRemove.push(v);
        }
      }

      // 8. Calculate Roundabout Smooth Curving Deflection (cx = 620, span = [460, 780])
      let deltaY = 0;
      let steerAngle = 0;
      const xMid = v.x + v.width / 2;
      if (xMid >= 460 && xMid <= 780) {
        const u = (xMid - 460) / 320; // 0 to 1
        const w = Math.sin(Math.PI * u) * Math.sin(Math.PI * u); // Hann bell window (0 at u=0, 1 at u=0.5, 0 at u=1)
        if (v.lane === 1) deltaY = -14 * w;
        else if (v.lane === 2) deltaY = -28 * w;
        else if (v.lane === 3) deltaY = 26 * w;
        else if (v.lane === 4) deltaY = 14 * w;

        // Subtle steering yaw tilt as vehicle turns into and out of the curve
        const steerSlope = Math.sin(2 * Math.PI * u);
        steerAngle = v.direction * steerSlope * (v.lane <= 2 ? -3.5 : 4.0);
      }

      v.currentY = v.y + deltaY;

      // 9. Update Render Transform & Headlights
      if (Math.abs(steerAngle) > 0.1) {
        v.el.setAttribute('transform', `translate(${v.x.toFixed(1)}, ${v.currentY.toFixed(1)}) rotate(${steerAngle.toFixed(1)}, ${v.width / 2}, 10)`);
      } else {
        v.el.setAttribute('transform', `translate(${v.x.toFixed(1)}, ${v.currentY.toFixed(1)})`);
      }
      const hlOpacity = getComputedStyle(document.body).getPropertyValue('--headlight-opacity') || '0';
      v.headlightEl.style.opacity = hlOpacity;
    }

    // Safely remove any un-recycled vehicles
    for (const v of toRemove) {
      const idx = this.vehicles.indexOf(v);
      if (idx !== -1) {
        this.vehicles.splice(idx, 1);
        if (v.el.parentNode) {
          v.el.parentNode.removeChild(v.el);
        }
      }
    }

    // Maintain target vehicle pool (only spawns when lane entry is clear)
    if (this.vehicles.length < this.targetCount) {
      this.spawnVehicle();
    } else if (this.vehicles.length > this.targetCount) {
      // Safely trim excess vehicles when offscreen
      const offscreenIdx = this.vehicles.findIndex(v => v.x < this.MIN_X || v.x > this.MAX_X);
      if (offscreenIdx !== -1) {
        const removed = this.vehicles.splice(offscreenIdx, 1)[0];
        if (removed && removed.el.parentNode) {
          removed.el.parentNode.removeChild(removed.el);
        }
      }
    }
  }
}

/* ==========================================================================
   4. PEDESTRIAN SIMULATION & SIDEWALK BOUNDARY ENFORCEMENT
   ========================================================================== */

const PEDESTRIAN_ARCHETYPES = [
  {
    type: 'student-backpack',
    render: (shirt) => `
      <!-- Backpack -->
      <rect x="-5.2" y="-5" width="2.4" height="6.5" fill="#1E293B" rx="1"/>
      <line x1="-3" y1="-3" x2="0" y2="-1" stroke="#1E293B" stroke-width="0.8"/>
    `,
    dialogues: [
      "I LOVE GITHUB COMMUNITY. 💻❤️",
      "DID YOU PUSH TO GITHUB? 🐙",
      "BRO, I HAVE AN ASSIGNMENT! 📚",
      "WHO HAS THE NOTES? 📝",
      "I LOVE SRM! 🎓"
    ],
    speedMult: 1.0
  },
  {
    type: 'student-books',
    render: (shirt) => `
      <!-- Stack of Textbooks -->
      <rect x="2" y="-2" width="3.4" height="4.8" fill="#F59E0B" rx="0.4"/>
      <rect x="2" y="-0.5" width="3.4" height="1.2" fill="#FFFFFF" opacity="0.6"/>
      <rect x="2" y="1.2" width="3.4" height="1.2" fill="#3B82F6" opacity="0.8"/>
    `,
    dialogues: [
      "WHERE IS MY CLASS? 🗺️",
      "I HAVE LAB IN 10 MINUTES! ⏳",
      "ATTENDANCE IS LOOKING BAD... 📉",
      "WHO HAS THE NOTES? 📝"
    ],
    speedMult: 0.95
  },
  {
    type: 'student-running',
    render: (shirt) => `
      <!-- Running Wind Streaks -->
      <line x1="-5" y1="-7" x2="-9" y2="-7" stroke="#EF4444" stroke-width="0.8" opacity="0.75"/>
      <line x1="-5" y1="-4" x2="-10" y2="-4" stroke="#EF4444" stroke-width="0.8" opacity="0.75"/>
    `,
    dialogues: [
      "ATTENDANCE IS 74.9%! RUNNING! 🏃💨",
      "CAN'T TALK, I'M LATE! ⚡",
      "GETTING LATE FOR CLASSES! 🏃‍♂️",
      "GATE CLOSES IN 2 MINUTES! ⏱️"
    ],
    speedMult: 1.55
  },
  {
    type: 'commuter-phone',
    render: (shirt) => `
      <!-- Smartphone Screen Glowing -->
      <rect x="2" y="-3" width="2.4" height="4" fill="#E2E8F0" rx="0.3"/>
      <rect x="2.4" y="-2.6" width="1.6" height="3.2" fill="#38BDF8"/>
    `,
    dialogues: [
      "Did attendance get updated on Academia? 📱",
      "Checking GitHub commit streak... 🔥",
      "SRM Wi-Fi just connected! 🎉",
      "Who pushed straight to main branch?! 😱"
    ],
    speedMult: 0.85
  },
  {
    type: 'office-worker',
    render: (shirt) => `
      <!-- Briefcase & Glasses -->
      <rect x="2" y="1" width="4.5" height="3.5" fill="#78350F" rx="0.5"/>
      <line x1="3.5" y1="1" x2="3.5" y2="0" stroke="#78350F" stroke-width="0.8"/>
    `,
    dialogues: [
      "Heading to the faculty lounge. ☕",
      "The hackathon judging was intense! 🏆",
      "Late for the department meeting! 👔",
      "Did everyone submit their lab reports? 📑"
    ],
    speedMult: 0.9
  },
  {
    type: 'shopper',
    render: (shirt) => `
      <!-- Shopping Bag from Bakery -->
      <path d="M2,0 h4 v5 h-4 z" fill="#F59E0B" rx="0.5"/>
      <path d="M3,0 Q4,-2 5,0" fill="none" stroke="#78350F" stroke-width="0.7"/>
    `,
    dialogues: [
      "Hot samosas from SRM Bake! 🥐✨",
      "I'M JUST GOING TO THE CANTEEN. 🥪",
      "SRM FOOD AGAIN? 🍛",
      "Chai break time! ☕"
    ],
    speedMult: 0.9
  },
  {
    type: 'dog-walker',
    render: (shirt) => `
      <!-- Dog on Leash -->
      <path d="M0,0 Q5,3 10,6" fill="none" stroke="#78350F" stroke-width="0.7"/>
      <g transform="translate(11, 4)">
        <ellipse cx="0" cy="0" rx="3.2" ry="2" fill="#B45309"/>
        <circle cx="2.8" cy="-1.4" r="1.5" fill="#92400E"/>
        <line x1="-1.5" y1="1.5" x2="-1.5" y2="4.2" stroke="#78350F" stroke-width="1.1"/>
        <line x1="1.5" y1="1.5" x2="1.5" y2="4.2" stroke="#78350F" stroke-width="1.1"/>
      </g>
    `,
    dialogues: [
      "Campus puppy says hi! 🐕🐾",
      "Taking a study break walk! 🐾✨",
      "EVERYONE NEEDS TO CHILL OUT! 😎",
      "Good doggo on duty! 🐕"
    ],
    speedMult: 0.92
  }
];

class PedestrianManager {
  constructor(container) {
    this.container = container;
    this.pedestrians = [];
    this.targetCount = 8;
    this.MIN_X = 20;
    this.MAX_X = 1180;
  }

  init() {
    const spacing = (this.MAX_X - this.MIN_X) / this.targetCount;
    for (let i = 0; i < this.targetCount; i++) {
      this.spawnPedestrian(this.MIN_X + 20 + i * spacing);
    }
  }

  spawnPedestrian(initialX = null) {
    const archetype = PEDESTRIAN_ARCHETYPES[Math.floor(Math.random() * PEDESTRIAN_ARCHETYPES.length)];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const baseSpeed = (0.6 + Math.random() * 0.35) * archetype.speedMult;
    const speed = (direction === 1 ? 1 : -1) * baseSpeed;
    const startX = initialX !== null
      ? Math.max(this.MIN_X, Math.min(this.MAX_X, initialX))
      : (this.MIN_X + Math.random() * (this.MAX_X - this.MIN_X));
    const y = 466 + (Math.random() * 4 - 2);

    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#E8785A', '#06B6D4'];
    const shirtColor = colors[Math.floor(Math.random() * colors.length)];
    const umbrellaColor = colors[Math.floor(Math.random() * colors.length)];

    // Responsive Hitbox: ~56x62px on Desktop, ~66x72px on Touch/Mobile
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const hbW = isTouch ? 66 : 56;
    const hbH = isTouch ? 72 : 62;
    const hbX = -(hbW / 2);
    const hbY = -(hbH / 2) - 3;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'sim-pedestrian');
    g.setAttribute('cursor', 'pointer');
    g.setAttribute('title', 'Click student to chat!');

    // Centered, generous invisible interaction hitbox moves 1:1 with the pedestrian
    g.innerHTML = `
      <rect class="ped-hitbox" x="${hbX}" y="${hbY}" width="${hbW}" height="${hbH}" fill="transparent" pointer-events="all"/>
      <g class="ped-inner">
        <!-- Attached Umbrella (opens in rain/storm) -->
        <g class="ped-umbrella" opacity="0" transform="scale(0.2) translateY(6px)">
          <!-- Umbrella Canopy -->
          <path class="umbrella-canopy" d="M -11,-15 Q 0,-25 11,-15 Q 5.5,-18 0,-18 Q -5.5,-18 -11,-15 Z" fill="${umbrellaColor}" stroke="#1F2937" stroke-width="0.8"/>
          <!-- Stick & Curved Handle -->
          <line x1="0" y1="-23" x2="0" y2="-4" stroke="#374151" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M 0,-4 Q 0,-2 2,-2 Q 3.5,-2 3.5,-3.5" fill="none" stroke="#374151" stroke-width="1.1" stroke-linecap="round"/>
        </g>
        <!-- Head -->
        <circle cx="0" cy="-8" r="3.2" fill="#FED7AA"/>
        <!-- Torso / Coat -->
        <rect x="-3" y="-5" width="6" height="8" fill="${shirtColor}" rx="1"/>
        <!-- Archetype Visual Accessory -->
        ${archetype.render(shirtColor)}
        <!-- Legs -->
        <line class="leg-l" x1="-1.8" y1="3" x2="-2" y2="9" stroke="#1F2937" stroke-width="1.8" stroke-linecap="round"/>
        <line class="leg-r" x1="1.8" y1="3" x2="2" y2="9" stroke="#1F2937" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    `;

    this.container.appendChild(g);

    const ped = {
      el: g,
      innerG: g.querySelector('.ped-inner'),
      umbrellaEl: g.querySelector('.ped-umbrella'),
      legL: g.querySelector('.leg-l'),
      legR: g.querySelector('.leg-r'),
      archetype: archetype,
      x: startX,
      y: y,
      speed: speed,
      direction: direction,
      animCycle: Math.random() * 10,
      umbrellaOpen: (cityState.weather === 'rain' || cityState.weather === 'storm') ? 1 : 0,
      isPaused: false,
      pauseTimeout: null
    };

    if (direction === -1) {
      ped.innerG.setAttribute('transform', 'scale(-1, 1)');
    }

    // Instant touch and click handling with 400ms debounce
    let lastInteract = 0;
    const onInteract = (e) => {
      e.stopPropagation();
      const now = Date.now();
      if (now - lastInteract < 400) return;
      lastInteract = now;
      this.reactPedestrian(ped);
    };

    g.addEventListener('pointerdown', onInteract);
    g.addEventListener('click', onInteract);

    this.pedestrians.push(ped);
    return ped;
  }

  reactPedestrian(ped) {
    soundEngine.playClick();

    // Archetype-tailored dialogue pool with general SRM student fallback
    const dialogues = ped.archetype && ped.archetype.dialogues 
      ? ped.archetype.dialogues 
      : ["I LOVE GITHUB COMMUNITY. 💻❤️", "I LOVE SRM! 🎓", "GETTING LATE FOR CLASSES! 🏃‍♂️"];

    let line = dialogues[Math.floor(Math.random() * dialogues.length)];

    // Rain-themed lines if raining
    if (cityState.weather === 'rain' || cityState.weather === 'storm') {
      const rainLines = [
        "Singin' in the rain! ☔🎶",
        "My notes are getting wet! 🌧️",
        "Classic monsoon semester vibes! ☔",
        "Good thing I brought an umbrella! 🌧️",
        "Can we have online classes today? 🌧️💻"
      ];
      if (Math.random() > 0.4) {
        line = rainLines[Math.floor(Math.random() * rainLines.length)];
      }
      unlockDiscovery('RAIN_DANCE');
    }

    // Immediate physical tactile squash-and-bounce reaction
    ped.innerG.classList.remove('ped-clicked-reaction');
    void ped.innerG.offsetWidth;
    ped.innerG.classList.add('ped-clicked-reaction');
    setTimeout(() => ped.innerG.classList.remove('ped-clicked-reaction'), 300);

    // Pause walking while speech bubble is active
    ped.isPaused = true;
    if (ped.pauseTimeout) clearTimeout(ped.pauseTimeout);

    const roll = Math.random();

    showContextMessage(ped.el, line, {
      duration: 2200,
      onClose: () => {
        ped.isPaused = false;
        if (roll >= 0.88) {
          const origSpeed = ped.speed;
          ped.speed = ped.speed * 2.4;
          setTimeout(() => {
            ped.speed = origSpeed;
          }, 1600);
        }
      }
    });
    updateStatusTicker(`Student said: "${line}"`);

    if (roll < 0.28) {
      // Joy hop
      ped.innerG.style.transition = 'transform 0.22s ease-out';
      ped.innerG.style.transform = (ped.direction === -1 ? 'scale(-1, 1) ' : '') + 'translateY(-7px)';
      setTimeout(() => {
        ped.innerG.style.transform = (ped.direction === -1 ? 'scale(-1, 1) ' : '') + 'translateY(0)';
        setTimeout(() => { ped.innerG.style.transition = ''; }, 250);
      }, 240);
    } else if (roll < 0.50) {
      // Turn around
      ped.direction = -ped.direction;
      ped.speed = -ped.speed;
      if (ped.direction === -1) {
        ped.innerG.setAttribute('transform', 'scale(-1, 1)');
      } else {
        ped.innerG.removeAttribute('transform');
      }
    } else if (roll < 0.72) {
      // Nearby student buddy reacts
      const buddy = this.pedestrians.find(other => other !== ped && Math.abs(other.x - ped.x) < 140 && Math.abs(other.x - ped.x) > 25);
      if (buddy) {
        setTimeout(() => {
          buddy.isPaused = true;
          showContextMessage(buddy.el, "Wait for me! 🏃", {
            duration: 1800,
            onClose: () => { buddy.isPaused = false; }
          });
          buddy.speed = Math.sign(ped.x - buddy.x) * Math.max(Math.abs(buddy.speed) * 1.5, 1.4);
          if (buddy.speed < 0) buddy.innerG.setAttribute('transform', 'scale(-1, 1)');
          else buddy.innerG.removeAttribute('transform');
        }, 350);
      }
    }

    // Safety fallback to guarantee pedestrian resumes walking even if popup is interrupted
    ped.pauseTimeout = setTimeout(() => {
      ped.isPaused = false;
    }, 2450);
  }

  update(delta) {
    const isRaining = cityState.weather === 'rain' || cityState.weather === 'storm';
    const isStorm = cityState.weather === 'storm';
    const isStormOrChaos = isStorm || cityState.chaosActive;

    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];

      // Smooth umbrella deployment & walking bob
      if (isRaining) {
        p.umbrellaOpen = Math.min(1, (p.umbrellaOpen || 0) + delta * 3.5);
      } else {
        p.umbrellaOpen = Math.max(0, (p.umbrellaOpen || 0) - delta * 3.5);
      }

      if (p.umbrellaEl) {
        const bobY = p.isPaused ? 0 : Math.sin(p.animCycle * 2) * 1.3;
        p.umbrellaEl.style.opacity = p.umbrellaOpen.toFixed(2);
        const scale = (0.2 + 0.8 * p.umbrellaOpen).toFixed(2);
        const tilt = isStorm ? (cityState.wind === 'gale' ? -16 : -11) : 0;
        p.umbrellaEl.setAttribute('transform', `translate(0, ${bobY.toFixed(1)}) rotate(${tilt}) scale(${scale})`);
      }

      // If paused, keep feet planted
      if (p.isPaused) {
        p.legL.setAttribute('x2', '-1.8');
        p.legR.setAttribute('x2', '1.8');
        p.el.setAttribute('transform', `translate(${p.x.toFixed(1)}, ${p.y})`);
        continue;
      }

      p.animCycle += 0.15;

      const runSpeedMultiplier = isStormOrChaos ? 2.2 : (isRaining ? 1.3 : 1);
      p.x += p.speed * runSpeedMultiplier;

      // Turn around at sidewalk limits
      if (p.x >= this.MAX_X && p.direction === 1) {
        p.x = this.MAX_X;
        p.direction = -1;
        p.speed = -Math.abs(p.speed);
        p.innerG.setAttribute('transform', 'scale(-1, 1)');
      } else if (p.x <= this.MIN_X && p.direction === -1) {
        p.x = this.MIN_X;
        p.direction = 1;
        p.speed = Math.abs(p.speed);
        p.innerG.removeAttribute('transform');
      }

      p.x = Math.max(this.MIN_X, Math.min(this.MAX_X, p.x));

      // Leg swing walk animation
      const legSwing = Math.sin(p.animCycle) * 3;
      p.legL.setAttribute('x2', `${-2 + legSwing}`);
      p.legR.setAttribute('x2', `${2 - legSwing}`);

      p.el.setAttribute('transform', `translate(${p.x.toFixed(1)}, ${p.y})`);
    }
  }
}

/* ==========================================================================
   5. TRAFFIC LIGHTS CONTROLLER
   ========================================================================== */
const trafficLights = [
  { id: 1, state: 'red', redEl: null, yelEl: null, grnEl: null },
  { id: 2, state: 'green', redEl: null, yelEl: null, grnEl: null }
];

function initTrafficLights() {
  trafficLights[0].redEl = document.getElementById('tl1-red');
  trafficLights[0].yelEl = document.getElementById('tl1-yellow');
  trafficLights[0].grnEl = document.getElementById('tl1-green');

  trafficLights[1].redEl = document.getElementById('tl2-red');
  trafficLights[1].yelEl = document.getElementById('tl2-yellow');
  trafficLights[1].grnEl = document.getElementById('tl2-green');

  document.getElementById('traffic-light-1').addEventListener('click', () => cycleTrafficLight(0));
  document.getElementById('traffic-light-2').addEventListener('click', () => cycleTrafficLight(1));

  setInterval(() => {
    if (!cityState.chaosActive) {
      cycleTrafficLight(0, true);
      cycleTrafficLight(1, true);
    }
  }, 12000);
}

function cycleTrafficLight(index, isAuto = false) {
  const tl = trafficLights[index];
  const states = ['red', 'green', 'yellow'];
  const nextIndex = (states.indexOf(tl.state) + 1) % states.length;
  tl.state = states[nextIndex];

  [tl.redEl, tl.yelEl, tl.grnEl].forEach(el => el.classList.remove('active'));
  if (tl.state === 'red') tl.redEl.classList.add('active');
  if (tl.state === 'yellow') tl.yelEl.classList.add('active');
  if (tl.state === 'green') tl.grnEl.classList.add('active');

  soundEngine.playSignalClick();

  // Tactile signal housing pulse
  tl.g.classList.remove('traffic-light-flicker');
  void tl.g.offsetWidth;
  tl.g.classList.add('traffic-light-flicker');
  setTimeout(() => tl.g.classList.remove('traffic-light-flicker'), 280);

  if (!isAuto) {
    unlockDiscovery('TRAFFIC_JAM');
    showContextMessage(tl.g, `Signal: ${tl.state.toUpperCase()}`);
    updateStatusTicker(`Traffic light manually set to ${tl.state}.`);
  }
}

/* ==========================================================================
   6. INTERACTIVE CITY OBJECTS & BUILDINGS
   ========================================================================== */
function initInteractiveCityElements() {
  // Street Lamps Toggle (Lamps 1 to 5 across full 1200px)
  ['lamp-1', 'lamp-2', 'lamp-3', 'lamp-4', 'lamp-5'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      soundEngine.playClick();
      // Lamp head micro-pulse
      el.classList.remove('lamp-clicked-pulse');
      void el.offsetWidth;
      el.classList.add('lamp-clicked-pulse');
      setTimeout(() => el.classList.remove('lamp-clicked-pulse'), 320);

      const beam = el.querySelector('.lamp-beam');
      const currentOpacity = parseFloat(getComputedStyle(beam).opacity) || 0;
      beam.style.opacity = currentOpacity > 0.1 ? '0' : '0.9';
      showContextMessage(el, currentOpacity > 0.1 ? "Off 💡" : "On 💡");
    });
  });

  // Durga Swami General Store (Neighborhood Store)
  const durgaStore = document.getElementById('bldg-durga-swami');
  if (durgaStore) {
    const durgaQuotes = [
      "Namaste! Fresh mangoes and daily provisions! 🥭",
      "Best filter coffee and daily essentials since 1984! ☕📦",
      "Discounts on Britannia biscuits and Maggi! 🍪",
      "Local neighborhood store, always happy to serve! 🛒✨",
      "Uncle says: Study hard and get good placements! 🎓✨"
    ];
    let durgaIdx = 0;
    durgaStore.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();

      // Tactile storefront pulse & warm display window flash
      durgaStore.classList.remove('durga-store-pulse');
      void durgaStore.offsetWidth;
      durgaStore.classList.add('durga-store-pulse');
      setTimeout(() => durgaStore.classList.remove('durga-store-pulse'), 380);

      const quote = durgaQuotes[durgaIdx];
      durgaIdx = (durgaIdx + 1) % durgaQuotes.length;
      showContextMessage(durgaStore, quote);
      updateStatusTicker(`Durga Swami Store: "${quote}"`);
      unlockDiscovery('DURGA_SWAMI');
    });
  }

  // SRM Community Pharmacy Green Cross
  const pharmaCross = document.getElementById('pharma-cross');
  if (pharmaCross) {
    pharmaCross.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      showContextMessage(pharmaCross, "First aid kits & cold remedies stocked! 💊✨");
      updateStatusTicker("SRM Community Pharmacy: Open for student essentials.");
    });
  }

  // Balcony Resident (Upper floor townhouse discovery)
  const balconyResident = document.getElementById('balcony-resident');
  if (balconyResident) {
    const balconyQuotes = [
      "Lovely breeze on the balcony today! ☕🌤️",
      "Looking out over the campus! 🏙️",
      "Chennai weather is awesome today! 🍃",
      "Wave back! 👋😊"
    ];
    let bIdx = 0;
    balconyResident.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const quote = balconyQuotes[bIdx];
      bIdx = (bIdx + 1) % balconyQuotes.length;
      showContextMessage(balconyResident, quote);
      updateStatusTicker(`Resident on Balcony: "${quote}"`);
    });
  }

  // Secret Rooftop Alley Cat (revealed after lingering in night mode)
  const nightCat = document.getElementById('night-cat');
  if (nightCat) {
    nightCat.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playCatMeow();
      showContextMessage(nightCat, "Meow! 🐾✨");
      unlockDiscovery('AFTER_MIDNIGHT');
      updateStatusTicker("You befriended the secret rooftop cat under the stars.");
    });
  }

  // Neighborhood Stray Dog
  const strayDog = document.getElementById('stray-dog');
  if (strayDog) {
    strayDog.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playDogBark();
      showContextMessage(strayDog, "Woof! 🐕✨");
      unlockDiscovery('SECRET_DOG');
      updateStatusTicker("You gave the neighborhood dog a friendly pat!");
    });
  }

  // Shop Sign Click (SRM Bake)
  const shopSignGroup = document.getElementById('shop-sign-group');
  const shopSignText = document.getElementById('shop-sign-text');
  const signs = ["GCSRM HUB 🚀", "SRM BAKE ☕", "PIZZA 24/7 🍕", "COFFEE BREAK ☕", "DEV CAFE 💻", "FRESH BAGELS 🥯"];
  let signIdx = 0;
  if (shopSignGroup && shopSignText) {
    shopSignGroup.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      signIdx = (signIdx + 1) % signs.length;
      shopSignText.textContent = signs[signIdx];
      showContextMessage(shopSignGroup, `Special: ${signs[signIdx]}!`);
    });
  }

  // Bakery Chalkboard Easel
  const bakeryEasel = document.getElementById('bakery-easel');
  if (bakeryEasel) {
    bakeryEasel.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      showContextMessage(bakeryEasel, "Special: Fresh Cinnamon Rolls ₹35 🥐✨");
      updateStatusTicker("SRM Bake Menu: Cinnamon rolls freshly baked.");
    });
  }

  // Outdoor Sidewalk Bistro Seating
  const cafeSeating = document.getElementById('cafe-bistro-seating');
  if (cafeSeating) {
    cafeSeating.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      showContextMessage(cafeSeating, "Enjoying the fresh air with an espresso ☕");
    });
  }

  // Campus Notice Board Click
  const campusBoard = document.getElementById('campus-notice-board');
  if (campusBoard) {
    const notices = [
      "SRM HACKATHON 2026: REGISTER NOW! 🚀",
      "GCSRM TECH TRACK RECRUITMENT ACTIVE! 🐙",
      "UB 5TH FLOOR LAB 304 RELOCATED 🏛️",
      "CANTEEN SPECIAL: SAMOSA & CHAI ₹20 ☕",
      "LIBRARY BOOKS DUE THIS FRIDAY! 📚",
      "LOST ID CARD FOUND AT TECH PARK 🪪"
    ];
    let noticeIdx = 0;
    campusBoard.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const text = notices[noticeIdx];
      noticeIdx = (noticeIdx + 1) % notices.length;
      showContextMessage(campusBoard, text);
      updateStatusTicker(`Campus Board: "${text}"`);
    });
  }

  // Campus Directional Signpost
  const campusSignpost = document.getElementById('campus-signpost');
  if (campusSignpost) {
    campusSignpost.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      showContextMessage(campusSignpost, "Tech Park ➔ 200m | Canteen ➔ 50m 📍");
      updateStatusTicker("Campus directional signpost: Tech Park ahead.");
    });
  }

  // Parked Vintage Bicycle
  const parkedBike = document.getElementById('foreground-bicycle');
  if (parkedBike) {
    parkedBike.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      showContextMessage(parkedBike, "Ready for the ride to Tech Park! 🚲💨");
      updateStatusTicker("Commuter bicycle parked safely by the curb.");
    });
  }

  // SRM University Roundabout Clock Tower Click
  const srmTower = document.getElementById('srm-roundabout-tower');
  if (srmTower) {
    const srmQuotes = [
      "SRM TIME: 3 minutes to reach Tech Park! 🏃💨",
      "CLASS IS STARTING! Run, don't get marked absent!",
      "THE CLOCK KNOWS. Have you submitted your lab report? 📋",
      "BETTER NOT BE LATE! ⏰",
      "CAMPUS CHIMES: Another hour, another attendance record! 🔔",
      "SRM ROUNDABOUT: Keep moving, don't block the circle! 🚗",
      "TIME TO GET TO CLASS! Java lab awaits! 💻"
    ];
    let srmIdx = 0;
    srmTower.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playTowerChime();
      srmTower.classList.remove('tower-chime-active');
      void srmTower.offsetWidth; // force reflow for animation restart
      srmTower.classList.add('tower-chime-active');
      setTimeout(() => srmTower.classList.remove('tower-chime-active'), 500);

      const quote = srmQuotes[srmIdx];
      srmIdx = (srmIdx + 1) % srmQuotes.length;
      showContextMessage(srmTower, quote);
      updateStatusTicker(`SRM Clock Tower: "${quote}"`);
      unlockDiscovery('SRM_LANDMARK');
    });
  }

  // Civic Municipal Clock Tower Building Click
  const civicClock = document.getElementById('bldg-clock');
  if (civicClock) {
    civicClock.addEventListener('click', (e) => {
      if (e.target.closest('#campus-notice-board') || e.target.closest('#roof-pigeon')) return;
      soundEngine.playTowerChime();

      // Clock highlight pulse
      civicClock.classList.remove('civic-clock-pulse');
      void civicClock.offsetWidth;
      civicClock.classList.add('civic-clock-pulse');
      setTimeout(() => civicClock.classList.remove('civic-clock-pulse'), 450);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      showContextMessage(civicClock, `Civic Clock: ${timeStr} 🏛️⏰`);
      updateStatusTicker(`Civic Clock Tower bells toll: Current time is ${timeStr}.`);
    });
  }

  // Resting Rooftop Pigeon on Clock Cornice
  const roofPigeon = document.getElementById('roof-pigeon');
  if (roofPigeon) {
    roofPigeon.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      showContextMessage(roofPigeon, "*coo!* 🐦✨");
      updateStatusTicker("You said hello to the city pigeon resting on the clock tower!");
    });
  }

  // Student Waiting for Bus at Shelter
  const busStudent = document.getElementById('bus-student');
  if (busStudent) {
    const busThoughts = [
      "Bus is 10 mins late again... 📱",
      "Checking GitHub notifications 🔔",
      "Hope I don't miss the 8:30 shuttle! 🚌",
      "Who pushed straight to main branch?! 😱",
      "Listening to lofi beats 🎧",
      "Need coffee before 9 AM class ☕"
    ];
    let busIdx = 0;
    busStudent.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const text = busThoughts[busIdx];
      busIdx = (busIdx + 1) % busThoughts.length;
      showContextMessage(busStudent, text);
      updateStatusTicker(`Student at Bus Stop: "${text}"`);
    });
  }

  // SRM Community Library & Cultural Center
  const libraryBldg = document.getElementById('bldg-library');
  if (libraryBldg) {
    const libQuotes = [
      "Shhh! Quiet study zone in progress 🤫📖",
      "Hackathon teams coding in seminar room 3B 💻🚀",
      "Returned 'Introduction to Algorithms' on time! 📘",
      "Digital archives and IEEE journals available 🏛️"
    ];
    let libIdx = 0;
    libraryBldg.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const quote = libQuotes[libIdx];
      libIdx = (libIdx + 1) % libQuotes.length;
      showContextMessage(libraryBldg, quote);
      updateStatusTicker(`Central Library: "${quote}"`);
    });
  }

  // Library Book Drop Box
  const libraryBookDrop = document.getElementById('library-book-drop');
  if (libraryBookDrop) {
    libraryBookDrop.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      showContextMessage(libraryBookDrop, "*clunk* Book returned! 📚✅");
      updateStatusTicker("Library book drop: Returned book successfully.");
    });
  }

  // Chai & Snacks Corner Kiosk
  const chaiKiosk = document.getElementById('bldg-chai');
  if (chaiKiosk) {
    const chaiQuotes = [
      "Garama-garam cutting chai! ₹10 only ☕✨",
      "Fresh hot samosas straight out of the kadai! 🥟",
      "Extra ginger and cardamom special tea! 🫖",
      "Coding break with chai and bun-maska! 🥖☕"
    ];
    let chaiIdx = 0;
    chaiKiosk.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const quote = chaiQuotes[chaiIdx];
      chaiIdx = (chaiIdx + 1) % chaiQuotes.length;
      showContextMessage(chaiKiosk, quote);
      updateStatusTicker(`Chai Corner: "${quote}"`);
    });
  }

  // Right Corner Campus Print & Cyber Annex
  const printAnnex = document.getElementById('bldg-corner-right');
  if (printAnnex) {
    const printQuotes = [
      "Need lab reports printed in color! ₹5 📄✨",
      "Spiral binding, project prints & stickers! 🖨️",
      "Final year thesis xerox rush hour! 📚",
      "Pen drives and blue print paper stocked! 💾"
    ];
    let printIdx = 0;
    printAnnex.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const quote = printQuotes[printIdx];
      printIdx = (printIdx + 1) % printQuotes.length;
      showContextMessage(printAnnex, quote);
      updateStatusTicker(`Print & Cyber Annex: "${quote}"`);
    });
  }

  // Building Windows Click (with subtle physical 1-2px wiggle reaction)
  document.querySelectorAll('.bldg-interactive').forEach(bldg => {
    bldg.addEventListener('click', (e) => {
      if (e.target.closest('#shop-sign-group') || e.target.closest('#durga-sign-group')) return;
      soundEngine.playClick();

      // Subtle 1-2px tactile wiggle
      bldg.classList.remove('bldg-click-wiggle');
      void bldg.offsetWidth;
      bldg.classList.add('bldg-click-wiggle');
      setTimeout(() => bldg.classList.remove('bldg-click-wiggle'), 250);

      const windows = bldg.querySelectorAll('.window');
      windows.forEach(w => {
        if (Math.random() > 0.4) {
          w.classList.toggle('win-toggled');
        }
      });
      updateStatusTicker("Building lights toggled.");
    });
  });

  // Trees Click (Snappy short leaf shake)
  document.querySelectorAll('.city-tree').forEach(tree => {
    tree.addEventListener('click', (e) => {
      e.stopPropagation();
      soundEngine.playClick();

      tree.classList.remove('tree-shake-active');
      void tree.offsetWidth;
      tree.classList.add('tree-shake-active');
      setTimeout(() => {
        tree.classList.remove('tree-shake-active');
      }, 420);

      showContextMessage(tree, "*rustle* 🍃");
    });
  });

  // Sun / Moon Click
  const celestialGroup = document.getElementById('celestial-group');
  if (celestialGroup) {
    celestialGroup.addEventListener('click', () => {
      const nextTime = cityState.time === 'day' ? 'night' : (cityState.time === 'night' ? 'sunset' : 'day');
      setTimeOfDay(nextTime);
    });
  }

  // Park Fountain Click
  const fountain = document.getElementById('park-fountain');
  if (fountain) {
    fountain.addEventListener('click', () => {
      soundEngine.playClick();
      showContextMessage(fountain, "*splash!* ⛲");
    });
  }
}

/* ==========================================================================
   7. BALLOONS SYSTEM
   ========================================================================== */
function dropBalloon() {
  soundEngine.playClick();
  const container = document.getElementById('balloons-container');
  const balloon = document.createElement('div');
  balloon.className = 'toy-balloon';

  // Spawn position strictly inside city width (1200 space)
  let posX = 80 + Math.random() * 1040;
  let posY = 640;

  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#00E55B'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  balloon.innerHTML = `
    <svg viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="18" rx="14" ry="17" fill="${color}"/>
      <ellipse cx="11" cy="12" rx="4" ry="7" fill="#FFFFFF" opacity="0.35"/>
      <polygon points="16,35 13,38 19,38" fill="${color}"/>
      <path d="M16,38 Q14,41 16,44 T16,48" stroke="#FFFFFF" stroke-width="1" opacity="0.6"/>
    </svg>
  `;

  balloon.style.left = `${(posX / 1200) * 100}%`;
  balloon.style.top = `${(posY / 680) * 100}%`;

  const floatSpeed = 1.3 + Math.random() * 0.9;
  const windFactor = cityState.wind === 'gale' ? 1.4 : (cityState.wind === 'gust' ? 0.7 : 0.2);

  cityState.activeBalloons++;
  renderChaosMetric();

  if (cityState.activeBalloons >= 6) {
    unlockDiscovery('BALLOON_FRENZY');
    updateStatusTicker("Airspace notice: Multiple balloons ascending!");
  }

  const animInterval = setInterval(() => {
    posY -= floatSpeed;
    posX += windFactor;

    // Strict boundary enforcement: never float outside the city frame
    posX = Math.max(30, Math.min(1170, posX));

    balloon.style.left = `${(posX / 1200) * 100}%`;
    balloon.style.top = `${(posY / 680) * 100}%`;

    // Remove if reached the ceiling
    if (posY < 10) {
      clearInterval(animInterval);
      if (balloon.parentNode) {
        container.removeChild(balloon);
        cityState.activeBalloons = Math.max(0, cityState.activeBalloons - 1);
        renderChaosMetric();
      }
    }
  }, 16);

  balloon.addEventListener('click', (e) => {
    e.stopPropagation();
    clearInterval(animInterval);
    popBalloon(balloon, posX, posY);
  });

  container.appendChild(balloon);
}

function popBalloon(balloonEl, x, y) {
  soundEngine.playPop();
  balloonEl.classList.add('popping');
  unlockDiscovery('BALLOON_POP');
  showContextMessage(balloonEl, "Pop! 💥");

  // Spawn radiating burst sparks
  const container = document.getElementById('balloons-container');
  if (container) {
    const bRect = balloonEl.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const centerX = bRect.left + bRect.width / 2 - cRect.left;
    const centerY = bRect.top + bRect.height / 2 - cRect.top;
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];
    const offsets = [
      { dx: -18, dy: -18 },
      { dx: 18, dy: -18 },
      { dx: -18, dy: 18 },
      { dx: 18, dy: 18 }
    ];
    offsets.forEach((off, idx) => {
      const spark = document.createElement('div');
      spark.className = 'balloon-spark';
      spark.style.left = `${centerX}px`;
      spark.style.top = `${centerY}px`;
      spark.style.backgroundColor = colors[idx % colors.length];
      spark.style.setProperty('--spark-dx', `${off.dx}px`);
      spark.style.setProperty('--spark-dy', `${off.dy}px`);
      container.appendChild(spark);
      setTimeout(() => {
        if (spark.parentNode) spark.parentNode.removeChild(spark);
      }, 340);
    });
  }

  cityState.activeBalloons = Math.max(0, cityState.activeBalloons - 1);
  renderChaosMetric();

  setTimeout(() => {
    if (balloonEl.parentNode) {
      balloonEl.parentNode.removeChild(balloonEl);
    }
  }, 280);
}

/* ==========================================================================
   8. HERO INTERACTION: CAUSE CHAOS
   ========================================================================== */
function triggerChaos() {
  if (cityState.chaosActive) return;
  cityState.chaosActive = true;
  soundEngine.playChaosSiren();

  // Subtle camera punch & micro-shake on the city scene
  const cameraViewport = document.getElementById('city-camera-viewport');
  if (cameraViewport && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cameraViewport.classList.remove('camera-chaos-punch');
    void cameraViewport.offsetWidth;
    cameraViewport.classList.add('camera-chaos-punch');
    setTimeout(() => {
      cameraViewport.classList.remove('camera-chaos-punch');
    }, 780);
  }

  const chaosButton = document.getElementById('btn-cause-chaos');
  chaosButton.classList.add('active');
  chaosButton.classList.add('is-firing');
  setTimeout(() => chaosButton.classList.remove('is-firing'), 600);

  const events = ['UFO_FLYBY', 'TURBO_TRAFFIC', 'BALLOON_SURGE', 'STORM_FLASH', 'PEDESTRIAN_PANIC'];
  const event = events[Math.floor(Math.random() * events.length)];
  cityState.activeChaosEvent = event;

  renderChaosMetric();

  switch (event) {
    case 'UFO_FLYBY': {
      updateStatusTicker("Chaos alert: Unidentified flying saucer scanning the rooftops!");
      const ufo = document.getElementById('secret-ufo');
      ufo.style.opacity = '1';
      ufo.style.transition = 'transform 6.5s ease-in-out';
      ufo.setAttribute('transform', 'translate(1120, 90)');
      showContextMessage(ufo, "Greetings Earthlings! 🛸");
      break;
    }

    case 'TURBO_TRAFFIC': {
      updateStatusTicker("Chaos alert: Every commuter consumed triple espresso!");
      vehicleManager.vehicles.forEach(v => {
        v.boost = 3;
      });
      break;
    }

    case 'BALLOON_SURGE': {
      updateStatusTicker("Chaos alert: Balloon container release!");
      for (let i = 0; i < 7; i++) {
        setTimeout(dropBalloon, i * 180);
      }
      break;
    }

    case 'STORM_FLASH': {
      updateStatusTicker("Chaos alert: Sudden atmospheric tempest!");
      const prevWeather = cityState.weather;
      setWeather('storm');
      triggerLightning();
      setTimeout(() => {
        setWeather(prevWeather);
      }, 7500);
      break;
    }

    case 'PEDESTRIAN_PANIC': {
      updateStatusTicker("Chaos alert: Announcement of a surprise pop quiz!");
      pedestrianManager.pedestrians.forEach(p => {
        showContextMessage(p.el, "Run!! 🏃💨");
      });
      break;
    }
  }

  // Restore order after 8 seconds & unlock CITY_SURVIVOR
  setTimeout(() => {
    cityState.chaosActive = false;
    cityState.activeChaosEvent = null;
    chaosButton.classList.remove('active');

    const ufo = document.getElementById('secret-ufo');
    ufo.style.transition = 'none';
    ufo.setAttribute('transform', 'translate(30, 90)');
    ufo.style.opacity = '0';

    vehicleManager.vehicles.forEach(v => { v.boost = 1; });

    // Humorous post-chaos aftermath / recovery messages
    const postChaosMessages = [
      "City management has been notified.",
      "City management has been notified.",
      "Everything is fine. Probably.",
      "That was unnecessary.",
      "Why did you press that?",
      "City management has restored order. You survived the chaos!",
      "Everything seems normal."
    ];
    const afterMsg = postChaosMessages[Math.floor(Math.random() * postChaosMessages.length)];
    updateStatusTicker(afterMsg);

    renderChaosMetric();
    soundEngine.updateAmbience();
    unlockDiscovery('CITY_SURVIVOR');
  }, 8000);
}

/* ==========================================================================
   9. SPONTANEOUS LIVING CITY EVENTS
   ========================================================================== */
function initRandomCityEvents() {
  // Stray dog trotting safely across the city
  setInterval(() => {
    if (Math.random() > 0.45) {
      runStrayDog();
    }
  }, 32000);

  // Status banter rotation
  setInterval(() => {
    if (!cityState.chaosActive && Math.random() > 0.4) {
      const msg = STATUS_BANTER[Math.floor(Math.random() * STATUS_BANTER.length)];
      updateStatusTicker(msg);
    }
  }, 18000);

  // Lightning strikes during storm
  setInterval(() => {
    if (cityState.weather === 'storm') {
      triggerLightning();
    }
  }, 4800);
}

function runStrayDog() {
  const dog = document.getElementById('stray-dog');
  if (!dog) return;
  // Moves safely strictly on the sidewalk [35, 1160]
  dog.style.opacity = '1';
  dog.style.transition = 'transform 8s linear';
  dog.setAttribute('transform', 'translate(1160, 466)');
  updateStatusTicker("Spotted: A friendly stray dog is trotting down the sidewalk!");

  setTimeout(() => {
    dog.style.transition = 'none';
    dog.style.opacity = '0';
    dog.setAttribute('transform', 'translate(35, 466)');
  }, 8200);
}

function triggerLightning() {
  const layer = document.getElementById('lightning-layer');
  if (!layer) return;
  layer.classList.add('flash-active');
  soundEngine.playLightning();
  setTimeout(() => {
    soundEngine.playThunder();
  }, 120);
  setTimeout(() => {
    layer.classList.remove('flash-active');
    setTimeout(() => {
      layer.classList.add('flash-active');
      setTimeout(() => layer.classList.remove('flash-active'), 50);
    }, 80);
  }, 90);
}

/* ==========================================================================
   10. WEATHER, TIME, TRAFFIC & WIND SWITCHERS
   ========================================================================== */
function setWeather(weather) {
  cityState.weather = weather;
  document.body.classList.remove('weather-sunny', 'weather-rain', 'weather-storm');
  document.body.classList.add(`weather-${weather}`);

  document.querySelectorAll('[data-action="weather"]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === weather);
  });

  if (weather === 'rain' || weather === 'storm') {
    unlockDiscovery('FIRST_RAIN');
  }

  soundEngine.playClick();
  soundEngine.updateAmbience();
  renderChaosMetric();
  updateStatusTicker(`Weather changed to ${weather}.`);
}

let nightStayTimer = null;

function setTimeOfDay(time) {
  cityState.time = time;
  document.body.classList.remove('theme-day', 'theme-sunset', 'theme-night');
  document.body.classList.add(`theme-${time}`);

  document.querySelectorAll('[data-action="time"]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === time);
  });

  const skyRect = document.getElementById('city-sky');
  if (time === 'day') skyRect.setAttribute('fill', 'url(#sky-day)');
  if (time === 'sunset') skyRect.setAttribute('fill', 'url(#sky-sunset)');
  if (time === 'night') {
    skyRect.setAttribute('fill', 'url(#sky-night)');
    unlockDiscovery('NIGHT_SHIFT');
  }

  // Rooftop cat appears after lingering in night mode
  const cat = document.getElementById('night-cat');
  if (nightStayTimer) {
    clearTimeout(nightStayTimer);
    nightStayTimer = null;
  }
  if (time === 'night') {
    nightStayTimer = setTimeout(() => {
      if (cityState.time === 'night' && cat) {
        cat.style.opacity = '1';
        updateStatusTicker("Look to the rooftops: A quiet alley cat has appeared under the stars.");
      }
    }, 14000); // 14 seconds of night mode
  } else {
    if (cat) cat.style.opacity = '0';
  }

  soundEngine.playClick();
  soundEngine.updateAmbience();
  renderChaosMetric();
  updateStatusTicker(`Time switched to ${time}.`);
}

function setTraffic(traffic) {
  cityState.traffic = traffic;
  document.querySelectorAll('[data-action="traffic"]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === traffic);
  });

  vehicleManager.updateTargetCount();
  soundEngine.playClick();
  soundEngine.updateAmbience();
  renderChaosMetric();
  updateStatusTicker(`Traffic adjusted to ${traffic}.`);
}

function setWind(wind) {
  cityState.wind = wind;
  document.body.classList.remove('wind-breeze', 'wind-gust', 'wind-gale');
  document.body.classList.add(`wind-${wind}`);

  document.querySelectorAll('[data-action="wind"]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === wind);
  });

  soundEngine.playClick();
  soundEngine.updateAmbience();
  renderChaosMetric();
  updateStatusTicker(`Wind adjusted to ${wind}.`);
}

/* ==========================================================================
   11. DYNAMIC CHAOS INDICATOR & SPEECH BUBBLES
   ========================================================================== */
function renderChaosMetric() {
  let score = 10;

  if (cityState.weather === 'rain') score += 12;
  if (cityState.weather === 'storm') score += 28;

  if (cityState.traffic === 'low') score -= 5;
  if (cityState.traffic === 'normal') score += 5;
  if (cityState.traffic === 'chaos') score += 32;

  if (cityState.wind === 'gust') score += 6;
  if (cityState.wind === 'gale') score += 14;

  score += Math.min(24, cityState.activeBalloons * 4);

  if (cityState.chaosActive) score += 40;

  score = Math.max(5, Math.min(99, score));
  cityState.chaosScore = score;

  const valEl = document.getElementById('chaos-val');
  const barEl = document.getElementById('chaos-bar');
  if (valEl) valEl.textContent = `${score}%`;
  if (barEl) barEl.style.width = `${score}%`;
}

function updateStatusTicker(msg) {
  const ticker = document.getElementById('status-ticker');
  if (!ticker) return;
  ticker.style.opacity = '0';
  setTimeout(() => {
    ticker.textContent = msg;
    ticker.style.opacity = '1';
  }, 140);
}

const activeContextPopups = new Map();

function showContextMessage(target, message, options = {}) {
  const bubblesLayer = document.getElementById('bubbles-layer');
  const stageFrame = document.getElementById('stage-frame');
  const cameraViewport = document.getElementById('city-camera-viewport') || stageFrame;
  if (!bubblesLayer || !cameraViewport || !message) return null;

  const duration = options.duration || 2200;

  // Cleanly dismiss previous popup for this target
  if (activeContextPopups.has(target)) {
    const prev = activeContextPopups.get(target);
    clearTimeout(prev.timer);
    if (prev.el && prev.el.parentNode) {
      prev.el.parentNode.removeChild(prev.el);
    }
    activeContextPopups.delete(target);
  }

  const stageRect = cameraViewport.getBoundingClientRect();
  if (stageRect.width === 0 || stageRect.height === 0) return null;

  let targetCenterX = stageRect.width / 2;
  let targetTop = stageRect.height / 2;
  let targetBottom = targetTop;

  // 1. Target is a DOM/SVG Element
  if (target instanceof Element) {
    const tRect = target.getBoundingClientRect();
    targetCenterX = tRect.left + tRect.width / 2 - stageRect.left;
    targetTop = tRect.top - stageRect.top;
    targetBottom = tRect.bottom - stageRect.top;
  }
  // 2. Target is an object with an .el property (e.g. Pedestrian, Vehicle)
  else if (target && typeof target === 'object' && target.el instanceof Element) {
    const tRect = target.el.getBoundingClientRect();
    targetCenterX = tRect.left + tRect.width / 2 - stageRect.left;
    targetTop = tRect.top - stageRect.top;
    targetBottom = tRect.bottom - stageRect.top;
  }
  // 3. Screen coordinates { x, y, isScreen: true }
  else if (target && target.isScreen) {
    targetCenterX = target.x - stageRect.left;
    targetTop = target.y - stageRect.top;
    targetBottom = targetTop;
  }
  // 4. World SVG 1200x680 coordinates { x, y }
  else if (target && typeof target.x === 'number' && typeof target.y === 'number') {
    const svgEl = document.getElementById('miniature-city-svg');
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      targetCenterX = (svgRect.left - stageRect.left) + (target.x / 1200) * svgRect.width;
      targetTop = (svgRect.top - stageRect.top) + (target.y / 680) * svgRect.height;
      targetBottom = targetTop;
    }
  }

  // Create popup
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  bubble.textContent = message;

  bubblesLayer.appendChild(bubble);
  const bubbleWidth = bubble.offsetWidth || 140;
  const bubbleHeight = bubble.offsetHeight || 36;

  // Placement: default above target, flip below if too close to top
  let bubbleTop = targetTop - bubbleHeight - 12;
  if (bubbleTop < 10) {
    bubbleTop = targetBottom + 12;
    bubble.classList.add('arrow-top');
  }

  // Horizontal clamping within stage frame
  const margin = 12;
  const minLeft = margin;
  const maxLeft = Math.max(margin, stageRect.width - bubbleWidth - margin);
  const desiredLeft = targetCenterX - bubbleWidth / 2;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, desiredLeft));

  // Dynamic arrow alignment pointing directly at target
  const arrowRelX = targetCenterX - clampedLeft;
  const clampedArrowX = Math.max(14, Math.min(bubbleWidth - 14, arrowRelX));

  bubble.style.left = `${clampedLeft.toFixed(1)}px`;
  bubble.style.top = `${bubbleTop.toFixed(1)}px`;
  bubble.style.setProperty('--arrow-x', `${clampedArrowX.toFixed(1)}px`);

  const timer = setTimeout(() => {
    bubble.classList.add('is-fading');
    setTimeout(() => {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
      if (activeContextPopups.get(target)?.el === bubble) {
        activeContextPopups.delete(target);
      }
      if (options.onClose) {
        options.onClose();
      }
    }, 240);
  }, duration);

  activeContextPopups.set(target, { el: bubble, timer, onClose: options.onClose });
  return bubble;
}

// Backwards-compatibility wrapper
function showSpeechBubble(target, y, text) {
  if (typeof target === 'number' && typeof y === 'number') {
    return showContextMessage({ x: target, y: y }, text);
  }
  return showContextMessage(target, y);
}

/* ==========================================================================
   EXPAND CITY (NETFLIX-STYLE FULLSCREEN & VIEWPORT EXPAND MODE)
   ========================================================================== */
function initExpandCityMode() {
  const expandBtn = document.getElementById('btn-expand-city');
  const stageFrame = document.getElementById('stage-frame');
  if (!expandBtn || !stageFrame) return;

  function toggleExpand() {
    const isExpanded = stageFrame.classList.contains('is-expanded');
    if (!isExpanded) {
      enterExpand();
    } else {
      exitExpand();
    }
  }

  function enterExpand() {
    stageFrame.classList.add('is-expanded');
    expandBtn.setAttribute('title', 'Exit expanded view');
    expandBtn.setAttribute('aria-label', 'Exit expanded view');
    updateStatusTicker("Expanded city view: Press ESC or click [X] to exit.");

    // Try Fullscreen API if available
    try {
      if (stageFrame.requestFullscreen) {
        stageFrame.requestFullscreen().catch(() => {});
      } else if (stageFrame.webkitRequestFullscreen) {
        stageFrame.webkitRequestFullscreen();
      }
    } catch (e) {}
  }

  function exitExpand() {
    stageFrame.classList.remove('is-expanded');
    expandBtn.setAttribute('title', 'Expand city');
    expandBtn.setAttribute('aria-label', 'Expand city');
    updateStatusTicker("Returned to normal city view.");

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (e) {}
  }

  expandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleExpand();
  });

  // ESC key listener to exit expanded mode
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stageFrame.classList.contains('is-expanded')) {
      exitExpand();
    }
  });

  // Fullscreen change events
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && stageFrame.classList.contains('is-expanded')) {
      exitExpand();
    }
  });
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && stageFrame.classList.contains('is-expanded')) {
      exitExpand();
    }
  });

  // Reposition active popups on resize
  window.addEventListener('resize', () => {
    activeContextPopups.forEach((data, target) => {
      if (data.el && data.el.parentNode) {
        const stageRect = (document.getElementById('city-camera-viewport') || stageFrame).getBoundingClientRect();
        if (target instanceof Element || (target && target.el instanceof Element)) {
          const el = target instanceof Element ? target : target.el;
          const tRect = el.getBoundingClientRect();
          const targetCenterX = tRect.left + tRect.width / 2 - stageRect.left;
          const bubbleWidth = data.el.offsetWidth || 140;
          const bubbleHeight = data.el.offsetHeight || 36;
          let bubbleTop = tRect.top - stageRect.top - bubbleHeight - 12;
          if (bubbleTop < 10) {
            bubbleTop = tRect.bottom - stageRect.top + 12;
            data.el.classList.add('arrow-top');
          } else {
            data.el.classList.remove('arrow-top');
          }
          const margin = 12;
          const minLeft = margin;
          const maxLeft = Math.max(margin, stageRect.width - bubbleWidth - margin);
          const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetCenterX - bubbleWidth / 2));
          const arrowRelX = targetCenterX - clampedLeft;
          const clampedArrowX = Math.max(14, Math.min(bubbleWidth - 14, arrowRelX));
          data.el.style.left = `${clampedLeft.toFixed(1)}px`;
          data.el.style.top = `${bubbleTop.toFixed(1)}px`;
          data.el.style.setProperty('--arrow-x', `${clampedArrowX.toFixed(1)}px`);
        }
      }
    });
  });
}

/* ==========================================================================
   12. DISCOVERY TRACKER & LOCALSTORAGE
   ========================================================================== */
function loadSavedData() {
  try {
    const savedDiscoveries = localStorage.getItem(STORAGE_DISCOVERIES_KEY);
    if (savedDiscoveries) {
      cityState.discoveries = JSON.parse(savedDiscoveries);
    }
    const savedSound = localStorage.getItem(STORAGE_SOUND_KEY);
    if (savedSound !== null) {
      cityState.soundEnabled = savedSound === 'true';
    }

    // Load Theme Mode (defaulting to system preference if not stored)
    let defaultTheme = 'light';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      defaultTheme = 'dark';
    }
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
    cityState.themeMode = (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : defaultTheme;

    const visits = parseInt(localStorage.getItem(STORAGE_VISITS_KEY) || '0', 10) + 1;
    localStorage.setItem(STORAGE_VISITS_KEY, visits.toString());

    if (visits > 1) {
      setTimeout(() => {
        updateStatusTicker("Welcome back to Tiny City.");
      }, 1000);
    }
  } catch (e) {
    console.warn('LocalStorage unavailable');
  }

  updateDiscoveryUI();
  updateSoundUI();
  applyThemeUI();
}

function unlockDiscovery(discoveryId) {
  if (cityState.discoveries.includes(discoveryId)) return;
  const item = DISCOVERY_DEFINITIONS.find(d => d.id === discoveryId);
  if (!item) return;

  cityState.discoveries.push(discoveryId);
  try {
    localStorage.setItem(STORAGE_DISCOVERIES_KEY, JSON.stringify(cityState.discoveries));
  } catch (e) {}

  updateDiscoveryUI();
  showDiscoveryToast(item);
}

function showDiscoveryToast(item) {
  const toast = document.getElementById('discovery-toast');
  const title = document.getElementById('toast-title');
  const desc = document.getElementById('toast-desc');
  if (!toast || !title || !desc) return;

  title.textContent = item.name;
  desc.textContent = item.desc;
  toast.hidden = false;

  soundEngine.playDiscoveryChime();

  setTimeout(() => {
    toast.hidden = true;
  }, 4500);
}

function updateDiscoveryUI() {
  const countEl = document.getElementById('discovery-count');
  if (countEl) {
    countEl.textContent = `${cityState.discoveries.length} / ${DISCOVERY_DEFINITIONS.length}`;
  }

  const list = document.getElementById('discoveries-list');
  if (!list) return;
  list.innerHTML = '';

  DISCOVERY_DEFINITIONS.forEach(def => {
    const isUnlocked = cityState.discoveries.includes(def.id);
    const card = document.createElement('div');
    card.className = `discovery-card ${isUnlocked ? 'unlocked' : 'locked'}`;

    card.innerHTML = `
      <div class="card-top">
        <span class="card-code">${def.code}</span>
        <span class="card-status">${isUnlocked ? 'Discovered' : 'Locked'}</span>
      </div>
      <div class="card-name">${isUnlocked ? def.name : '???'}</div>
      <div class="card-desc">${isUnlocked ? def.desc : def.hint}</div>
    `;

    list.appendChild(card);
  });
}

function updateSoundUI() {
  const soundLabel = document.getElementById('sound-label');
  const soundBtn = document.getElementById('sound-btn');
  if (soundLabel) soundLabel.textContent = cityState.soundEnabled ? 'On' : 'Off';
  if (soundBtn) {
    soundBtn.classList.toggle('is-active', cityState.soundEnabled);
    soundBtn.setAttribute('aria-pressed', cityState.soundEnabled.toString());
  }
}

function toggleSound() {
  cityState.soundEnabled = !cityState.soundEnabled;
  soundEngine.init();
  soundEngine.setMasterEnabled(cityState.soundEnabled);
  soundEngine.updateAmbience();
  try {
    localStorage.setItem(STORAGE_SOUND_KEY, cityState.soundEnabled.toString());
  } catch (e) {}
  updateSoundUI();
  soundEngine.playClick();
  updateStatusTicker(`Sound ${cityState.soundEnabled ? 'enabled' : 'muted'}.`);
}

function applyThemeUI() {
  const isDark = cityState.themeMode === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  const themeLabel = document.getElementById('theme-label');
  const themeBtn = document.getElementById('theme-btn');
  if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
  if (themeBtn) {
    themeBtn.classList.toggle('is-active', isDark);
    themeBtn.setAttribute('aria-pressed', isDark.toString());
  }
}

function toggleTheme() {
  cityState.themeMode = cityState.themeMode === 'dark' ? 'light' : 'dark';
  applyThemeUI();
  try {
    localStorage.setItem(STORAGE_THEME_KEY, cityState.themeMode);
  } catch (e) {}
  soundEngine.playClick();
  updateStatusTicker(`Switched UI theme to ${cityState.themeMode === 'dark' ? 'Dark' : 'Light'} Mode.`);
}

function resetDiscoveries() {
  cityState.discoveries = [];
  try {
    localStorage.removeItem(STORAGE_DISCOVERIES_KEY);
  } catch (e) {}
  updateDiscoveryUI();
  soundEngine.playClick();
  updateStatusTicker("Discoveries reset.");
}

/* ==========================================================================
   13. EVENT LISTENERS & KEYBOARD SHORTCUTS
   ========================================================================== */
let vehicleManager = null;
let pedestrianManager = null;

function setupEventListeners() {
  document.querySelectorAll('.btn-tactile[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const val = btn.getAttribute('data-value');
      if (action === 'weather') setWeather(val);
      if (action === 'time') setTimeOfDay(val);
      if (action === 'traffic') setTraffic(val);
      if (action === 'wind') setWind(val);
    });
  });

  document.getElementById('btn-drop-balloon').addEventListener('click', dropBalloon);
  document.getElementById('btn-cause-chaos').addEventListener('click', triggerChaos);
  document.getElementById('sound-btn').addEventListener('click', toggleSound);

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const modal = document.getElementById('discoveries-modal');
  const openModalBtn = document.getElementById('open-discoveries-btn');
  const closeModalBtn = document.getElementById('close-discoveries-btn');

  openModalBtn.addEventListener('click', () => {
    soundEngine.playClick();
    modal.hidden = false;
    openModalBtn.setAttribute('aria-expanded', 'true');
  });

  closeModalBtn.addEventListener('click', () => {
    soundEngine.playClick();
    modal.hidden = true;
    openModalBtn.setAttribute('aria-expanded', 'false');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.hidden = true;
      openModalBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('btn-reset-storage').addEventListener('click', resetDiscoveries);

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toUpperCase();

    if (key === '1') setWeather('sunny');
    if (key === '2') setWeather('rain');
    if (key === '3') setWeather('storm');

    if (key === 'D') setTimeOfDay('day');
    if (key === 'S') setTimeOfDay('sunset');
    if (key === 'N') setTimeOfDay('night');

    if (key === 'B') dropBalloon();
    if (key === 'C') triggerChaos();
    if (key === 'M') toggleSound();
    if (key === 'T') toggleTheme();

    if (key === 'O' || key === '?') {
      modal.hidden = !modal.hidden;
      openModalBtn.setAttribute('aria-expanded', (!modal.hidden).toString());
    }

    if (e.key === 'Escape' && !modal.hidden) {
      modal.hidden = true;
      openModalBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Resume Web Audio on first user gesture if sound was enabled in localStorage
  const resumeAudioOnGesture = () => {
    if (cityState.soundEnabled) {
      soundEngine.init();
      soundEngine.setMasterEnabled(true);
      soundEngine.updateAmbience();
    }
  };
  window.addEventListener('pointerdown', resumeAudioOnGesture, { once: true });
  window.addEventListener('keydown', resumeAudioOnGesture, { once: true });
}

/* ==========================================================================
   13B. LIVE REAL-TIME CLOCK HAND SYNCHRONIZATION
   ========================================================================== */
function updateCityClocks() {
  const now = new Date();
  const hours = (now.getHours() % 12) + now.getMinutes() / 60;
  const minutes = now.getMinutes() + now.getSeconds() / 60;

  const hAngle = (hours / 12) * 2 * Math.PI - Math.PI / 2;
  const mAngle = (minutes / 60) * 2 * Math.PI - Math.PI / 2;

  // Civic Municipal Clock (#bldg-clock, center 616, 147)
  const cHour = document.getElementById('clock-hour');
  const cMin = document.getElementById('clock-min');
  if (cHour && cMin) {
    cHour.setAttribute('x2', (616 + 7 * Math.cos(hAngle)).toFixed(1));
    cHour.setAttribute('y2', (147 + 7 * Math.sin(hAngle)).toFixed(1));
    cMin.setAttribute('x2', (616 + 11 * Math.cos(mAngle)).toFixed(1));
    cMin.setAttribute('y2', (147 + 11 * Math.sin(mAngle)).toFixed(1));
  }

  // SRM Roundabout Clock (#srm-roundabout, center 620, 500)
  const sHour = document.getElementById('srm-clock-hour');
  const sMin = document.getElementById('srm-clock-min');
  if (sHour && sMin) {
    sHour.setAttribute('x1', '620');
    sHour.setAttribute('y1', '500');
    sHour.setAttribute('x2', (620 + 4.2 * Math.cos(hAngle)).toFixed(1));
    sHour.setAttribute('y2', (500 + 4.2 * Math.sin(hAngle)).toFixed(1));
    sMin.setAttribute('x1', '620');
    sMin.setAttribute('y1', '500');
    sMin.setAttribute('x2', (620 + 6.0 * Math.cos(mAngle)).toFixed(1));
    sMin.setAttribute('y2', (500 + 6.0 * Math.sin(mAngle)).toFixed(1));
  }
}

/* ==========================================================================
   14. MAIN INITIALIZATION & 60FPS SIMULATION LOOP
   ========================================================================== */
function init() {
  const vehiclesLayer = document.getElementById('vehicles-layer');
  const pedestriansLayer = document.getElementById('pedestrians-layer');

  vehicleManager = new VehicleManager(vehiclesLayer);
  pedestrianManager = new PedestrianManager(pedestriansLayer);

  vehicleManager.init();
  pedestrianManager.init();

  initTrafficLights();
  initInteractiveCityElements();
  initRandomCityEvents();
  setupEventListeners();
  initExpandCityMode();
  loadSavedData();
  renderChaosMetric();
  updateCityClocks();

  let lastTimestamp = performance.now();
  let clockTimer = 0;
  function loop(now) {
    const delta = (now - lastTimestamp) / 1000;
    lastTimestamp = now;

    vehicleManager.update(delta);
    pedestrianManager.update(delta);

    clockTimer += delta;
    if (clockTimer >= 1.0) {
      clockTimer = 0;
      updateCityClocks();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
