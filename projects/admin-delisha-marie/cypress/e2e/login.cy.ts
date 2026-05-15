describe('Admin Login Page', () => {
  beforeEach(() => {
    // Intercept the session check that occurs on initialization.
    // Return a 401 so the component does not redirect immediately to /
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 401,
      body: { error: 'Unauthorized' },
    }).as('getCurrentUser');

    cy.visit('/login');
    cy.get('#login-username').should('be.visible');
  });

  it('should render the login form with username and password fields', () => {
    cy.get('h1').should('contain', 'Admin Portal');
    cy.get('#login-username').should('be.visible');
    cy.get('#login-password').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Log In');
  });

  it('should allow toggling password visibility', () => {
    // Ensure password field is initially obscured
    cy.get('#login-password').should('have.attr', 'type', 'password');

    // Use regular click to trigger browser events natively, ensuring NgZone registration
    cy.get('button[aria-label="Show password"]').click();
    
    // Verify field reveals text value
    cy.get('#login-password').should('have.attr', 'type', 'text');
    
    // Toggling back should work identically
    cy.get('button[aria-label="Hide password"]').click();
    cy.get('#login-password').should('have.attr', 'type', 'password');
  });

  it('should allow successful log in and redirect to admin dashboard', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        session: { access_token: 'mock_token' },
        user: {
          username: 'sirda',
          email: 'sirda@example.com'
        }
      }
    }).as('postLogin');

    cy.intercept('GET', '**/api/recipes*', {
      statusCode: 200,
      body: []
    }).as('getRecipes');

    // Wait for fields to be active/enabled before typing
    cy.get('#login-username').should('not.be.disabled').type('sirda');
    cy.get('#login-username').blur();

    cy.get('#login-password').should('not.be.disabled').type('SuperSecurePass!1');
    cy.get('#login-password').blur();

    // CRITICAL: Override the /auth/me intercept BEFORE submitting the form
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        user: {
          username: 'sirda',
          email: 'sirda@example.com'
        }
      }
    }).as('getCurrentUserAfterLogin');

    cy.get('button[type="submit"]').should('not.be.disabled').click({ force: true });
    cy.wait('@postLogin');

    cy.location('pathname', { timeout: 10000 }).should('eq', '/');
  });

  it('should navigate to signup page when clicking the sign up link', () => {
    cy.get('a').contains('Sign Up').click({ force: true });
    cy.location('pathname').should('eq', '/signup');
  });
});
