// Hearth & Skillet — Static configuration: kitchen layout, ingredients, recipes, timings, palette.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const GRID_COLS = 13;
export const GRID_ROWS = 6;
export const TILE_SIZE = 84;
export const GRID_X = Math.floor((CANVAS_W - GRID_COLS * TILE_SIZE) / 2);
export const GRID_Y = 154;

export const SHIFT_DURATION = 120;
export const TARGET_REVENUE = 480;
export const MAX_STRIKES = 3;
export const MAX_ACTIVE_ORDERS = 4;

export const CHEF_SPEED = 310;
export const CHEF_DASH_SPEED = 640;
export const CHEF_DASH_DURATION = 0.18;
export const CHEF_DASH_COOLDOWN = 1.4;
export const CHOP_STEPS = 3;
export const COOK_TIME_STOVE = 5.2;
export const COOK_TIME_GRILL = 3.8;
export const BURN_WARNING_TIME = 4.2;
export const BURN_TOTAL_TIME = 7.4;

export const PALETTE = {
  wallDark: '#2a1a12',
  wallWarm: '#3d2518',
  railBrass: '#d9a441',
  railShadow: '#8e621c',
  tileLight: '#f3e5cf',
  tileDark: '#dfb995',
  tileGrout: '#caa07a',
  woodTop: '#c48349',
  woodEdge: '#8a5328',
  woodHighlight: '#dfa468',
  boardWood: '#e7be85',
  stoveMetal: '#464952',
  copper: '#cf6f3e',
  copperLight: '#ec9a69',
  flame: '#ff7b29',
  parchment: '#fbf2dc',
  parchmentEdge: '#d8c298',
  ink: '#2d1c12',
  mutedInk: '#6f513d',
  good: '#2f9e5b',
  warn: '#e08e26',
  danger: '#d43f35',
  gold: '#f5b82e',
};

export const INGREDIENTS = {
  tomato_raw: { id: 'tomato_raw', label: 'Tomato', short: 'Tomato', color: '#e23d2d', accent: '#4f9c3d', chopTo: 'tomato_diced' },
  tomato_diced: { id: 'tomato_diced', label: 'Diced Tomato', short: 'Diced Tom', color: '#e64d36', accent: '#f7a58d', cookTo: 'marinara' },
  marinara: { id: 'marinara', label: 'Marinara', short: 'Marinara', color: '#c42e20', accent: '#ff8f5c' },
  pasta_raw: { id: 'pasta_raw', label: 'Raw Pasta', short: 'Pasta', color: '#f0c55b', accent: '#d69f2d', cookTo: 'pasta_cooked' },
  pasta_cooked: { id: 'pasta_cooked', label: 'Cooked Pasta', short: 'Al Dente', color: '#f6d676', accent: '#fff2b8' },
  steak_raw: { id: 'steak_raw', label: 'Raw Cutlet', short: 'Cutlet', color: '#b53f43', accent: '#f0c7be', chopTo: 'steak_prepped' },
  steak_prepped: { id: 'steak_prepped', label: 'Seasoned Cutlet', short: 'Prepped', color: '#c84a48', accent: '#629c45', cookTo: 'steak_seared' },
  steak_seared: { id: 'steak_seared', label: 'Seared Steak', short: 'Seared', color: '#6b3222', accent: '#b86842' },
  herbs_raw: { id: 'herbs_raw', label: 'Fresh Herbs', short: 'Herbs', color: '#3b9b49', accent: '#7cd470', chopTo: 'herbs_chopped' },
  herbs_chopped: { id: 'herbs_chopped', label: 'Minced Herbs', short: 'Herb Mix', color: '#2c8a3d', accent: '#9ae67e' },
  cheese_raw: { id: 'cheese_raw', label: 'Mozzarella', short: 'Cheese', color: '#fff4cf', accent: '#e5cf8e', chopTo: 'cheese_grated' },
  cheese_grated: { id: 'cheese_grated', label: 'Grated Cheese', short: 'Grated', color: '#fff7db', accent: '#f2d98c' },
};

export const RECIPES = [
  {
    id: 'bruschetta',
    name: 'Caprese Bruschetta',
    shortName: 'Caprese',
    price: 75,
    orderTime: 46,
    minElapsed: 0,
    ingredients: ['tomato_diced', 'cheese_grated', 'herbs_chopped'],
  },
  {
    id: 'marinara_pasta',
    name: 'Herb Marinara Pasta',
    shortName: 'Marinara Pasta',
    price: 115,
    orderTime: 54,
    minElapsed: 0,
    ingredients: ['pasta_cooked', 'marinara', 'herbs_chopped'],
  },
  {
    id: 'herb_steak',
    name: 'Seared Herb Steak',
    shortName: 'Herb Steak',
    price: 125,
    orderTime: 54,
    minElapsed: 0,
    ingredients: ['steak_seared', 'herbs_chopped'],
  },
  {
    id: 'steak_melt',
    name: 'Cheesy Steak Melt',
    shortName: 'Steak Melt',
    price: 155,
    orderTime: 60,
    minElapsed: 22,
    ingredients: ['steak_seared', 'cheese_grated', 'tomato_diced'],
  },
  {
    id: 'bistro_skillet',
    name: 'Grand Bistro Skillet',
    shortName: 'Bistro Skillet',
    price: 210,
    orderTime: 68,
    minElapsed: 48,
    ingredients: ['pasta_cooked', 'steak_seared', 'marinara', 'cheese_grated'],
  },
];

// Legend for kitchen station layout (13 cols x 6 rows)
export function createKitchenLayout() {
  const rows = [
    [
      { type: 'counter' },
      { type: 'stove', id: 'stove-1', label: 'SKILLET' },
      { type: 'stove', id: 'stove-2', label: 'SKILLET' },
      { type: 'counter' },
      { type: 'grill', id: 'grill-1', label: 'HEARTH' },
      { type: 'counter' },
      { type: 'plate_rack', label: 'PLATES' },
      { type: 'assembly', id: 'asm-1', label: 'PLATE' },
      { type: 'assembly', id: 'asm-2', label: 'PLATE' },
      { type: 'counter' },
      { type: 'pass', label: 'SERVE' },
      { type: 'pass', label: 'SERVE' },
      { type: 'trash', label: 'TRASH' },
    ],
    new Array(GRID_COLS).fill(null).map(() => ({ type: 'floor' })),
    [
      { type: 'floor' },
      { type: 'floor' },
      { type: 'floor' },
      { type: 'chop', id: 'chop-1', label: 'CHOP' },
      { type: 'counter', id: 'island-1' },
      { type: 'chop', id: 'chop-2', label: 'CHOP' },
      { type: 'floor' },
      { type: 'assembly', id: 'asm-3', label: 'PLATE' },
      { type: 'counter', id: 'island-2' },
      { type: 'plate_rack', label: 'PLATES' },
      { type: 'floor' },
      { type: 'floor' },
      { type: 'floor' },
    ],
    new Array(GRID_COLS).fill(null).map(() => ({ type: 'floor' })),
    new Array(GRID_COLS).fill(null).map(() => ({ type: 'floor' })),
    [
      { type: 'counter' },
      { type: 'crate', crateItem: 'tomato_raw', label: 'TOMATO' },
      { type: 'counter' },
      { type: 'crate', crateItem: 'pasta_raw', label: 'PASTA' },
      { type: 'counter' },
      { type: 'crate', crateItem: 'steak_raw', label: 'CUTLET' },
      { type: 'counter' },
      { type: 'crate', crateItem: 'herbs_raw', label: 'HERBS' },
      { type: 'counter' },
      { type: 'crate', crateItem: 'cheese_raw', label: 'CHEESE' },
      { type: 'counter' },
      { type: 'counter' },
      { type: 'counter' },
    ],
  ];
  return rows;
}
