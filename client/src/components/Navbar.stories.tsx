import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { fn, userEvent, within } from 'storybook/test';
import { Navbar } from './Navbar';
import { RoleProvider } from '../lib/roleContext';
import { EXPECTED_NETWORK, EXPECTED_NETWORK_LABEL } from '../lib/network';
import type { StaffRole } from '../lib/types';

const meta = {
  title: 'Components/Navbar', component: Navbar, parameters: { layout: 'fullscreen', role: 'admin' },
  decorators: [(Story, context) => <MemoryRouter><RoleProvider role={context.parameters.role as StaffRole}><Story /></RoleProvider></MemoryRouter>],
  args: { walletStatus: 'idle', address: null, network: null, onConnect: fn(), onDisconnect: fn(), onCheckNetwork: fn() },
} satisfies Meta<typeof Navbar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Disconnected: Story = {};
export const RestoringSession: Story = { args: { walletStatus: 'checking' } };
export const Connecting: Story = { args: { walletStatus: 'connecting' } };
export const Unavailable: Story = { args: { walletStatus: 'unavailable' } };
export const Connected: Story = { args: { walletStatus: 'connected', address: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37', network: EXPECTED_NETWORK } };
export const Clinician: Story = { ...Connected, parameters: { role: 'clinician' } };
export const FrontDesk: Story = { ...Connected, parameters: { role: 'front_desk' } };
export const WrongNetwork: Story = { ...Connected, args: { ...Connected.args, network: EXPECTED_NETWORK === 'TESTNET' ? 'PUBLIC' : 'TESTNET' } };
export const NetworkInstructions: Story = {
  ...WrongNetwork,
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('button', { name: `Switch to ${EXPECTED_NETWORK_LABEL}` })); },
};
export const NetworkError: Story = { ...Connected, args: { ...Connected.args, network: null, networkError: 'Unable to verify the wallet network.' } };
export const CheckingNetwork: Story = { ...NetworkError, args: { ...NetworkError.args, networkChecking: true } };
export const MobileMenu: Story = {
  ...Connected, globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('button', { name: 'Toggle menu' })); },
};
