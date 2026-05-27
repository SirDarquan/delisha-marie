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
      cy.get('#login-email').should('be.visible');
    });

    it('should render the login form with email field', () => {
      cy.get('h1').should('contain', 'Delisha Marie');
      cy.get('#login-email').should('be.visible');
      cy.get('button[type="submit"]:visible').should('contain', 'Log In');
    });

    it('should show error message when sending OTP fails', () => {
      cy.intercept('POST', '**/auth/descope/send-otp', {
        statusCode: 400,
        body: { error: 'Failed to send OTP' },
      }).as('postSendOtpFail');

      cy.get('#login-email').should('not.be.disabled').type('error@example.com');
      cy.get('button[type="submit"]:visible').should('not.be.disabled').click();
      cy.wait('@postSendOtpFail');

      cy.contains('Failed to send OTP').should('be.visible');
    });

    it('should allow successful existing user login via OTP and redirect to admin dashboard', () => {
      cy.intercept('POST', '**/auth/descope/send-otp', {
        statusCode: 200,
        body: { success: true, isNewUser: false },
      }).as('postSendOtp');

      cy.intercept('POST', '**/auth/descope/verify-otp', {
        statusCode: 200,
        body: {
          success: true,
          session: { access_token: 'mock_token' },
          user: {
            username: 'sirda',
            email: 'sirda@example.com',
          },
        },
      }).as('postVerifyOtp');

      cy.intercept('GET', '**/api/recipes*', {
        statusCode: 200,
        body: [],
      }).as('getRecipes');

      // 1. Enter email
      cy.get('#login-email').type('sirda@example.com');
      cy.get('button[type="submit"]:visible').click();
      cy.wait('@postSendOtp');

      // 2. Transition to Step 2 (OTP)
      cy.get('#login-otp').should('be.visible');
      cy.get('#login-otp').type('123456');

      // Intercept auth/me with authenticated state before confirming OTP
      cy.intercept('GET', '**/auth/me*', {
        statusCode: 200,
        body: {
          user: {
            username: 'sirda',
            email: 'sirda@example.com',
          },
        },
      }).as('getCurrentUserAfterLogin');

      cy.get('button[type="submit"]:visible').click();
      cy.wait('@postVerifyOtp');

      cy.location('pathname', { timeout: 10000 }).should('eq', '/');
    });

    it('should allow successful new user signup and sync with Supabase', () => {
      cy.intercept('POST', '**/auth/descope/send-otp', {
        statusCode: 200,
        body: { success: true, isNewUser: true },
      }).as('postSendOtpNew');

      cy.intercept('POST', '**/auth/descope/verify-otp', {
        statusCode: 200,
        body: {
          success: true,
          isNewUser: true,
          descopeToken: 'mock_descope_token',
        },
      }).as('postVerifyOtpNew');

      cy.intercept('POST', '**/auth/descope/register', {
        statusCode: 200,
        body: {
          success: true,
          session: { access_token: 'mock_token' },
          user: {
            username: 'alicew',
            email: 'new@example.com',
          },
        },
      }).as('postRegister');

      cy.intercept('GET', '**/api/recipes*', {
        statusCode: 200,
        body: [],
      }).as('getRecipes');

      // 1. Enter email
      cy.get('#login-email').type('new@example.com');
      cy.get('button[type="submit"]:visible').click();
      cy.wait('@postSendOtpNew');

      // 2. Step 2: OTP Entry
      cy.get('#login-otp').should('be.visible');
      cy.get('#login-otp').type('123456');
      cy.get('button[type="submit"]:visible').click();
      cy.wait('@postVerifyOtpNew');

      // 3. Step 3: Profile Info Setup
      cy.get('#info-email').should('be.disabled').and('have.value', 'new@example.com');
      cy.get('#info-firstName').type('Alice');
      cy.get('#info-lastName').type('Wonder');
      cy.get('#info-displayName').type('alicew');

      // Intercept auth/me to be authenticated
      cy.intercept('GET', '**/auth/me*', {
        statusCode: 200,
        body: {
          user: {
            username: 'alicew',
            email: 'new@example.com',
          },
        },
      }).as('getCurrentUserAfterRegister');

      cy.get('button[type="submit"]:visible').click();
      cy.wait('@postRegister');

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
      cy.intercept('GET', '**/auth/me*', {
        statusCode: 200,
        body: {
          user: { username: 'passkeyUser', email: 'passkey@example.com' },
        },
      }).as('getCurrentUserPasskey');

      cy.window().then((win) => {
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
