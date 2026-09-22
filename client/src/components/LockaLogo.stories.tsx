import type { Meta, StoryObj } from '@storybook/react-vite';
import { LockaLogo } from './LockaLogo';

const meta = { title: 'Components/LockaLogo', component: LockaLogo, args: { size: 64 } } satisfies Meta<typeof LockaLogo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NavbarSize: Story = { args: { size: 38 } };
export const Large: Story = { args: { size: 128 } };
