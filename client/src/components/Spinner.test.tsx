import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with the spinner class and default size/borderWidth', () => {
    const { container } = render(<Spinner />);
    const el = container.firstChild as HTMLElement;

    expect(el).toHaveClass('spinner');
    expect(el.style.width).toBe('16px');
    expect(el.style.height).toBe('16px');
    expect(el.style.borderWidth).toBe('2px');
  });

  it('reflects custom size and borderWidth props in inline styles', () => {
    const { container } = render(<Spinner size={32} borderWidth={4} />);
    const el = container.firstChild as HTMLElement;

    expect(el.style.width).toBe('32px');
    expect(el.style.height).toBe('32px');
    expect(el.style.borderWidth).toBe('4px');
  });
});
