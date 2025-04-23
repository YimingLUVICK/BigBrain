import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../pages/Login';
import { vi } from 'vitest';

describe('Login Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-token' }),
      })
    );
  });

  it('renders input fields and login button', () => {
    render(<Login />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('shows error if password is wrong', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Login failed' }),
    });

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    expect(await screen.findByText(/Login failed/i)).toBeInTheDocument();
  });
});
