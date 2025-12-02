const TEAMS = [
  // ======================
  // Premier League
  // ======================

  //5
  { leagueId: "epl", leagueName: "Premier League", name: "Manchester City", stars: 5.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Arsenal", stars: 5.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Liverpool", stars: 5.0 },

  //4.5
  { leagueId: "epl", leagueName: "Premier League", name: "Aston Villa", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Chelsea", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Crystal Palace", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Manchester United", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Newcastle United", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Nottingham Forest", stars: 4.5 },
  { leagueId: "epl", leagueName: "Premier League", name: "Tottenham Hotspur", stars: 4.5 },
  
  //4.0
  { leagueId: "epl", leagueName: "Premier League", name: "AFC Bournemouth", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Brighton & Hove Albion", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Brentford", stars: 4.0 }, 
  { leagueId: "epl", leagueName: "Premier League", name: "Burnley", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Everton", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Fulham", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Leads United", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "West Ham United", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Sunderland", stars: 4.0 },
  { leagueId: "epl", leagueName: "Premier League", name: "Wolverhampton Wanderers", stars: 4.0 },

  // ======================
  // LaLiga (Spanish Primera División)
  // ======================
  
  //5.0
  { leagueId: "laliga", leagueName: "LaLiga", name: "Real Madrid", stars: 5.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "FC Barcelona", stars: 5.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Atlético Madrid", stars: 5.0 },

  //4.5
  { leagueId: "laliga", leagueName: "LaLiga", name: "Athletic Bilbao", stars: 4.5 },

  //4.0
  { leagueId: "laliga", leagueName: "LaLiga", name: "CA Osasuna", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Celta Vigo", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Real Sociedad", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Getafe CF", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Girona FC", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Villarreal CF", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Real Betis", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Rayo Vallecano", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "RCD Mallorca", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Rayo Espanyol", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Sevilla FC", stars: 4.0 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Valencia CF", stars: 4.0 },

  //3.5
  { leagueId: "laliga", leagueName: "LaLiga", name: "D. Alaves", stars: 3.5 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Elche CF", stars: 3.5 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "Levante UD", stars: 3.5 },
  { leagueId: "laliga", leagueName: "LaLiga", name: "R. Oviedo", stars: 3.5 },

  // ======================
  // Serie A
  // ======================
  
  //5.0
  { leagueId: "seriea", leagueName: "Serie A", name: "Inter", stars: 5.0 },

  //4.5
  { leagueId: "seriea", leagueName: "Serie A", name: "SSC Napoli", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "AC Milan", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Juventus", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Atalanta", stars: 4.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Bergamo Calcio", stars: 4.5 },
  
  //4.0
  { leagueId: "seriea", leagueName: "Serie A", name: "Latium", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "AS Roma", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Bologna", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Fiorentina", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Torino", stars: 4.0 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Como", stars: 4.0 },

  //3.5
  { leagueId: "seriea", leagueName: "Serie A", name: "Cagliari", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Cremonese", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Genoa", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Lecce", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Parma", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Pisa", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Udinese", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Sassuolo", stars: 3.5 },
  { leagueId: "seriea", leagueName: "Serie A", name: "Hellas Verona", stars: 3.5 },

  // ======================
  // Bundesliga
  // ======================
  
  //5.0
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Bayern Munich", stars: 5.0 },

  //4.5
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Borussia Dortmund", stars: 4.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Bayer Leverkusen", stars: 4.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "RB Leipzig", stars: 4.5 },

  //4.0
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Frankfurt", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "SV Werder Bremen", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "TSG Hoffenheim", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Borussia Mönchengladbach", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "SC Freiburg", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "VfB Stuttgart", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "VfL Wolfsburg", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "FSV Mainz 05", stars: 4.0 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Werder Bremen", stars: 4.0 },
  
  //3.5
  { leagueId: "bundes", leagueName: "Bundesliga", name: "FC Koln", stars: 3.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Union Berlin", stars: 3.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "FC Augsburg", stars: 3.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Hambuger SV", stars: 3.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "Heidenheim", stars: 3.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: `M'gladbach`, stars: 3.5 },
  { leagueId: "bundes", leagueName: "Bundesliga", name: "FC St. Pauli", stars: 3.5 },

  
  // ======================
  // Ligue 1
  // ======================

  //5.0
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Paris Saint-Germain", stars: 5.0 },

  //4.5
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Olympique de Marseille", stars: 4.5 },

  //4.0
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "AS Monaco", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "OGC Nice", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "LOSC Lille", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Olympique Lyonnais", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Stade Rennais FC", stars: 4.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Paris FC", stars: 4.0 },

  //3.5
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "AJ Auxerre", stars: 3.5 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "FC Nantes", stars: 3.5 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "RC Lens", stars: 3.5 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Stade Brestois 29", stars: 3.5 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Strasbourg", stars: 3.5 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Toulouse FC", stars: 3.5 },

  //3.0
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Angers Sco", stars: 3.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "FC Lorient", stars: 3.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "FC Metz", stars: 3.0 },
  { leagueId: "ligue1", leagueName: "Ligue 1", name: "Havre FC", stars: 3.0 },

];

export default TEAMS;
