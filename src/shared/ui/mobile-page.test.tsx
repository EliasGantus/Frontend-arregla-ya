import { render, screen } from '@testing-library/react';

import {
  MobileHero,
  MobilePage,
  MobileSection,
  MobileStats,
} from '@/shared/ui/mobile-page';

describe('mobile page primitives', () => {
  it('renders a compact mobile page with bottom-nav safe spacing', () => {
    render(
      <MobilePage>
        <p>Contenido mobile</p>
      </MobilePage>,
    );

    expect(screen.getByText('Contenido mobile').parentElement).toHaveClass('pb-24');
  });

  it('renders a mobile hero with optional badge and action', () => {
    render(
      <MobileHero
        eyebrow="Solicitudes"
        title="Segui tus pedidos"
        description="Revisa estados y acciones pendientes."
        badge="2 activas"
        action={<button type="button">Crear</button>}
      />,
    );

    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Segui tus pedidos' })).toBeInTheDocument();
    expect(screen.getByText('2 activas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('renders section heading and stats without requiring a card wrapper', () => {
    render(
      <MobileSection eyebrow="Seguimiento" title="Mis solicitudes" description="Estado general">
        <MobileStats
          stats={[
            { label: 'Activas', value: '2' },
            { label: 'Pagos', value: '$85.000' },
          ]}
        />
      </MobileSection>,
    );

    expect(screen.getByRole('heading', { name: 'Mis solicitudes' })).toBeInTheDocument();
    expect(screen.getByText('Activas')).toBeInTheDocument();
    expect(screen.getByText('$85.000')).toBeInTheDocument();
  });
});
