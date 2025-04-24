import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from "vitest";
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Editgame from '../pages/Editgame';
import Editquestion from '../pages/Editquestion';
import Play from '../pages/Play';

describe("example test", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

// login component test
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

// register component test
describe('Register Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal('window', Object.create(window));
    window.location = { hash: '' };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders email, password and confirm fields', () => {
    render(<Register />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Password/i).length).toBe(2);
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<Register />);
    const [passwordInput, confirmInput] = screen.getAllByLabelText(/Password/i);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'abc123' } });
    fireEvent.change(confirmInput, { target: { value: 'xyz456' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });
});

// Dashboard component test
describe('Dashboard Component', () => {
  it('renders dashboard with create and upload sections', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('email', 'test@example.com');
    render(<Dashboard />);
    expect(screen.getByPlaceholderText('New game name')).toBeInTheDocument();
    expect(screen.getByText(/Create Empty Game/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Game File/i)).toBeInTheDocument();
  });
});

// Editgame component test
describe('Editgame Component', () => {
  it('shows loading initially', () => {
    render(<Editgame gameId="123" />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});

//Editquestion component test
describe('Editquestion Component', () => {
  it('displays loading state initially', () => {
    render(<Editquestion gameId="123" questionId="0" />);
    expect(screen.getByText(/Loading question/i)).toBeInTheDocument();
  });
});

//Play component test
describe('Play Component', () => {
  it('renders join screen initially', () => {
    render(<Play sessionId="999" />);
    expect(screen.getByText(/Join Session/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your name/i)).toBeInTheDocument();
  });
});


