export interface Match {
  date: string;
  time: string;
  tournament: string;
  format: string;
  team1: string;
  team2: string;
  used_team1: string; // Exact name from parquet
  used_team2: string; // Exact name from parquet
  proba1: number;
  proba2: number;
  status?: string;
  matchDate?: Date;
}

// GitHub raw URLs for CSV files (updated by GitHub Actions)
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/franc0510/streamlit-shine-sparkle/main/public/Documents';

const fetchCSVFromGitHub = async (filename: string): Promise<string> => {
  // Add cache-busting timestamp to avoid browser caching
  const cacheBuster = `?t=${Date.now()}`;
  const url = `${GITHUB_RAW_BASE}/${filename}${cacheBuster}`;
  
  const response = await fetch(url, {
    cache: 'no-store', // Ensure no caching
    headers: {
      'Accept': 'text/plain',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
};

export const parseScheduleCSV = async (): Promise<Match[]> => {
  try {
    const text = await fetchCSVFromGitHub('schedule_with_probs.csv');
    const lines = text.split('\n').slice(1); // Skip header
    
    return lines
      .filter(line => line.trim())
      .map(line => {
        const cols = line.split(',');
        const dateTime = new Date(cols[0]);
        
        return {
          date: dateTime.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          time: dateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          tournament: cols[1],
          format: cols[2],
          team1: cols[3],
          team2: cols[4],
          proba1: parseFloat(cols[5]),
          proba2: parseFloat(cols[6]),
          used_team1: cols[10] || cols[3], // Column 10: used_team1
          used_team2: cols[11] || cols[4], // Column 11: used_team2
          status: cols[9]
        };
      })
      .filter(match => match.status === 'ok');
  } catch (error) {
    console.error('Error fetching/parsing schedule CSV from GitHub:', error);
    throw new Error('Unable to load match schedule. Please check your connection and try again.');
  }
};

export const parsePredictionsHistoryCSV = async (): Promise<Match[]> => {
  try {
    const text = await fetchCSVFromGitHub('predictions_history.csv');
    const lines = text.split('\n').slice(1); // Skip header
    const now = new Date();
    
    return lines
      .filter(line => line.trim())
      .map(line => {
        const cols = line.split(',');
        const dateTime = new Date(cols[2]);
        
        return {
          date: dateTime.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          time: dateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          tournament: cols[3],
          format: cols[4],
          team1: cols[5],
          team2: cols[6],
          proba1: parseFloat(cols[7]) * 100,
          proba2: parseFloat(cols[8]) * 100,
          used_team1: cols[9] || cols[5],
          used_team2: cols[10] || cols[6],
          status: cols[12],
          matchDate: dateTime
        };
      })
      .filter(match => match.status === 'ok' && match.matchDate && match.matchDate < now)
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error fetching/parsing predictions history CSV from GitHub:', error);
    throw new Error('Unable to load predictions history. Please check your connection and try again.');
  }
};

// Normalize text: remove accents, lowercase
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim();
};

// List of available team logo files: [filename, extension]
const availableLogos: [string, string][] = [
  ["100_Thieves", "png"], ["35", "webp"], ["Alpha7", "png"], ["Anyone_s_Legend", "png"], 
  ["BILIBILI_GAMING_DREAMSMART", "png"], ["BK ROG Esports", "png"], 
  ["BNK_FEARX_Youth", "png"], ["Beşiktaş_Esports", "png"], ["Bro Challengers", "png"], 
  ["CTBC_Flying_Oyster", "png"], ["Conviction", "png"], ["Crvena_zvezda_Esports", "png"], 
  ["DNF_Challengers", "png"], ["DRX_Challengers", "png"], ["Disguised", "png"], 
  ["Estral_Esports", "png"], ["FLAMENGO_Redragon", "png"], ["FN_Esports", "png"], 
  ["Farenvehn", "png"], ["Flame_hard", "png"], ["FlyQuest", "png"], ["Fnatic", "png"], 
  ["Forsaken_Team", "png"], ["French Flair", "png"], ["Fukuoka SoftBank HAWKS gaming", "png"], 
  ["G2_Esports", "png"], ["GMBLERS_Esports", "png"], ["Galions", "png"], 
  ["Gen.G Esports", "png"], ["Hanwha_Life_Esports", "png"], ["Invictus Gaming", "png"], 
  ["Isurus", "png"], ["Joblife", "png"], ["Karmine_Corp", "png"], ["Leviatan", "png"], 
  ["Lille Esport", "png"], ["Luminosity_Gaming", "png"], ["MGN_Vikings_Esports", "png"], 
  ["Movistar_KOI", "png"], ["NightBirds", "png"], ["PSG_Talon", "png"], ["Pain Gaming", "png"], 
  ["RED Canids", "png"], ["Rich_Gang", "png"], ["SDM_Tigres", "png"], ["SICAR_Esports", "png"], 
  ["SPIKE_Syndicate", "png"], ["Saigon_Dino", "png"], ["Skillcamp", "png"], ["Solary", "png"],
  ["Suzhou LNG Ninebot Esports", "png"], ["T1", "png"], ["T1_Esports_Academy", "png"], 
  ["TBD", "png"], ["TLN Pirates", "png"], ["TOPESPORT", "png"], ["Team_Insidious", "png"], 
  ["Team_Secret_Whales", "png"], ["The_Chiefs_Esports_Club", "png"], ["Ultra Prime", "png"], 
  ["Unicorns_of_Love_Sexy_Edition", "png"], ["Veni_Vidi_Vici", "png"], ["Vitality.Bee", "png"], 
  ["Vivo_Keyd_Stars", "png"], ["WeiboGaming Faw Audi", "png"], ["ZYB", "png"], ["ZennIT", "png"], 
  ["aNc_Legends", "png"], ["beijing jdg intel esports", "png"], ["kt_Challengers", "png"], 
  ["kt_Rolster", "png"], ["mCon_Esports", "png"], ["xi'an team we", "png"]
];

// Create a lookup map: normalized name -> { filename, extension }
const logoLookup: Map<string, { filename: string; ext: string }> = new Map();
availableLogos.forEach(([filename, ext]) => {
  const normalized = normalizeText(filename.replace(/_/g, ' '));
  logoLookup.set(normalized, { filename, ext });
});

// Manual aliases for teams with different display names
const manualAliases: Record<string, string> = {
  "topesports": "TOPESPORT",
  "top esports": "TOPESPORT",
  "beijing jdg intel esports": "JDG Intel Esports",
  "jd gaming": "JDG Intel Esports",
  "hanjin brion challengers": "Bro Challengers",
  "anyone's legend": "Anyone_s_Legend",
};

export const getTeamLogo = (teamName: string): string => {
  if (!teamName) return '/Documents/teams/shaco.png';
  
  const normalized = normalizeText(teamName.replace(/_/g, ' '));
  
  // 1. Check manual aliases first
  if (manualAliases[normalized]) {
    const aliasLookup = logoLookup.get(normalizeText(manualAliases[normalized].replace(/_/g, ' ')));
    if (aliasLookup) {
      return `/Documents/teams/${aliasLookup.filename}.${aliasLookup.ext}`;
    }
    return `/Documents/teams/${manualAliases[normalized]}.png`;
  }
  
  // 2. Direct lookup in available logos (normalized)
  if (logoLookup.has(normalized)) {
    const logo = logoLookup.get(normalized)!;
    return `/Documents/teams/${logo.filename}.${logo.ext}`;
  }
  
  // 3. Fallback to shaco
  return '/Documents/teams/shaco.png';
};
