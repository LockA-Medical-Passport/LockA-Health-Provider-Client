import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders its children', () => {
    render(<GlassCard>panel content</GlassCard>);
    expect(screen.getByText('panel content')).toBeInTheDocument();
  });

  it('applies the glass class by default', () => {
    render(<GlassCard data-testid="card">a</GlassCard>);
    expect(screen.getByTestId('card')).toHaveClass('glass', 'rounded-xl');
    expect(screen.getByTestId('card')).not.toHaveClass('glass-bright');
  });

  it('applies the glass-bright class when bright is set', () => {
    render(
      <GlassCard bright data-testid="card">
        b
      </GlassCard>,
    );
    expect(screen.getByTestId('card')).toHaveClass('glass-bright', 'rounded-xl');
    expect(screen.getByTestId('card')).not.toHaveClass('glass');
  });

  it('merges a custom className with the base classes', () => {
    render(
      <GlassCard className="extra-class" data-testid="card">
        c
      </GlassCard>,
    );
    expect(screen.getByTestId('card')).toHaveClass('glass', 'rounded-xl', 'extra-class');
  });

  it('forwards arbitrary HTML attributes and event handlers', () => {
    const onClick = vi.fn();
    render(
      <GlassCard data-testid="card" aria-label="panel" onClick={onClick}>
        d
      </GlassCard>,
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('aria-label', 'panel');

    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
