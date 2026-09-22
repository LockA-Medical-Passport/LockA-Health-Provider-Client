import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import { Modal } from './Modal';

const meta = {
  title: 'Components/Modal', component: Modal,
  args: { title: 'Request patient access', onClose: fn(), children: <p className="text-sm text-slate-300">Select record categories and provide a purpose statement.</p> },
  render: function Example(args) {
    const [open, setOpen] = useState(false);
    return <><button className="btn-primary rounded-lg px-4 py-3" onClick={() => setOpen(true)}>Open modal</button>{open && <Modal {...args} onClose={() => { args.onClose(); setOpen(false); }} />}</>;
  },
} satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {};
export const Open: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open modal' })); } };
export const LongContent: Story = {
  args: { title: 'Patient record details with a longer title', children: <div className="space-y-4">{Array.from({ length: 20 }, (_, index) => <p key={index} className="text-sm text-slate-300">Record detail {index + 1}: consent, timestamps, and issuer information.</p>)}</div> },
  play: Open.play,
};
