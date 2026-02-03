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

// List of available team logo files (without extension)
const availableLogos: string[] = [
  "100_Thieves", "Alpha7", "Anyone_s_Legend", "BILIBILI_GAMING_DREAMSMART",
  "BK ROG Esports", "BNK_FEARX_Youth", "Beşiktaş_Esports", "Bro Challengers", 
  "CTBC_Flying_Oyster", "Conviction", "Crvena_zvezda_Esports", "DNF_Challengers", 
  "DRX_Challengers", "Disguised", "Estral_Esports", "FLAMENGO_Redragon", "FN_Esports", 
  "Farenvehn", "Flame_hard", "FlyQuest", "Fnatic", "Forsaken_Team", "French Flair",
  "Fukuoka SoftBank HAWKS gaming", "G2_Esports", "GMBLERS_Esports", "Galions", 
  "Gen.G Esports", "Hanwha_Life_Esports", "Invictus Gaming", "Isurus", "Joblife",
  "Karmine_Corp", "Leviatan", "Lille Esport", "Luminosity_Gaming", "MGN_Vikings_Esports", 
  "Movistar_KOI", "NightBirds", "PSG_Talon", "Pain Gaming", "RED Canids", "Rich_Gang", 
  "SDM_Tigres", "SICAR_Esports", "SPIKE_Syndicate", "Saigon_Dino", "Skillcamp", "Solary",
  "Suzhou LNG Ninebot Esports", "T1", "T1_Esports_Academy", "TBD", "TOPESPORT", 
  "Team_Insidious", "Team_Secret_Whales", "The_Chiefs_Esports_Club", "Ultra Prime", 
  "Unicorns_of_Love_Sexy_Edition", "Veni_Vidi_Vici", "Vitality.Bee", "Vivo_Keyd_Stars", 
  "WeiboGaming Faw Audi", "ZYB", "ZennIT", "aNc_Legends", "beijing jdg intel esports",
  "kt_Challengers", "kt_Rolster", "mCon_Esports", "xi'an team we"
];

// Create a lookup map: normalized name -> actual filename
const logoLookup: Map<string, string> = new Map();
availableLogos.forEach(filename => {
  // Normalize: replace underscores with spaces, remove accents, lowercase
  const normalized = normalizeText(filename.replace(/_/g, ' '));
  logoLookup.set(normalized, filename);
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
  
  // Normalize input: remove accents, lowercase, spaces instead of underscores
  const normalized = normalizeText(teamName.replace(/_/g, ' '));
  
  // 1. Check manual aliases first
  if (manualAliases[normalized]) {
    return `/Documents/teams/${manualAliases[normalized]}.png`;
  }
  
  // 2. Direct lookup in available logos (normalized)
  if (logoLookup.has(normalized)) {
    return `/Documents/teams/${logoLookup.get(normalized)}.png`;
  }
  
  // 3. Fallback to shaco
  return '/Documents/teams/shaco.png';
};
