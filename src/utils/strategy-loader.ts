import fs from 'fs';
import path from 'path';

export interface UtilizationRange {
  min: number;
  max: number;
}

export interface StrategyParams {
  targetUtilizationRange: UtilizationRange;
  minAPYDeltaToSwitch: number;
  maxLoopDepth: number;
  maxLTVBuffer: number;
  maxGasUSD: number;
}

function validateUtilizationRange(range: unknown): asserts range is UtilizationRange {
  if (typeof range !== 'object' || range === null) {
    throw new Error('targetUtilizationRange must be an object');
  }

  const r = range as Record<string, unknown>;

  if (typeof r.min !== 'number' || r.min < 0 || r.min > 1) {
    throw new Error('targetUtilizationRange.min must be between 0 and 1');
  }

  if (typeof r.max !== 'number' || r.max < 0 || r.max > 1) {
    throw new Error('targetUtilizationRange.max must be between 0 and 1');
  }

  if (r.min >= r.max) {
    throw new Error('targetUtilizationRange.min must be less than max');
  }
}

function validateStrategyParams(params: unknown): asserts params is StrategyParams {
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    throw new Error('Strategy params must be an object');
  }

  const p = params as Record<string, unknown>;

  if (!p.targetUtilizationRange) {
    throw new Error('targetUtilizationRange is required');
  }
  validateUtilizationRange(p.targetUtilizationRange);

  if (typeof p.minAPYDeltaToSwitch !== 'number' || p.minAPYDeltaToSwitch < 0 || p.minAPYDeltaToSwitch > 1) {
    throw new Error('minAPYDeltaToSwitch must be between 0 and 1');
  }

  if (
    typeof p.maxLoopDepth !== 'number' ||
    !Number.isInteger(p.maxLoopDepth) ||
    p.maxLoopDepth < 0 ||
    p.maxLoopDepth > 10
  ) {
    throw new Error('maxLoopDepth must be an integer between 0 and 10');
  }

  if (typeof p.maxLTVBuffer !== 'number' || p.maxLTVBuffer < 0 || p.maxLTVBuffer > 0.5) {
    throw new Error('maxLTVBuffer must be between 0 and 0.5');
  }

  if (typeof p.maxGasUSD !== 'number' || p.maxGasUSD < 0 || p.maxGasUSD > 1000) {
    throw new Error('maxGasUSD must be between 0 and 1000');
  }
}

export function loadStrategyParams(
  configPath: string = path.join(process.cwd(), 'config/strategy-params.json')
): StrategyParams {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const fileContent = fs.readFileSync(configPath, 'utf-8');
  let params: unknown;

  try {
    params = JSON.parse(fileContent);
  } catch (err) {
    throw new Error(`Invalid JSON in config file: ${err}`);
  }

  validateStrategyParams(params);

  return params as StrategyParams;
}

