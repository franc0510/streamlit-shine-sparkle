export interface Match {
  date: string;
  time: string;
  tournament: string;
  format: string;
  team1: string;
  team2: string;
  proba1: number;
  proba2: number;
  status?: string;
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
          status: cols[12]
        };
      })
      .filter(match => match.status === 'ok')
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error parsing predictions history CSV:', error);
    return [];
  }
};

export const getTeamLogo = (teamName: string): string => {
  // Normalize team name to match file naming
  const normalized = teamName
    .replace(/ /g, '_')
    .replace(/\./g, '');
  
  return `/Documents/teams/${normalized}.png`;
};
