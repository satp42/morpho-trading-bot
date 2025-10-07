import {
  loadVaultConfigs,
  getVaultByMarketId,
  getVaultsByChain,
  getMarketKey,
} from '../src/utils/vault-loader';
import fs from 'fs';
import path from 'path';

describe('vault-loader', () => {
  const testConfigPath = path.join(__dirname, 'test-vaults.json');
  const validConfig = [
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
      chainId: 1,
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

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('loadVaultConfigs', () => {
    it('should load valid vault configs', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      const configs = loadVaultConfigs(testConfigPath);

      expect(configs).toHaveLength(2);
      expect(configs[0].marketId).toBe(
        '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc'
      );
      expect(configs[0].collateralSymbol).toBe('wstETH');
      expect(configs[0].loanSymbol).toBe('USDC');
    });

    it('should throw on missing config file', () => {
      expect(() => loadVaultConfigs('/nonexistent/path.json')).toThrow('Config file not found');
    });

    it('should throw on invalid JSON', () => {
      fs.writeFileSync(testConfigPath, 'invalid json');

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('Invalid JSON');
    });

    it('should throw if config is not an array', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify({ marketId: '0x123' }));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('must be an array');
    });

    it('should throw on duplicate marketId', () => {
      const duplicate = [validConfig[0], validConfig[0]];
      fs.writeFileSync(testConfigPath, JSON.stringify(duplicate));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('Duplicate marketId');
    });

    it('should throw on duplicate market key', () => {
      const duplicate = [
        validConfig[0],
        {
          ...validConfig[0],
          marketId: '0x1234567890123456789012345678901234567890123456789012345678901234',
        },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(duplicate));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('Duplicate market');
    });

    it('should throw on invalid marketId format', () => {
      const invalid = [{ ...validConfig[0], marketId: '0x123' }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('marketId must be');
    });

    it('should throw on invalid address format', () => {
      const invalid = [{ ...validConfig[0], collateralToken: '0x123' }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('collateralToken must be');
    });

    it('should throw on invalid chainId', () => {
      const invalid = [{ ...validConfig[0], chainId: -1 }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('chainId must be');
    });

    it('should throw on invalid lltv format', () => {
      const invalid = [{ ...validConfig[0], lltv: 'invalid' }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('lltv must be');
    });

    it('should throw on lltv mismatch with lltvPercent', () => {
      const invalid = [{ ...validConfig[0], lltv: '500000000000000000', lltvPercent: 94.5 }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('does not match');
    });

    it('should throw on invalid lltvPercent', () => {
      const invalid = [{ ...validConfig[0], lltvPercent: 150 }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadVaultConfigs(testConfigPath)).toThrow('lltvPercent must be');
    });
  });

  describe('getVaultByMarketId', () => {
    it('should find vault by market id', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadVaultConfigs(testConfigPath);

      const vault = getVaultByMarketId(
        configs,
        '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc'
      );

      expect(vault).toBeDefined();
      expect(vault?.collateralSymbol).toBe('wstETH');
      expect(vault?.loanSymbol).toBe('USDC');
    });

    it('should be case insensitive', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadVaultConfigs(testConfigPath);

      const vault = getVaultByMarketId(
        configs,
        '0xB323495F7E4148BE5643A4EA4A8221EEF163E4BCCFDEDC2A6F4696BAACBC86CC'
      );

      expect(vault).toBeDefined();
    });

    it('should return undefined for non-existent market', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadVaultConfigs(testConfigPath);

      const vault = getVaultByMarketId(
        configs,
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      );

      expect(vault).toBeUndefined();
    });
  });

  describe('getVaultsByChain', () => {
    it('should filter vaults by chain', () => {
      const multiChain = [
        ...validConfig,
        { ...validConfig[0], marketId: '0x' + '1'.repeat(64), chainId: 42161 },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(multiChain));
      const configs = loadVaultConfigs(testConfigPath);

      const ethVaults = getVaultsByChain(configs, 1);
      const arbVaults = getVaultsByChain(configs, 42161);

      expect(ethVaults).toHaveLength(2);
      expect(arbVaults).toHaveLength(1);
    });

    it('should return empty array for chains with no vaults', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadVaultConfigs(testConfigPath);

      const vaults = getVaultsByChain(configs, 999);

      expect(vaults).toHaveLength(0);
    });
  });

  describe('getMarketKey', () => {
    it('should generate correct market key', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadVaultConfigs(testConfigPath);

      const key = getMarketKey(configs[0]);

      expect(key.chainId).toBe(1);
      expect(key.collateralToken).toBe('0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0');
      expect(key.loanToken).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
    });

    it('should normalize addresses to lowercase', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadVaultConfigs(testConfigPath);

      const key = getMarketKey(configs[0]);

      expect(key.collateralToken).toBe(key.collateralToken.toLowerCase());
      expect(key.loanToken).toBe(key.loanToken.toLowerCase());
    });
  });

  describe('real config file', () => {
    it('should load actual morpho-vaults.json without errors', () => {
      const realConfigPath = path.join(process.cwd(), 'config/morpho-vaults.json');

      expect(() => loadVaultConfigs(realConfigPath)).not.toThrow();

      const configs = loadVaultConfigs(realConfigPath);
      expect(configs.length).toBeGreaterThan(0);
      expect(configs.every((c) => c.chainId > 0)).toBe(true);
      expect(configs.every((c) => c.lltvPercent > 0 && c.lltvPercent <= 100)).toBe(true);
    });
  });
});

