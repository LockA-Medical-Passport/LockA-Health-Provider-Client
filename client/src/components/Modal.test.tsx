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
});
