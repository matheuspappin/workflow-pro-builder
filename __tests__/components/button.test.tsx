import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

describe('Button', () => {
  it('should render a button with default variant and size', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('h-9');
  });

  it('should render a button with a different variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-secondary');
  });

  it('should render a button with a different size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button', { name: /large/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('h-10');
  });

  it('should render a button with an icon', () => {
    render(
      <Button>
        Click me <ChevronRight data-testid="icon" />
      </Button>
    );
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it('should render as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Link</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: /link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/link');
  });
});