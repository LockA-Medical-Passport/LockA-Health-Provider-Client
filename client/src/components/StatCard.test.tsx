import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders the label, value, and icon when no badgeTone is given', () => {
    render(
      <StatCard label="Total Patients" value="128" icon={<span data-testid="icon">I</span>} color="#22d3ee" />,
    );

    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();

    const value = screen.getByText('128');
    expect(value).toHaveClass('text-lg', 'font-bold', 'text-white');
  });

  it('renders the value inside a tone badge when badgeTone is given, instead of the plain value text', () => {
    render(
      <StatCard
        label="Pending Requests"
        value="4"
        icon={<span data-testid="icon">I</span>}
        color="#f59e0b"
        badgeTone="amber"
      />,
    );

    const value = screen.getByText('4');
    expect(value).toHaveClass('badge', 'badge-amber');
    expect(value).not.toHaveClass('text-lg', 'font-bold');
  });

  it('renders a sub label when provided', () => {
    const { container } = render(
      <StatCard label="Total Patients" value="128" icon={<span />} color="#22d3ee" sub="vs. last week" />,
    );

    expect(screen.getByText('vs. last week')).toBeInTheDocument();
    expect(container.getElementsByClassName('text-slate-500 mt-0.5')).toHaveLength(1);
  });

  it('omits the sub label when not provided', () => {
    const { container } = render(<StatCard label="Total Patients" value="128" icon={<span />} color="#22d3ee" />);

    expect(container.getElementsByClassName('text-slate-500 mt-0.5')).toHaveLength(0);
  });

  it('applies the color prop to the icon container', () => {
    render(<StatCard label="Total Patients" value="128" icon={<span data-testid="icon">I</span>} color="#22d3ee" />);

    const iconWrapper = screen.getByTestId('icon').parentElement as HTMLElement;
    expect(iconWrapper.style.color).toBe('rgb(34, 211, 238)');
    expect(iconWrapper.style.background).toBe('rgba(34, 211, 238, 0.125)');
    expect(iconWrapper.style.border).toBe('1px solid rgba(34, 211, 238, 0.25)');
  });
});
