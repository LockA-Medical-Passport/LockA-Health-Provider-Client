import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Icons from './Icons';

const meta = {
  title: 'Components/Icons',
  render: () => <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-cyan-300">
    {Object.entries(Icons).map(([name, Icon]) => <div key={name} className="glass rounded-lg p-4 flex flex-col items-center gap-3"><Icon className="w-6 h-6" aria-hidden="true" /><span className="text-xs text-slate-300">{name}</span></div>)}
  </div>,
} satisfies Meta;
export default meta;
export const Gallery: StoryObj<typeof meta> = {};
