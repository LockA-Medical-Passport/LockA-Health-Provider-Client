import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldError } from './FieldError';

const meta = {
  title: 'Components/FieldError', component: FieldError,
  args: { id: 'email-error', error: 'Enter a valid email address' },
  render: (args) => <div className="max-w-sm"><label htmlFor="story-email" className="text-sm block mb-2">Email</label><input id="story-email" className="input-field" defaultValue={args.error ? 'invalid-address' : 'clinician@example.com'} aria-invalid={!!args.error} aria-describedby={args.error ? args.id : undefined} /><FieldError {...args} /></div>,
} satisfies Meta<typeof FieldError>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Invalid: Story = {};
export const Valid: Story = { args: { error: null } };
