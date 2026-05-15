describe('Admin Signup Page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 401,
      body: { error: 'Unauthorized' },
    }).as('getCurrentUser');

    cy.intercept('GET', '**/auth/check-username*', {
      statusCode: 200,
      body: { available: true }
    }).as('checkUsername');

    cy.visit('/signup');
    cy.get('#reg-username').should('be.visible');
  });

  it('should check form valid state dependencies', () => {
    // Guarantee initialization finishes by adding not.be.disabled assertions before type
    cy.get('#reg-username').should('not.be.disabled').type('sirdarquan');
    cy.get('#reg-username').blur();

    cy.get('#reg-email').should('not.be.disabled').type('test@example.com');
    cy.get('#reg-email').blur();

    cy.get('#reg-password').should('not.be.disabled').type('weak');
    cy.get('#reg-password').blur();
    
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should check validation patterns', () => {
    cy.get('#reg-password').should('not.be.disabled').type('weakpass');
    cy.get('#reg-password').blur();
    
    cy.contains('At least 8 chars').should('have.class', 'text-green-400');
    cy.contains('One uppercase').should('not.have.class', 'text-green-400');
  });

  it('should complete successful signup when strong credentials are provided', () => {
    cy.intercept('POST', '**/auth/signup', {
      statusCode: 200,
      body: {
        session: { access_token: 'mock_token' },
        user: {
          username: 'successUser',
          email: 'success@example.com'
        }
      }
    }).as('registerUser');

    cy.intercept('GET', '**/api/recipes*', {
      statusCode: 200,
      body: []
    }).as('getRecipes');

    cy.get('#reg-username').should('not.be.disabled').type('successUser');
    cy.get('#reg-username').blur();
    cy.wait('@checkUsername');

    cy.get('#reg-email').should('not.be.disabled').type('success@example.com');
    cy.get('#reg-email').blur();
    
    cy.get('#reg-password').should('not.be.disabled').type('StrongPass!999');
    cy.get('#reg-password').blur();

    cy.contains('At least 8 chars').should('have.class', 'text-green-400');
    cy.contains('One uppercase').should('have.class', 'text-green-400');
    cy.contains('One lowercase').should('have.class', 'text-green-400');
    cy.contains('One number').should('have.class', 'text-green-400');
    cy.contains('One special character').should('have.class', 'text-green-400');

    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        user: {
          username: 'successUser',
          email: 'success@example.com'
        }
      }
    }).as('getCurrentUserAfterSignup');

    cy.get('button[type="submit"]').should('not.be.disabled').click({ force: true });
    cy.wait('@registerUser');

    cy.location('pathname', { timeout: 10000 }).should('eq', '/');
  });
});
