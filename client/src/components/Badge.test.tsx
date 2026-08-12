import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, statusToBadgeTone, type BadgeTone } from './Badge';

describe('Badge', () => {
  it('renders its children with the tone-specific class', () => {
    render(<Badge tone="green">OK</Badge>);
    expect(screen.getByText('OK')).toHaveClass('badge', 'badge-green');
  });

  const tones: BadgeTone[] = ['green', 'amber', 'red', 'cyan', 'gray'];
  it.each(tones)('renders the badge-%s class', (tone) => {
    render(<Badge tone={tone}>{`${tone}-label`}</Badge>);
    expect(screen.getByText(`${tone}-label`)).toHaveClass('badge', `badge-${tone}`);
  });
});

describe('statusToBadgeTone', () => {
  it.each([
    ['active', 'green'],
    ['approved', 'green'],
    ['verified', 'green'],
    ['pending', 'amber'],
    ['expiring_soon', 'amber'],
    ['denied', 'red'],
    ['revoked', 'red'],
    ['suspended', 'red'],
    ['expired', 'gray'],
  ] satisfies [string, BadgeTone][])('maps "%s" to "%s"', (status, tone) => {
    expect(statusToBadgeTone(status)).toBe(tone);
  });

  it('falls back to cyan for any unrecognized status', () => {
    expect(statusToBadgeTone('some_unknown_status')).toBe('cyan');
    expect(statusToBadgeTone('')).toBe('cyan');
  });
});
