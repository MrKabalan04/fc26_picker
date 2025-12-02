const TEAMS = [
  // ======================
  // Premier League
  // ======================
  { leagueId: "epl", leagueName: "Premier League", name: "Manchester City", stars: 5.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Arsenal", stars: 5.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Liverpool", stars: 5.0 },

  { leagueId: "epl", leagueName: "Premier League", name: "Chelsea", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Newcastle United", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Tottenham Hotspur", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Aston Villa", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Manchester United", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Nottingham Forest", stars: 4.5 },

  { leagueId: "epl", leagueName: "Premier League", name: "AFC Bournemouth", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Brighton & Hove Albion", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Crystal Palace", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "West Ham United", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Brentford", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Fulham", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Everton", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Wolverhampton Wanderers", stars: 4.0 },

  // ======================
  // LaLiga (Spanish Primera División)
  // ======================
  { leagueId: "laliga", leagueName: "LaLiga", name: "Real Madrid", stars: 5.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "FC Barcelona", stars: 5.0 },

  { leagueId: "laliga", leagueName: "LaLiga", name: "Atlético Madrid", stars: 4.5 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Athletic Bilbao", stars: 4.5 },

  { leagueId: "laliga", leagueName: "LaLiga", name: "Real Sociedad", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Villarreal CF", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Real Betis", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Girona FC", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "RCD Mallorca", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Rayo Vallecano", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Celta Vigo", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Getafe CF", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "CA Osasuna", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Sevilla FC", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Valencia CF", stars: 4.0 },

  // ======================
  // Serie A
  // ======================
  { leagueId: "seriea", leagueName: "Serie A", name: "Inter", stars: 5.0 },

  { leagueId: "seriea", leagueName: "Serie A", name: "SSC Napoli", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "AC Milan", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Juventus", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "AS Roma", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Atalanta", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Lazio", stars: 4.5 },

  { leagueId: "seriea", leagueName: "Serie A", name: "Bologna", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Fiorentina", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Torino", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Como", stars: 4.0 },

  // ======================
  // Bundesliga
  // ======================
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Bayern Munich", stars: 5.0 },

  { leagueId: "bundes", leagueName: "Bundesliga", name: "Borussia Dortmund", stars: 4.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Bayer Leverkusen", stars: 4.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "RB Leipzig", stars: 4.5 },

  { leagueId: "bundes", leagueName: "Bundesliga", name: "Eintracht Frankfurt", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Borussia Mönchengladbach", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "SC Freiburg", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "VfB Stuttgart", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "VfL Wolfsburg", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "FC Augsburg", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Mainz 05", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Werder Bremen", stars: 4.0 },

  // ======================
  // Ligue 1
  // ======================
  
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Paris Saint-Germain", stars: 5.0 },

  { leagueId: "ligue1", leagueName: "Ligue 1", name: "AS Monaco", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Olympique de Marseille", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "LOSC Lille", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "OGC Nice", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Olympique Lyonnais", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Stade Rennais FC", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Paris FC", stars: 4.0 },
];

export default TEAMS;
