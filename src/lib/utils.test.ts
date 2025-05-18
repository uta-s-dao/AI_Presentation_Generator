import { describe, it, expect } from 'vitest';
import { escapeHtml, isSafeUrl } from './utils';

describe('escapeHtml', () => {
  it('escapes script tags and quotes', () => {
    const input = `<script>alert('x')</script>`;
    const output = escapeHtml(input);
    expect(output).toBe('&lt;script&gt;alert(&#039;x&#039;)&lt;/script&gt;');
  });
});

describe('isSafeUrl', () => {
  it('allows http and https URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('https://example.com')).toBe(true);
  });

  it('rejects non-http protocols', () => {
    expect(isSafeUrl('ftp://example.com')).toBe(false);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });
});
