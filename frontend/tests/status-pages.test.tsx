import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusPage } from '../src/shared/StatusPage';

describe('StatusPage', () => {
  it.each([
    [403, 'Nu ai acces la această secțiune.'],
    [404, 'Nu am găsit resursa căutată.'],
    [503, 'Serviciul nu este disponibil momentan.'],
  ] as const)('renders the %s recovery state', (code, title) => {
    render(<StatusPage code={code} />);
    expect(screen.getByText(String(code))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });
});
