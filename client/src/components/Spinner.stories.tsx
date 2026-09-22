import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = { title: 'Components/Spinner', component: Spinner, args: { size: 16, borderWidth: 2 } } satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 12 } };
export const Large: Story = { args: { size: 32, borderWidth: 3 } };
