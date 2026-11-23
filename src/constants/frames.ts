import type { StickerOption } from '../types'

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`
}

export const STICKER_OPTIONS: StickerOption[] = [
  {
    id: 'monkey_polite',
    label: 'Polite Meme Monkey',
    category: 'New',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="84" rx="28" ry="26" fill="#8D5B3C"/>
          <circle cx="30" cy="46" r="11" fill="#D9A782"/>
          <circle cx="90" cy="46" r="11" fill="#D9A782"/>
          <circle cx="60" cy="46" r="26" fill="#8D5B3C"/>
          <ellipse cx="60" cy="50" rx="19" ry="15" fill="#E6BC98"/>
          <circle cx="52" cy="44" r="3.5" fill="#18181B"/>
          <circle cx="68" cy="44" r="3.5" fill="#18181B"/>
          <circle cx="53" cy="43" r="1.2" fill="#FFF" stroke="none"/>
          <circle cx="69" cy="43" r="1.2" fill="#FFF" stroke="none"/>
          <path d="M52 56 Q60 61 68 56" fill="none" stroke-width="2.5" stroke-linecap="round"/>
          <ellipse cx="60" cy="86" rx="14" ry="12" fill="#E6BC98"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_phone',
    label: 'Monkey Checking Phone',
    category: 'New',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="56" cy="82" rx="26" ry="26" fill="#7C4D30"/>
          <circle cx="28" cy="44" r="10" fill="#D9A782"/>
          <circle cx="84" cy="44" r="10" fill="#D9A782"/>
          <circle cx="56" cy="44" r="24" fill="#7C4D30"/>
          <ellipse cx="58" cy="48" rx="17" ry="14" fill="#E6BC98"/>
          <circle cx="52" cy="44" r="3.2" fill="#18181B"/>
          <circle cx="66" cy="44" r="3.2" fill="#18181B"/>
          <path d="M54 55 Q60 58 65 55" fill="none" stroke-width="2.5"/>
          <rect x="74" y="56" width="22" height="34" rx="4" fill="#1E293B" stroke="#F8FAFC" stroke-width="2.5"/>
          <circle cx="85" cy="66" r="3" fill="#38BDF8" stroke="none"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_think',
    label: 'Thinking Monkey',
    category: 'Trending',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="84" rx="26" ry="24" fill="#9A6644"/>
          <circle cx="30" cy="46" r="10" fill="#E6BC98"/>
          <circle cx="90" cy="46" r="10" fill="#E6BC98"/>
          <circle cx="60" cy="46" r="25" fill="#9A6644"/>
          <ellipse cx="60" cy="50" rx="18" ry="14" fill="#F2D0B0"/>
          <circle cx="52" cy="40" r="3.5" fill="#18181B"/>
          <circle cx="68" cy="40" r="3.5" fill="#18181B"/>
          <path d="M55 56 Q62 53 67 57" fill="none" stroke-width="2.5"/>
          <circle cx="68" cy="66" r="8" fill="#E6BC98"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_shades',
    label: 'Cool Boss Monkey',
    category: 'Top Used',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="84" rx="27" ry="24" fill="#78492C"/>
          <circle cx="29" cy="46" r="10" fill="#D9A782"/>
          <circle cx="91" cy="46" r="10" fill="#D9A782"/>
          <circle cx="60" cy="46" r="25" fill="#78492C"/>
          <ellipse cx="60" cy="51" rx="18" ry="14" fill="#E6BC98"/>
          <rect x="40" y="37" width="17" height="11" rx="2" fill="#09090B" stroke="#FFF" stroke-width="1.5"/>
          <rect x="63" y="37" width="17" height="11" rx="2" fill="#09090B" stroke="#FFF" stroke-width="1.5"/>
          <line x1="57" y1="41" x2="63" y2="41" stroke="#FFF" stroke-width="2"/>
          <path d="M52 57 Q60 62 69 56" fill="none" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_hands_up',
    label: 'Absolute Cinema Monkey',
    category: 'Trending',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="86" rx="26" ry="22" fill="#8D5B3C"/>
          <ellipse cx="22" cy="54" rx="8" ry="18" transform="rotate(-18 22 54)" fill="#8D5B3C"/>
          <ellipse cx="98" cy="54" rx="8" ry="18" transform="rotate(18 98 54)" fill="#8D5B3C"/>
          <circle cx="60" cy="48" r="24" fill="#8D5B3C"/>
          <ellipse cx="60" cy="52" rx="17" ry="14" fill="#E6BC98"/>
          <circle cx="52" cy="46" r="3.5" fill="#18181B"/>
          <circle cx="68" cy="46" r="3.5" fill="#18181B"/>
          <ellipse cx="60" cy="57" rx="5" ry="4" fill="#451A03"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_point',
    label: 'You! Pointing Monkey',
    category: 'New',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="56" cy="84" rx="25" ry="23" fill="#8D5B3C"/>
          <circle cx="28" cy="46" r="10" fill="#D9A782"/>
          <circle cx="84" cy="46" r="10" fill="#D9A782"/>
          <circle cx="56" cy="46" r="24" fill="#8D5B3C"/>
          <ellipse cx="56" cy="50" rx="17" ry="14" fill="#E6BC98"/>
          <circle cx="49" cy="44" r="3.5" fill="#18181B"/>
          <circle cx="64" cy="44" r="3.5" fill="#18181B"/>
          <circle cx="88" cy="68" r="11" fill="#E6BC98"/>
          <rect x="84" y="48" width="8" height="16" rx="4" fill="#E6BC98"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_smudge',
    label: 'Smudge Table Cat',
    category: 'Top Used',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,48 22,18 50,34" fill="#F8FAFC"/>
          <polygon points="92,48 98,18 70,34" fill="#F8FAFC"/>
          <ellipse cx="60" cy="62" rx="34" ry="28" fill="#F8FAFC"/>
          <line x1="42" y1="54" x2="54" y2="56" stroke-width="3.5" stroke-linecap="round"/>
          <line x1="78" y1="54" x2="66" y2="56" stroke-width="3.5" stroke-linecap="round"/>
          <polygon points="60,62 56,67 64,67" fill="#F472B6"/>
          <path d="M48 74 Q60 68 72 74" fill="none" stroke-width="3"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_thumbs_up',
    label: 'Crying Thumbs Up Cat',
    category: 'Trending',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,48 24,20 48,34" fill="#E2E8F0"/>
          <polygon points="86,48 90,20 66,34" fill="#E2E8F0"/>
          <circle cx="57" cy="62" r="30" fill="#F8FAFC"/>
          <circle cx="46" cy="56" r="6.5" fill="#18181B"/>
          <circle cx="68" cy="56" r="6.5" fill="#18181B"/>
          <circle cx="44" cy="54" r="2.2" fill="#FFF" stroke="none"/>
          <circle cx="66" cy="54" r="2.2" fill="#FFF" stroke="none"/>
          <path d="M42 63 Q46 70 50 63" fill="#38BDF8" stroke="none"/>
          <path d="M64 63 Q68 70 72 63" fill="#38BDF8" stroke="none"/>
          <circle cx="94" cy="74" r="13" fill="#F8FAFC"/>
          <rect x="90" y="53" width="9" height="16" rx="4.5" fill="#F8FAFC"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_standing',
    label: 'Standing Polite Cat',
    category: 'New',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="80" rx="20" ry="28" fill="#E5E7EB"/>
          <polygon points="42,36 38,14 54,26" fill="#E5E7EB"/>
          <polygon points="78,36 82,14 66,26" fill="#E5E7EB"/>
          <circle cx="60" cy="40" r="20" fill="#F9FAFB"/>
          <circle cx="53" cy="38" r="3" fill="#18181B"/>
          <circle cx="67" cy="38" r="3" fill="#18181B"/>
          <path d="M56 46 Q60 49 64 46" fill="none" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_cool_shades',
    label: 'Deal With It Cool Cat',
    category: 'Top Used',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,46 22,18 48,32" fill="#FDE68A"/>
          <polygon points="92,46 98,18 72,32" fill="#FDE68A"/>
          <circle cx="60" cy="60" r="31" fill="#FEF3C7"/>
          <rect x="34" y="47" width="22" height="13" fill="#09090B"/>
          <rect x="64" y="47" width="22" height="13" fill="#09090B"/>
          <line x1="56" y1="51" x2="64" y2="51" stroke-width="3"/>
          <path d="M52 70 Q60 75 68 70" fill="none" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_banana',
    label: 'Crying Banana Cat',
    category: 'Trending',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <path d="M45 14 Q60 6 75 14 Q92 56 76 104 Q60 112 44 104 Q28 56 45 14 Z" fill="#FACC15"/>
          <circle cx="60" cy="48" r="18" fill="#F8FAFC"/>
          <circle cx="53" cy="46" r="3.5" fill="#18181B"/>
          <circle cx="67" cy="46" r="3.5" fill="#18181B"/>
          <path d="M49 52 Q53 62 56 52" fill="#38BDF8" stroke="none"/>
          <path d="M64 52 Q67 62 71 52" fill="#38BDF8" stroke="none"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_pop',
    label: 'Pop Cat O-Mouth',
    category: 'Top Used',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="30,44 24,16 50,30" fill="#F8FAFC"/>
          <polygon points="90,44 96,16 70,30" fill="#F8FAFC"/>
          <circle cx="60" cy="62" r="32" fill="#F8FAFC"/>
          <circle cx="46" cy="48" r="3.5" fill="#18181B"/>
          <circle cx="74" cy="48" r="3.5" fill="#18181B"/>
          <ellipse cx="60" cy="70" rx="16" ry="18" fill="#F43F5E"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'hamster_sad',
    label: 'Sad Violin Hamster',
    category: 'Trending',
    group: 'hamster',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <circle cx="34" cy="34" r="11" fill="#D97706"/>
          <circle cx="86" cy="34" r="11" fill="#D97706"/>
          <ellipse cx="60" cy="64" rx="32" ry="34" fill="#FDE68A"/>
          <ellipse cx="60" cy="74" rx="22" ry="20" fill="#FFFBEB"/>
          <circle cx="47" cy="54" r="8.5" fill="#18181B"/>
          <circle cx="73" cy="54" r="8.5" fill="#18181B"/>
          <circle cx="44" cy="51" r="3" fill="#FFF" stroke="none"/>
          <circle cx="70" cy="51" r="3" fill="#FFF" stroke="none"/>
          <polygon points="60,86 48,80 48,92" fill="#EF4444"/>
          <polygon points="60,86 72,80 72,92" fill="#EF4444"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'hero_spider_thumbs',
    label: 'Spider-Hero Thumbs Up',
    category: 'New',
    group: 'hero',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="56" cy="58" rx="26" ry="32" fill="#DC2626"/>
          <path d="M38 48 Q48 38 52 54 Q42 58 38 48 Z" fill="#F8FAFC" stroke-width="3.5"/>
          <path d="M74 48 Q64 38 60 54 Q70 58 74 48 Z" fill="#F8FAFC" stroke-width="3.5"/>
          <circle cx="94" cy="72" r="12" fill="#DC2626"/>
          <rect x="90" y="52" width="8" height="16" rx="4" fill="#DC2626"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'doge_shiba',
    label: 'Doge Wow Side-Eye',
    category: 'Top Used',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="30,42 22,14 50,28" fill="#F59E0B"/>
          <polygon points="90,42 98,14 70,28" fill="#F59E0B"/>
          <circle cx="60" cy="62" r="32" fill="#FBBF24"/>
          <ellipse cx="60" cy="70" rx="20" ry="16" fill="#FEF3C7"/>
          <circle cx="48" cy="52" r="4" fill="#18181B"/>
          <circle cx="72" cy="52" r="4" fill="#18181B"/>
          <ellipse cx="60" cy="64" rx="5" ry="3.5" fill="#18181B"/>
          <path d="M52 73 Q60 78 68 73" fill="none" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'denim_star_patch',
    label: 'Denim Jeans Star Patch',
    category: 'New',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <polygon points="60,12 73,44 108,46 80,68 90,102 60,82 30,102 40,68 12,46 47,44" fill="#1E3A8A" stroke="#F59E0B" stroke-width="3.5" stroke-dasharray="5,3"/>
      </svg>
    `),
  },
  {
    id: 'press_breaking_stamp',
    label: 'Breaking News Stamp',
    category: 'Trending',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80">
        <rect x="6" y="12" width="128" height="56" rx="6" fill="#DC2626" stroke="#18181B" stroke-width="4"/>
        <text x="70" y="47" font-family="sans-serif" font-weight="900" font-size="18" fill="#FFFFFF" text-anchor="middle">BREAKING</text>
      </svg>
    `),
  },
  {
    id: 'y2k_chrome_heart',
    label: 'Y2K Chrome Heart',
    category: 'Top Used',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <path d="M60 98 C60 98 18 70 18 42 C18 26 32 16 46 16 C54 16 60 22 60 28 C60 22 66 16 74 16 C88 16 102 26 102 42 C102 70 60 98 60 98 Z" fill="#EC4899" stroke="#FFFFFF" stroke-width="4"/>
      </svg>
    `),
  },
  // ==================== EXTRA 24 VIRAL INTERNET MEME STICKERS ====================
  {
    id: 'pepe_sad_frog',
    label: 'Pepe Feels Bad Frog',
    category: 'Trending',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#14532D" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="70" rx="40" ry="30" fill="#4ADE80"/>
          <ellipse cx="44" cy="44" rx="16" ry="13" fill="#4ADE80"/>
          <ellipse cx="76" cy="44" rx="16" ry="13" fill="#4ADE80"/>
          <ellipse cx="44" cy="45" rx="10" ry="8" fill="#FFFFFF"/>
          <ellipse cx="76" cy="45" rx="10" ry="8" fill="#FFFFFF"/>
          <circle cx="46" cy="46" r="4" fill="#09090B"/>
          <circle cx="78" cy="46" r="4" fill="#09090B"/>
          <path d="M32 38 Q44 43 56 38" fill="#4ADE80" stroke-width="2.5"/>
          <path d="M64 38 Q76 43 88 38" fill="#4ADE80" stroke-width="2.5"/>
          <path d="M34 78 Q60 68 86 78 Q60 88 34 78 Z" fill="#B91C1C"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'pepe_cool_shades',
    label: 'Pepe Cool Shades',
    category: 'Top Used',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#14532D" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="68" rx="40" ry="30" fill="#22C55E"/>
          <ellipse cx="44" cy="44" rx="15" ry="12" fill="#22C55E"/>
          <ellipse cx="76" cy="44" rx="15" ry="12" fill="#22C55E"/>
          <rect x="26" y="37" width="28" height="16" rx="2" fill="#09090B" stroke="#FFF" stroke-width="2"/>
          <rect x="66" y="37" width="28" height="16" rx="2" fill="#09090B" stroke="#FFF" stroke-width="2"/>
          <line x1="54" y1="43" x2="66" y2="43" stroke="#FFF" stroke-width="3"/>
          <path d="M38 74 Q60 85 84 72" fill="none" stroke="#991B1B" stroke-width="5" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'this_is_fine_dog',
    label: 'This Is Fine Dog',
    category: 'Trending',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <path d="M16 104 Q24 68 38 82 Q52 46 66 76 Q84 52 96 80 Q108 66 108 104 Z" fill="#F97316"/>
          <circle cx="58" cy="62" r="24" fill="#FDE047"/>
          <rect x="34" y="30" width="48" height="8" rx="3" fill="#78350F"/>
          <rect x="42" y="18" width="32" height="14" rx="3" fill="#92400E"/>
          <circle cx="50" cy="58" r="5" fill="#FFF"/>
          <circle cx="68" cy="58" r="5" fill="#FFF"/>
          <circle cx="50" cy="58" r="2" fill="#09090B"/>
          <circle cx="68" cy="58" r="2" fill="#09090B"/>
          <path d="M48 70 Q58 76 68 70" fill="none" stroke-width="2.5"/>
          <rect x="78" y="72" width="18" height="18" rx="3" fill="#FFFFFF"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'stonks_arrow',
    label: 'STONKS Arrow Up',
    category: 'Top Used',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 110">
        <rect x="6" y="14" width="118" height="82" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="3"/>
        <polyline points="18,78 46,56 66,66 106,28" fill="none" stroke="#22C55E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <polygon points="108,26 92,28 104,40" fill="#22C55E"/>
        <text x="65" y="88" font-family="sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">STONKS</text>
      </svg>
    `),
  },
  {
    id: 'capybara_orange',
    label: 'Chill Capybara Orange',
    category: 'New',
    group: 'hamster',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#291A10" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="72" rx="38" ry="30" fill="#A16207"/>
          <ellipse cx="42" cy="70" rx="18" ry="14" fill="#78350F"/>
          <line x1="62" y1="62" x2="76" y2="62" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="62" cy="30" r="14" fill="#F97316"/>
          <path d="M62 16 Q68 8 74 14 Q68 18 62 16 Z" fill="#22C55E"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'beluga_smirk_cat',
    label: 'Beluga Polite Smirk Cat',
    category: 'Trending',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,46 20,16 50,32" fill="#F8FAFC"/>
          <polygon points="92,46 100,16 70,32" fill="#F8FAFC"/>
          <circle cx="60" cy="62" r="32" fill="#F8FAFC"/>
          <circle cx="46" cy="54" r="4.5" fill="#18181B"/>
          <circle cx="74" cy="54" r="4.5" fill="#18181B"/>
          <path d="M40 72 Q60 76 80 70" fill="none" stroke-width="3.5" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_huh_confused',
    label: 'HUH? Confused Cat',
    category: 'New',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,46 22,18 48,32" fill="#9CA3AF"/>
          <polygon points="92,46 98,18 72,32" fill="#9CA3AF"/>
          <circle cx="60" cy="62" r="31" fill="#D1D5DB"/>
          <circle cx="46" cy="56" r="5" fill="#18181B"/>
          <circle cx="74" cy="56" r="5" fill="#18181B"/>
          <ellipse cx="60" cy="72" rx="7" ry="5" fill="#F472B6"/>
          <text x="96" y="34" font-family="sans-serif" font-weight="900" font-size="22" fill="#EF4444" stroke="none">?</text>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_vibing_headphones',
    label: 'Vibing Music Cat',
    category: 'Top Used',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <path d="M26 62 C26 22, 94 22, 94 62" fill="none" stroke="#EC4899" stroke-width="6"/>
          <circle cx="60" cy="64" r="28" fill="#FFFFFF"/>
          <rect x="20" y="50" width="14" height="28" rx="6" fill="#EC4899"/>
          <rect x="86" y="50" width="14" height="28" rx="6" fill="#EC4899"/>
          <path d="M44 58 Q50 52 56 58" fill="none" stroke-width="3"/>
          <path d="M64 58 Q70 52 76 58" fill="none" stroke-width="3"/>
          <path d="M52 72 Q60 79 68 72" fill="none" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_crying_peace',
    label: 'Crying Peace Cat',
    category: 'New',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,48 24,20 48,34" fill="#F8FAFC"/>
          <polygon points="84,48 88,20 64,34" fill="#F8FAFC"/>
          <circle cx="56" cy="62" r="29" fill="#FFFFFF"/>
          <circle cx="45" cy="56" r="6" fill="#18181B"/>
          <circle cx="67" cy="56" r="6" fill="#18181B"/>
          <path d="M40 64 Q45 73 50 64" fill="#38BDF8" stroke="none"/>
          <path d="M62 64 Q67 73 72 64" fill="#38BDF8" stroke="none"/>
          <rect x="88" y="42" width="7" height="24" rx="3.5" transform="rotate(-12 91 54)" fill="#FFFFFF"/>
          <rect x="98" y="42" width="7" height="24" rx="3.5" transform="rotate(12 101 54)" fill="#FFFFFF"/>
          <circle cx="96" cy="70" r="10" fill="#FFFFFF"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'cat_shocked_wide',
    label: 'Shocked Wide-Eye Cat',
    category: 'Trending',
    group: 'cat',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,46 22,16 50,32" fill="#FDBA74"/>
          <polygon points="92,46 98,16 70,32" fill="#FDBA74"/>
          <circle cx="60" cy="62" r="32" fill="#FED7AA"/>
          <circle cx="46" cy="54" r="10" fill="#FFFFFF"/>
          <circle cx="74" cy="54" r="10" fill="#FFFFFF"/>
          <circle cx="46" cy="54" r="3" fill="#09090B"/>
          <circle cx="74" cy="54" r="3" fill="#09090B"/>
          <ellipse cx="60" cy="74" rx="8" ry="10" fill="#18181B"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_side_eye',
    label: 'Side-Eye Sus Monkey',
    category: 'Trending',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <circle cx="28" cy="54" r="11" fill="#D9A782"/>
          <circle cx="92" cy="54" r="11" fill="#D9A782"/>
          <circle cx="60" cy="58" r="30" fill="#8D5B3C"/>
          <ellipse cx="60" cy="64" rx="22" ry="18" fill="#E6BC98"/>
          <ellipse cx="48" cy="52" rx="8" ry="6" fill="#FFFFFF"/>
          <ellipse cx="72" cy="52" rx="8" ry="6" fill="#FFFFFF"/>
          <circle cx="52" cy="52" r="3.5" fill="#18181B"/>
          <circle cx="76" cy="52" r="3.5" fill="#18181B"/>
          <line x1="50" y1="72" x2="70" y2="70" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_coffee',
    label: 'Monkey Sipping Coffee',
    category: 'New',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <circle cx="28" cy="46" r="10" fill="#D9A782"/>
          <circle cx="92" cy="46" r="10" fill="#D9A782"/>
          <circle cx="60" cy="48" r="26" fill="#7C4D30"/>
          <ellipse cx="60" cy="54" rx="19" ry="15" fill="#E6BC98"/>
          <circle cx="52" cy="46" r="3.2" fill="#18181B"/>
          <circle cx="68" cy="46" r="3.2" fill="#18181B"/>
          <rect x="44" y="72" width="32" height="28" rx="4" fill="#FFFFFF"/>
          <path d="M76 78 C86 78 86 92 76 92" fill="none" stroke="#FFFFFF" stroke-width="4"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'monkey_crown_king',
    label: 'King Crown Monkey',
    category: 'Top Used',
    group: 'monkey',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#2A1810" stroke-width="3" stroke-linejoin="round">
          <polygon points="36,34 42,14 54,26 60,12 66,26 78,14 84,34" fill="#FACC15"/>
          <circle cx="28" cy="58" r="10" fill="#D9A782"/>
          <circle cx="92" cy="58" r="10" fill="#D9A782"/>
          <circle cx="60" cy="60" r="28" fill="#8D5B3C"/>
          <ellipse cx="60" cy="65" rx="20" ry="16" fill="#E6BC98"/>
          <circle cx="52" cy="58" r="3.5" fill="#18181B"/>
          <circle cx="68" cy="58" r="3.5" fill="#18181B"/>
          <path d="M50 72 Q60 78 70 72" fill="none" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'noot_penguin',
    label: 'Noot Noot Penguin',
    category: 'Trending',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="64" rx="32" ry="38" fill="#18181B"/>
          <circle cx="46" cy="48" r="7" fill="#FFFFFF"/>
          <circle cx="74" cy="48" r="7" fill="#FFFFFF"/>
          <circle cx="46" cy="48" r="3" fill="#09090B"/>
          <circle cx="74" cy="48" r="3" fill="#09090B"/>
          <ellipse cx="60" cy="70" rx="14" ry="10" fill="#EF4444"/>
          <ellipse cx="60" cy="70" rx="7" ry="5" fill="#7F1D1D"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'shiba_bonk',
    label: 'Shiba BONK Meme',
    category: 'Top Used',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <polygon points="28,46 22,18 48,32" fill="#F59E0B"/>
          <polygon points="84,46 90,18 64,32" fill="#F59E0B"/>
          <circle cx="56" cy="64" r="30" fill="#FBBF24"/>
          <circle cx="46" cy="56" r="4" fill="#18181B"/>
          <circle cx="66" cy="56" r="4" fill="#18181B"/>
          <rect x="82" y="16" width="14" height="58" rx="6" transform="rotate(24 89 45)" fill="#B45309"/>
          <text x="84" y="96" font-family="sans-serif" font-weight="900" font-size="16" fill="#EF4444" stroke="none">BONK!</text>
        </g>
      </svg>
    `),
  },
  {
    id: 'hero_spider_point',
    label: 'Spider-Hero Pointing',
    category: 'Top Used',
    group: 'hero',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="48" cy="58" rx="25" ry="30" fill="#DC2626"/>
          <path d="M32 48 Q42 38 46 54 Q36 58 32 48 Z" fill="#F8FAFC" stroke-width="3"/>
          <path d="M64 48 Q54 38 50 54 Q60 58 64 48 Z" fill="#F8FAFC" stroke-width="3"/>
          <rect x="70" y="54" width="38" height="12" rx="6" fill="#DC2626"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'hero_deadpool_heart',
    label: 'Anti-Hero Heart Mask',
    category: 'New',
    group: 'hero',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="58" rx="28" ry="34" fill="#B91C1C"/>
          <ellipse cx="46" cy="54" rx="10" ry="15" fill="#18181B"/>
          <ellipse cx="74" cy="54" rx="10" ry="15" fill="#18181B"/>
          <ellipse cx="46" cy="54" rx="4" ry="7" fill="#FFFFFF"/>
          <ellipse cx="74" cy="54" rx="4" ry="7" fill="#FFFFFF"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'skull_bruh',
    label: 'Skull Bruh Moment',
    category: 'Top Used',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <path d="M26 56 C26 26, 94 26, 94 56 C94 74, 82 82, 82 94 L38 94 C38 82, 26 74, 26 56 Z" fill="#F8FAFC"/>
          <circle cx="45" cy="56" r="10" fill="#18181B"/>
          <circle cx="75" cy="56" r="10" fill="#18181B"/>
          <polygon points="60,66 55,76 65,76" fill="#18181B"/>
          <line x1="48" y1="84" x2="48" y2="94" stroke-width="3"/>
          <line x1="60" y1="84" x2="60" y2="94" stroke-width="3"/>
          <line x1="72" y1="84" x2="72" y2="94" stroke-width="3"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'clown_meme',
    label: 'Clown Moment Meme',
    category: 'Trending',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <circle cx="24" cy="48" r="14" fill="#EF4444"/>
          <circle cx="96" cy="48" r="14" fill="#EF4444"/>
          <circle cx="34" cy="28" r="13" fill="#FACC15"/>
          <circle cx="86" cy="28" r="13" fill="#3B82F6"/>
          <circle cx="60" cy="60" r="32" fill="#FFFFFF"/>
          <circle cx="47" cy="52" r="4" fill="#18181B"/>
          <circle cx="73" cy="52" r="4" fill="#18181B"/>
          <circle cx="60" cy="64" r="9" fill="#EF4444"/>
          <path d="M44 76 Q60 88 76 76" fill="none" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'wojak_mask',
    label: 'Smiling Behind Mask',
    category: 'New',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="60" cy="60" rx="34" ry="38" fill="#F8FAFC"/>
          <circle cx="47" cy="52" r="4" fill="#18181B"/>
          <circle cx="73" cy="52" r="4" fill="#18181B"/>
          <path d="M42 70 Q60 84 78 70" fill="none" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M36 58 Q32 70 38 74" fill="#38BDF8" stroke="none"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'hamster_peace',
    label: 'Chubby Peace Hamster',
    category: 'New',
    group: 'hamster',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <g stroke="#18181B" stroke-width="3" stroke-linejoin="round">
          <circle cx="34" cy="34" r="10" fill="#F59E0B"/>
          <circle cx="86" cy="34" r="10" fill="#F59E0B"/>
          <ellipse cx="60" cy="64" rx="34" ry="32" fill="#FEF08A"/>
          <circle cx="46" cy="56" r="5" fill="#18181B"/>
          <circle cx="74" cy="56" r="5" fill="#18181B"/>
          <circle cx="36" cy="66" r="6" fill="#FDA4AF" stroke="none"/>
          <circle cx="84" cy="66" r="6" fill="#FDA4AF" stroke="none"/>
          <path d="M52 68 Q60 74 68 68" fill="none" stroke-width="2.5"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'speech_no_cap',
    label: 'NO CAP Bubble',
    category: 'Trending',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90">
        <rect x="8" y="10" width="124" height="56" rx="16" fill="#FFFFFF" stroke="#18181B" stroke-width="4"/>
        <polygon points="36,66 24,84 54,66" fill="#FFFFFF" stroke="#18181B" stroke-width="4"/>
        <text x="70" y="45" font-family="sans-serif" font-weight="900" font-size="20" fill="#18181B" text-anchor="middle">NO CAP!</text>
      </svg>
    `),
  },
  {
    id: 'speech_slay',
    label: 'SLAY Pop Badge',
    category: 'New',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80">
        <rect x="8" y="12" width="124" height="54" rx="27" fill="#EC4899" stroke="#FFFFFF" stroke-width="4"/>
        <text x="70" y="47" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">SLAY!</text>
      </svg>
    `),
  },
  {
    id: 'speech_real',
    label: 'SO REAL Stamp',
    category: 'Top Used',
    group: 'meme',
    svgDataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80">
        <rect x="8" y="12" width="124" height="54" rx="10" fill="#FACC15" stroke="#18181B" stroke-width="4"/>
        <text x="70" y="47" font-family="sans-serif" font-weight="900" font-size="20" fill="#18181B" text-anchor="middle">SO REAL</text>
      </svg>
    `),
  },
]


export { FRAME_TEMPLATES, DEFAULT_FRAME } from './frameCatalog'
