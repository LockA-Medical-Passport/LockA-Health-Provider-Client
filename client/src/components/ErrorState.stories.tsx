import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ErrorState } from './ErrorState';

const meta = { title: 'Components/ErrorState', component: ErrorState, args: { onRetry: fn() } } satisfies Meta<typeof ErrorState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const CustomMessage: Story = { args: { message: 'Unable to load patient records. Check your connection and try again.' } };
