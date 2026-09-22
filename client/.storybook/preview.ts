import type { Preview } from '@storybook/react-vite';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    viewport: {
      options: {
        phone: { name: 'Phone (375px)', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet (768px)', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop (1024px)', styles: { width: '1024px', height: '768px' } },
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
