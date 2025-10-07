import { logger } from '../src/utils/logger';
import fs from 'fs';
import path from 'path';

describe('logger', () => {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'bot.log');

  beforeEach(() => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  afterAll(() => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  it('should create log directory if not exists', () => {
    if (fs.existsSync(logDir)) {
      fs.rmSync(logDir, { recursive: true });
    }

    logger.info('test message');

    expect(fs.existsSync(logDir)).toBe(true);
  });

  it('should write log entry to file', () => {
    logger.info('test message', { key: 'value' });

    const logContent = fs.readFileSync(logFile, 'utf-8');
    const logEntry = JSON.parse(logContent.trim());

    expect(logEntry.level).toBe('info');
    expect(logEntry.message).toBe('test message');
    expect(logEntry.meta).toEqual({ key: 'value' });
    expect(logEntry.timestamp).toBeDefined();
  });

  it('should write multiple log levels', () => {
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    const logContent = fs.readFileSync(logFile, 'utf-8');
    const lines = logContent.trim().split('\n');

    expect(lines).toHaveLength(4);
    expect(JSON.parse(lines[0]).level).toBe('debug');
    expect(JSON.parse(lines[1]).level).toBe('info');
    expect(JSON.parse(lines[2]).level).toBe('warn');
    expect(JSON.parse(lines[3]).level).toBe('error');
  });

  it('should log to console', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    logger.info('console test');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('console test'));

    consoleSpy.mockRestore();
  });
});

