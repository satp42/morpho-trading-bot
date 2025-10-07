import { ConfigManager, initializeConfig, getConfig, resetConfig } from '../src/utils/config';
import fs from 'fs';
import path from 'path';

describe('config', () => {
  const testConfigDir = path.join(__dirname, 'test-config-dir');
  const chainsPath = path.join(testConfigDir, 'chains.json');
  const vaultsPath = path.join(testConfigDir, 'morpho-vaults.json');
  const strategyPath = path.join(testConfigDir, 'strategy-params.json');

  const validChains = [
    {
      chainId: 1,
      name: 'ethereum',
      displayName: 'Ethereum',
      rpcUrl: 'http://test.com',
      nativeSymbol: 'ETH',
      biconomyApiKey: 'test-key',
    },
    {
      chainId: 42161,
      name: 'arbitrum',
      displayName: 'Arbitrum',
      rpcUrl: 'http://arb.com',
      nativeSymbol: 'ETH',
      biconomyApiKey: 'test-key',
    },
  ];

  const validVaults = [
    {
      marketId: '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
      chainId: 1,
      collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      collateralSymbol: 'wstETH',
      loanToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      loanSymbol: 'USDC',
      oracle: '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2',
      irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
      lltv: '945000000000000000',
      lltvPercent: 94.5,
    },
    {
      marketId: '0xc54d7acf14de29e0e5527cabd7a576506870346a78a11a6762e2cca66322ec41',
      chainId: 42161,
      collateralToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      collateralSymbol: 'wstETH',
      loanToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      loanSymbol: 'WETH',
      oracle: '0x2a01EB9496094dA03c4E364Def50f5aD1280AD72',
      irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
      lltv: '945000000000000000',
      lltvPercent: 94.5,
    },
  ];

  const validStrategy = {
    targetUtilizationRange: { min: 0.7, max: 0.9 },
    minAPYDeltaToSwitch: 0.005,
    maxLoopDepth: 3,
    maxLTVBuffer: 0.05,
    maxGasUSD: 50,
  };

  beforeEach(() => {
    resetConfig();
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
    fs.writeFileSync(chainsPath, JSON.stringify(validChains));
    fs.writeFileSync(vaultsPath, JSON.stringify(validVaults));
    fs.writeFileSync(strategyPath, JSON.stringify(validStrategy));
  });

  afterEach(() => {
    resetConfig();
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true });
    }
  });

  describe('ConfigManager', () => {
    it('should load all configs successfully', () => {
      const config = new ConfigManager(testConfigDir);

      expect(config.getChains()).toHaveLength(2);
      expect(config.getVaults()).toHaveLength(2);
      expect(config.getStrategy()).toBeDefined();
    });

    it('should validate cross-references between chains and vaults', () => {
      const invalidVaults = [
        {
          ...validVaults[0],
          chainId: 999,
        },
      ];
      fs.writeFileSync(vaultsPath, JSON.stringify(invalidVaults));

      expect(() => new ConfigManager(testConfigDir)).toThrow('references unknown chainId');
    });

    describe('getChains', () => {
      it('should return all chains', () => {
        const config = new ConfigManager(testConfigDir);
        const chains = config.getChains();

        expect(chains).toHaveLength(2);
        expect(chains[0].chainId).toBe(1);
        expect(chains[1].chainId).toBe(42161);
      });

      it('should return a copy of chains array', () => {
        const config = new ConfigManager(testConfigDir);
        const chains1 = config.getChains();
        const chains2 = config.getChains();

        expect(chains1).not.toBe(chains2);
        expect(chains1).toEqual(chains2);
      });
    });

    describe('getChainByName', () => {
      it('should find chain by name', () => {
        const config = new ConfigManager(testConfigDir);
        const chain = config.getChainByName('ethereum');

        expect(chain).toBeDefined();
        expect(chain?.chainId).toBe(1);
        expect(chain?.name).toBe('ethereum');
      });

      it('should return undefined for unknown chain', () => {
        const config = new ConfigManager(testConfigDir);
        const chain = config.getChainByName('unknown');

        expect(chain).toBeUndefined();
      });
    });

    describe('getChainById', () => {
      it('should find chain by id', () => {
        const config = new ConfigManager(testConfigDir);
        const chain = config.getChainById(42161);

        expect(chain).toBeDefined();
        expect(chain?.chainId).toBe(42161);
        expect(chain?.name).toBe('arbitrum');
      });

      it('should return undefined for unknown chain', () => {
        const config = new ConfigManager(testConfigDir);
        const chain = config.getChainById(999);

        expect(chain).toBeUndefined();
      });
    });

    describe('getVaults', () => {
      it('should return all vaults', () => {
        const config = new ConfigManager(testConfigDir);
        const vaults = config.getVaults();

        expect(vaults).toHaveLength(2);
        expect(vaults[0].chainId).toBe(1);
        expect(vaults[1].chainId).toBe(42161);
      });

      it('should return a copy of vaults array', () => {
        const config = new ConfigManager(testConfigDir);
        const vaults1 = config.getVaults();
        const vaults2 = config.getVaults();

        expect(vaults1).not.toBe(vaults2);
        expect(vaults1).toEqual(vaults2);
      });
    });

    describe('getVaultByMarketId', () => {
      it('should find vault by market id', () => {
        const config = new ConfigManager(testConfigDir);
        const vault = config.getVaultByMarketId(
          '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc'
        );

        expect(vault).toBeDefined();
        expect(vault?.collateralSymbol).toBe('wstETH');
        expect(vault?.loanSymbol).toBe('USDC');
      });

      it('should return undefined for unknown market', () => {
        const config = new ConfigManager(testConfigDir);
        const vault = config.getVaultByMarketId('0x' + '0'.repeat(64));

        expect(vault).toBeUndefined();
      });
    });

    describe('getVaultsByChain', () => {
      it('should filter vaults by chain', () => {
        const config = new ConfigManager(testConfigDir);
        const ethVaults = config.getVaultsByChain(1);
        const arbVaults = config.getVaultsByChain(42161);

        expect(ethVaults).toHaveLength(1);
        expect(arbVaults).toHaveLength(1);
        expect(ethVaults[0].chainId).toBe(1);
        expect(arbVaults[0].chainId).toBe(42161);
      });

      it('should return empty array for chains with no vaults', () => {
        const config = new ConfigManager(testConfigDir);
        const vaults = config.getVaultsByChain(999);

        expect(vaults).toHaveLength(0);
      });
    });

    describe('getStrategy', () => {
      it('should return strategy params', () => {
        const config = new ConfigManager(testConfigDir);
        const strategy = config.getStrategy();

        expect(strategy.targetUtilizationRange.min).toBe(0.7);
        expect(strategy.targetUtilizationRange.max).toBe(0.9);
        expect(strategy.minAPYDeltaToSwitch).toBe(0.005);
        expect(strategy.maxLoopDepth).toBe(3);
        expect(strategy.maxLTVBuffer).toBe(0.05);
        expect(strategy.maxGasUSD).toBe(50);
      });

      it('should return a copy of strategy', () => {
        const config = new ConfigManager(testConfigDir);
        const strategy1 = config.getStrategy();
        const strategy2 = config.getStrategy();

        expect(strategy1).not.toBe(strategy2);
        expect(strategy1).toEqual(strategy2);
      });
    });

    describe('getFullConfig', () => {
      it('should return complete config', () => {
        const config = new ConfigManager(testConfigDir);
        const fullConfig = config.getFullConfig();

        expect(fullConfig.chains).toHaveLength(2);
        expect(fullConfig.vaults).toHaveLength(2);
        expect(fullConfig.strategy).toBeDefined();
      });
    });
  });

  describe('singleton pattern', () => {
    it('should initialize config', () => {
      const config = initializeConfig(testConfigDir);

      expect(config).toBeInstanceOf(ConfigManager);
      expect(config.getChains()).toHaveLength(2);
    });

    it('should get initialized config', () => {
      initializeConfig(testConfigDir);
      const config = getConfig();

      expect(config).toBeInstanceOf(ConfigManager);
      expect(config.getChains()).toHaveLength(2);
    });

    it('should throw if getting config before initialization', () => {
      expect(() => getConfig()).toThrow('Config not initialized');
    });

    it('should allow reinitialization after reset', () => {
      initializeConfig(testConfigDir);
      expect(() => getConfig()).not.toThrow();

      resetConfig();
      expect(() => getConfig()).toThrow('Config not initialized');

      initializeConfig(testConfigDir);
      expect(() => getConfig()).not.toThrow();
    });
  });

  describe('real config files', () => {
    it('should load actual config directory without errors', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        RPC_URL_MAINNET: 'http://test-mainnet.com',
        RPC_URL_ARBITRUM: 'http://test-arbitrum.com',
        RPC_URL_BASE: 'http://test-base.com',
        BICONOMY_API_KEY: 'test-biconomy-key',
      };

      const realConfigDir = path.join(process.cwd(), 'config');

      expect(() => new ConfigManager(realConfigDir)).not.toThrow();

      const config = new ConfigManager(realConfigDir);
      expect(config.getChains().length).toBeGreaterThan(0);
      expect(config.getVaults().length).toBeGreaterThan(0);
      expect(config.getStrategy()).toBeDefined();

      process.env = originalEnv;
    });
  });
});

