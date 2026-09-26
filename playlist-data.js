// Setlist finale — 15 titres retenus par le vote de tout le groupe.
// tier: catégorie d'accueil (reprend le message envoyé au groupe)
// dualVersion/oldFile: ancienne + nouvelle version (IA)
// pitchShift: demi-tons (négatif = baisser). -2 = -1 ton, -3 = -1,5 ton
// bpm, key: à renseigner manuellement (null = non affiché)
const TIERS = {
  top5: { label: "Incontournables", emoji: "⭐" },
  quasi: { label: "Quasi-unanimes (4/5)", emoji: "🔥" },
  bien: { label: "Bien accueillies (3/5)", emoji: "👍" },
  retenue: { label: "Retenues (2/5)", emoji: "✅" },
};

const PLAYLIST = [
  { slug: "a-thousand-and-three-stars", title: "A Thousand And Three Stars", tier: "top5", dualVersion: true, oldFile: "a-thousand-and-three-stars-old.mp3", pitchShift: -2, bpm: null, key: null },
  { slug: "too-bad", title: "Too Bad (Bad)", tier: "top5", dualVersion: true, oldFile: "too-bad-old.mp3", pitchShift: -2, bpm: null, key: null },
  { slug: "everytime", title: "Everytime", tier: "top5", pitchShift: -3, bpm: null, key: null },
  { slug: "dust-of-the-world", title: "Dust Of The World", tier: "top5", dualVersion: true, oldFile: "dust-of-the-world-old.mp3", pitchShift: -2, bpm: null, key: null },
  { slug: "savage", title: "Savage", tier: "top5", bpm: null, key: null },
  { slug: "breath", title: "Breath", tier: "quasi", dualVersion: true, oldFile: "breath-old.mp3", bpm: null, key: null },
  { slug: "the-ripper", title: "The Ripper (Trinaire / Triliaire)", tier: "quasi", dualVersion: true, oldFile: "the-ripper-old.mp3", bpm: null, key: null },
  { slug: "into-the-night", title: "Into The Night (Goodie)", tier: "bien", bpm: null, key: null },
  { slug: "modern-times", title: "Modern Times (Johnny Rules)", tier: "bien", dualVersion: true, oldFile: "modern-times-johnnyrules.mp3", bpm: null, key: null },
  { slug: "snakes-house", title: "Snakes' House", tier: "retenue", bpm: null, key: null },
  { slug: "poison", title: "Poison", tier: "retenue", bpm: null, key: null },
  { slug: "in-the-eye", title: "In The Eye", tier: "retenue", bpm: null, key: null },
  { slug: "twilight", title: "Twilight", tier: "retenue", bpm: null, key: null },
  { slug: "let-it-die", title: "Let It Die (Ternaire)", tier: "retenue", dualVersion: true, oldFile: "let-it-die-old.mp3", bpm: null, key: null },
  { slug: "balboa", title: "Balboa (On My Way)", tier: "retenue", dualVersion: true, oldFile: "balboa-old.mp3", bpm: null, key: null },
];
