import path from 'node:path';
import crypto from 'node:crypto';
import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Load .env from monorepo root
config({ path: path.resolve(__dirname, '../../../../.env') });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// ─── Deterministic PRNG ─────────────────────────────────
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const rng = createRng(20260224);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Types ──────────────────────────────────────────────
type Position = 'GK' | 'RB' | 'CB' | 'LB' | 'CDM' | 'CM' | 'CAM' | 'RM' | 'LM' | 'RW' | 'LW' | 'CF' | 'ST';

interface TeamDef {
  name: string;
  budget: number;
  region: 'spanish' | 'english' | 'german' | 'french' | 'italian' | 'portuguese' | 'dutch' | 'brazilian' | 'belgian' | 'scottish' | 'greek' | 'swiss' | 'austrian' | 'ukrainian' | 'croatian' | 'czech' | 'hungarian' | 'scandinavian';
}

// ─── Team Definitions ───────────────────────────────────
const championsTeams: TeamDef[] = [
  { name: 'Real Madrid CF', budget: 300_000_000, region: 'spanish' },
  { name: 'FC Barcelona', budget: 280_000_000, region: 'spanish' },
  { name: 'Manchester City', budget: 310_000_000, region: 'english' },
  { name: 'Bayern Munich', budget: 290_000_000, region: 'german' },
  { name: 'Paris Saint-Germain', budget: 320_000_000, region: 'french' },
  { name: 'Liverpool FC', budget: 260_000_000, region: 'english' },
  { name: 'Inter Milan', budget: 220_000_000, region: 'italian' },
  { name: 'Arsenal FC', budget: 250_000_000, region: 'english' },
  { name: 'Atlético Madrid', budget: 230_000_000, region: 'spanish' },
  { name: 'Borussia Dortmund', budget: 210_000_000, region: 'german' },
  { name: 'Juventus FC', budget: 240_000_000, region: 'italian' },
  { name: 'Chelsea FC', budget: 270_000_000, region: 'english' },
  { name: 'AC Milan', budget: 200_000_000, region: 'italian' },
  { name: 'SSC Napoli', budget: 190_000_000, region: 'italian' },
  { name: 'Bayer Leverkusen', budget: 180_000_000, region: 'german' },
  { name: 'Manchester United', budget: 275_000_000, region: 'english' },
  { name: 'Tottenham Hotspur', budget: 220_000_000, region: 'english' },
  { name: 'RB Leipzig', budget: 175_000_000, region: 'german' },
  { name: 'SL Benfica', budget: 160_000_000, region: 'portuguese' },
  { name: 'FC Porto', budget: 155_000_000, region: 'portuguese' },
];

const europaTeams: TeamDef[] = [
  { name: 'AS Roma', budget: 150_000_000, region: 'italian' },
  { name: 'Sevilla FC', budget: 130_000_000, region: 'spanish' },
  { name: 'Real Sociedad', budget: 120_000_000, region: 'spanish' },
  { name: 'SS Lazio', budget: 125_000_000, region: 'italian' },
  { name: 'Villarreal CF', budget: 115_000_000, region: 'spanish' },
  { name: 'AFC Ajax', budget: 110_000_000, region: 'dutch' },
  { name: 'PSV Eindhoven', budget: 105_000_000, region: 'dutch' },
  { name: 'Sporting CP', budget: 100_000_000, region: 'portuguese' },
  { name: 'Olympique Lyon', budget: 120_000_000, region: 'french' },
  { name: 'Olympique Marseille', budget: 115_000_000, region: 'french' },
  { name: 'AS Monaco', budget: 130_000_000, region: 'french' },
  { name: 'ACF Fiorentina', budget: 95_000_000, region: 'italian' },
  { name: 'Atalanta BC', budget: 100_000_000, region: 'italian' },
  { name: 'Real Betis', budget: 90_000_000, region: 'spanish' },
  { name: 'Newcastle United', budget: 140_000_000, region: 'english' },
  { name: 'West Ham United', budget: 110_000_000, region: 'english' },
  { name: 'Wolverhampton Wanderers', budget: 95_000_000, region: 'english' },
  { name: 'Aston Villa', budget: 120_000_000, region: 'english' },
  { name: 'Brighton & Hove Albion', budget: 105_000_000, region: 'english' },
  { name: 'Crystal Palace', budget: 90_000_000, region: 'english' },
];

const conferenceTeams: TeamDef[] = [
  { name: 'Feyenoord', budget: 80_000_000, region: 'dutch' },
  { name: 'Club Brugge', budget: 70_000_000, region: 'belgian' },
  { name: 'Celtic FC', budget: 65_000_000, region: 'scottish' },
  { name: 'Rangers FC', budget: 60_000_000, region: 'scottish' },
  { name: 'Olympiacos FC', budget: 55_000_000, region: 'greek' },
  { name: 'PAOK FC', budget: 45_000_000, region: 'greek' },
  { name: 'FC Basel', budget: 50_000_000, region: 'swiss' },
  { name: 'BSC Young Boys', budget: 45_000_000, region: 'swiss' },
  { name: 'Red Bull Salzburg', budget: 65_000_000, region: 'austrian' },
  { name: 'Shakhtar Donetsk', budget: 60_000_000, region: 'ukrainian' },
  { name: 'Dinamo Zagreb', budget: 40_000_000, region: 'croatian' },
  { name: 'SK Slavia Prague', budget: 42_000_000, region: 'czech' },
  { name: 'Sparta Prague', budget: 40_000_000, region: 'czech' },
  { name: 'Ferencváros TC', budget: 35_000_000, region: 'hungarian' },
  { name: 'Malmö FF', budget: 30_000_000, region: 'scandinavian' },
  { name: 'FC Copenhagen', budget: 45_000_000, region: 'scandinavian' },
  { name: 'FK Bodø/Glimt', budget: 25_000_000, region: 'scandinavian' },
  { name: 'AZ Alkmaar', budget: 55_000_000, region: 'dutch' },
  { name: 'RSC Anderlecht', budget: 60_000_000, region: 'belgian' },
  { name: 'Standard Liège', budget: 40_000_000, region: 'belgian' },
];

// ─── Name Pools by Region ───────────────────────────────
const firstNames: Record<string, string[]> = {
  spanish: ['Carlos', 'Diego', 'Alejandro', 'Pablo', 'Sergio', 'Álvaro', 'Marco', 'Lucas', 'Iker', 'Daniel', 'Adrián', 'Hugo', 'Javier', 'Raúl', 'Ángel', 'Fernando', 'Dani', 'Marcos', 'Óscar', 'Rubén', 'Iván', 'Jesús', 'Antonio', 'Miguel'],
  english: ['James', 'Harry', 'Jack', 'Oliver', 'Charlie', 'George', 'Thomas', 'William', 'Ben', 'Luke', 'Sam', 'Ryan', 'Connor', 'Joe', 'Callum', 'Nathan', 'Alex', 'Declan', 'Jordan', 'Marcus', 'Mason', 'Ethan', 'Kyle', 'Aaron'],
  german: ['Maximilian', 'Leon', 'Lukas', 'Felix', 'Jonas', 'Niklas', 'Julian', 'Florian', 'Kai', 'Timo', 'Manuel', 'Sebastian', 'Kevin', 'Patrick', 'Robin', 'Sven', 'Jamal', 'Leroy', 'Antonio', 'Thomas', 'Philipp', 'Marco', 'Bastian', 'Lars'],
  french: ['Antoine', 'Kylian', 'Ousmane', 'Adrien', 'Hugo', 'Aurélien', 'Théo', 'Moussa', 'Ibrahima', 'Dayot', 'Mattéo', 'Alexandre', 'Baptiste', 'Clément', 'Raphaël', 'Jules', 'Maxime', 'Lucas', 'Romain', 'Olivier', 'Youssouf', 'Randal', 'William', 'Nabil'],
  italian: ['Marco', 'Alessandro', 'Lorenzo', 'Matteo', 'Federico', 'Nicolò', 'Gianluca', 'Gianluigi', 'Davide', 'Luca', 'Andrea', 'Simone', 'Giacomo', 'Sandro', 'Manuel', 'Fabio', 'Roberto', 'Danilo', 'Ciro', 'Domenico', 'Giovanni', 'Salvatore', 'Stefano', 'Pietro'],
  portuguese: ['Bernardo', 'Diogo', 'Gonçalo', 'Rúben', 'Bruno', 'Rafael', 'Pedro', 'Nuno', 'João', 'André', 'Rui', 'Vitinha', 'Francisco', 'Tiago', 'Miguel', 'Fábio', 'Danilo', 'Nelson', 'Sérgio', 'Ricardo', 'António', 'Cristiano', 'Luís', 'Hélder'],
  dutch: ['Daan', 'Sem', 'Luuk', 'Frenkie', 'Matthijs', 'Jurriën', 'Memphis', 'Steven', 'Virgil', 'Cody', 'Xavi', 'Denzel', 'Daley', 'Ryan', 'Wout', 'Marten', 'Noa', 'Teun', 'Tijjani', 'Jerdy', 'Justin', 'Kenneth', 'Ian', 'Jordi'],
  brazilian: ['Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Vinícius', 'Rodrygo', 'Casemiro', 'Marquinhos', 'Richarlison', 'Bruno', 'Thiago', 'Roberto', 'Éder', 'Wendell', 'Douglas', 'Danilo', 'Alex', 'Igor', 'Bremer', 'Éderson', 'Endrick', 'Raphinha', 'Antony', 'Arthur'],
  belgian: ['Kevin', 'Romelu', 'Thibaut', 'Eden', 'Youri', 'Leandro', 'Axel', 'Jérémy', 'Amadou', 'Thorgan', 'Dries', 'Michy', 'Nacer', 'Divock', 'Timothy', 'Charles', 'Loïs', 'Dennis', 'Arthur', 'Hans'],
  scottish: ['Andrew', 'Scott', 'John', 'Kieran', 'Callum', 'Stuart', 'Craig', 'Billy', 'Lewis', 'Graeme', 'Ross', 'David', 'Ryan', 'Grant', 'Nathan', 'Greg', 'Andy', 'Liam', 'Connor', 'Jamie'],
  greek: ['Giorgos', 'Kostas', 'Dimitris', 'Thanasis', 'Vangelis', 'Nikos', 'Panagiotis', 'Anastasios', 'Sotiris', 'Petros', 'Manolis', 'Alexandros', 'Christos', 'Ioannis', 'Spyros', 'Vasilis', 'Michalis', 'Stavros', 'Yannis', 'Achilleas'],
  swiss: ['Granit', 'Xherdan', 'Manuel', 'Yann', 'Ricardo', 'Breel', 'Denis', 'Remo', 'Noah', 'Dan', 'Fabian', 'Renato', 'Djibril', 'Silvan', 'Ruben', 'Leonidas', 'Nico', 'Cédric', 'Eray', 'Ardon'],
  austrian: ['David', 'Marcel', 'Konrad', 'Marko', 'Christoph', 'Stefan', 'Patrick', 'Michael', 'Valentino', 'Romano', 'Nicolas', 'Florian', 'Alexander', 'Maximilian', 'Philipp', 'Kevin', 'Gernot', 'Martin', 'Christopher', 'Lukas'],
  ukrainian: ['Oleksandr', 'Andriy', 'Mykhailo', 'Vitaliy', 'Ruslan', 'Taras', 'Serhiy', 'Viktor', 'Dmytro', 'Bohdan', 'Ilya', 'Artem', 'Roman', 'Denys', 'Yevhen', 'Vladyslav', 'Maksym', 'Heorhiy', 'Valeriy', 'Ihor'],
  croatian: ['Luka', 'Ivan', 'Mateo', 'Marcelo', 'Joško', 'Josip', 'Ante', 'Mario', 'Nikola', 'Dominik', 'Lovro', 'Andrej', 'Borna', 'Duje', 'Mislav', 'Domagoj', 'Kristijan', 'Bruno', 'Martin', 'Filip'],
  czech: ['Tomáš', 'Patrik', 'Vladimír', 'Ondřej', 'Adam', 'Jan', 'Petr', 'Jakub', 'David', 'Michal', 'Lukáš', 'Matěj', 'Pavel', 'Martin', 'Ladislav', 'Robin', 'Václav', 'West', 'Alex', 'Mojmír'],
  hungarian: ['Dominik', 'Willi', 'Péter', 'Roland', 'Zsolt', 'Dániel', 'Ádám', 'Barnabás', 'Bálint', 'Attila', 'László', 'Tamás', 'Gábor', 'István', 'Kevin', 'Loïc', 'Bendegúz', 'Márton', 'Endre', 'Botond'],
  scandinavian: ['Emil', 'Oscar', 'Viktor', 'Rasmus', 'Alexander', 'Marcus', 'Isak', 'Dejan', 'Erling', 'Martin', 'Sander', 'Kristoffer', 'Jens', 'Jonas', 'Fredrik', 'Sebastian', 'Hugo', 'Ludwig', 'Jesper', 'Mikael'],
};

const lastNames: Record<string, string[]> = {
  spanish: ['García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'Sánchez', 'González', 'Pérez', 'Fernández', 'Torres', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Díaz', 'Navarro', 'Ruiz', 'Gil', 'Serrano', 'Ramos', 'Vázquez', 'Blanco', 'Castro', 'Ortega'],
  english: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Wilson', 'Taylor', 'Davis', 'Clark', 'Moore', 'White', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Green', 'Baker', 'Adams', 'Campbell', 'Mitchell', 'Roberts', 'Phillips'],
  german: ['Müller', 'Schmidt', 'Weber', 'Fischer', 'Wagner', 'Becker', 'Schäfer', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neuer', 'Schwarz', 'Zimmermann', 'Braun', 'Hartmann', 'Krüger', 'Werner', 'Lange', 'Kraus', 'Lehmann', 'Kaiser', 'Dietrich', 'Engel'],
  french: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefèvre', 'Leroy', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Mercier', 'Blanc', 'Ndiaye', 'Konaté', 'Dembélé'],
  italian: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'Costa', 'De Luca', 'Giordano', 'Mancini', 'Barbieri', 'Fontana', 'Rinaldi', 'Pellegrini', 'Marchetti', 'Serra', 'Moretti'],
  portuguese: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Mendes', 'Sousa', 'Neves', 'Ramos', 'Vieira', 'Dias'],
  dutch: ['De Jong', 'Van Dijk', 'De Vrij', 'Bakker', 'Visser', 'De Boer', 'Jansen', 'Van der Berg', 'Smit', 'Mulder', 'De Groot', 'Bos', 'Peters', 'Hendriks', 'Dekker', 'Brouwer', 'Kok', 'De Graaf', 'Van Leeuwen', 'Willems', 'Vermeer', 'Van Beek', 'Kuipers', 'Schouten'],
  brazilian: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Ferreira', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Ribeiro', 'Carvalho', 'Gomes', 'Militão', 'Martins', 'Rocha', 'Barbosa', 'Nunes', 'Moreira', 'Cavalcanti', 'Teixeira', 'Correia', 'Cardoso'],
  belgian: ['De Bruyne', 'Courtois', 'Hazard', 'Lukaku', 'Tielemans', 'Witsel', 'Mertens', 'Carrasco', 'Onana', 'Dendoncker', 'Vanaken', 'Vertonghen', 'Alderweireld', 'Castagne', 'Theate', 'De Ketelaere', 'Openda', 'Doku', 'Trossard', 'Saelemaekers'],
  scottish: ['McGregor', 'Robertson', 'McGinn', 'Tierney', 'Christie', 'McKenna', 'Fraser', 'Armstrong', 'McLean', 'Gilmour', 'Patterson', 'Porteous', 'Ralston', 'Turnbull', 'Ferguson', 'Stewart', 'Campbell', 'Hamilton', 'MacDonald', 'Murray'],
  greek: ['Papadopoulos', 'Mavropanos', 'Tzolis', 'Bakasetas', 'Mantalos', 'Galanopoulos', 'Tsimikas', 'Kourbelis', 'Pavlidis', 'Ioannidis', 'Fortounis', 'Limnios', 'Chatzigiovannis', 'Pelkas', 'Douvikas', 'Konstantelias', 'Siopis', 'Vlachodimos', 'Giannoulis', 'Tzavellas'],
  swiss: ['Xhaka', 'Shaqiri', 'Akanji', 'Sommer', 'Rodríguez', 'Embolo', 'Zakaria', 'Freuler', 'Okafor', 'Steffen', 'Widmer', 'Elvedi', 'Seferović', 'Zuber', 'Vargas', 'Mbabu', 'Cömert', 'Ndoye', 'Jashari', 'Rieder'],
  austrian: ['Alaba', 'Arnautović', 'Sabitzer', 'Laimer', 'Schlager', 'Lainer', 'Posch', 'Danso', 'Wöber', 'Seiwald', 'Wimmer', 'Grillitsch', 'Kalajdžić', 'Gregoritsch', 'Baumgartner', 'Trauner', 'Lienhart', 'Prass', 'Schmid', 'Querfeld'],
  ukrainian: ['Zinchenko', 'Dovbyk', 'Tsygankov', 'Mudryk', 'Mykolenko', 'Sydorchuk', 'Yaremchuk', 'Malinovsky', 'Yarmolenko', 'Trubin', 'Zabarnyi', 'Bondar', 'Tymchyk', 'Stepanenko', 'Buyalskiy', 'Shaparenko', 'Sudakov', 'Lunin', 'Vanat', 'Pikhalyonok'],
  croatian: ['Modrić', 'Perišić', 'Kovačić', 'Brozović', 'Kramarić', 'Gvardiol', 'Šutalo', 'Sučić', 'Pašalić', 'Vlašić', 'Livaja', 'Petković', 'Juranović', 'Stanišić', 'Erlić', 'Ivanušec', 'Majer', 'Budimir', 'Pongračić', 'Baturina'],
  czech: ['Schick', 'Souček', 'Barák', 'Coufal', 'Hložek', 'Provod', 'Ševčík', 'Zelený', 'Král', 'Černý', 'Krejčí', 'Hranáč', 'Vitík', 'Červ', 'Šulc', 'Lingr', 'Jurásek', 'Staněk', 'Kovář', 'Vlček'],
  hungarian: ['Szoboszlai', 'Szalai', 'Gulácsi', 'Orbán', 'Kerkez', 'Sallai', 'Kleinheisler', 'Nagy', 'Fiola', 'Gazdag', 'Styles', 'Bolla', 'Dárdai', 'Schäfer', 'Nego', 'Csoboth', 'Ádám', 'Horváth', 'Dibusz', 'Varga'],
  scandinavian: ['Haaland', 'Ødegaard', 'Isak', 'Kulusevski', 'Eriksen', 'Højlund', 'Kristiansen', 'Skov Olsen', 'Lindström', 'Gyökeres', 'Forsberg', 'Lindelöf', 'Berge', 'Sörloth', 'Nyland', 'Wind', 'Hjulmand', 'Maehle', 'Svensson', 'Augustinsson'],
};

// ─── Squad Template ─────────────────────────────────────
const squadTemplate: { position: Position; count: number }[] = [
  { position: 'GK', count: 2 },
  { position: 'CB', count: 4 },
  { position: 'RB', count: 2 },
  { position: 'LB', count: 2 },
  { position: 'CDM', count: 2 },
  { position: 'CM', count: 3 },
  { position: 'CAM', count: 1 },
  { position: 'RW', count: 2 },
  { position: 'LW', count: 2 },
  { position: 'ST', count: 3 },
]; // = 23 players per team

// ─── Owner Usernames ────────────────────────────────────
const ownerUsernames = [
  'KingKev_VCM', 'ShadowStrike99', 'NeonGoal', 'BlazeRunner', 'IronWall_GG',
  'CyberFalcon', 'StormBreaker22', 'DarkPhoenix_X', 'VoltageViper', 'LunarTide',
  'FrostByte_FC', 'TurboKick', 'NightHawk_Pro', 'ThunderBolt7', 'PixelPitch',
  'CrimsonTactix', 'GhostMidfield', 'WarpSpeed_11', 'DragonFlick', 'NovaStrike',
  'ZenithFC', 'RapidRiser', 'CosmicGoalie', 'IronClad_CM', 'VenomPass',
  'SteelNerve', 'BlitzKrieg_10', 'SonicWinger', 'MysticBoot', 'TitanDefender',
  'PhantomDrib', 'RebelKicker', 'ArcticFox_FC', 'MaverickMid', 'PulseFC_88',
  'ViperVault', 'OmegaFinish', 'HyperLinkUp', 'SilverBullet9', 'GalacticGK',
  'NitroPress', 'CobaltEdge', 'InfernoFC_7', 'FlashPoint22', 'QuantumKeep',
  'SpartanRun', 'OrionTactic', 'EclipseBoss', 'CrypticWing', 'HelixStrike',
  'TalonFC_Pro', 'AvalancheKB', 'ZephyrPlay', 'EmberShot', 'PrismMaster',
  'VortexCM_11', 'AxisControl', 'NebulaBoot', 'CatalystFC', 'VertexGoal',
];

// ─── Player Generation Helpers ──────────────────────────
function generateOverall(tier: 'champions' | 'europa' | 'conference', position: Position, index: number): number {
  // First players at each position are starters (higher rated)
  const isStarter = index === 0 || (position === 'CB' && index <= 1) || (position === 'CM' && index <= 1) || (position === 'ST' && index <= 1);

  const ranges = {
    champions: { starterMin: 80, starterMax: 92, benchMin: 72, benchMax: 80 },
    europa: { starterMin: 75, starterMax: 84, benchMin: 68, benchMax: 76 },
    conference: { starterMin: 68, starterMax: 78, benchMin: 62, benchMax: 70 },
  };

  const r = ranges[tier];
  if (isStarter) {
    return randInt(r.starterMin, r.starterMax);
  }
  return randInt(r.benchMin, r.benchMax);
}

function generateAge(overall: number): number {
  // Higher rated players tend to be in their prime (25-31)
  if (overall >= 85) return randInt(25, 32);
  if (overall >= 78) return randInt(23, 30);
  if (overall >= 70) return randInt(20, 29);
  return randInt(18, 24); // Lower rated = younger prospects
}

function generatePotential(overall: number, age: number): number {
  if (age <= 22) return Math.min(99, overall + randInt(5, 15));
  if (age <= 25) return Math.min(99, overall + randInt(2, 8));
  if (age <= 29) return Math.min(99, overall + randInt(0, 3));
  return overall; // Veterans have reached their ceiling
}

function generateWeakFoot(): number {
  const roll = rng();
  if (roll < 0.05) return 5;
  if (roll < 0.25) return 4;
  if (roll < 0.65) return 3;
  return 2;
}

// ─── Generate Round-Robin Schedule ──────────────────────
function generateDoubleRoundRobin(numTeams: number): { home: number; away: number }[][] {
  const teams = Array.from({ length: numTeams }, (_, i) => i);
  const firstHalf: { home: number; away: number }[][] = [];

  for (let round = 0; round < numTeams - 1; round++) {
    const matches: { home: number; away: number }[] = [];
    for (let i = 0; i < numTeams / 2; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];
      // Alternate home/away for team 0 to keep it fair
      if (i === 0 && round % 2 === 1) {
        matches.push({ home: away, away: home });
      } else {
        matches.push({ home, away });
      }
    }
    firstHalf.push(matches);

    // Rotate: fix teams[0], rotate the rest clockwise
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  // Second half: reverse home/away
  const secondHalf = firstHalf.map(round =>
    round.map(m => ({ home: m.away, away: m.home }))
  );

  return [...firstHalf, ...secondHalf];
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  // ─── Seed Skill Groups & Skills ─────────────────────────
  const skillGroupsData = [
    {
      name: 'Pace',
      sortOrder: 1,
      skills: [
        { name: 'Acceleration', sortOrder: 1 },
        { name: 'Sprint Speed', sortOrder: 2 },
      ],
    },
    {
      name: 'Shooting',
      sortOrder: 2,
      skills: [
        { name: 'Positioning', sortOrder: 1 },
        { name: 'Finishing', sortOrder: 2 },
        { name: 'Shot Power', sortOrder: 3 },
        { name: 'Long Shots', sortOrder: 4 },
        { name: 'Volleys', sortOrder: 5 },
        { name: 'Penalties', sortOrder: 6 },
      ],
    },
    {
      name: 'Passing',
      sortOrder: 3,
      skills: [
        { name: 'Vision', sortOrder: 1 },
        { name: 'Crossing', sortOrder: 2 },
        { name: 'FK Accuracy', sortOrder: 3 },
        { name: 'Short Passing', sortOrder: 4 },
        { name: 'Long Passing', sortOrder: 5 },
        { name: 'Curve', sortOrder: 6 },
      ],
    },
    {
      name: 'Dribbling',
      sortOrder: 4,
      skills: [
        { name: 'Agility', sortOrder: 1 },
        { name: 'Balance', sortOrder: 2 },
        { name: 'Reactions', sortOrder: 3 },
        { name: 'Ball Control', sortOrder: 4 },
        { name: 'Dribbling', sortOrder: 5 },
        { name: 'Composure', sortOrder: 6 },
      ],
    },
    {
      name: 'Defending',
      sortOrder: 5,
      skills: [
        { name: 'Interceptions', sortOrder: 1 },
        { name: 'Heading Accuracy', sortOrder: 2 },
        { name: 'Def. Awareness', sortOrder: 3 },
        { name: 'Standing Tackle', sortOrder: 4 },
        { name: 'Sliding Tackle', sortOrder: 5 },
      ],
    },
    {
      name: 'Physical',
      sortOrder: 6,
      skills: [
        { name: 'Jumping', sortOrder: 1 },
        { name: 'Stamina', sortOrder: 2 },
        { name: 'Strength', sortOrder: 3 },
        { name: 'Aggression', sortOrder: 4 },
      ],
    },
  ];

  for (const groupData of skillGroupsData) {
    const group = await prisma.skillGroup.upsert({
      where: { name: groupData.name },
      update: { sortOrder: groupData.sortOrder },
      create: { name: groupData.name, sortOrder: groupData.sortOrder },
    });

    for (const skillData of groupData.skills) {
      await prisma.skillDefinition.upsert({
        where: { name: skillData.name },
        update: { sortOrder: skillData.sortOrder, skillGroupId: group.id },
        create: {
          name: skillData.name,
          skillGroupId: group.id,
          defaultValue: 50,
          sortOrder: skillData.sortOrder,
        },
      });
    }

    console.log(`Seeded skill group: ${groupData.name} (${groupData.skills.length} skills)`);
  }

  // ─── Seed Player Role Definitions ─────────────────────────
  const playerRolesData: { name: string; position: string; description?: string; sortOrder: number }[] = [
    { name: 'Goalkeeper', position: 'GK', description: 'Standard goalkeeper', sortOrder: 1 },
    { name: 'Sweeper Keeper', position: 'GK', description: 'Goalkeeper who plays high up the pitch', sortOrder: 2 },
    { name: 'Ball-Playing Defender', position: 'CB', description: 'Center back comfortable on the ball', sortOrder: 1 },
    { name: 'Stopper', position: 'CB', description: 'Aggressive center back', sortOrder: 2 },
    { name: 'Fullback', position: 'RB', sortOrder: 1 },
    { name: 'Wingback', position: 'RB', description: 'Attacking fullback', sortOrder: 2 },
    { name: 'Falseback', position: 'RB', description: 'Inverted fullback who tucks inside', sortOrder: 3 },
    { name: 'Fullback', position: 'LB', sortOrder: 1 },
    { name: 'Wingback', position: 'LB', description: 'Attacking fullback', sortOrder: 2 },
    { name: 'Falseback', position: 'LB', description: 'Inverted fullback who tucks inside', sortOrder: 3 },
    { name: 'Holding', position: 'CDM', description: 'Stays back to shield the defence', sortOrder: 1 },
    { name: 'Centre-Half', position: 'CDM', description: 'Drops between centre-backs', sortOrder: 2 },
    { name: 'Deep-Lying Playmaker', position: 'CDM', description: 'Dictates play from deep', sortOrder: 3 },
    { name: 'Box-to-Box', position: 'CM', description: 'Covers the full length of the pitch', sortOrder: 1 },
    { name: 'Deep-Lying Playmaker', position: 'CM', description: 'Dictates play from deep', sortOrder: 2 },
    { name: 'Playmaker', position: 'CM', description: 'Creative central midfielder', sortOrder: 3 },
    { name: 'Playmaker', position: 'CAM', description: 'Creative attacking midfielder', sortOrder: 1 },
    { name: 'Shadow Striker', position: 'CAM', description: 'Plays close to the striker', sortOrder: 2 },
    { name: 'Half-Winger', position: 'CAM', description: 'Drifts wide from central position', sortOrder: 3 },
    { name: 'Winger', position: 'RM', description: 'Stays wide and delivers crosses', sortOrder: 1 },
    { name: 'Wide Midfielder', position: 'RM', description: 'Balanced wide role', sortOrder: 2 },
    { name: 'Winger', position: 'LM', description: 'Stays wide and delivers crosses', sortOrder: 1 },
    { name: 'Wide Midfielder', position: 'LM', description: 'Balanced wide role', sortOrder: 2 },
    { name: 'Winger', position: 'RW', description: 'Hugs the touchline', sortOrder: 1 },
    { name: 'Inside Forward', position: 'RW', description: 'Cuts inside to shoot', sortOrder: 2 },
    { name: 'Wide Playmaker', position: 'RW', description: 'Creative wide player', sortOrder: 3 },
    { name: 'Winger', position: 'LW', description: 'Hugs the touchline', sortOrder: 1 },
    { name: 'Inside Forward', position: 'LW', description: 'Cuts inside to shoot', sortOrder: 2 },
    { name: 'Wide Playmaker', position: 'LW', description: 'Creative wide player', sortOrder: 3 },
    { name: 'False 9', position: 'CF', description: 'Drops deep to create space', sortOrder: 1 },
    { name: 'Target Forward', position: 'CF', description: 'Physical focal point', sortOrder: 2 },
    { name: 'Advanced Forward', position: 'ST', description: 'Plays on the last defender', sortOrder: 1 },
    { name: 'Poacher', position: 'ST', description: 'Goal-focused striker', sortOrder: 2 },
    { name: 'Target Forward', position: 'ST', description: 'Physical focal point', sortOrder: 3 },
  ];

  for (const roleData of playerRolesData) {
    await prisma.playerRoleDefinition.upsert({
      where: {
        name_position: { name: roleData.name, position: roleData.position as any },
      },
      update: { description: roleData.description, sortOrder: roleData.sortOrder },
      create: {
        name: roleData.name,
        position: roleData.position as any,
        description: roleData.description,
        sortOrder: roleData.sortOrder,
      },
    });
  }
  console.log(`Seeded ${playerRolesData.length} player role definitions`);

  // ─── Seed Play Style Definitions ────────────────────────
  const allOutfieldPositions = ['RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'] as const;
  const attackingPositions = ['CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'] as const;
  const defendingPositions = ['RB', 'CB', 'LB', 'CDM'] as const;

  const playStyleTemplates: { name: string; positions: readonly string[]; description?: string; sortOrder: number }[] = [
    { name: 'Finesse Shot', positions: attackingPositions, description: 'Curls shots into the corner', sortOrder: 1 },
    { name: 'Power Shot', positions: attackingPositions, description: 'Powerful strikes on goal', sortOrder: 2 },
    { name: 'Chip Shot', positions: attackingPositions, description: 'Lobs the keeper with finesse', sortOrder: 3 },
    { name: 'Trivela', positions: allOutfieldPositions, description: 'Uses outside of the foot', sortOrder: 4 },
    { name: 'Pinged Pass', positions: allOutfieldPositions, description: 'Accurate long-range passes', sortOrder: 5 },
    { name: 'Incisive Pass', positions: ['CM', 'CAM', 'CDM', 'CF'], description: 'Threading through balls', sortOrder: 6 },
    { name: 'Whipped Pass', positions: ['RB', 'LB', 'RM', 'LM', 'RW', 'LW'], description: 'Delivers whipped crosses', sortOrder: 7 },
    { name: 'Tiki Taka', positions: allOutfieldPositions, description: 'Quick one-touch passing', sortOrder: 8 },
    { name: 'Press Proven', positions: allOutfieldPositions, description: 'Stays composed under pressure', sortOrder: 9 },
    { name: 'Rapid', positions: allOutfieldPositions, description: 'Explosive acceleration', sortOrder: 10 },
    { name: 'Technical', positions: allOutfieldPositions, description: 'Excellent close control', sortOrder: 11 },
    { name: 'Bruiser', positions: defendingPositions, description: 'Physical and aggressive in challenges', sortOrder: 12 },
    { name: 'Intercept', positions: defendingPositions, description: 'Reads the game to intercept passes', sortOrder: 13 },
    { name: 'Jockey', positions: defendingPositions, description: 'Expert at containing attackers', sortOrder: 14 },
    { name: 'Aerial', positions: ['CB', 'ST', 'CF'], description: 'Dominant in the air', sortOrder: 15 },
    { name: 'Acrobatic', positions: ['GK'], description: 'Spectacular shot-stopping', sortOrder: 16 },
    { name: 'Rushing', positions: ['GK'], description: 'Quick off the line', sortOrder: 17 },
    { name: 'Far Reach', positions: ['GK'], description: 'Extended diving reach', sortOrder: 18 },
    { name: 'Footwork', positions: ['GK'], description: 'Good with feet for distribution', sortOrder: 19 },
  ];

  let playStyleCount = 0;
  for (const template of playStyleTemplates) {
    for (const position of template.positions) {
      await prisma.playStyleDefinition.upsert({
        where: {
          name_position: { name: template.name, position: position as any },
        },
        update: { description: template.description, sortOrder: template.sortOrder },
        create: {
          name: template.name,
          position: position as any,
          description: template.description,
          sortOrder: template.sortOrder,
        },
      });
      playStyleCount++;
    }
  }
  console.log(`Seeded ${playStyleCount} play style definitions`);

  // ─── Seed League Settings ─────────────────────────────────
  const leagueSettings = [
    { key: 'waiver_period_days', value: '3' },
    { key: 'trade_offer_expiry_days', value: '7' },
    { key: 'free_agency_cost_percent', value: '50' },
  ];

  for (const setting of leagueSettings) {
    await prisma.leagueSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`Seeded ${leagueSettings.length} league settings`);

  // ═════════════════════════════════════════════════════════
  // COMPETITIONS, TEAMS, PLAYERS & SCHEDULE
  // ═════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════');
  console.log('  Seeding Competitions, Teams & Players');
  console.log('══════════════════════════════════════════════\n');

  // Fetch all skill definitions for player skill generation
  const skillDefs = await prisma.skillDefinition.findMany({
    include: { skillGroup: true },
    orderBy: { skillGroup: { sortOrder: 'asc' } },
  });
  console.log(`Found ${skillDefs.length} skill definitions for player generation`);

  // ─── Clean Previous Seed Data ─────────────────────────────
  // Delete in FK-safe order. Only deletes data from previous seed runs.
  console.log('Cleaning previous seed data...');
  await prisma.matchPlayerStat.deleteMany({});
  await prisma.matchSubstitution.deleteMany({});
  await prisma.matchLineupEntry.deleteMany({});
  await prisma.timeProposal.deleteMany({});
  await prisma.matchMessage.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.competitionTeam.deleteMany({});
  await prisma.competition.deleteMany({});
  await prisma.playerPlayStyleAssignment.deleteMany({});
  await prisma.playerRoleAssignment.deleteMany({});
  await prisma.playerPosition.deleteMany({});
  await prisma.playerSkill.deleteMany({});
  await prisma.tradeOfferPlayer.deleteMany({});
  await prisma.tradeOffer.deleteMany({});
  await prisma.waiverBid.deleteMany({});
  await prisma.waiverWire.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.itemUsageLog.deleteMany({});
  await prisma.teamItem.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({ where: { discordId: { startsWith: 'seed_' } } });
  console.log('Clean complete.');

  // ─── Create Admin User ────────────────────────────────────
  const adminDiscordId = process.env.ADMIN_DISCORD_ID;
  let adminUser: any = null;
  if (adminDiscordId) {
    adminUser = await prisma.user.upsert({
      where: { discordId: adminDiscordId },
      update: { role: 'ADMIN' },
      create: {
        discordId: adminDiscordId,
        discordUsername: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log(`Admin user seeded: ${adminUser.id}`);
  }

  // ─── Create Owner Users ───────────────────────────────────
  console.log('Creating 60 owner users...');
  const users: { id: string; discordUsername: string }[] = [];
  for (const username of ownerUsernames) {
    const user = await prisma.user.create({
      data: {
        discordId: `seed_${username.toLowerCase()}`,
        discordUsername: username,
        discordAvatar: null,
        role: 'OWNER',
      },
    });
    users.push(user);
  }
  console.log(`Created ${users.length} owner users`);

  // ─── Create Teams ─────────────────────────────────────────
  const allTeamDefs: { def: TeamDef; tier: 'champions' | 'europa' | 'conference' }[] = [
    ...championsTeams.map(d => ({ def: d, tier: 'champions' as const })),
    ...europaTeams.map(d => ({ def: d, tier: 'europa' as const })),
    ...conferenceTeams.map(d => ({ def: d, tier: 'conference' as const })),
  ];

  console.log('Creating 60 teams...');
  const teams: { id: string; name: string; tier: 'champions' | 'europa' | 'conference'; region: string }[] = [];
  for (let i = 0; i < allTeamDefs.length; i++) {
    const { def, tier } = allTeamDefs[i];
    const team = await prisma.team.create({
      data: {
        name: def.name,
        budget: def.budget,
        ownerId: users[i].id,
      },
    });
    teams.push({ id: team.id, name: team.name, tier, region: def.region });
  }
  console.log(`Created ${teams.length} teams`);

  // ─── Create Competitions ──────────────────────────────────
  console.log('Creating 3 competitions...');
  const championsComp = await prisma.competition.create({
    data: {
      name: 'VCM Champions League',
      type: 'DOUBLE_ROUND_ROBIN',
      status: 'ACTIVE',
      config: { matchesPerWeek: 4, tier: 'champions' },
    },
  });
  const europaComp = await prisma.competition.create({
    data: {
      name: 'VCM Europa League',
      type: 'DOUBLE_ROUND_ROBIN',
      status: 'ACTIVE',
      config: { matchesPerWeek: 4, tier: 'europa' },
    },
  });
  const conferenceComp = await prisma.competition.create({
    data: {
      name: 'VCM Conference League',
      type: 'DOUBLE_ROUND_ROBIN',
      status: 'ACTIVE',
      config: { matchesPerWeek: 4, tier: 'conference' },
    },
  });
  console.log('Competitions created: Champions, Europa, Conference');

  // ─── Assign Teams to Competitions ─────────────────────────
  const championsTeamIds = teams.filter(t => t.tier === 'champions');
  const europaTeamIds = teams.filter(t => t.tier === 'europa');
  const conferenceTeamIds = teams.filter(t => t.tier === 'conference');

  const competitionAssignments = [
    { compId: championsComp.id, teams: championsTeamIds },
    { compId: europaComp.id, teams: europaTeamIds },
    { compId: conferenceComp.id, teams: conferenceTeamIds },
  ];

  for (const { compId, teams: compTeams } of competitionAssignments) {
    await prisma.competitionTeam.createMany({
      data: compTeams.map((t, idx) => ({
        competitionId: compId,
        teamId: t.id,
        seed: idx + 1,
      })),
    });
  }
  console.log('Assigned 20 teams to each competition');

  // ─── Generate Players ─────────────────────────────────────
  console.log('Generating players for all 60 teams...');

  // Track used name combos to avoid duplicates
  const usedNames = new Set<string>();

  function generateUniqueName(region: string): { firstName: string; lastName: string } {
    const fNames = firstNames[region] || firstNames.english;
    const lNames = lastNames[region] || lastNames.english;
    let attempts = 0;
    while (attempts < 100) {
      // Mix in some international players (30% chance)
      const useRegion = rng() < 0.7 ? region : pick(Object.keys(firstNames));
      const fPool = firstNames[useRegion] || firstNames.english;
      const lPool = lastNames[useRegion] || lastNames.english;
      const first = pick(fPool);
      const last = pick(lPool);
      const key = `${first}_${last}`;
      if (!usedNames.has(key)) {
        usedNames.add(key);
        return { firstName: first, lastName: last };
      }
      attempts++;
    }
    // Fallback: append a number
    const first = pick(fNames);
    const last = pick(lNames);
    const key = `${first}_${last}_${usedNames.size}`;
    usedNames.add(key);
    return { firstName: first, lastName: last };
  }

  // Skill generation based on position and overall
  function generateSkillValue(skillGroupName: string, position: Position, overall: number): number {
    const base = overall;
    let modifier = 0;

    // Position-specific skill tendencies
    if (position === 'GK') {
      if (skillGroupName === 'Defending') modifier = randInt(5, 15);
      else if (skillGroupName === 'Physical') modifier = randInt(-5, 5);
      else if (skillGroupName === 'Shooting') modifier = randInt(-30, -15);
      else if (skillGroupName === 'Passing') modifier = randInt(-15, -5);
      else if (skillGroupName === 'Dribbling') modifier = randInt(-20, -10);
      else if (skillGroupName === 'Pace') modifier = randInt(-15, 0);
    } else if (['CB', 'RB', 'LB'].includes(position)) {
      if (skillGroupName === 'Defending') modifier = randInt(3, 12);
      else if (skillGroupName === 'Physical') modifier = randInt(0, 8);
      else if (skillGroupName === 'Shooting') modifier = randInt(-15, -5);
      else if (skillGroupName === 'Passing') modifier = randInt(-5, 5);
      else if (skillGroupName === 'Dribbling') modifier = randInt(-8, 2);
      else if (skillGroupName === 'Pace') modifier = position === 'CB' ? randInt(-8, 2) : randInt(0, 8);
    } else if (['CDM', 'CM'].includes(position)) {
      if (skillGroupName === 'Defending') modifier = position === 'CDM' ? randInt(2, 10) : randInt(-5, 5);
      else if (skillGroupName === 'Physical') modifier = randInt(-3, 7);
      else if (skillGroupName === 'Shooting') modifier = randInt(-8, 3);
      else if (skillGroupName === 'Passing') modifier = randInt(2, 10);
      else if (skillGroupName === 'Dribbling') modifier = randInt(-2, 6);
      else if (skillGroupName === 'Pace') modifier = randInt(-5, 3);
    } else if (['CAM', 'RM', 'LM', 'RW', 'LW'].includes(position)) {
      if (skillGroupName === 'Defending') modifier = randInt(-15, -5);
      else if (skillGroupName === 'Physical') modifier = randInt(-8, 2);
      else if (skillGroupName === 'Shooting') modifier = randInt(0, 8);
      else if (skillGroupName === 'Passing') modifier = randInt(2, 10);
      else if (skillGroupName === 'Dribbling') modifier = randInt(3, 12);
      else if (skillGroupName === 'Pace') modifier = randInt(2, 10);
    } else if (['ST', 'CF'].includes(position)) {
      if (skillGroupName === 'Defending') modifier = randInt(-20, -10);
      else if (skillGroupName === 'Physical') modifier = randInt(-3, 7);
      else if (skillGroupName === 'Shooting') modifier = randInt(5, 15);
      else if (skillGroupName === 'Passing') modifier = randInt(-8, 3);
      else if (skillGroupName === 'Dribbling') modifier = randInt(0, 8);
      else if (skillGroupName === 'Pace') modifier = randInt(-2, 8);
    }

    // Add individual variation
    const variation = randInt(-4, 4);
    return Math.max(30, Math.min(99, base + modifier + variation));
  }

  let totalPlayers = 0;
  let totalSkills = 0;
  let totalPositions = 0;

  for (const team of teams) {
    const playerData: {
      id: string;
      firstName: string;
      lastName: string;
      age: number;
      primaryPosition: Position;
      overall: number;
      weakFoot: number;
      potential: number;
      teamId: string;
    }[] = [];

    for (const slot of squadTemplate) {
      for (let idx = 0; idx < slot.count; idx++) {
        const { firstName, lastName } = generateUniqueName(team.region);
        const overall = generateOverall(team.tier, slot.position, idx);
        const age = generateAge(overall);
        const potential = generatePotential(overall, age);
        const weakFoot = generateWeakFoot();

        playerData.push({
          id: crypto.randomUUID(),
          firstName,
          lastName,
          age,
          primaryPosition: slot.position,
          overall,
          weakFoot,
          potential,
          teamId: team.id,
        });
      }
    }

    // Bulk create players
    await prisma.player.createMany({ data: playerData });
    totalPlayers += playerData.length;

    // Bulk create primary positions
    const positionData = playerData.map(p => ({
      playerId: p.id,
      position: p.primaryPosition,
      isPrimary: true,
    }));
    await prisma.playerPosition.createMany({ data: positionData });
    totalPositions += positionData.length;

    // Bulk create skills for each player
    const skillData: { playerId: string; skillDefinitionId: string; value: number }[] = [];
    for (const player of playerData) {
      for (const skillDef of skillDefs) {
        skillData.push({
          playerId: player.id,
          skillDefinitionId: skillDef.id,
          value: generateSkillValue(skillDef.skillGroup.name, player.primaryPosition, player.overall),
        });
      }
    }
    await prisma.playerSkill.createMany({ data: skillData });
    totalSkills += skillData.length;
  }

  console.log(`Created ${totalPlayers} players`);
  console.log(`Created ${totalPositions} player positions`);
  console.log(`Created ${totalSkills} player skills`);

  // ─── Generate Schedules ───────────────────────────────────
  console.log('\nGenerating double round-robin schedules...');

  const competitions = [
    { comp: championsComp, teams: championsTeamIds },
    { comp: europaComp, teams: europaTeamIds },
    { comp: conferenceComp, teams: conferenceTeamIds },
  ];

  let totalRounds = 0;
  let totalMatches = 0;

  // Season starts September 2026
  const seasonStart = new Date('2026-09-01T19:00:00Z');

  for (const { comp, teams: compTeams } of competitions) {
    const schedule = generateDoubleRoundRobin(compTeams.length);
    // schedule has 38 rounds (19 per half), each with 10 matches

    for (let roundIdx = 0; roundIdx < schedule.length; roundIdx++) {
      const matchWeek = Math.floor(roundIdx / 4) + 1;
      const dayInWeek = (roundIdx % 4) + 1;
      const roundNumber = roundIdx + 1;
      const roundName = `Match Week ${matchWeek} - Day ${dayInWeek}`;

      // Schedule dates: each match week is ~1 real week apart
      // Within a match week, days are spaced 1-2 days apart
      const weekOffset = (matchWeek - 1) * 7;
      const dayOffset = (dayInWeek - 1) * 2; // Games every 2 days within a week
      const scheduledDate = new Date(seasonStart);
      scheduledDate.setDate(scheduledDate.getDate() + weekOffset + dayOffset);

      const round = await prisma.round.create({
        data: {
          competitionId: comp.id,
          roundNumber,
          name: roundName,
        },
      });
      totalRounds++;

      const matchData = schedule[roundIdx].map((m, mIdx) => ({
        roundId: round.id,
        homeTeamId: compTeams[m.home].id,
        awayTeamId: compTeams[m.away].id,
        matchNumber: mIdx + 1,
        scheduledAt: scheduledDate,
        status: 'SCHEDULED' as const,
      }));

      await prisma.match.createMany({ data: matchData });
      totalMatches += matchData.length;
    }

    console.log(`  ${comp.name}: 38 rounds, ${schedule.length * 10} matches`);
  }

  console.log(`\nTotal rounds created: ${totalRounds}`);
  console.log(`Total matches created: ${totalMatches}`);

  // ─── Summary ──────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('══════════════════════════════════════════════');
  console.log(`  Competitions:  3`);
  console.log(`  Teams:         ${teams.length}`);
  console.log(`  Owners:        ${users.length}`);
  console.log(`  Players:       ${totalPlayers}`);
  console.log(`  Skills:        ${totalSkills}`);
  console.log(`  Rounds:        ${totalRounds}`);
  console.log(`  Matches:       ${totalMatches}`);
  console.log(`  Match Weeks:   10 per competition (4 games/team/week)`);
  console.log('══════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
