import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children with the tone-specific class', () => {
    render(<Badge tone="green">OK</Badge>);
    expect(screen.getByText('OK')).toHaveClass('badge', 'badge-green');
  });
});
