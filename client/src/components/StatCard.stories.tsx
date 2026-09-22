import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard } from './StatCard';
import { AccessIcon } from './Icons';

const meta = {
  title: 'Components/StatCard', component: StatCard,
  decorators: [(Story) => <div className="max-w-xs"><Story /></div>],
  args: { label: 'Active Access Grants', value: '24', icon: <AccessIcon className="w-4 h-4" />, color: '#10b981', sub: 'patients currently granting access' },
} satisfies Meta<typeof StatCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Count: Story = {};
export const Empty: Story = { args: { value: '0', sub: 'No grants yet' } };
export const Status: Story = { args: { label: 'Verification', value: 'Pending', badgeTone: 'amber', color: '#f59e0b', sub: 'Awaiting organization review' } };
export const WithoutDescription: Story = { args: { sub: undefined } };
