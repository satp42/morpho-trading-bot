import fs from 'fs';
import path from 'path';

export interface VaultConfig {
  marketId: string;
  chainId: number;
  collateralToken: string;
  collateralSymbol: string;
  loanToken: string;
  loanSymbol: string;
  oracle: string;
  irm: string;
  lltv: string;
  lltvPercent: number;
}

export interface MarketKey {
  chainId: number;
  collateralToken: string;
  loanToken: string;
}

function validateVaultConfig(config: unknown): asserts config is VaultConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Vault config must be an object');
  }

  const v = config as Record<string, unknown>;

  if (typeof v.marketId !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(v.marketId)) {
    throw new Error('marketId must be a valid 32-byte hex string');
  }

  if (typeof v.chainId !== 'number' || v.chainId <= 0) {
    throw new Error('chainId must be a positive number');
  }

  if (typeof v.collateralToken !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(v.collateralToken)) {
    throw new Error('collateralToken must be a valid Ethereum address');
  }

  if (typeof v.collateralSymbol !== 'string' || v.collateralSymbol.length === 0) {
    throw new Error('collateralSymbol must be a non-empty string');
  }

  if (typeof v.loanToken !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(v.loanToken)) {
    throw new Error('loanToken must be a valid Ethereum address');
  }

  if (typeof v.loanSymbol !== 'string' || v.loanSymbol.length === 0) {
    throw new Error('loanSymbol must be a non-empty string');
  }

  if (typeof v.oracle !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(v.oracle)) {
    throw new Error('oracle must be a valid Ethereum address');
  }

  if (typeof v.irm !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(v.irm)) {
    throw new Error('irm must be a valid Ethereum address');
  }

  if (typeof v.lltv !== 'string' || !/^\d+$/.test(v.lltv)) {
    throw new Error('lltv must be a numeric string');
  }

  if (typeof v.lltvPercent !== 'number' || v.lltvPercent <= 0 || v.lltvPercent > 100) {
    throw new Error('lltvPercent must be a number between 0 and 100');
  }

  const expectedLltv = BigInt(Math.floor(v.lltvPercent * 1e16));
  const actualLltv = BigInt(v.lltv);
  if (actualLltv !== expectedLltv) {
    throw new Error(`lltv ${v.lltv} does not match lltvPercent ${v.lltvPercent}`);
  }
}

function generateMarketKey(config: VaultConfig): string {
  return `${config.chainId}-${config.collateralToken.toLowerCase()}-${config.loanToken.toLowerCase()}`;
}

export function loadVaultConfigs(
  configPath: string = path.join(process.cwd(), 'config/morpho-vaults.json')
): VaultConfig[] {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const fileContent = fs.readFileSync(configPath, 'utf-8');
  let rawConfigs: unknown;

  try {
    rawConfigs = JSON.parse(fileContent);
  } catch (err) {
    throw new Error(`Invalid JSON in config file: ${err}`);
  }

  if (!Array.isArray(rawConfigs)) {
    throw new Error('Config must be an array of vault configurations');
  }

  const marketIds = new Set<string>();
  const marketKeys = new Set<string>();
  const configs: VaultConfig[] = [];

  for (const rawConfig of rawConfigs) {
    validateVaultConfig(rawConfig);

    if (marketIds.has(rawConfig.marketId)) {
      throw new Error(`Duplicate marketId: ${rawConfig.marketId}`);
    }

    const marketKey = generateMarketKey(rawConfig);
    if (marketKeys.has(marketKey)) {
      throw new Error(
        `Duplicate market: chainId=${rawConfig.chainId}, collateral=${rawConfig.collateralSymbol}, loan=${rawConfig.loanSymbol}`
      );
    }

    marketIds.add(rawConfig.marketId);
    marketKeys.add(marketKey);
    configs.push(rawConfig);
  }

  return configs;
}

export function getVaultByMarketId(
  vaults: VaultConfig[],
  marketId: string
): VaultConfig | undefined {
  return vaults.find((v) => v.marketId.toLowerCase() === marketId.toLowerCase());
}

export function getVaultsByChain(vaults: VaultConfig[], chainId: number): VaultConfig[] {
  return vaults.filter((v) => v.chainId === chainId);
}

export function getMarketKey(vault: VaultConfig): MarketKey {
  return {
    chainId: vault.chainId,
    collateralToken: vault.collateralToken.toLowerCase(),
    loanToken: vault.loanToken.toLowerCase(),
  };
}

