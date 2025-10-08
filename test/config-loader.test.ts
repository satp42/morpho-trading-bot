import { loadChainConfigs, getChainByName, getChainById } from '../src/utils/config-loader';
import fs from 'fs';
import path from 'path';

describe('config-loader', () => {
  const testConfigPath = path.join(__dirname, 'test-chains.json');
  const validConfig = [
    {
      chainId: 1,
      name: 'ethereum',
      displayName: 'Ethereum Mainnet',
      rpcUrl: '${RPC_URL}',
      nativeSymbol: 'ETH',
      biconomyApiKey: '${BICONOMY_KEY}',
      morphoBlueAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
    },
    {
      chainId: 42161,
      name: 'arbitrum',
      displayName: 'Arbitrum One',
      rpcUrl: '${RPC_URL_ARB}',
      nativeSymbol: 'ETH',
      biconomyApiKey: '${BICONOMY_KEY}',
      morphoBlueAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
    },
  ];

  const mockEnv = {
    RPC_URL: 'http://mainnet.example.com',
    RPC_URL_ARB: 'http://arbitrum.example.com',
    BICONOMY_KEY: 'test-key',
  };

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('loadChainConfigs', () => {
    it('should load valid chain configs', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      const configs = loadChainConfigs(testConfigPath, mockEnv);

      expect(configs).toHaveLength(2);
      expect(configs[0].chainId).toBe(1);
      expect(configs[0].name).toBe('ethereum');
      expect(configs[0].rpcUrl).toBe('http://mainnet.example.com');
      expect(configs[0].biconomyApiKey).toBe('test-key');
    });

    it('should resolve environment variables', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      const configs = loadChainConfigs(testConfigPath, mockEnv);

      expect(configs[0].rpcUrl).not.toContain('${');
      expect(configs[0].biconomyApiKey).not.toContain('${');
    });

    it('should throw on missing config file', () => {
      expect(() => loadChainConfigs('/nonexistent/path.json')).toThrow('Config file not found');
    });

    it('should throw on invalid JSON', () => {
      fs.writeFileSync(testConfigPath, 'invalid json');

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('Invalid JSON');
    });

    it('should throw if config is not an array', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify({ chainId: 1 }));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('must be an array');
    });

    it('should throw if config is empty array', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify([]));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('at least one chain');
    });

    it('should throw on duplicate chainId', () => {
      const duplicate = [validConfig[0], { ...validConfig[0], name: 'other' }];
      fs.writeFileSync(testConfigPath, JSON.stringify(duplicate));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('Duplicate chainId');
    });

    it('should throw on duplicate chain name', () => {
      const duplicate = [validConfig[0], { ...validConfig[0], chainId: 999 }];
      fs.writeFileSync(testConfigPath, JSON.stringify(duplicate));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('Duplicate chain name');
    });

    it('should throw on missing required field', () => {
      const invalid = [{ chainId: 1, name: 'ethereum' }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow();
    });

    it('should throw on invalid chainId type', () => {
      const invalid = [{ ...validConfig[0], chainId: '1' }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('chainId must be');
    });

    it('should throw when environment variable not found', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      expect(() => loadChainConfigs(testConfigPath, {})).toThrow('Environment variable');
    });

    it('should throw on invalid morphoBlueAddress format', () => {
      const invalid = [{ ...validConfig[0], morphoBlueAddress: '0x123' }];
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('morphoBlueAddress must be');
    });

    it('should throw on missing morphoBlueAddress', () => {
      const invalid = [{ ...validConfig[0] }];
      delete (invalid[0] as any).morphoBlueAddress;
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadChainConfigs(testConfigPath, mockEnv)).toThrow('morphoBlueAddress must be');
    });

    it('should accept valid morphoBlueAddress', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      const configs = loadChainConfigs(testConfigPath, mockEnv);

      expect(configs[0].morphoBlueAddress).toBe('0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb');
      expect(configs[1].morphoBlueAddress).toBe('0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb');
    });
  });

  describe('getChainByName', () => {
    it('should find chain by name', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadChainConfigs(testConfigPath, mockEnv);

      const chain = getChainByName(configs, 'ethereum');

      expect(chain).toBeDefined();
      expect(chain?.chainId).toBe(1);
    });

    it('should return undefined for non-existent chain', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadChainConfigs(testConfigPath, mockEnv);

      const chain = getChainByName(configs, 'nonexistent');

      expect(chain).toBeUndefined();
    });
  });

  describe('getChainById', () => {
    it('should find chain by id', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadChainConfigs(testConfigPath, mockEnv);

      const chain = getChainById(configs, 42161);

      expect(chain).toBeDefined();
      expect(chain?.name).toBe('arbitrum');
    });

    it('should return undefined for non-existent chain', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const configs = loadChainConfigs(testConfigPath, mockEnv);

      const chain = getChainById(configs, 999);

      expect(chain).toBeUndefined();
    });
  });

  describe('real config file', () => {
    it('should load actual chains.json without errors', () => {
      const realConfigPath = path.join(process.cwd(), 'config/chains.json');
      const testEnv = {
        RPC_URL_MAINNET: 'http://test-mainnet.com',
        RPC_URL_ARBITRUM: 'http://test-arbitrum.com',
        RPC_URL_BASE: 'http://test-base.com',
        BICONOMY_API_KEY: 'test-biconomy-key',
      };

      expect(() => loadChainConfigs(realConfigPath, testEnv)).not.toThrow();

      const configs = loadChainConfigs(realConfigPath, testEnv);
      expect(configs.length).toBeGreaterThan(0);
      expect(configs.every((c) => c.chainId > 0)).toBe(true);
      expect(configs.every((c) => c.nativeSymbol.length > 0)).toBe(true);
    });
  });
});

