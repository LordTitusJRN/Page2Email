'use strict';

const {
  generateSubject,
  buildMailtoUrl,
  buildGmailUrl,
  buildOutlookUrl,
  generateFilename,
} = require('../src/utils');

// Fixed date used across all tests for deterministic output
const FIXED_DATE = new Date('2025-06-15T10:00:00.000Z');

describe('generateSubject', () => {
  test('combines title, host, and date', () => {
    const result = generateSubject('My Order Confirmation', 'https://shop.example.com/order/123', FIXED_DATE);
    expect(result).toContain('My Order Confirmation');
    expect(result).toContain('shop.example.com');
    expect(result).toContain('2025');
  });

  test('strips www. prefix from host', () => {
    const result = generateSubject('Receipt', 'https://www.shop.com/receipt', FIXED_DATE);
    expect(result).toContain('shop.com');
    expect(result).not.toContain('www.');
  });

  test('falls back to host when title is empty', () => {
    const result = generateSubject('', 'https://example.com/page', FIXED_DATE);
    expect(result).toContain('example.com');
  });

  test('truncates very long titles to 80 chars', () => {
    const longTitle = 'A'.repeat(200);
    const result = generateSubject(longTitle, 'https://example.com', FIXED_DATE);
    const titlePart = result.split(' – ')[0];
    expect(titlePart.length).toBeLessThanOrEqual(80);
  });

  test('handles invalid URL gracefully', () => {
    expect(() => generateSubject('Title', 'not-a-url', FIXED_DATE)).not.toThrow();
  });
});

describe('buildMailtoUrl', () => {
  test('builds a correctly structured mailto URL', () => {
    const url = buildMailtoUrl(['alice@example.com'], 'Test Subject', 'Hello body');
    expect(url).toMatch(/^mailto:/);
    expect(url).toContain('alice%40example.com');
    expect(url).toContain('subject=Test%20Subject');
    expect(url).toContain('body=Hello%20body');
  });

  test('joins multiple recipients with commas', () => {
    const url = buildMailtoUrl(['a@x.com', 'b@x.com'], 'Subj', 'Body');
    const to = decodeURIComponent(url.split('?')[0].replace('mailto:', ''));
    expect(to).toContain('a@x.com');
    expect(to).toContain('b@x.com');
  });

  test('filters empty recipient strings', () => {
    const url = buildMailtoUrl(['', 'valid@example.com', ''], 'S', 'B');
    const to = decodeURIComponent(url.split('?')[0].replace('mailto:', ''));
    expect(to).toBe('valid@example.com');
  });

  test('works with empty recipients array', () => {
    const url = buildMailtoUrl([], 'Subject', 'Body');
    expect(url).toMatch(/^mailto:/);
    expect(url).toContain('subject=');
  });

  test('does not use + for spaces (uses %20)', () => {
    const url = buildMailtoUrl([], 'Hello World', 'Some body');
    expect(url).not.toContain('+');
    expect(url).toContain('%20');
  });
});

describe('buildGmailUrl', () => {
  test('returns a Gmail compose URL', () => {
    const url = buildGmailUrl(['user@gmail.com'], 'My Subject', 'My body');
    expect(url).toMatch(/^https:\/\/mail\.google\.com/);
    expect(url).toContain('view=cm');
    expect(url).toContain('fs=1');
    expect(url).toContain('su=');
    expect(url).toContain('body=');
  });

  test('includes recipient in URL', () => {
    const url = buildGmailUrl(['recipient@test.com'], 'S', 'B');
    expect(url).toContain('recipient%40test.com');
  });
});

describe('buildOutlookUrl', () => {
  test('returns an Outlook Web compose URL', () => {
    const url = buildOutlookUrl(['user@outlook.com'], 'Subj', 'Body');
    expect(url).toMatch(/^https:\/\/outlook\.office\.com/);
    expect(url).toContain('subject=');
    expect(url).toContain('body=');
  });

  test('joins multiple recipients with semicolons', () => {
    const url = buildOutlookUrl(['a@x.com', 'b@x.com'], 'S', 'B');
    const params = new URLSearchParams(url.split('?')[1]);
    const to = params.get('to');
    expect(to).toContain('a@x.com');
    expect(to).toContain('b@x.com');
    expect(to).toContain(';');
  });
});

describe('generateFilename', () => {
  test('generates a PNG filename for screenshot format', () => {
    const name = generateFilename('My Receipt', 'screenshot', FIXED_DATE);
    expect(name).toMatch(/\.png$/);
    expect(name).toContain('My-Receipt');
    expect(name).toContain('2025-06-15');
  });

  test('generates a PDF filename for pdf format', () => {
    const name = generateFilename('Order Confirmation', 'pdf', FIXED_DATE);
    expect(name).toMatch(/\.pdf$/);
  });

  test('strips special characters from title', () => {
    const name = generateFilename('Page <test> "quotes" & more!', 'screenshot', FIXED_DATE);
    expect(name).not.toContain('<');
    expect(name).not.toContain('>');
    expect(name).not.toContain('"');
    expect(name).not.toContain('!');
  });

  test('replaces spaces with hyphens', () => {
    const name = generateFilename('Hello World', 'screenshot', FIXED_DATE);
    expect(name).toContain('Hello-World');
    expect(name).not.toContain(' ');
  });

  test('truncates very long titles to 60 chars (before date suffix)', () => {
    const name = generateFilename('A'.repeat(200), 'screenshot', FIXED_DATE);
    const base = name.split('-2025')[0];
    expect(base.length).toBeLessThanOrEqual(60);
  });

  test('falls back to "page" when title is empty', () => {
    const name = generateFilename('', 'screenshot', FIXED_DATE);
    expect(name).toMatch(/^page-/);
  });
});
