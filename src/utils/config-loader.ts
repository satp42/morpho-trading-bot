import fs from 'fs';
import path from 'path';

export interface ChainConfig {
  chainId: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  nativeSymbol: string;
  biconomyApiKey: string;
}

function validateChainConfig(config: unknown): asserts config is ChainConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Chain config must be an object');
  }

  const c = config as Record<string, unknown>;

  if (typeof c.chainId !== 'number' || c.chainId <= 0) {
    throw new Error('chainId must be a positive number');
  }

  if (typeof c.name !== 'string' || c.name.length === 0) {
    throw new Error('name must be a non-empty string');
  }

  if (typeof c.displayName !== 'string' || c.displayName.length === 0) {
    throw new Error('displayName must be a non-empty string');
  }

  if (typeof c.rpcUrl !== 'string' || c.rpcUrl.length === 0) {
    throw new Error('rpcUrl must be a non-empty string');
  }

  if (typeof c.nativeSymbol !== 'string' || c.nativeSymbol.length === 0) {
    throw new Error('nativeSymbol must be a non-empty string');
  }

  if (typeof c.biconomyApiKey !== 'string' || c.biconomyApiKey.length === 0) {
    throw new Error('biconomyApiKey must be a non-empty string');
  }
}

function resolveEnvVars(value: string, envVars: Record<string, string>): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
    const envValue = envVars[key];
    if (!envValue) {
      throw new Error(`Environment variable ${key} not found`);
    }
    return envValue;
  });
}

export function loadChainConfigs(
  configPath: string = path.join(process.cwd(), 'config/chains.json'),
  envVars: Record<string, string> = process.env as Record<string, string>
): ChainConfig[] {
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
    throw new Error('Config must be an array of chain configurations');
  }

  if (rawConfigs.length === 0) {
    throw new Error('Config must contain at least one chain');
  }

  const chainIds = new Set<number>();
  const chainNames = new Set<string>();
  const configs: ChainConfig[] = [];

  for (const rawConfig of rawConfigs) {
    validateChainConfig(rawConfig);

    if (chainIds.has(rawConfig.chainId)) {
      throw new Error(`Duplicate chainId: ${rawConfig.chainId}`);
    }

    if (chainNames.has(rawConfig.name)) {
      throw new Error(`Duplicate chain name: ${rawConfig.name}`);
    }

    chainIds.add(rawConfig.chainId);
    chainNames.add(rawConfig.name);

    const resolvedConfig: ChainConfig = {
      ...rawConfig,
      rpcUrl: resolveEnvVars(rawConfig.rpcUrl, envVars),
      biconomyApiKey: resolveEnvVars(rawConfig.biconomyApiKey, envVars),
    };

    configs.push(resolvedConfig);
  }

  return configs;
}

export function getChainByName(chains: ChainConfig[], name: string): ChainConfig | undefined {
  return chains.find((c) => c.name === name);
}

export function getChainById(chains: ChainConfig[], chainId: number): ChainConfig | undefined {
  return chains.find((c) => c.chainId === chainId);
}

