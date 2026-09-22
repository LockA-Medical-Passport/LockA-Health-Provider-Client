import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Pagination', component: Pagination,
  args: { page: 1, pageSize: 10, total: 23, hasMore: true, loading: false, error: false, requestedPage: 1, previous: fn(), next: fn(), reload: fn() },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FirstPage: Story = {};
export const MiddlePage: Story = { args: { page: 2, requestedPage: 2 } };
export const LastPage: Story = { args: { page: 3, requestedPage: 3, hasMore: false } };
export const Empty: Story = { args: { total: 0, hasMore: false } };
export const Loading: Story = { args: { requestedPage: 2, loading: true } };
export const Failed: Story = { args: { requestedPage: 2, error: true } };
