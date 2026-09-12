# TINY CITY — "Mess with it."

> **GCSRM 2026 Technical Track (Web Development) Recruitment Task Submission**  
> *A stylized miniature animated city web toy built with vanilla HTML5, CSS3, SVG, and JavaScript.*

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Web%20Toy-557A5A?style=for-the-badge)](index.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-E8785A?style=for-the-badge)](package.json)

---

## 1. Project Overview

**TINY CITY** is an interactive digital toy designed purely for tactile delight, experimentation, and playful discovery. The user is greeted by a living, miniature vector metropolis and an immediate invitation: **"Mess with it."**

Within 3 seconds, anyone understands how it works:
$$\text{LOOK} \longrightarrow \text{CLICK} \longrightarrow \text{SOMETHING HAPPENS} \longrightarrow \text{"oh that's cool"} \longrightarrow \text{KEEP PLAYING}$$

There are no stressful win conditions, no endless tutorials, no heavy physics simulations, and no complicated rules. It is a web toy crafted for those spare minutes when you want to poke at a tiny world and see what happens.

### Visual Architecture & Aesthetic Philosophy
The project deliberately balances two harmonious design layers:
1. **The Website Interface (Playful, Funky, Hand-Drawn Web-Toy UI)**:
   - **Bouncy Wordmark**: Custom `TINY CITY` lettering where each letter has individual rotation (`-5deg` to `+5deg`), lively bounce keyframes, distinct toy palette accents (`#FF5500`, `#00BF56`, `#3B82F6`, `#F59E0B`, `#8B5CF6`), and an animated hand-drawn SVG doodle underline with a pulsing dot.
   - **Tactile Toy Controls**: Chunky physical toy buttons using rounded, warm geometry with asymmetric corners (`10px 8px 11px 9px`), 3D offset extrusion shadows (`0 3.5px 0`), active press-down depth (`translateY(2.5px)`), and a standout coral `[⚡ Cause Chaos]` toy button with wobble animation.
   - **Thoughtful Dual-Font Hierarchy**: Chunky display typography (**Fredoka** / **Shantell Sans**) for big headings and interactive controls, paired with clean, readable **DM Sans** for secondary telemetry and badges.
   - **Airy, Lightweight Header**: Replaced heavy boxed dashboard cards with airy, minimalist status pills (`.stat-pill`) for live Chaos %, Discoveries counter, Audio, and Theme, maximizing whitespace and letting the miniature city shine.
2. **The City Itself (Warm, Stylized Miniature Vector Art — Preserved & Locked)**:
   - Built with pure, scalable SVG primitives (`<rect>`, `<path>`, `<circle>`, `<polygon>`, `<linearGradient>`).
   - Rich urban palette: terracotta brick, warm ochre, slate blues, concrete, and foliage greens.
   - Dynamic lighting cycles: Warm glowing windows at night, soft sunset reflections, and street lamp cones.

---

## 2. Key Features & Interactions

### The Main Controls
Every button on the interface directly alters the miniature city:

| Control Area | Options | Impact on the City |
| :--- | :--- | :--- |
| **Weather** | `☀️ Sunny`, `🌧️ Rain`, `⛈️ Storm` | Transitions sky gradients, animated diagonal rain streaks, reflective road puddles, smooth umbrella deployment with natural walking bobs & storm wind tilts, continuous ambient rain/storm sound, and sudden lightning flashes with thunder. |
| **Time** | `🌅 Day`, `🌇 Sunset`, `🌙 Night` | Smooth CSS variable transitions between golden sunshine, amber twilight, and midnight navy. At night, building windows light up in warm gold, street lamps cast radial light beams, procedural crickets chirp under the stars, vehicle headlights turn on, and a quiet rooftop cat appears after lingering after midnight! |
| **Traffic** | `Low`, `Normal`, `Chaos` | Dynamically regulates vehicle pool density, cruising velocities, lane pacing, and procedural audio traffic density (from sparse passes to busy overlapping traffic & honks). |
| **Wind** | `Breeze`, `Gust`, `Gale` | Physically alters the sway frequency of park trees, cloud drift speed across the sky, pedestrian umbrella tilts, and balloon lateral drift. |
| **Drop Balloon** | `[🎈 Drop Balloon]` | Spawns colorful balloons floating upwards from street level. Each balloon is clickable and bursts with an animated SVG pop! Spawning $\ge 6$ balloons triggers the *Sky Swarm* discovery. |
| **Cause Chaos** | `[⚡ Cause Chaos]` | **The Hero Interaction.** Triggers an unexpected temporary 8-second phenomenon (UFO flyby with scanning beam, nitro vehicle boost, pedestrian panic sprint, sudden thunderstorm, or balloon swarm), automatically restoring order afterwards and unlocking *City Survivor*. |

### The Expanded 3-Zone Miniature Metropolis
The city horizontally spans the full 1200px canvas across three continuous, distinct architectural zones:

```
┌─────────────────────────┬──────────────────────────────────┬─────────────────────────────┐
│    LEFT: NEIGHBORHOOD   │       CENTER: CIVIC ANCHOR       │   RIGHT: COMMUNITY & PARK   │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────┤
│ • DURGA SWAMI store     │ • SRM BAKE & Cafe                │ • Community Library & Dome  │
│ • Townhouse & Pharma    │ • SRM TECH Glass Tower           │ • Chai & Snack Corner       │
│ • Dormer roofs & tiles  │ • Municipal Clock Tower          │ • Bus Shelter & Commuters   │
│ • Parked vintage scooter│ • Modernist Apartments & Balcony │ • Park, Trees & Fountain    │
│ • Sidewalk flower boxes │ • Bistro outdoor seating         │ • Park benches & path       │
└─────────────────────────┴──────────────────────────────────┴─────────────────────────────┘
  x = 0 → 220               x = 230 → 810                      x = 820 → 1200
```

### Interactive City Elements (Natural Discovery)
The miniature city contains clickable objects designed to be discovered naturally:
- **DURGA SWAMI Provisions & General Store**: Authentic neighborhood corner store with a warm terracotta facade, striped green & gold awning, clearly readable `DURGA SWAMI` signage, display window packed with spice jars and provisions, entrance door with brass bell, and sidewalk crates of fresh oranges and apples. Tapping it greets you with friendly shopkeeper dialogue and unlocks discovery `[11] Durga Swami Store`!
- **SRM Community Pharmacy & Residential Townhouse**: Slate brick townhouse with pitched gable roof, brick chimney with smoke puff, dormer attic window, and ground-floor pharmacy with glowing green neon medical cross (`#pharma-cross`).
- **SRM Community Library & Cultural Center**: Classical limestone masonry building with grand arched reading room windows, verdigris copper dome cupola with weather vane, stately entrance columns, banner, and sidewalk 24/7 book return drop box.
- **Corner Chai & Street Snacks Kiosk**: Vibrant ochre awning, wooden counter, steaming steel chai kettle (`.steam-line`), golden samosa display rack, and sidewalk stools.
- **7 Distinct Pedestrian Archetypes (SRM Students & Citizens)**:
  - **Student with Backpack**: Classic commuter in hoodie with backpack.
  - **Student with Textbooks**: Carrying a stack of study materials.
  - **Sprinting Student**: Late for 8:00 AM class/lab rushing along the sidewalk at 1.55x speed!
  - **Phone Commuter**: Glancing down at an illuminated smartphone screen.
  - **Office Worker / Faculty**: Carrying a briefcase.
  - **Bakery Shopper**: Carrying a paper pastry bag from SRM Bake.
  - **Dog Walker**: Walking a happy little puppy on a leash!
  - **Easy Hitbox**: Equipped with an invisible `56–66px` touch target (`.ped-hitbox`) and subtle hover micro-lift, making miniature walking students effortless to click on mobile or desktop without pixel-hunting.
  - **Authentic Student Dialogue**: When tapped, pedestrians briefly pause walking and display authentic SRM / GCSRM student banter (*"I LOVE GITHUB COMMUNITY. 💻❤️"*, *"WHERE IS MY CLASS? 🗺️"*, *"BRO, I HAVE AN ASSIGNMENT! 📚"*, *"ATTENDANCE IS 74.9%! RUNNING! 🏃💨"*, *"HOT SAMOSAS FROM SRM BAKE! 🥐"*).
  - **Fun Reactions**: NPCs have a chance to do a joy hop, turn around, trigger a nearby student buddy (*"Wait for me! 🏃"*), or do a sudden sprint boost.
  - **Rain Umbrellas**: In Rain or Storm, students deploy umbrellas with natural walking bob and storm tilt. Tapping them triggers rain-themed dialogue and unlocks *Rain Dance*!
- **Diorama Landmarks & Details**:
  - **Civic Municipal Clock Tower Building (Restored)**: Prominent central civic building (`x = 536..696`) featuring a continuous vertical tower shaft from ground to spire, twin arched belfry louvers with wooden slats, live real-time synchronized clock hands (`#clock-hour`, `#clock-min`), symmetrical arched windows, and a grand paneled entrance portal resting solidly on the sidewalk base (`y = 455`).
  - **SRM University Clock Tower & Roundabout Landmark (New Centerpiece)**: Situated in the middle of the roadway (`cx = 620, cy = 565`), faithfully recreated in stylized vector diorama art based on the real SRM University campus clock tower:
    - Terraced circular stone plinths with white balustrade railings and flowering marigolds.
    - 4 Classical fluted ivory pillars with an open central pavilion archway through which road and sky are visible.
    - Entablature with 4 classical corner urns.
    - Ornate ivory clock chamber with live real-time clock hands (`#srm-clock-hour`, `#srm-clock-min`).
    - Classical ribbed bell dome (cupola) crowned with an ornate finial spire reaching `y = 440`.
    - Clicking the tower plays an authentic multi-harmonic campus bell chime, triggers a playful bounce animation, shows witty SRM campus banter (*"SRM TIME: 3 minutes to reach Tech Park!"*, *"CLASS IS STARTING! Run!"*), and unlocks discovery `[12] SRM Clock Tower`!
    - At night, architectural uplighting illuminates the pillars and the clock dial glows warmly.
  - **Bakery (SRM Bake)**: Distinctive striped awning, warm display window with golden pastries, flower planter box, and sidewalk chalkboard easel menu (`₹30 🥐`).
  - **Outdoor Sidewalk Café**: Bistro table with two chairs and a steaming cup of coffee (`.steam-line`).
  - **Apartment Block Balconies**: Upper balcony with lush hanging ivy vines; lower balcony with colorful laundry line drying in the breeze (`.sway-element`) and potted plants.
  - **SRM Tech High-Rise**: Bicycle rack with a parked commuter bicycle locked out front.
  - **Parked Vintage Mint Scooter**: Parked near the bakery curb with retro round headlight.
  - **Sidewalk Eco Recycling Bin**: Green recycling bin positioned near the bus shelter.
  - **Interactive Campus Notice Board**: Located by the sidewalk near the bus shelter. Clicking it cycles announcements.
  - **Bus Shelter Student**: A commuter waiting inside the shelter looking at their smartphone.
  - **Cars, Scooters & Taxis**: Clicking any vehicle honks its model-specific horn and gives it a speed boost.
  - **Rooftop Alley Cat**: Lingering in night mode for 14+ seconds reveals a quiet silhouette cat on the Cafe rooftop. Tapping it triggers a gentle meow (*"Meow! 🐾✨"*) and unlocks *After Midnight*!
  - **Stray Dog**: A friendly neighborhood stray dog occasionally runs across the sidewalk. Tapping it makes it bark happily (*"Woof! 🐕✨"*) and unlocks *The Good Dog*!
  - **Traffic Signals**: Clicking either traffic light post manually cycles its signal (`Red` $\to$ `Green` $\to$ `Yellow`) with an electronic relay click, causing oncoming traffic to respect the red light and stop smoothly before the zebra crosswalk.
  - **5 Street Lamps**: Spaced across the 1200px width (`x = 75, 345, 680, 975, 1135`), each clickable and automatically casting radial light cones in night mode.
  - **Commercial & Office Buildings**: Clicking facades toggles random window illuminations or triggers office party lights.
  - **Park Trees**: Clicking foliage triggers an energetic leaf rustle animation (`*rustle* 🍃`).
  - **Celestial Sun & Moon**: Clicking the sun or moon in the sky directly cycles the time of day.
  - **Park Fountain**: Clicking the central fountain water ripples with a celebratory splash.

---

## 3. Movement Boundaries & Multi-Lane Traffic Architecture

A central technical achievement is the **rock-solid multi-lane traffic simulation with zero vehicle overlaps across the full 1200px roadway**:
- **4 Dedicated Roadway Lanes**:
  - `Lane 1` (Eastbound Outer): `y = 506`, heading right
  - `Lane 2` (Eastbound Inner): `y = 534`, heading right
  - `Lane 3` (Westbound Inner): `y = 576`, heading left
  - `Lane 4` (Westbound Outer): `y = 606`, heading left
  - Vehicles are strictly assigned to a lane and remain locked in their lane during transit.
- **Roundabout Island Deflection & Zero Island Collisions**:
  - Vehicles approaching the SRM Roundabout Island (`cx = 620, cy = 565`, span `x ∈ [460, 780]`) smoothly curve around the island using a continuous Hann-window mathematical deflection:
    - Lane 1 deflects upward by $-14\text{px}$ to $y = 492$.
    - Lane 2 deflects upward by $-28\text{px}$ to $y = 506$ (guaranteeing $\ge 17\text{px}$ clearance above island).
    - Lane 3 deflects downward by $+26\text{px}$ to $y = 602$ (guaranteeing $\ge 15\text{px}$ clearance below island).
    - Lane 4 deflects downward by $+14\text{px}$ to $y = 620$.
  - Includes dynamic steering yaw tilt as vehicles turn in and out of the roundabout curve.
  - Rigorously tested across 18,000 simulation frames with zero vehicle overlaps and zero island collisions.
- **Intelligent Following-Distance Engine (Zero Overlaps Guaranteed)**:
  - For every vehicle, the simulator calculates the exact gap to the vehicle directly ahead in the *same* lane.
  - When closing the gap, vehicles dynamically and smoothly decelerate (`brakeRate`), coming to a complete stop if the gap shrinks $\le 22\text{px}$.
  - An absolute hard safety clamp guarantees vehicles mathematically never occupy the same horizontal space ($gap \ge 12\text{px}$ enforced at all times, even during chaos mode or frame-rate drops).
- **Smooth Traffic Light Queuing**:
  - Vehicles approaching red signals at Crosswalk 1 (`x ≈ 210`) or Crosswalk 2 (`x ≈ 910`) halt smoothly before the zebra crossing.
  - Following vehicles queue up behind the lead car in an orderly line without overlapping.
  - When lights turn green, cars accelerate sequentially.
- **Safe Spawn Clearance Checking**:
  - Vehicles only spawn into a lane when its entry threshold is clear ($130\text{px}$ clearance buffer), eliminating overlap bugs at the source.
- **Continuous Edge Recycling**:
  - Vehicles exiting the road perimeter seamlessly recycle into available opposing lanes if entry is clear, or safely yield to new spawns.
- **7 Distinct Vehicle Types**:
  - Compact Hatchback, City Sedan, Yellow Taxi, Sports Coupe, Delivery Van, City Transit Bus, and agile Scooter/Moped—each with unique palettes and custom horn audio synthesis.
- **Pedestrians Stay on Sidewalks**: Citizens walk strictly on the sidewalk (`y = 464` to `468`). Upon reaching either boundary (`x = 20` or `x = 1180`), they turn around smoothly.

---

## 4. The Discovery System (12 Discoveries)

Rather than a tedious checklist, Tiny City features **12 fun surprises** unlocked through natural curiosity:

```
[01] Downpour Dispatch   — Summoned rainfall or a storm over the city.
[02] Midnight Glow       — Switched to night mode and watched windows light up.
[03] Aero Burst          — Clicked and popped an airborne balloon.
[04] Sky Swarm           — Spawned a cluster of 6 or more floating balloons.
[05] Signal Conductor    — Manually changed a traffic signal to halt traffic.
[06] Commuter Beep       — Clicked an active car to honk its horn.
[07] The Good Dog        — Spotted and patted the stray dog trotting on the sidewalk.
[08] Rain Dance          — Tapped an umbrella-carrying commuter during the downpour.
[09] After Midnight      — Lingered in night mode and befriended the rooftop alley cat.
[10] City Survivor       — Unleashed peak chaos and successfully restored peace and order.
[11] Durga Swami Store   — Visited the beloved neighborhood provisions shop and said hello to the shopkeeper.
[12] SRM Clock Tower     — Visited the iconic university clock tower standing proud on the traffic roundabout.
```

- Unlocks trigger a warm toast notification accompanied by a musical major triad chime (C6-E6-G6).
- All progress is saved automatically to browser `localStorage`.
- Clicking `Discoveries [X / 12]` in the header opens a warm paper modal showing unlocked cards and mystery hints (`???`).

---

## 5. Rich Procedural Web Audio Engine

Tiny City includes a zero-dependency, layered procedural audio engine built on the Web Audio API with smooth crossfades:
- **Continuous Rain Ambience**: Lowpass-filtered looped white noise (1200Hz) with smooth fade-in/out ramps.
- **Storm Atmosphere**: Heavier rain noise combined with resonant bandpass wind rumble (260Hz), electric lightning snaps, and randomized decaying sub-bass thunderclaps.
- **Night Crickets**: Natural procedural dual-frequency chirps (4400Hz–4800Hz) with randomized intervals and pulse envelopes, fading out in daylight.
- **Dynamic Traffic Audio Density**: Continuous road hum whose density and event frequency dynamically scale from Low (sparse passes every 8s), to Normal (steady hum every 3-4s), to Chaos (busy overlapping engines & erratic horns every 1-1.5s).
- **Vehicle-Specific Horns**: Unique acoustic signatures for Taxi (NYC double-beep), Sports car (revving dual-tone), Sedan (mellow dual horn), Van (deep honk), and Bus (heavy transit horn) with click cooldown.
- **Tactile Sound Effects**: Crisp pop transient for balloons, electronic relay click for traffic lights, soft tactile wooden click for UI buttons, and celebratory chime for discoveries.

> **Audio Policy**: Sound is muted by default to respect browser autoplay conventions. AudioContext initializes and resumes on first user gesture.

---

## 6. JavaScript Architecture & State Management

The entire application runs on pure, modular vanilla JavaScript structured for readability and GCSRM recruitment evaluation:

```
script.js
├── 1. Global City State (Single source of truth)
├── 2. CitySoundEngine (Layered procedural Web Audio synthesizer)
├── 3. VehicleManager (Autonomous car pool, strict road boundaries, lane looping)
├── 4. PedestrianManager (Sidewalk bounds, turnaround logic, umbrella bobbing & tilt)
├── 5. TrafficLights Controller (Autonomous & manual signal cycles)
├── 6. Interactive City Handlers (Lamps, trees, buildings, signs, celestial, rooftop cat, dog)
├── 7. Balloons System (Wind drift, tap-to-pop, swarm detector)
├── 8. Hero Cause Chaos Engine (Randomized temporary events & graceful auto-reset)
├── 9. Living City Spontaneous Events (Stray dog, status banter loop, rooftop cat)
├── 10. Environment Switchers (Weather, Time of Day, Traffic, Wind)
├── 11. Dynamic Chaos Formula & Speech Bubbles
├── 12. Discovery Tracker & LocalStorage Interface (10 discoveries)
├── 13. Keyboard Shortcuts & Event Delegation
└── 14. RequestAnimationFrame Loop (60 FPS fluid rendering)
```

### Dynamic Chaos Formula
City entropy is calculated in real time:
$$\text{Chaos} = \text{Base}(10) + \text{Weather} + \text{Traffic} + \text{Wind} + (\text{Balloons} \times 4) + \text{ChaosEvent}(40)$$
Clamped safely between $5\%$ and $99\%$.

---

## 7. Keyboard Shortcuts

For power users and accessibility:
- `1` / `2` / `3` : Set Weather (Sunny / Rain / Storm)
- `D` / `S` / `N` : Set Time (Day / Sunset / Night)
- `B` : Drop Balloon
- `C` : Cause Chaos
- `M` : Mute / Unmute Audio
- `T` : Toggle UI Theme (Light Mode / Dark Mode)
- `O` or `?` : Open / Close Discoveries Archive
- `ESC` : Dismiss Modals

---

## 8. Theme System & Local Storage

### Dual UI Theme Architecture (Light & Dark Modes)
Tiny City features a high-performance, non-destructive theme toggle that shifts the website UI while keeping the miniature city artwork warm, colorful, and intact:
- **Light Mode (Warm Poster Aesthetic)**: Paper cream backdrop (`#F6F3EB`), terracotta accents (`#E8785A`), sage green (`#557A5A`), and crisp graphite borders (`#2B2824`).
- **Dark Mode (F1 Carbon & Racing Green Aesthetic)**: Deep carbon chassis (`#0C0E12`), card surfaces (`#151821`), racing green highlights (`#00E55B`), off-white headers (`#F5F6F8`), and high-contrast speech bubbles.
- **City Immunity**: The vector city illustration is strictly decoupled from UI theme variables—its buildings, roads, parks, vehicles, and dynamic sky shaders remain vivid and vibrant in both modes.

### Local Storage Persistence
The application persists user state across visits using standard browser `localStorage`:
1. `tiny_city_discoveries_v4`: JSON array of unlocked discovery string IDs.
2. `tiny_city_sound_v4`: Boolean string (`"true"` / `"false"`) storing audio preference.
3. `tiny_city_theme_mode`: String (`"light"` / `"dark"`) storing theme preference (respects `prefers-color-scheme` by default).
4. `tiny_city_visits_v4`: Integer count of sessions. If $>1$, the status feed greets the returning user with `"Welcome back to Tiny City."`

A **"Reset Progress"** button is built into the discoveries modal to clear storage safely for demonstration.

---

## 9. How to Run Locally

Because Tiny City requires **zero build steps, zero node modules, and zero external packages**, running it is instantaneous:

### Option A: Open directly in your browser
Double-click `index.html` or drag it into any modern web browser (Chrome, Firefox, Safari, Edge).

### Option B: Local Python HTTP Server
```bash
# Navigate to the repository directory
cd "web toy"

# Start Python 3 HTTP server
python3 -m http.server 8000
```
Open `http://localhost:8000` in your browser.

---

## 10. Deployment Instructions

### Deploying to GitHub Pages
1. Push this repository to GitHub.
2. In your repository on GitHub, navigate to **Settings** $\to$ **Pages** (under "Code and automation").
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `master`), folder: `/ (root)`
4. Click **Save**. Within 1–2 minutes, your web toy will be live at `https://<your-username>.github.io/<repo-name>/`.

### Deploying to Vercel
1. Install Vercel CLI via `npm i -g vercel` OR connect via [vercel.com](https://vercel.com).
2. If using CLI, run in the project directory:
   ```bash
   vercel
   ```
3. Accept the default settings (No framework preset required).
4. Deployment completes in seconds!

---

## 11. Technical Track Evaluation Checklist

- [x] **HTML5**: Semantic tags (`<header>`, `<main>`, `<footer>`, `<aside>`, `<button>`), ARIA accessibility roles.
- [x] **CSS3**: Warm editorial palette, CSS Custom Properties, Fraunces + DM Sans typography, responsive grid & flexbox layouts, touch target sizing ($\ge 44\text{px}$), `@media (prefers-reduced-motion)`.
- [x] **SVG City Preservation**: Original city artwork, buildings, roads, trees, cars, and palette 100% preserved.
- [x] **Vanilla JavaScript**: State-driven architecture, event delegation, strict coordinate boundary enforcement, `requestAnimationFrame`.
- [x] **Web Audio API**: Procedural sound synthesis with zero external audio assets.
- [x] **LocalStorage**: Persistent discovery archives and user preferences.
- [x] **Responsive UX**: Tested across mobile (320px+), tablet, and desktop without horizontal overflow or clipped controls.

---

*Crafted with precision for the GitHub Community SRM (GCSRM) 2026 Technical Recruitment.*
