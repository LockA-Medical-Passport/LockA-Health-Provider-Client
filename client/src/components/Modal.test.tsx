import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders the title and children', () => {
    render(
      <Modal title="Edit Patient" onClose={vi.fn()}>
        <p>Modal body content</p>
      </Modal>,
    );

    expect(screen.getByText('Edit Patient')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Edit Patient" onClose={onClose}>
        <p>Modal body content</p>
      </Modal>,
    );

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal body', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit Patient" onClose={onClose}>
        <p>Modal body content</p>
      </Modal>,
    );

    fireEvent.click(screen.getByText('Modal body content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit Patient" onClose={onClose}>
        <p>Modal body content</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit Patient" onClose={onClose}>
        <p>Modal body content</p>
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for keys other than Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit Patient" onClose={onClose}>
        <p>Modal body content</p>
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening for Escape after unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal title="Edit Patient" onClose={onClose}>
        <p>Modal body content</p>
      </Modal>,
    );

    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('gives the dialog an accessible name and moves focus inside when opened', () => {
    render(
      <Modal title="Edit Patient" onClose={vi.fn()}>
        <button type="button">Save</button>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Edit Patient' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('traps Tab and Shift+Tab focus within the dialog', () => {
    render(
      <Modal title="Edit Patient" onClose={vi.fn()}>
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Modal>,
    );

    const close = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: 'Last action' });

    close.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();

    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(close).toHaveFocus();
  });

  it('returns focus to the trigger element when closed', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
          {open && (
            <Modal title="Edit Patient" onClose={() => setOpen(false)}>
              <p>Modal body content</p>
            </Modal>
          )}
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
