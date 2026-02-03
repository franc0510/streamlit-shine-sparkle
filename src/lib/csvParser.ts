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

// Normalize text: remove accents, handle special characters
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
  "BNK_FEARX_Youth", "Beşiktaş_Esports", "Bro Challengers", "CTBC_Flying_Oyster",
  "Conviction", "Crvena_zvezda_Esports", "DNF_Challengers", "DRX_Challengers",
  "Disguised", "Estral_Esports", "FLAMENGO_Redragon", "FN_Esports", "Farenvehn",
  "Flame_hard", "FlyQuest", "Fnatic", "Forsaken_Team", "G2_Esports",
  "GMBLERS_Esports", "Gen.G Esports", "Hanwha_Life_Esports", "Invictus Gaming",
  "Isurus", "JDG Intel Esports", "Karmine_Corp", "Leviatan", "Luminosity_Gaming",
  "MGN_Vikings_Esports", "Movistar_KOI", "NightBirds", "PSG_Talon", "Pain Gaming",
  "RED Canids", "Rich_Gang", "SDM_Tigres", "SICAR_Esports", "SPIKE_Syndicate",
  "Saigon_Dino", "Suzhou LNG Ninebot Esports", "T1", "T1_Esports_Academy", "TBD",
  "TOPESPORT", "Team_Insidious", "Team_Secret_Whales", "The_Chiefs_Esports_Club",
  "Ultra Prime", "Unicorns_of_Love_Sexy_Edition", "Veni_Vidi_Vici", "Vitality.Bee",
  "Vivo_Keyd_Stars", "ZennIT", "aNc_Legends", "kt_Challengers", "kt_Rolster", "mCon_Esports"
];

// Create a lookup map: normalized name -> actual filename
const logoLookup: Map<string, string> = new Map();
availableLogos.forEach(filename => {
  const normalized = normalizeText(filename.replace(/_/g, ' ').replace(/\./g, ' '));
  logoLookup.set(normalized, filename);
});

// Additional manual aliases for edge cases
const manualAliases: Record<string, string> = {
  "topesports": "TOPESPORT",
  "top esports": "TOPESPORT",
  "jdg intel esports club": "JDG Intel Esports",
  "beijing jdg intel esports": "JDG Intel Esports",
  "jd gaming": "JDG Intel Esports",
  "pain gaming": "Pain Gaming",
  "bro challengers": "Bro Challengers",
  "hanjin brion challengers": "Bro Challengers",
  "anyone's legend": "Anyone_s_Legend",
  "anyones legend": "Anyone_s_Legend",
};

export const getTeamLogo = (teamName: string): string => {
  if (!teamName) return '/Documents/teams/shaco.png';
  
  const normalized = normalizeText(teamName.replace(/_/g, ' ').replace(/\./g, ' '));
  
  // 1. Check manual aliases first
  if (manualAliases[normalized]) {
    return `/Documents/teams/${manualAliases[normalized]}.png`;
  }
  
  // 2. Direct lookup in available logos
  if (logoLookup.has(normalized)) {
    return `/Documents/teams/${logoLookup.get(normalized)}.png`;
  }
  
  // 3. Try partial matching (team name contains or is contained in logo name)
  for (const [logoNormalized, filename] of logoLookup.entries()) {
    if (logoNormalized.includes(normalized) || normalized.includes(logoNormalized)) {
      return `/Documents/teams/${filename}.png`;
    }
  }
  
  // 4. Try matching first word (e.g., "Fnatic TQ" -> "Fnatic")
  const firstWord = normalized.split(' ')[0];
  if (firstWord.length >= 3) {
    for (const [logoNormalized, filename] of logoLookup.entries()) {
      if (logoNormalized.startsWith(firstWord) || logoNormalized.split(' ')[0] === firstWord) {
        return `/Documents/teams/${filename}.png`;
      }
    }
  }
  
  // 5. Fallback: build filename from team name
  const fallbackName = teamName
    .replace(/-/g, ' ')
    .replace(/\s+/g, '_')
    .split('_')
    .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
    .join('_');
  
  return `/Documents/teams/${fallbackName}.png`;
};
