const fs = require('fs');

// 1. BottomCommandDock.tsx
let f = 'src/components/ui/nexus/hud/BottomCommandDock.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace("import { Hammer, Cpu, Compass, ScrollText, Box, Rocket, Building2, Sliders } from 'lucide-react';", "import { Hammer, Cpu, Compass, Box, Rocket, Building2 } from 'lucide-react';");
c = c.replace("import { nexusAudio } from '../../../../utils/nexusAudio';\n", "");
fs.writeFileSync(f, c);

// 2. CenterTargetingHUD.tsx
f = 'src/components/ui/nexus/hud/CenterTargetingHUD.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace("import { clsx } from 'clsx';\n", "");
fs.writeFileSync(f, c);

// 3. LeftOperationsPanel.tsx
f = 'src/components/ui/nexus/hud/LeftOperationsPanel.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace("import { Target, ChevronLeft, ChevronRight, CheckCircle2, Circle, AlertTriangle, Radio } from 'lucide-react';", "import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';");
fs.writeFileSync(f, c);

// 4. RightIntelligencePanel.tsx
f = 'src/components/ui/nexus/hud/RightIntelligencePanel.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace("import { Crosshair, Zap, Activity, ShieldAlert, Check } from 'lucide-react';", "import { Crosshair } from 'lucide-react';");
fs.writeFileSync(f, c);

// 5. TopCommandBar.tsx
f = 'src/components/ui/nexus/hud/TopCommandBar.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace("import { Wind, Droplets, Apple, Zap, Users, Coins, Play, Pause, FastForward, Radio, Volume2, VolumeX } from 'lucide-react';", "import { Wind, Droplets, Apple, Zap, Users, Coins, Pause, Radio, Volume2, VolumeX } from 'lucide-react';");
fs.writeFileSync(f, c);

// 6. useNexusGameStore.ts
f = 'src/state/useNexusGameStore.ts';
c = fs.readFileSync(f, 'utf8');
c = c.replace("import { RESOURCE_DEFS, ResourceId } from '../config/resourceConfig';", "import { ResourceId } from '../config/resourceConfig';");
c = c.replace("import { BUILDING_DEFS, BuildingType } from '../config/buildingConfig';\n", "");
fs.writeFileSync(f, c);

console.log('Unused imports cleaned successfully.');
