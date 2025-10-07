import path from 'path';
import { loadChainConfigs, ChainConfig, getChainByName, getChainById } from './config-loader';
import { loadVaultConfigs, VaultConfig, getVaultByMarketId, getVaultsByChain } from './vault-loader';
import { loadStrategyParams, StrategyParams } from './strategy-loader';

export interface BotConfig {
  chains: ChainConfig[];
  vaults: VaultConfig[];
  strategy: StrategyParams;
}

export class ConfigManager {
  private config: BotConfig;

  constructor(configDir: string = path.join(process.cwd(), 'config')) {
    const chainsPath = path.join(configDir, 'chains.json');
    const vaultsPath = path.join(configDir, 'morpho-vaults.json');
    const strategyPath = path.join(configDir, 'strategy-params.json');

    this.config = {
      chains: loadChainConfigs(chainsPath),
      vaults: loadVaultConfigs(vaultsPath),
      strategy: loadStrategyParams(strategyPath),
    };

    this.validateCrossReferences();
  }

  private validateCrossReferences(): void {
    const chainIds = new Set(this.config.chains.map((c) => c.chainId));

    for (const vault of this.config.vaults) {
      if (!chainIds.has(vault.chainId)) {
        throw new Error(
          `Vault ${vault.marketId} references unknown chainId ${vault.chainId}`
        );
      }
    }
  }

  getChains(): ChainConfig[] {
    return [...this.config.chains];
  }

  getChainByName(name: string): ChainConfig | undefined {
    return getChainByName(this.config.chains, name);
  }

  getChainById(chainId: number): ChainConfig | undefined {
    return getChainById(this.config.chains, chainId);
  }

  getVaults(): VaultConfig[] {
    return [...this.config.vaults];
  }

  getVaultByMarketId(marketId: string): VaultConfig | undefined {
    return getVaultByMarketId(this.config.vaults, marketId);
  }

  getVaultsByChain(chainId: number): VaultConfig[] {
    return getVaultsByChain(this.config.vaults, chainId);
  }

  getStrategy(): StrategyParams {
    return { ...this.config.strategy };
  }

  getFullConfig(): BotConfig {
    return {
      chains: this.getChains(),
      vaults: this.getVaults(),
      strategy: this.getStrategy(),
    };
  }
}

let configInstance: ConfigManager | null = null;

export function initializeConfig(configDir?: string): ConfigManager {
  configInstance = new ConfigManager(configDir);
  return configInstance;
}

export function getConfig(): ConfigManager {
  if (!configInstance) {
    throw new Error('Config not initialized. Call initializeConfig() first.');
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}

