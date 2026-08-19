import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the JobPulse header', () => {
  render(<App />);
  expect(screen.getByText(/jobpulse/i)).toBeInTheDocument();
});
