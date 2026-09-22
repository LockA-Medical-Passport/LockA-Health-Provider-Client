import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlassCard } from './GlassCard';

const meta = {
  title: 'Components/GlassCard', component: GlassCard,
  args: { className: 'p-6 max-w-md', children: <><h2 className="text-lg font-semibold text-white">Patient records</h2><p className="text-sm text-slate-400 mt-2">Approved records appear here.</p></> },
} satisfies Meta<typeof GlassCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Bright: Story = { args: { bright: true } };
export const Glow: Story = { args: { className: 'p-6 max-w-md glow-blue', bright: true } };
