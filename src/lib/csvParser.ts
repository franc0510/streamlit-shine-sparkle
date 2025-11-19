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

export const parseScheduleCSV = async (): Promise<Match[]> => {
  try {
    const response = await fetch('/Documents/schedule_with_probs.csv');
    const text = await response.text();
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
    console.error('Error parsing schedule CSV:', error);
    return [];
  }
};

export const parsePredictionsHistoryCSV = async (): Promise<Match[]> => {
  try {
    const response = await fetch('/Documents/predictions_history.csv');
    const text = await response.text();
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
    console.error('Error parsing predictions history CSV:', error);
    return [];
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
