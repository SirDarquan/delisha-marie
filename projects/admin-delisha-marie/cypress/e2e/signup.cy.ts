describe('Admin Signup Page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 401,
      body: { error: 'Unauthorized' },
    }).as('getCurrentUser');

    cy.intercept('GET', '**/auth/check-username*', {
      statusCode: 200,
      body: { available: true },
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

  it('should show inline validation errors for invalid user input', () => {
    // Short username
    cy.get('#reg-username').should('not.be.disabled').type('si');
    cy.get('#reg-username').blur();
    cy.contains('Username is required (min 3 chars).').should('be.visible');

    // Invalid email
    cy.get('#reg-email').should('not.be.disabled').type('not-an-email');
    cy.get('#reg-email').blur();
    cy.contains('Please enter a valid email address.').should('be.visible');
  });

  it('should show an indicator if the username is already taken', () => {
    cy.intercept('GET', '**/auth/check-username*', {
      statusCode: 200,
      body: { available: false },
    }).as('checkUsernameTaken');

    cy.get('#reg-username').should('not.be.disabled').type('taken-user');
    cy.get('#reg-username').blur();
    cy.wait('@checkUsernameTaken');

    cy.contains('Username is already taken.').should('be.visible');
  });

  it('should check validation patterns', () => {
    cy.get('#reg-password').should('not.be.disabled').type('weakpass', { delay: 100 });
    cy.get('#reg-password').blur();

    cy.contains('At least 8 chars').should('have.class', 'text-green-400');
    cy.contains('One uppercase').should('not.have.class', 'text-green-400');
  });

  it('should show snackbar error if register API returns failure', () => {
    cy.intercept('POST', '**/auth/signup', {
      statusCode: 400,
      body: { error: 'Signup failed' },
    }).as('registerUserFail');

    cy.get('#reg-username').should('not.be.disabled').type('failUser');
    cy.get('#reg-username').blur();
    cy.wait('@checkUsername');

    cy.get('#reg-email').should('not.be.disabled').type('fail@example.com');
    cy.get('#reg-email').blur();

    cy.get('#reg-password').should('not.be.disabled').type('StrongPass!999');
    cy.get('#reg-password').blur();

    cy.get('button[type="submit"]').should('not.be.disabled').click({ force: true });
    cy.wait('@registerUserFail');

    cy.contains('Registration failed. Please check your data and try again.').should('be.visible');
  });

  it('should complete successful signup when strong credentials are provided', () => {
    cy.intercept('POST', '**/auth/signup', {
      statusCode: 200,
      body: {
        session: { access_token: 'mock_token' },
        user: {
          username: 'successUser',
          email: 'success@example.com',
        },
      },
    }).as('registerUser');

    cy.intercept('GET', '**/api/recipes*', {
      statusCode: 200,
      body: [],
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
          email: 'success@example.com',
        },
      },
    }).as('getCurrentUserAfterSignup');

    cy.get('button[type="submit"]').should('not.be.disabled').click({ force: true });
    cy.wait('@registerUser');

    cy.location('pathname', { timeout: 10000 }).should('eq', '/');
  });

  it('should navigate to login page when clicking the Log In link', () => {
    cy.get('a').contains('Log In').click({ force: true });
    cy.location('pathname').should('eq', '/login');
  });
});
