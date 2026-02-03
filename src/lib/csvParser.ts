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

export const getTeamLogo = (teamName: string): string => {
  // Special mappings for teams with non-standard file names
  const specialMappings: Record<string, string> = {
    "Gen.G Esports": "Gen.G Esports.png",
    "kt Rolster": "kt_Rolster.png",
    "TOPESPORTS": "TOPESPORT.png",
    "Top Esports": "TOPESPORT.png",
    "Anyone's Legend": "Anyone_s_Legend.png",
    "BRO Challengers": "Bro Challengers.png",
    "Bro Challengers": "Bro Challengers.png",
    "JDG Intel Esports Club": "JDG Intel Esports.png",
    "JDG Intel Esports": "JDG Intel Esports.png",
    "Beijing JDG Intel Esports": "JDG Intel Esports.png",
    "Invictus Gaming": "Invictus Gaming.png",
    "Pain Gaming": "Pain Gaming.png",
    "paiN Gaming": "Pain Gaming.png",
    "RED Canids": "RED Canids.png",
    "Suzhou LNG Ninebot Esports": "Suzhou LNG Ninebot Esports.png",
    "Ultra Prime": "Ultra Prime.png",
    "LEVIATÁN": "Leviatan.png",
    "Leviatan": "Leviatan.png",
    "Leviatán": "Leviatan.png",
  };

  // Check for special mapping first
  if (specialMappings[teamName]) {
    return `/Documents/teams/${specialMappings[teamName]}`;
  }

  // Build a robust file name: Title Case words joined by underscores. Keep dots (e.g., Gen.G)
  const canonical = (teamName || "")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = canonical
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join("_");

  return `/Documents/teams/${normalized}.png`;
};
