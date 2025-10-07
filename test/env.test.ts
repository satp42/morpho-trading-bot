import { loadConfig } from '../src/utils/env';

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load all required environment variables', () => {
    process.env.RPC_URL_MAINNET = 'http://mainnet.example.com';
    process.env.RPC_URL_ARBITRUM = 'http://arbitrum.example.com';
    process.env.RPC_URL_BASE = 'http://base.example.com';
    process.env.BICONOMY_API_KEY = 'test-api-key';
    process.env.PRIVATE_KEY = '0xtest';

    const config = loadConfig();

    expect(config.rpcUrlMainnet).toBe('http://mainnet.example.com');
    expect(config.rpcUrlArbitrum).toBe('http://arbitrum.example.com');
    expect(config.rpcUrlBase).toBe('http://base.example.com');
    expect(config.biconomyApiKey).toBe('test-api-key');
    expect(config.privateKey).toBe('0xtest');
  });

  it('should throw error when required variable is missing', () => {
    process.env.RPC_URL_MAINNET = 'http://mainnet.example.com';

    expect(() => loadConfig()).toThrow('Missing required environment variable');
  });
});

