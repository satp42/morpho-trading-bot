import { loadStrategyParams } from '../src/utils/strategy-loader';
import fs from 'fs';
import path from 'path';

describe('strategy-loader', () => {
  const testConfigPath = path.join(__dirname, 'test-strategy.json');
  const validConfig = {
    targetUtilizationRange: {
      min: 0.7,
      max: 0.9,
    },
    minAPYDeltaToSwitch: 0.005,
    maxLoopDepth: 3,
    maxLTVBuffer: 0.05,
    maxGasUSD: 50,
  };

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('loadStrategyParams', () => {
    it('should load valid strategy params', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));

      const params = loadStrategyParams(testConfigPath);

      expect(params.targetUtilizationRange.min).toBe(0.7);
      expect(params.targetUtilizationRange.max).toBe(0.9);
      expect(params.minAPYDeltaToSwitch).toBe(0.005);
      expect(params.maxLoopDepth).toBe(3);
      expect(params.maxLTVBuffer).toBe(0.05);
      expect(params.maxGasUSD).toBe(50);
    });

    it('should throw on missing config file', () => {
      expect(() => loadStrategyParams('/nonexistent/path.json')).toThrow('Config file not found');
    });

    it('should throw on invalid JSON', () => {
      fs.writeFileSync(testConfigPath, 'invalid json');

      expect(() => loadStrategyParams(testConfigPath)).toThrow('Invalid JSON');
    });

    it('should throw if config is not an object', () => {
      fs.writeFileSync(testConfigPath, JSON.stringify(['array']));

      expect(() => loadStrategyParams(testConfigPath)).toThrow('must be an object');
    });

    it('should throw on missing targetUtilizationRange', () => {
      const invalid = { ...validConfig };
      delete (invalid as any).targetUtilizationRange;
      fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

      expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange is required');
    });

    describe('targetUtilizationRange validation', () => {
      it('should throw if targetUtilizationRange is not an object', () => {
        const invalid = { ...validConfig, targetUtilizationRange: 0.5 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange must be an object');
      });

      it('should throw if min is less than 0', () => {
        const invalid = {
          ...validConfig,
          targetUtilizationRange: { min: -0.1, max: 0.9 },
        };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange.min must be between');
      });

      it('should throw if min is greater than 1', () => {
        const invalid = {
          ...validConfig,
          targetUtilizationRange: { min: 1.5, max: 2.0 },
        };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange.min must be between');
      });

      it('should throw if max is less than 0', () => {
        const invalid = {
          ...validConfig,
          targetUtilizationRange: { min: 0.5, max: -0.1 },
        };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange.max must be between');
      });

      it('should throw if max is greater than 1', () => {
        const invalid = {
          ...validConfig,
          targetUtilizationRange: { min: 0.5, max: 1.5 },
        };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange.max must be between');
      });

      it('should throw if min is greater than or equal to max', () => {
        const invalid = {
          ...validConfig,
          targetUtilizationRange: { min: 0.9, max: 0.7 },
        };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange.min must be less than max');
      });

      it('should throw if min equals max', () => {
        const invalid = {
          ...validConfig,
          targetUtilizationRange: { min: 0.8, max: 0.8 },
        };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('targetUtilizationRange.min must be less than max');
      });
    });

    describe('minAPYDeltaToSwitch validation', () => {
      it('should throw if less than 0', () => {
        const invalid = { ...validConfig, minAPYDeltaToSwitch: -0.01 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('minAPYDeltaToSwitch must be between');
      });

      it('should throw if greater than 1', () => {
        const invalid = { ...validConfig, minAPYDeltaToSwitch: 1.5 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('minAPYDeltaToSwitch must be between');
      });

      it('should accept 0', () => {
        const valid = { ...validConfig, minAPYDeltaToSwitch: 0 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });

      it('should accept 1', () => {
        const valid = { ...validConfig, minAPYDeltaToSwitch: 1 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });
    });

    describe('maxLoopDepth validation', () => {
      it('should throw if not an integer', () => {
        const invalid = { ...validConfig, maxLoopDepth: 3.5 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('maxLoopDepth must be an integer');
      });

      it('should throw if less than 0', () => {
        const invalid = { ...validConfig, maxLoopDepth: -1 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('maxLoopDepth must be an integer');
      });

      it('should throw if greater than 10', () => {
        const invalid = { ...validConfig, maxLoopDepth: 11 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('maxLoopDepth must be an integer');
      });

      it('should accept 0', () => {
        const valid = { ...validConfig, maxLoopDepth: 0 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });

      it('should accept 10', () => {
        const valid = { ...validConfig, maxLoopDepth: 10 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });
    });

    describe('maxLTVBuffer validation', () => {
      it('should throw if less than 0', () => {
        const invalid = { ...validConfig, maxLTVBuffer: -0.01 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('maxLTVBuffer must be between');
      });

      it('should throw if greater than 0.5', () => {
        const invalid = { ...validConfig, maxLTVBuffer: 0.6 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('maxLTVBuffer must be between');
      });

      it('should accept 0', () => {
        const valid = { ...validConfig, maxLTVBuffer: 0 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });

      it('should accept 0.5', () => {
        const valid = { ...validConfig, maxLTVBuffer: 0.5 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });
    });

    describe('maxGasUSD validation', () => {
      it('should throw if less than 0', () => {
        const invalid = { ...validConfig, maxGasUSD: -10 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('maxGasUSD must be between');
      });

      it('should throw if greater than 1000', () => {
        const invalid = { ...validConfig, maxGasUSD: 1001 };
        fs.writeFileSync(testConfigPath, JSON.stringify(invalid));

        expect(() => loadStrategyParams(testConfigPath)).toThrow('maxGasUSD must be between');
      });

      it('should accept 0', () => {
        const valid = { ...validConfig, maxGasUSD: 0 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });

      it('should accept 1000', () => {
        const valid = { ...validConfig, maxGasUSD: 1000 };
        fs.writeFileSync(testConfigPath, JSON.stringify(valid));

        expect(() => loadStrategyParams(testConfigPath)).not.toThrow();
      });
    });
  });

  describe('real config file', () => {
    it('should load actual strategy-params.json without errors', () => {
      const realConfigPath = path.join(process.cwd(), 'config/strategy-params.json');

      expect(() => loadStrategyParams(realConfigPath)).not.toThrow();

      const params = loadStrategyParams(realConfigPath);
      expect(params.targetUtilizationRange.min).toBeGreaterThan(0);
      expect(params.targetUtilizationRange.max).toBeLessThanOrEqual(1);
      expect(params.minAPYDeltaToSwitch).toBeGreaterThanOrEqual(0);
      expect(params.maxLoopDepth).toBeGreaterThanOrEqual(0);
      expect(params.maxLTVBuffer).toBeGreaterThanOrEqual(0);
      expect(params.maxGasUSD).toBeGreaterThan(0);
    });
  });
});

