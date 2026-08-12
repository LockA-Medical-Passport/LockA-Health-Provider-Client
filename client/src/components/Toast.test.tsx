import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './Toast';

type Kind = 'success' | 'error' | 'info';

function Trigger({ kind, message }: { kind: Kind; message: string }) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast(kind, message)}>
      {`trigger-${kind}`}
    </button>
  );
}

function getToastContainer(message: string) {
  return screen.getByText(message).closest('.glass-bright') as HTMLElement;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider / useToast', () => {
  it('renders a toast with kind-specific styling when toast() is called', () => {
    render(
      <ToastProvider>
        <Trigger kind="success" message="Saved successfully" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-success'));

    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    const toastEl = getToastContainer('Saved successfully');
    expect(within(toastEl).getByText('✓')).toBeInTheDocument();
    expect(toastEl.style.borderColor).toBe('rgba(16, 185, 129, 0.35)');
  });

  it.each([
    ['success', '✓', 'rgba(16, 185, 129, 0.35)'],
    ['error', '✕', 'rgba(239, 68, 68, 0.35)'],
    ['info', 'ℹ', 'rgba(59, 130, 246, 0.35)'],
  ] satisfies [Kind, string, string][])('applies the right icon/border for a "%s" toast', (kind, icon, border) => {
    render(
      <ToastProvider>
        <Trigger kind={kind} message={`${kind}-message`} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText(`trigger-${kind}`));

    const toastEl = getToastContainer(`${kind}-message`);
    expect(within(toastEl).getByText(icon)).toBeInTheDocument();
    expect(toastEl.style.borderColor).toBe(border);
  });

  it('stacks multiple toasts', () => {
    render(
      <ToastProvider>
        <Trigger kind="success" message="First toast" />
        <Trigger kind="error" message="Second toast" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-success'));
    fireEvent.click(screen.getByText('trigger-error'));

    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(document.querySelectorAll('.glass-bright')).toHaveLength(2);
  });

  it('auto-dismisses a toast after its 4s timeout, without waiting in real time', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger kind="info" message="Disappearing toast" />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('trigger-info').click();
    });
    expect(screen.getByText('Disappearing toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText('Disappearing toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Disappearing toast')).not.toBeInTheDocument();
  });

  it('removes a toast immediately when its close button is clicked, without waiting for the timeout', () => {
    render(
      <ToastProvider>
        <Trigger kind="success" message="Dismiss me" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-success'));
    const toastEl = getToastContainer('Dismiss me');
    const closeButton = within(toastEl).getByRole('button');

    fireEvent.click(closeButton);

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('throws when useToast is called outside a ToastProvider', () => {
    function Bare() {
      useToast();
      return null;
    }

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow('useToast must be used within a ToastProvider');
    consoleError.mockRestore();
  });
});
