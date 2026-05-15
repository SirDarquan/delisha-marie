describe('Single Recipe Detail View', () => {
  const mockFullRecipe = {
    id: 101,
    title: 'Signature Beef Stew',
    slug: 'signature-beef-stew',
    description: 'Warm comforting premium beef stew.',
    content: '<p>This is a delicious detailed background story for my classic stew.</p>',
    ingredients: ['2 lbs Beef Chuck', '4 Carrots', '1 Yellow Onion'],
    instructions: ['Sear beef in pot', 'Dice veggies and add', 'Simmer for 2 hours'],
    image: 'beef-stew.jpg',
    yield: '6 servings',
    prepTime: '20m',
    cookTime: '2h',
    totalTime: '2h 20m',
    cuisine: 'American',
    course: 'Main Course',
    method: 'Stovetop',
    author: 'Delisha Marie',
    rating: 4.8,
    ratingCount: 12,
    nutrition: {
      calories: '450 kcal',
      fat: '22g',
      carbohydrates: '18g',
      protein: '35g',
      servingSize: '1 bowl',
    },
    breadcrumbs: {
      main: 0,
      items: [
        [
          { label: 'Home', url: '/' },
          { label: 'Recipes', url: '/recipes' },
          { label: 'Signature Beef Stew' },
        ],
      ],
    },
    navigation: {
      prev: { title: 'Previous Salad', slug: 'previous-salad' },
      next: { title: 'Next Pie', slug: 'next-pie' },
    },
  };

  beforeEach(() => {
    // Setup active recipe list API mock
    cy.intercept('GET', '/api/recipes*', {
      statusCode: 200,
      body: [mockFullRecipe],
    }).as('getRecipeList');

    // Stub comments list for this recipe
    cy.intercept('GET', '/api/comments*', {
      statusCode: 200,
      body: [
        {
          id: 'c1',
          recipeId: '101',
          author: 'Grace Hopper',
          content: 'Absolutely phenomenal stew! Reminds me of Sunday dinner.',
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('getRecipeComments');

    cy.visit('/recipe/signature-beef-stew');
    cy.wait('@getRecipeList');
  });

  it('should populate the HTML Head with robust JSON-LD Schema markup', () => {
    // JSON-LD resolver dynamically injects a script block wrapped in @graph
    cy.get('script[type="application/ld+json"]')
      .should('exist')
      .then((scripts) => {
        const scriptContents = Array.from(scripts).map((s) => JSON.parse(s.textContent || '{}'));

        // The schema resolver wraps elements inside the '@graph' array property
        interface GraphObject {
          '@graph': { '@type': string; name?: string }[];
        }
        const rootObj = scriptContents.find(
          (s): s is GraphObject =>
            s && '@graph' in s && Array.isArray((s as GraphObject)['@graph']),
        );
        expect(rootObj).to.not.equal(undefined);

        const recipeSchema = rootObj?.['@graph'].find((s) => s['@type'] === 'Recipe');
        expect(recipeSchema).to.not.equal(undefined);
        expect(recipeSchema?.name).to.equal('Signature Beef Stew');
      });
  });

  it('should render the main article layout, including the breadcrumb tree', () => {
    cy.get('article').should('be.visible');

    // Verify Breadcrumbs
    cy.get('dml-breadcrumbs')
      .should('contain.text', 'Home')
      .and('contain.text', 'Recipes')
      .and('contain.text', 'Signature Beef Stew');
  });

  it('should render the full recipe card with action triggers and metrics', () => {
    cy.get('#recipe-card').within(() => {
      // Title & Author check
      cy.get('.recipe-card-title').should('contain.text', 'Signature Beef Stew');

      // Metrics
      cy.get('.recipe-card-time').contains('2h 20m');
      cy.get('.recipe-card-servings').contains('6 servings');

      // Buttons
      cy.get('button').contains('Print').should('exist');
      cy.get('button').contains('Rate').should('exist');
      cy.get('button').contains('Save').should('exist');

      // List items
      cy.get('h3').contains('Ingredients').should('exist');
      cy.get('li').should('contain.text', '2 lbs Beef Chuck');

      cy.get('h3').contains('Instructions').should('exist');
      cy.get('p').should('contain.text', 'Simmer for 2 hours');

      // Nutrition Grid
      cy.get('h3').contains('Nutritional Information').should('exist');
      cy.get('span').contains('Calories').siblings('span').should('contain.text', '450 kcal');
    });
  });

  it('should display submitted user comments and handle empty feedback states', () => {
    // Assert existing comment is rendered
    cy.get('dml-recipe-comments').within(() => {
      cy.get('h2').should('contain.text', 'comment(s)');
      cy.get('.comment-author').should('contain.text', 'Grace Hopper');
      cy.get('.comment-content').should('contain.text', 'Reminds me of Sunday dinner.');
    });
  });

  it('should navigate to adjacent recipes via sequential next/prev widgets', () => {
    // Next/Previous post widget
    cy.get('dml-recipe-navigation').within(() => {
      cy.get('span').contains('Next Recipe').should('exist');
      cy.get('span').contains('Previous Recipe').should('exist');
    });
  });
});
