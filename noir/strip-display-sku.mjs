// Presentation-only aliases. Source SKUs retain their catalogue packaging codes.
// The 24D004 rows in tasmy-prescot-led-2026.pdf, p. 7 are 50 m reels.
// Confirmed reel lengths: 12EC480, card 53fd8c1c23d628a2 (5 m EANs);
// WCOB, cards 984266776ec188ef / 6efc2297c3a940a1 (5 m);
// 24EC320 IP67, card 44c2ebd0869d82b1 (1 m EANs).
export function formatStripSku(sku){
  return String(sku??'')
    .replace(/^(24D004-050-8-(?:WW|NW))50$/,'$1')
    .replace(/^(12EC480(?:WW27|WW|NW))5$/,'$1')
    .replace(/^(24WCOB(?:320(?:WW|NW|W)|280CCT))5(IP62)$/,'$1$2')
    .replace(/^(24EC320(?:WW|NW|W))1(IP67)$/,'$1$2');
}
