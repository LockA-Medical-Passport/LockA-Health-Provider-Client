import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { ToastProvider, useToast } from './Toast';

function ToastDemo() {
  const { toast } = useToast();
  return <div className="flex flex-wrap gap-3">
    <button className="btn-success rounded-lg px-4 py-3" onClick={() => toast('success', 'Record uploaded successfully')}>Show success</button>
    <button className="btn-danger rounded-lg px-4 py-3" onClick={() => toast('error', 'Unable to upload the record. Please try again.')}>Show error</button>
    <button className="btn-secondary rounded-lg px-4 py-3" onClick={() => toast('info', 'Access has been revoked')}>Show info</button>
    <button className="btn-primary rounded-lg px-4 py-3" onClick={() => { toast('success', 'Staff member added'); toast('error', 'Unable to load records'); toast('info', 'Access request pending'); }}>Queue three notifications</button>
  </div>;
}
const meta = { title: 'Components/Toast', component: ToastDemo, decorators: [(Story) => <ToastProvider><Story /></ToastProvider>] } satisfies Meta<typeof ToastDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Interactive: Story = {};
export const Success: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('button', { name: 'Show success' })); } };
export const Error: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('button', { name: 'Show error' })); } };
export const Info: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('button', { name: 'Show info' })); } };
export const Queue: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('button', { name: 'Queue three notifications' })); } };
