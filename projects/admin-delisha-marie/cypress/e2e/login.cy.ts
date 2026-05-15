describe('Admin Login Page', () => {
  describe('Unauthenticated user scenarios', () => {
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

    it('should show error message when login fails with invalid credentials', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' },
      }).as('postLoginFail');

      cy.get('#login-username').should('not.be.disabled').type('wrong-user');
      cy.get('#login-password').should('not.be.disabled').type('wrong-pass');

      cy.get('button[type="submit"]').should('not.be.disabled').click({ force: true });
      cy.wait('@postLoginFail');

      cy.contains('Invalid username or password.').should('be.visible');
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
            email: 'sirda@example.com',
          },
        },
      }).as('postLogin');

      cy.intercept('GET', '**/api/recipes*', {
        statusCode: 200,
        body: [],
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
            email: 'sirda@example.com',
          },
        },
      }).as('getCurrentUserAfterLogin');

      cy.get('button[type="submit"]').should('not.be.disabled').click({ force: true });
      cy.wait('@postLogin');

      cy.location('pathname', { timeout: 10000 }).should('eq', '/');
    });

    it('should handle account recovery - forgot username', () => {
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns('sirda@example.com');
      });

      cy.intercept('POST', '**/auth/retrieve-username', {
        statusCode: 200,
        body: { username: 'sirda' },
      }).as('retrieveUsername');

      cy.contains('Forgot Username?').click();
      cy.wait('@retrieveUsername').its('request.body.email').should('eq', 'sirda@example.com');

      cy.contains('Your username is: sirda').should('be.visible');
    });

    it('should handle account recovery - forgot password', () => {
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns('sirda');
      });

      cy.intercept('POST', '**/auth/retrieve-password', {
        statusCode: 200,
        body: { password: 'SuperSecretPassword' },
      }).as('retrievePassword');

      cy.contains('Forgot Password?').click();
      cy.wait('@retrievePassword').its('request.body.identifier').should('eq', 'sirda');

      cy.contains('Your password is: SuperSecretPassword').should('be.visible');
    });

    it('should authenticate via passkey successfully', () => {
      // Intercept /auth/me to return 200 BEFORE action so that the authGuard on the '/' route
      // successfully authenticates the user once redirection is triggered!
      cy.intercept('GET', '**/auth/me*', {
        statusCode: 200,
        body: {
          user: { username: 'passkeyUser', email: 'passkey@example.com' },
        },
      }).as('getCurrentUserPasskey');

      cy.window().then((win) => {
        // Ensure navigator.credentials is defined in the headless environment
        if (!win.navigator.credentials) {
          Object.defineProperty(win.navigator, 'credentials', {
            value: { get: () => Promise.resolve(null) },
            writable: true,
            configurable: true,
          });
        }
        cy.stub(win.navigator.credentials, 'get').resolves({
          id: 'mock-credential-id',
          type: 'public-key',
        });
      });

      cy.intercept('GET', '**/api/recipes*', {
        statusCode: 200,
        body: [],
      }).as('getRecipes');

      cy.contains('Sign in with Passkey').click();

      cy.contains('Passkey authenticated successfully!').should('be.visible');

      cy.location('pathname', { timeout: 10000 }).should('eq', '/');
    });

    it('should navigate to signup page when clicking the sign up link', () => {
      cy.get('a').contains('Sign Up').click({ force: true });
      cy.location('pathname').should('eq', '/signup');
    });
  });

  describe('Authenticated user scenarios', () => {
    it('should redirect to dashboard immediately if already authenticated on init', () => {
      cy.intercept('GET', '**/auth/me*', {
        statusCode: 200,
        body: {
          user: { username: 'sirda', email: 'sirda@example.com' },
        },
      }).as('getCurrentUserAuthenticated');

      cy.intercept('GET', '**/api/recipes*', {
        statusCode: 200,
        body: [],
      }).as('getRecipes');

      cy.visit('/login');
      cy.location('pathname', { timeout: 10000 }).should('eq', '/');
    });
  });
});
