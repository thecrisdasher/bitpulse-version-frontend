// These modules are only available in the Node.js runtime (server side)
// Import them conditionally so the file can also be bundled for the client.
let fs: typeof import('fs') | null = null;
let path: typeof import('path') | null = null;

if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  path = require('path');
}

export type MarketCategory = 'acciones' | 'materias-primas' | 'criptomonedas' | 'divisas' | 'indices';

const DATA_PATH = typeof window === 'undefined' && path ? path.resolve(process.cwd(), 'lib/config/leverageData.json') : '';

const defaultSettings: Record<MarketCategory, number> = {
  'acciones': 5,
  'materias-primas': 10,
  'criptomonedas': 20,
  'divisas': 50,
  'indices': 100,
};

function loadFromFile(): Record<MarketCategory, number> {
  try {
    if (fs && fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch {
    /* ignore */
  }
  return { ...defaultSettings };
}

function saveToFile(data: Record<MarketCategory, number>) {
  try {
    if (fs) {
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch {
    /* ignore */
  }
}

// Estado en memoria
let leverageSettings: Record<MarketCategory, number> = loadFromFile();

export const getLeverage = (category: MarketCategory): number => {
  return leverageSettings[category] ?? defaultSettings[category];
};

export const setLeverage = (category: MarketCategory, value: number): void => {
  leverageSettings[category] = value;
  saveToFile(leverageSettings);
};

export const getAllLeverage = (): Record<MarketCategory, number> => {
  return { ...leverageSettings };
}; 