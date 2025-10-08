import { Interface, AbiCoder } from 'ethers';
import fs from 'fs';
import path from 'path';

describe('Morpho Blue ABI', () => {
  const abiPath = path.join(__dirname, '../src/contracts/morpho-blue-abi.json');
  let morphoInterface: Interface;
  let abi: any[];

  beforeAll(() => {
    const abiContent = fs.readFileSync(abiPath, 'utf-8');
    abi = JSON.parse(abiContent);
    morphoInterface = new Interface(abi);
  });

  describe('ABI structure', () => {
    it('should load ABI without errors', () => {
      expect(abi).toBeDefined();
      expect(Array.isArray(abi)).toBe(true);
      expect(abi.length).toBeGreaterThan(0);
    });

    it('should contain core functions', () => {
      const functionNames = abi
        .filter((item) => item.type === 'function')
        .map((item) => item.name);

      expect(functionNames).toContain('supply');
      expect(functionNames).toContain('supplyCollateral');
      expect(functionNames).toContain('borrow');
      expect(functionNames).toContain('repay');
      expect(functionNames).toContain('withdraw');
      expect(functionNames).toContain('withdrawCollateral');
      expect(functionNames).toContain('position');
      expect(functionNames).toContain('market');
    });

    it('should have valid function selectors', () => {
      const supplySelector = morphoInterface.getFunction('supply')?.selector;
      const borrowSelector = morphoInterface.getFunction('borrow')?.selector;
      const positionSelector = morphoInterface.getFunction('position')?.selector;

      expect(supplySelector).toBeDefined();
      expect(borrowSelector).toBeDefined();
      expect(positionSelector).toBeDefined();
      expect(supplySelector).toMatch(/^0x[a-fA-F0-9]{8}$/);
      expect(borrowSelector).toMatch(/^0x[a-fA-F0-9]{8}$/);
      expect(positionSelector).toMatch(/^0x[a-fA-F0-9]{8}$/);
    });
  });

  describe('Function encoding', () => {
    it('should encode position function call', () => {
      const marketId = '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc';
      const userAddress = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';

      const encodedData = morphoInterface.encodeFunctionData('position', [marketId, userAddress]);

      expect(encodedData).toBeDefined();
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(encodedData.length).toBeGreaterThan(10);
    });

    it('should encode market function call', () => {
      const marketId = '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc';

      const encodedData = morphoInterface.encodeFunctionData('market', [marketId]);

      expect(encodedData).toBeDefined();
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should encode supplyCollateral function call', () => {
      const marketParams = {
        loanToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        collateralToken: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
        oracle: '0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2',
        irm: '0x870ac11d48b15db9a138cf899d20f13f79ba00bc',
        lltv: '945000000000000000',
      };
      const assets = '1000000000000000000';
      const onBehalf = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';
      const data = '0x';

      const encodedData = morphoInterface.encodeFunctionData('supplyCollateral', [
        marketParams,
        assets,
        onBehalf,
        data,
      ]);

      expect(encodedData).toBeDefined();
      expect(encodedData).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(encodedData.length).toBeGreaterThan(100);
    });
  });

  describe('Function decoding', () => {
    it('should decode position function result', () => {
      const mockReturnData =
        '0x0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016345785d8a0000';

      const decodedResult = morphoInterface.decodeFunctionResult('position', mockReturnData);

      expect(decodedResult).toBeDefined();
      expect(decodedResult.length).toBe(3);
      expect(decodedResult[0]).toBeDefined();
      expect(decodedResult[1]).toBeDefined();
      expect(decodedResult[2]).toBeDefined();
    });

    it('should decode market function result', () => {
      const mockReturnData =
        '0x0000000000000000000000000000000000000000000000000000000000000f42000000000000000000000000000000000000000000000000000000000000f420000000000000000000000000000000000000000000000000000000000000e100000000000000000000000000000000000000000000000000000000000000e100000000000000000000000000000000000000000000000000000000006789abcd00000000000000000000000000000000000000000000000000000000000000fa';

      const decodedResult = morphoInterface.decodeFunctionResult('market', mockReturnData);

      expect(decodedResult).toBeDefined();
      expect(decodedResult.length).toBe(6);
    });

    it('should decode borrow function result', () => {
      const mockReturnData =
        '0x0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000de0b6b3a7640000';

      const decodedResult = morphoInterface.decodeFunctionResult('borrow', mockReturnData);

      expect(decodedResult).toBeDefined();
      expect(decodedResult.length).toBe(2);
    });
  });

  describe('Round-trip encoding/decoding', () => {
    it('should round-trip position call', () => {
      const marketId = '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc';
      const userAddress = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';

      const encodedData = morphoInterface.encodeFunctionData('position', [marketId, userAddress]);
      const decodedData = morphoInterface.decodeFunctionData('position', encodedData);

      expect(decodedData[0].toLowerCase()).toBe(marketId.toLowerCase());
      expect(decodedData[1].toLowerCase()).toBe(userAddress.toLowerCase());
    });

    it('should round-trip supplyCollateral call', () => {
      const marketParams = {
        loanToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        collateralToken: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
        oracle: '0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2',
        irm: '0x870ac11d48b15db9a138cf899d20f13f79ba00bc',
        lltv: '945000000000000000',
      };
      const assets = '1000000000000000000';
      const onBehalf = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';
      const data = '0x';

      const encodedData = morphoInterface.encodeFunctionData('supplyCollateral', [
        marketParams,
        assets,
        onBehalf,
        data,
      ]);
      const decodedData = morphoInterface.decodeFunctionData('supplyCollateral', encodedData);

      expect(decodedData[0].loanToken.toLowerCase()).toBe(marketParams.loanToken.toLowerCase());
      expect(decodedData[0].collateralToken.toLowerCase()).toBe(
        marketParams.collateralToken.toLowerCase()
      );
      expect(decodedData[1].toString()).toBe(assets);
      expect(decodedData[2].toLowerCase()).toBe(onBehalf.toLowerCase());
    });
  });

  describe('MarketParams tuple structure', () => {
    it('should correctly encode MarketParams tuple', () => {
      const marketParams = {
        loanToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        collateralToken: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
        oracle: '0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2',
        irm: '0x870ac11d48b15db9a138cf899d20f13f79ba00bc',
        lltv: BigInt('945000000000000000'),
      };

      const abiCoder = AbiCoder.defaultAbiCoder();
      const encoded = abiCoder.encode(
        ['tuple(address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)'],
        [marketParams]
      );

      expect(encoded).toBeDefined();
      expect(encoded).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should correctly decode MarketParams tuple', () => {
      const marketParams = {
        loanToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        collateralToken: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
        oracle: '0x48f7e36eb6b826b2df4b2e630b62cd25e89e40e2',
        irm: '0x870ac11d48b15db9a138cf899d20f13f79ba00bc',
        lltv: BigInt('945000000000000000'),
      };

      const abiCoder = AbiCoder.defaultAbiCoder();
      const encoded = abiCoder.encode(
        ['tuple(address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)'],
        [marketParams]
      );
      const [decoded] = abiCoder.decode(
        ['tuple(address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)'],
        encoded
      );

      expect(decoded.loanToken.toLowerCase()).toBe(marketParams.loanToken.toLowerCase());
      expect(decoded.collateralToken.toLowerCase()).toBe(marketParams.collateralToken.toLowerCase());
      expect(decoded.oracle.toLowerCase()).toBe(marketParams.oracle.toLowerCase());
      expect(decoded.irm.toLowerCase()).toBe(marketParams.irm.toLowerCase());
      expect(decoded.lltv.toString()).toBe(marketParams.lltv.toString());
    });
  });
});

