describe('Login Flow', () => {
  beforeEach(() => {
    // Visita a p�gina de login antes de cada teste
    cy.visit('/portal/login'); // Ajuste esta URL para a sua p�gina de login real
  });

  it('should display validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('E-mail ou telefone � obrigat�rio.').should('be.visible');
    cy.contains('Senha � obrigat�ria.').should('be.visible');
  });

  it('should allow a user to log in successfully', () => {
    // Este teste assume que voc� tem um usu�rio de teste v�lido no seu Supabase
    const email = Cypress.env('TEST_USER_EMAIL') || 'test@example.com';
    const password = Cypress.env('TEST_USER_PASSWORD') || 'password123';

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Ap�s o login, o usu�rio deve ser redirecionado para o dashboard
    cy.url().should('include', '/dashboard'); // Ajuste para a URL de redirecionamento p�s-login
    cy.contains('Bem-vindo ao Dashboard').should('be.visible'); // Verifique algum elemento no dashboard
  });

  it('should display an error for invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Credenciais inv�lidas. Verifique seu e-mail/telefone e senha.').should('be.visible');
    cy.url().should('include', '/portal/login'); // Deve permanecer na p�gina de login
  });
});