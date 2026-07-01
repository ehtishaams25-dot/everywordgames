import fs from "fs";
import path from "path";
import sharp from "sharp";

const ARTWORK_DIR = path.resolve("public/superheroes/artwork");
const SILHOUETTE_DIR = path.resolve("public/superheroes/silhouettes");
const DATA_DIR_PUBLIC = path.resolve("public/data");
const DATA_DIR_SRC = path.resolve("src/data");

[ARTWORK_DIR, SILHOUETTE_DIR, DATA_DIR_PUBLIC, DATA_DIR_SRC].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface RawAkababHero {
  id: number;
  name: string;
  slug: string;
  powerstats: {
    intelligence: number;
    strength: number;
    speed: number;
    durability: number;
    power: number;
    combat: number;
  };
  appearance: {
    gender: string;
    race: string;
  };
  biography: {
    fullName: string;
    aliases: string[];
    publisher: string;
    firstAppearance: string;
    alignment: string;
  };
  connections: {
    groupAffiliation: string;
  };
  images: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
}

export interface SuperheroData {
  id: number;
  name: string;
  publisher: string;
  universe: string;
  team: string[];
  powers: string[];
  gender: string;
  firstAppearance: number;
  aliases: string[];
  image: string;
  silhouette: string;
  tier: "easy" | "medium" | "hard";
}

// Curated data for iconic and popular heroes/villains to ensure premium quality
const CURATED_HEROES: Record<string, {
  publisher?: string;
  universe?: string;
  team?: string[];
  powers?: string[];
  firstAppearance?: number;
  tier?: "easy" | "medium" | "hard";
}> = {
  // --- EASY TIER (50 Iconic Heroes & Villains) ---
  "Batman": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Bat-Family"],
    powers: ["Peak Human", "Martial Arts", "Detective", "Genius Intellect"], firstAppearance: 1939, tier: "easy"
  },
  "Superman": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Kryptonian"],
    powers: ["Flight", "Super Strength", "Heat Vision", "Freeze Breath", "Invulnerability"], firstAppearance: 1938, tier: "easy"
  },
  "Spider-Man": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "Spider-Army"],
    powers: ["Wall-Crawling", "Spider-Sense", "Super Strength", "Web-Slinging", "Agility"], firstAppearance: 1962, tier: "easy"
  },
  "Iron Man": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "S.H.I.E.L.D."],
    powers: ["Powered Armor", "Flight", "Repulsor Rays", "Genius Intellect"], firstAppearance: 1963, tier: "easy"
  },
  "Hulk": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "Defenders"],
    powers: ["Super Strength", "Invulnerability", "Regeneration", "Super Leaping"], firstAppearance: 1962, tier: "easy"
  },
  "Thor": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "Asgardians"],
    powers: ["God of Thunder", "Flight", "Super Strength", "Mjolnir Mastery", "Lightning Control"], firstAppearance: 1962, tier: "easy"
  },
  "Wonder Woman": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Amazons"],
    powers: ["Super Strength", "Flight", "Lasso of Truth", "Martial Arts", "Immortality"], firstAppearance: 1941, tier: "easy"
  },
  "Flash": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Flash Family"],
    powers: ["Super Speed", "Speed Force", "Time Travel", "Phasing", "Accelerated Healing"], firstAppearance: 1940, tier: "easy"
  },
  "Captain America": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "S.H.I.E.L.D."],
    powers: ["Super Soldier", "Master Tactician", "Vibranium Shield Mastery", "Peak Human"], firstAppearance: 1941, tier: "easy"
  },
  "Wolverine": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["X-Men", "Avengers", "X-Force"],
    powers: ["Adamantium Claws", "Healing Factor", "Enhanced Senses", "Martial Arts"], firstAppearance: 1974, tier: "easy"
  },
  "Deadpool": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["X-Force", "Mercs for Money"],
    powers: ["Accelerated Healing", "Master Swordsman", "Marksmanship", "Fourth Wall Breaking"], firstAppearance: 1991, tier: "easy"
  },
  "Black Panther": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "Wakandan Royal Family"],
    powers: ["Vibranium Suit", "Enhanced Reflexes", "Martial Arts", "Genius Intellect"], firstAppearance: 1966, tier: "easy"
  },
  "Doctor Strange": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "Defenders", "Midnight Sons"],
    powers: ["Sorcery", "Astral Projection", "Time Manipulation", "Flight"], firstAppearance: 1963, tier: "easy"
  },
  "Aquaman": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Atlanteans"],
    powers: ["Underwater Breathing", "Marine Telepathy", "Super Strength", "Hydrokinesis"], firstAppearance: 1941, tier: "easy"
  },
  "Green Lantern": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Green Lantern Corps"],
    powers: ["Power Ring Constructs", "Flight", "Force Fields", "Willpower Mastery"], firstAppearance: 1940, tier: "easy"
  },
  "Black Widow": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "S.H.I.E.L.D."],
    powers: ["Master Spy", "Martial Arts", "Marksmanship", "Acrobatics"], firstAppearance: 1964, tier: "easy"
  },
  "Scarlet Witch": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "X-Men"],
    powers: ["Chaos Magic", "Reality Warping", "Telekinesis", "Telepathy"], firstAppearance: 1964, tier: "easy"
  },
  "Daredevil": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Defenders", "Marvel Knights"],
    powers: ["Radar Sense", "Enhanced Senses", "Master Martial Artist", "Acrobatics"], firstAppearance: 1964, tier: "easy"
  },
  "Green Arrow": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Team Arrow"],
    powers: ["Master Archer", "Martial Arts", "Peak Human Condition", "Tactician"], firstAppearance: 1941, tier: "easy"
  },
  "Joker": {
    publisher: "DC", universe: "DC Comics", team: ["Injustice League", "Suicide Squad"],
    powers: ["Criminal Mastermind", "Chemical Engineering", "Pain Resistance", "Unpredictability"], firstAppearance: 1940, tier: "easy"
  },
  "Harley Quinn": {
    publisher: "DC", universe: "DC Comics", team: ["Suicide Squad", "Birds of Prey", "Gotham City Sirens"],
    powers: ["Acrobatics", "Toxin Immunity", "Martial Arts", "Unpredictability"], firstAppearance: 1992, tier: "easy"
  },
  "Magneto": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["X-Men", "Brotherhood of Mutants"],
    powers: ["Magnetokinesis", "Flight", "Force Fields", "Metal Manipulation"], firstAppearance: 1963, tier: "easy"
  },
  "Professor X": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["X-Men", "Illuminati"],
    powers: ["Master Telepath", "Mind Control", "Astral Projection", "Genius Intellect"], firstAppearance: 1963, tier: "easy"
  },
  "Storm": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["X-Men", "Avengers"],
    powers: ["Weather Manipulation", "Flight", "Lightning Control", "Atmospheric Resistance"], firstAppearance: 1975, tier: "easy"
  },
  "Cyclops": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["X-Men", "X-Factor"],
    powers: ["Optic Blasts", "Master Tactician", "Spatial Awareness", "Leadership"], firstAppearance: 1963, tier: "easy"
  },
  "Thanos": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Black Order"],
    powers: ["Super Strength", "Invulnerability", "Energy Projection", "Genius Intellect"], firstAppearance: 1973, tier: "easy"
  },
  "Loki": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Asgardians", "Cabal"],
    powers: ["Illusion Casting", "Sorcery", "Shape-Shifting", "Immortality"], firstAppearance: 1962, tier: "easy"
  },
  "Lex Luthor": {
    publisher: "DC", universe: "DC Comics", team: ["Injustice League", "Secret Society of Super Villains"],
    powers: ["Genius Intellect", "Warsuit Armor", "Master Strategist", "Technological Engineering"], firstAppearance: 1940, tier: "easy"
  },
  "Catwoman": {
    publisher: "DC", universe: "DC Comics", team: ["Batman Family", "Gotham City Sirens", "Birds of Prey"],
    powers: ["Master Thief", "Acrobatics", "Martial Arts", "Whip Mastery"], firstAppearance: 1940, tier: "easy"
  },
  "Venom": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Sinister Six", "Guardians of the Galaxy", "Dark Avengers"],
    powers: ["Symbiote Enhancement", "Shape-Shifting", "Web-Slinging", "Spider-Sense Immunity"], firstAppearance: 1988, tier: "easy"
  },
  "Robin": {
    publisher: "DC", universe: "DC Comics", team: ["Teen Titans", "Bat-Family", "Young Justice"],
    powers: ["Acrobatics", "Martial Arts", "Detective", "Master Tactician"], firstAppearance: 1940, tier: "easy"
  },
  "Nightwing": {
    publisher: "DC", universe: "DC Comics", team: ["Titans", "Bat-Family", "Outsiders"],
    powers: ["Master Acrobatic", "Escrima Sticks Mastery", "Martial Arts", "Leadership"], firstAppearance: 1984, tier: "easy"
  },
  "Ghost Rider": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Midnight Sons", "Avengers", "Thunderbolts"],
    powers: ["Hellfire Manipulation", "Penance Stare", "Superhuman Strength", "Demonic Transformation"], firstAppearance: 1972, tier: "easy"
  },
  "Punisher": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Thunderbolts", "Marvel Knights"],
    powers: ["Master Marksman", "Expert Tactician", "Martial Arts", "High Pain Tolerance"], firstAppearance: 1974, tier: "easy"
  },
  "Shazam": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Shazam Family"],
    powers: ["Magic Lightning", "Super Strength", "Flight", "Speed of Mercury", "Wisdom of Solomon"], firstAppearance: 1940, tier: "easy"
  },
  "Supergirl": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Kryptonian", "Legion of Super-Heroes"],
    powers: ["Flight", "Super Strength", "Heat Vision", "Freeze Breath", "Invulnerability"], firstAppearance: 1959, tier: "easy"
  },
  "Batgirl": {
    publisher: "DC", universe: "DC Comics", team: ["Bat-Family", "Birds of Prey"],
    powers: ["Martial Arts", "Genius Intellect", "Computer Hacking", "Detective"], firstAppearance: 1967, tier: "easy"
  },
  "Cyborg": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League", "Teen Titans"],
    powers: ["Technopathy", "Cybernetic Enhancement", "Energy Cannon", "Flight", "Super Strength"], firstAppearance: 1980, tier: "easy"
  },
  "Martian Manhunter": {
    publisher: "DC", universe: "DC Comics", team: ["Justice League"],
    powers: ["Shape-Shifting", "Telepathy", "Flight", "Intangibility", "Super Strength"], firstAppearance: 1955, tier: "easy"
  },
  "Hawkeye": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "S.H.I.E.L.D.", "West Coast Avengers"],
    powers: ["Master Marksman", "Trick Arrows", "Martial Arts", "Acrobatics"], firstAppearance: 1964, tier: "easy"
  },
  "Ant-Man": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers", "Guardians of the Galaxy"],
    powers: ["Size Manipulation", "Insect Communication", "Super Strength in Shrunk Form"], firstAppearance: 1962, tier: "easy"
  },
  "Wasp": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Avengers"],
    powers: ["Size Manipulation", "Bio-Electric Blasts", "Flight", "Insect Communication"], firstAppearance: 1963, tier: "easy"
  },
  "Star-Lord": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Guardians of the Galaxy"],
    powers: ["Master Marksmanship", "Jet Boot Flight", "Expert Strategist", "Hand-to-Hand Combat"], firstAppearance: 1976, tier: "easy"
  },
  "Groot": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Guardians of the Galaxy"],
    powers: ["Flora Colossus Physiology", "Regeneration", "Size Growth", "Super Strength"], firstAppearance: 1960, tier: "easy"
  },
  "Rocket Raccoon": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Guardians of the Galaxy"],
    powers: ["Master Tactician", "Expert Marksman", "Weapons Specialist", "Enhanced Agility"], firstAppearance: 1976, tier: "easy"
  },
  "Gamora": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Guardians of the Galaxy", "Infinity Watch"],
    powers: ["Deadliest Woman in the Universe", "Super Strength", "Master Assassin", "Regeneration"], firstAppearance: 1975, tier: "easy"
  },
  "Drax the Destroyer": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Guardians of the Galaxy", "Infinity Watch"],
    powers: ["Super Strength", "Invulnerability", "Master Knife Fighter", "Enhanced Senses"], firstAppearance: 1973, tier: "easy"
  },
  "Doctor Doom": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Cabal", "Legion of the Unliving"],
    powers: ["Supreme Sorcery", "Titanium Armor", "Genius Intellect", "Force Fields", "Energy Projection"], firstAppearance: 1962, tier: "easy"
  },
  "Green Goblin": {
    publisher: "Marvel", universe: "Marvel Comics", team: ["Sinister Six", "Dark Avengers"],
    powers: ["Superhuman Strength", "Goblin Glider", "Pumpkin Bombs", "Regenerative Healing"], firstAppearance: 1964, tier: "easy"
  },
  "Bane": {
    publisher: "DC", universe: "DC Comics", team: ["Suicide Squad", "Secret Society of Super Villains"],
    powers: ["Venom Enhancement", "Super Strength", "Genius Intellect", "Master Tactician"], firstAppearance: 1993, tier: "easy"
  },

  // --- MEDIUM TIER SAMPLE (Popular Heroes & Villains) ---
  "Jean Grey": { publisher: "Marvel", team: ["X-Men"], powers: ["Phoenix Force", "Telekinesis", "Telepathy", "Flight"], firstAppearance: 1963, tier: "medium" },
  "Beast": { publisher: "Marvel", team: ["X-Men", "Avengers"], powers: ["Superhuman Agility", "Enhanced Strength", "Genius Intellect", "Acrobatics"], firstAppearance: 1963, tier: "medium" },
  "Rogue": { publisher: "Marvel", team: ["X-Men", "Avengers"], powers: ["Power Absorption", "Memory Absorption", "Flight", "Super Strength"], firstAppearance: 1981, tier: "medium" },
  "Gambit": { publisher: "Marvel", team: ["X-Men"], powers: ["Molecular Kinetic Charging", "Card Throwing", "Agility", "Hypnotic Charm"], firstAppearance: 1990, tier: "medium" },
  "Silver Surfer": { publisher: "Marvel", team: ["Defenders", "Heralds of Galactus"], powers: ["Power Cosmic", "Faster-Than-Light Flight", "Energy Manipulation", "Invulnerability"], firstAppearance: 1966, tier: "medium" },
  "Riddler": { publisher: "DC", team: ["Injustice League", "Secret Society of Super Villains"], powers: ["Genius Intellect", "Puzzle Mastermind", "Tactical Trap Design"], firstAppearance: 1948, tier: "medium" },
  "Two-Face": { publisher: "DC", team: ["Injustice League", "Suicide Squad"], powers: ["Criminal Strategist", "Marksmanship", "Hand-to-Hand Combat"], firstAppearance: 1942, tier: "medium" },
  "Penguin": { publisher: "DC", team: ["Injustice League", "Suicide Squad"], powers: ["Criminal Mastermind", "Weaponized Umbrellas", "Underworld Connections"], firstAppearance: 1941, tier: "medium" },
  "Sinestro": { publisher: "DC", team: ["Sinestro Corps", "Injustice League"], powers: ["Yellow Power Ring Constructs", "Flight", "Fear Manipulation"], firstAppearance: 1961, tier: "medium" },
  "Darkseid": { publisher: "DC", team: ["Elite of Apokolips"], powers: ["Omega Beams", "Godlike Strength", "Immortality", "Telekinesis"], firstAppearance: 1970, tier: "medium" },
  "Galactus": { publisher: "Marvel", team: ["Cosmic Entities"], powers: ["Power Cosmic", "Planet Consumption", "Immortality", "Matter Manipulation"], firstAppearance: 1966, tier: "medium" },
  "Ultron": { publisher: "Marvel", team: ["Masters of Evil"], powers: ["Adamantium Armor", "Artificial Intelligence", "Energy Blasts", "Flight"], firstAppearance: 1968, tier: "medium" },
  "Kingpin": { publisher: "Marvel", team: ["Hand", "Emissaries of Evil"], powers: ["Peak Human Strength", "Criminal Mastermind", "Martial Arts"], firstAppearance: 1967, tier: "medium" },
  "Doc Ock": { publisher: "Marvel", team: ["Sinister Six"], powers: ["Mechanical Tentacles", "Genius Intellect", "Wall-Climbing"], firstAppearance: 1963, tier: "medium" },
  "Sandman": { publisher: "Marvel", team: ["Sinister Six", "Frightful Four"], powers: ["Sand Manipulation", "Shape-Shifting", "Super Strength", "Invulnerability"], firstAppearance: 1963, tier: "medium" },
  "Mysterio": { publisher: "Marvel", team: ["Sinister Six"], powers: ["Master Illusionist", "Special Effects Engineering", "Hypnotism", "Chemistry"], firstAppearance: 1964, tier: "medium" },
  "Vulture": { publisher: "Marvel", team: ["Sinister Six"], powers: ["Flight Harness", "Superhuman Strength", "Master Inventor"], firstAppearance: 1963, tier: "medium" },
  "Electro": { publisher: "Marvel", team: ["Sinister Six"], powers: ["Electrokinetic Manipulation", "Lightning Generation", "Flight"], firstAppearance: 1964, tier: "medium" },
  "Kraven the Hunter": { publisher: "Marvel", team: ["Sinister Six"], powers: ["Enhanced Strength", "Master Tracker", "Jungle Fighting Mastery", "Longevity"], firstAppearance: 1964, tier: "medium" },
  "Lizard": { publisher: "Marvel", team: ["Sinister Six"], powers: ["Reptilian Transformation", "Regenerative Healing", "Super Strength", "Tail Whip"], firstAppearance: 1963, tier: "medium" },
  "Rhino": { publisher: "Marvel", team: ["Sinister Six"], powers: ["Superhuman Strength", "Armored Hide", "Devastating Charge"], firstAppearance: 1966, tier: "medium" },
  "Carnage": { publisher: "Marvel", team: ["Maximum Carnage"], powers: ["Symbiote Shape-Shifting", "Super Strength", "Web-Slinging", "Regeneration"], firstAppearance: 1992, tier: "medium" },
  "Blade": { publisher: "Marvel", team: ["Midnight Sons", "Avengers", "MI-13"], powers: ["Dhampir Physiology", "Master Swordsman", "Vampire Immunity", "Accelerated Healing"], firstAppearance: 1973, tier: "medium" },
  "Moon Knight": { publisher: "Marvel", team: ["Avengers", "Defenders", "Heroes for Hire"], powers: ["Lunar Strength Enhancement", "Master Martial Artist", "Weapons Expert", "Pain Tolerance"], firstAppearance: 1975, tier: "medium" },
  "Vision": { publisher: "Marvel", team: ["Avengers"], powers: ["Density Manipulation", "Flight", "Solar Energy Beams", "Intangibility"], firstAppearance: 1968, tier: "medium" },
  "Falcon": { publisher: "Marvel", team: ["Avengers", "S.H.I.E.L.D."], powers: ["Winged Flight Harness", "Avian Telepathy", "Master Combatant", "Acrobatics"], firstAppearance: 1969, tier: "medium" },
  "Winter Soldier": { publisher: "Marvel", team: ["Avengers", "Thunderbolts", "S.H.I.E.L.D."], powers: ["Cybernetic Arm", "Master Assassin", "Expert Marksman", "Martial Arts"], firstAppearance: 1941, tier: "medium" },
  "War Machine": { publisher: "Marvel", team: ["Avengers", "S.H.I.E.L.D."], powers: ["Heavily Armed Exosuit", "Flight", "Repulsor Blasts", "Ballistic Arsenal"], firstAppearance: 1979, tier: "medium" },
  "She-Hulk": { publisher: "Marvel", team: ["Avengers", "Fantastic Four", "Defenders"], powers: ["Super Strength", "Invulnerability", "Regenerative Healing", "Expert Legal Mind"], firstAppearance: 1980, tier: "medium" },
  "Miles Morales": { publisher: "Marvel", team: ["Champions", "Spider-Army", "Young Avengers"], powers: ["Venom Blast", "Camouflage Invisibility", "Wall-Crawling", "Spider-Sense"], firstAppearance: 2011, tier: "medium" },
  "Spider-Gwen": { publisher: "Marvel", team: ["Spider-Army", "Web Warriors"], powers: ["Wall-Crawling", "Spider-Sense", "Super Agility", "Web-Slinging"], firstAppearance: 2014, tier: "medium" },
  "Superboy": { publisher: "DC", team: ["Teen Titans", "Young Justice", "Superman Family"], powers: ["Tactile Telekinesis", "Super Strength", "Flight", "Invulnerability"], firstAppearance: 1993, tier: "medium" },
  "Beast Boy": { publisher: "DC", team: ["Teen Titans", "Doom Patrol"], powers: ["Animal Shape-Shifting", "Regenerative Healing", "Enhanced Senses"], firstAppearance: 1965, tier: "medium" },
  "Raven": { publisher: "DC", team: ["Teen Titans", "Sentinels of Magic"], powers: ["Shadow Self Astral Projection", "Empathy", "Telekinesis", "Flight", "Dark Magic"], firstAppearance: 1980, tier: "medium" },
  "Starfire": { publisher: "DC", team: ["Teen Titans", "Outsiders", "Justice League Odyssey"], powers: ["Ultraviolet Energy Bolts", "Flight", "Super Strength", "Linguistic Assimilation"], firstAppearance: 1980, tier: "medium" },
  "Blue Beetle": { publisher: "DC", team: ["Teen Titans", "Justice League"], powers: ["Alien Scarab Armor", "Energy Cannons", "Flight", "Adaptive Shielding"], firstAppearance: 1939, tier: "medium" },
  "Booster Gold": { publisher: "DC", team: ["Justice League", "Time Masters"], powers: ["Time Travel Circuitry", "Force Fields", "Flight Ring", "Energy Gauntlets"], firstAppearance: 1986, tier: "medium" },
  "Zatanna": { publisher: "DC", team: ["Justice League Dark", "Sentinels of Magic"], powers: ["Backwards Magic Spells", "Illusion Casting", "Telekinesis", "Elemental Control"], firstAppearance: 1964, tier: "medium" },
  "Constantine": { publisher: "DC", team: ["Justice League Dark", "Trenchcoat Brigade"], powers: ["Occult Sorcery", "Master Exorcist", "Hypnotism", "Magical Warding"], firstAppearance: 1985, tier: "medium" },
  "Swamp Thing": { publisher: "DC", team: ["Justice League Dark", "Parliament of Trees"], powers: ["Plant Elemental Mastery", "Regeneration", "Super Strength", "Chlorokinesis"], firstAppearance: 1971, tier: "medium" },
  "Red Hood": { publisher: "DC", team: ["Outlaws", "Bat-Family", "Suicide Squad"], powers: ["Master Marksman", "Expert Martial Artist", "Tactical Strategist", "Acrobatics"], firstAppearance: 1983, tier: "medium" },
  "Deathstroke": { publisher: "DC", team: ["Suicide Squad", "Secret Society of Super Villains", "Titans East"], powers: ["Enhanced Brain Capacity", "Super Soldier Reflexes", "Master Swordsman", "Regeneration"], firstAppearance: 1980, tier: "medium" },
  "Deadshot": { publisher: "DC", team: ["Suicide Squad", "Secret Six"], powers: ["Uncanny Marksmanship", "Wrist-Mounted Guns", "Expert Assassin"], firstAppearance: 1950, tier: "medium" },
  "Captain Marvel": { publisher: "Marvel", team: ["Avengers", "Starjammers", "S.H.I.E.L.D."], powers: ["Photon Blasts", "Super Strength", "Flight", "Energy Absorption"], firstAppearance: 1967, tier: "easy" },
  "Spawn": { publisher: "Image", universe: "Image Comics", team: ["Creatures of the Night"], powers: ["Necroplasm Magic", "Symbiotic Shroud", "Immortality", "Super Strength"], firstAppearance: 1992, tier: "medium" },
  "Hellboy": { publisher: "Dark Horse", universe: "Dark Horse Comics", team: ["B.P.R.D."], powers: ["Right Hand of Doom", "Superhuman Strength", "Fire Immunity", "Demonic Longevity"], firstAppearance: 1993, tier: "medium" },
  "Invincible": { publisher: "Image", universe: "Image Comics", team: ["Guardians of the Globe", "Teen Team"], powers: ["Viltrumite Physiology", "Super Strength", "Faster-Than-Light Flight", "Invulnerability"], firstAppearance: 2002, tier: "medium" },
  "Homelander": { publisher: "Dynamite", universe: "The Boys", team: ["The Seven"], powers: ["Heat Vision", "Super Strength", "Flight", "Invulnerability"], firstAppearance: 2006, tier: "medium" },
  "Omni-Man": { publisher: "Image", universe: "Image Comics", team: ["Viltrum Empire", "Guardians of the Globe"], powers: ["Viltrumite Physiology", "Super Strength", "High-Speed Flight", "Invulnerability"], firstAppearance: 2002, tier: "medium" },
  "The Tick": { publisher: "New England", universe: "The Tick", team: ["City Protectors"], powers: ["Nigh-Invulnerability", "Super Strength", "Dramatic Monologuing", "Agility"], firstAppearance: 1986, tier: "medium" },
};

function normalizePublisher(pub: string): string {
  if (!pub) return "Independent";
  const lower = pub.toLowerCase();
  if (lower.includes("dc")) return "DC";
  if (lower.includes("marvel")) return "Marvel";
  if (lower.includes("dark horse")) return "Dark Horse";
  if (lower.includes("image")) return "Image";
  if (lower.includes("idw")) return "IDW";
  if (lower.includes("dynamite")) return "Dynamite";
  return pub.replace(/ Comics$/i, "").trim();
}

function extractTeams(affiliations: string, heroName: string): string[] {
  if (!affiliations || affiliations === "-" || affiliations.toLowerCase().includes("none")) {
    return ["Solo Avenger"];
  }

  const iconicTeamKeywords = [
    "Justice League", "Avengers", "X-Men", "Fantastic Four", "Guardians of the Galaxy",
    "Suicide Squad", "Teen Titans", "Titans", "Sinister Six", "Defenders", "S.H.I.E.L.D.",
    "Bat-Family", "Spider-Army", "Outsiders", "Birds of Prey", "Injustice League",
    "Brotherhood of Mutants", "Black Order", "B.P.R.D.", "The Seven", "Guardians of the Globe",
    "X-Force", "Secret Society", "Green Lantern Corps", "Amazons", "Atlanteans", "Inhumans"
  ];

  const matchedTeams: string[] = [];
  for (const keyword of iconicTeamKeywords) {
    if (affiliations.toLowerCase().includes(keyword.toLowerCase())) {
      matchedTeams.push(keyword);
    }
  }

  if (matchedTeams.length > 0) {
    return Array.from(new Set(matchedTeams)).slice(0, 3);
  }

  // Fallback splitting
  const parts = affiliations
    .split(/[,;]/)
    .map((p) => p.replace(/^formerly\s+/i, "").replace(/\(.*?\)/g, "").trim())
    .filter((p) => p.length > 2 && p.length < 35 && !p.toLowerCase().includes("family"));

  return parts.length > 0 ? parts.slice(0, 2) : ["Independent"];
}

function derivePowers(powerstats: RawAkababHero["powerstats"], race: string): string[] {
  const powers: string[] = [];
  if (powerstats.strength >= 80) powers.push("Super Strength");
  if (powerstats.speed >= 75) powers.push("Super Speed");
  if (powerstats.intelligence >= 85) powers.push("Genius Intellect");
  if (powerstats.durability >= 85) powers.push("Invulnerability");
  if (powerstats.power >= 80) powers.push("Energy Manipulation");
  if (powerstats.combat >= 85) powers.push("Master Martial Artist");
  if (race && race !== "Human" && race !== "-" && race !== "null") {
    powers.push(`${race} Physiology`);
  }
  if (powers.length === 0) {
    powers.push("Peak Human Condition", "Expert Combatant");
  }
  return Array.from(new Set(powers)).slice(0, 3);
}

function extractYear(firstApp: string, id: number): number {
  if (firstApp && firstApp !== "-") {
    const match = firstApp.match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  // Fallback heuristic by ID
  if (id <= 100) return 1963;
  if (id <= 300) return 1975;
  if (id <= 500) return 1988;
  return 1998;
}

async function downloadImage(url: string, destPath: string, retries = 3): Promise<boolean> {
  if (fs.existsSync(destPath)) return true;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let targetUrl = url;
      if (attempt > 1 && url.includes("cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0")) {
        targetUrl = url.replace("cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0", "akabab.github.io/superhero-api");
      }
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        if (attempt === retries) return false;
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Optimize with sharp as WebP (400x400 max, quality 80)
      await sharp(buffer)
        .resize(400, 400, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 82 })
        .toFile(destPath);

      return true;
    } catch (err) {
      if (attempt === retries) {
        console.error(`Failed to download image from ${url} after ${retries} attempts:`, err);
        return false;
      }
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  return false;
}

async function generateSuperheroDatabase() {
  console.log("Fetching superhero database from Akabab API...");
  const apiUrl = "https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/all.json";
  
  let rawHeroes: RawAkababHero[] = [];
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    rawHeroes = await res.json();
  } catch (err) {
    console.error("Failed to fetch from primary CDN, trying fallback URL...", err);
    const fallbackRes = await fetch("https://akabab.github.io/superhero-api/api/all.json");
    rawHeroes = await fallbackRes.json();
  }

  console.log(`Fetched ${rawHeroes.length} raw character records. Processing and downloading artwork...`);

  const processedHeroes: SuperheroData[] = [];
  let downloadedCount = 0;

  const targetHeroes = rawHeroes.filter((hero) => {
    if (!hero.name || !hero.images || (!hero.images.lg && !hero.images.md)) return false;
    if (CURATED_HEROES[hero.name]) return true;
    const slugName = `${hero.id}-${hero.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
    const artworkPath = path.join(ARTWORK_DIR, `${slugName}.webp`);
    if (fs.existsSync(artworkPath)) return true;
    const isPopular = (hero.powerstats.intelligence + hero.powerstats.strength + hero.powerstats.power > 160) &&
                      hero.connections?.groupAffiliation !== "-" &&
                      hero.biography?.publisher !== "-";
    return isPopular;
  }).slice(0, 150);

  console.log(`Filtered to ${targetHeroes.length} iconic and popular characters. Processing and downloading artwork...`);

  const chunkSize = 6;
  for (let i = 0; i < targetHeroes.length; i += chunkSize) {
    const chunk = targetHeroes.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (hero) => {
        if (!hero.name || !hero.images || (!hero.images.lg && !hero.images.md)) return;

        const curated = CURATED_HEROES[hero.name] || {};
        let tier: "easy" | "medium" | "hard" = curated.tier || "hard";
        if (tier === "hard") {
          const isPopular = (hero.powerstats.intelligence + hero.powerstats.strength + hero.powerstats.power > 150) &&
                            hero.connections?.groupAffiliation !== "-" &&
                            hero.biography?.publisher !== "-";
          if (isPopular && processedHeroes.filter((p) => p.tier === "medium").length < 220) {
            tier = "medium";
          }
        }

        const publisher = curated.publisher || normalizePublisher(hero.biography?.publisher || "Independent");
        const universe = curated.universe || (publisher === "DC" ? "DC Comics" : publisher === "Marvel" ? "Marvel Comics" : `${publisher} Universe`);
        const team = curated.team || extractTeams(hero.connections?.groupAffiliation || "", hero.name);
        const powers = curated.powers || derivePowers(hero.powerstats || { intelligence: 50, strength: 50, speed: 50, durability: 50, power: 50, combat: 50 }, hero.appearance?.race || "Human");
        const firstAppearance = curated.firstAppearance || extractYear(hero.biography?.firstAppearance || "", hero.id);
        const gender = (hero.appearance?.gender && hero.appearance.gender !== "-" && hero.appearance.gender !== "null") ? hero.appearance.gender : "Unknown";

        const aliases = (hero.biography?.aliases || [])
          .filter((a) => a && a !== "-" && a !== "null" && a.toLowerCase() !== hero.name.toLowerCase())
          .slice(0, 4);

        const slugName = `${hero.id}-${hero.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
        const artworkFileName = `${slugName}.webp`;
        const artworkPath = path.join(ARTWORK_DIR, artworkFileName);
        const imageUrl = hero.images.lg || hero.images.md;

        const success = await downloadImage(imageUrl, artworkPath);
        if (!success) {
          console.warn(`Skipping ${hero.name} (ID: ${hero.id}) due to image download failure.`);
          return;
        }

        processedHeroes.push({
          id: hero.id,
          name: hero.name,
          publisher,
          universe,
          team,
          powers,
          gender,
          firstAppearance,
          aliases,
          image: `/superheroes/artwork/${artworkFileName}`,
          silhouette: `/superheroes/silhouettes/${artworkFileName}`,
          tier,
        });
      })
    );
    downloadedCount = processedHeroes.length;
    if (i % 30 === 0 || i + chunkSize >= targetHeroes.length) {
      console.log(`Processed ${downloadedCount} / ${targetHeroes.length} characters...`);
    }
  }

  // Ensure all curated heroes present in dataset
  console.log(`Processed ${processedHeroes.length} superheroes.`);
  const easyCount = processedHeroes.filter((p) => p.tier === "easy").length;
  const mediumCount = processedHeroes.filter((p) => p.tier === "medium").length;
  const hardCount = processedHeroes.length;
  console.log(`Tiers distribution: Easy (${easyCount}), Medium (${mediumCount}), Hard (${hardCount})`);

  processedHeroes.sort((a, b) => {
    const tierOrder = { easy: 1, medium: 2, hard: 3 };
    if (tierOrder[a.tier] !== tierOrder[b.tier]) {
      return tierOrder[a.tier] - tierOrder[b.tier];
    }
    return a.name.localeCompare(b.name);
  });

  const jsonStr = JSON.stringify(processedHeroes, null, 2);
  fs.writeFileSync(path.join(DATA_DIR_PUBLIC, "superheroes.json"), jsonStr);
  fs.writeFileSync(path.join(DATA_DIR_SRC, "superheroes.json"), jsonStr);
  console.log(`Successfully written superheroes.json to public/data and src/data.`);
}

generateSuperheroDatabase().catch((err) => {
  console.error("Error generating superhero database:", err);
  process.exit(1);
});
