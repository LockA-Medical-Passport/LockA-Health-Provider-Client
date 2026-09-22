import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = { title: 'Components/Badge', component: Badge, args: { tone: 'green', children: 'Verified' } } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Green: Story = {};
export const Amber: Story = { args: { tone: 'amber', children: 'Pending' } };
export const Red: Story = { args: { tone: 'red', children: 'Revoked' } };
export const Cyan: Story = { args: { tone: 'cyan', children: 'Clinician' } };
export const Gray: Story = { args: { tone: 'gray', children: 'Expired' } };
