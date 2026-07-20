// Setlist finale — 14 titres retenus par le vote de tout le groupe.
// tier: catégorie d'accueil (reprend le message envoyé au groupe)
// dualVersion/oldFile: reprend les infos de songs.js pour les titres qui ont
// une ancienne et une nouvelle version (IA).
const TIERS = {
  unanime: { label: "Unanimes (5/5)", emoji: "🔥" },
  quasi: { label: "Quasi-unanimes (4/5)", emoji: "⭐" },
  bien: { label: "Bien accueillies (3/5)", emoji: "👍" },
  retenue: { label: "Retenues (2/5)", emoji: "✅" },
};

const PLAYLIST = [
  { slug: "a-thousand-and-three-stars", title: "A Thousand And Three Stars", tier: "unanime", dualVersion: true, oldFile: "a-thousand-and-three-stars-old.mp3" },
  { slug: "dust-of-the-world", title: "Dust Of The World", tier: "unanime" },
  { slug: "too-bad", title: "Too Bad (Bad)", tier: "unanime", dualVersion: true, oldFile: "too-bad-old.mp3" },
  { slug: "everytime", title: "Everytime", tier: "unanime" },
  { slug: "breath", title: "Breath", tier: "quasi", dualVersion: true, oldFile: "breath-old.mp3" },
  { slug: "the-ripper", title: "The Ripper (Trinaire / Triliaire)", tier: "quasi", dualVersion: true, oldFile: "the-ripper-old.mp3" },
  { slug: "into-the-night", title: "Into The Night (Goodie)", tier: "bien" },
  { slug: "modern-times", title: "Modern Times (Johnny Rules)", tier: "bien", dualVersion: true, oldFile: "modern-times-johnnyrules.mp3" },
  { slug: "snakes-house", title: "Snakes' House", tier: "retenue" },
  { slug: "poison", title: "Poison", tier: "retenue" },
  { slug: "in-the-eye", title: "In The Eye", tier: "retenue" },
  { slug: "twilight", title: "Twilight", tier: "retenue" },
  { slug: "let-it-die", title: "Let It Die (Ternaire)", tier: "retenue", dualVersion: true, oldFile: "let-it-die-old.mp3" },
  { slug: "balboa", title: "Balboa (On My Way)", tier: "retenue", dualVersion: true, oldFile: "balboa-old.mp3" },
];
