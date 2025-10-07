import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  rpcUrlMainnet: string;
  rpcUrlArbitrum: string;
  rpcUrlBase: string;
  biconomyApiKey: string;
  privateKey: string;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function loadConfig(): EnvConfig {
  return {
    rpcUrlMainnet: getEnvVar('RPC_URL_MAINNET'),
    rpcUrlArbitrum: getEnvVar('RPC_URL_ARBITRUM'),
    rpcUrlBase: getEnvVar('RPC_URL_BASE'),
    biconomyApiKey: getEnvVar('BICONOMY_API_KEY'),
    privateKey: getEnvVar('PRIVATE_KEY'),
  };
}

