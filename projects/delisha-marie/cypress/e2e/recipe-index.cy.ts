describe('Recipe Index Page', () => {
  beforeEach(() => {
    // Intercept API call to /api/recipe-index
    cy.intercept('GET', '/api/recipe-index*', {
      statusCode: 200,
      body: {
        featuredCategories: [
          { name: 'Appetizers', url: '/recipes/appetizers', image: '/images/categories/appetizers.png' },
          { name: 'Desserts', url: '/recipes/desserts', image: '/images/categories/desserts.png' }
        ],
        cookingMethods: [
          { name: 'Air Fryer', url: '/methods/air-fryer', image: '/images/methods/air-fryer.png' }
        ],
        categoriesList: [
          {
            name: 'Appetizers',
            url: '/recipes/appetizers',
            children: [{ name: 'Dips', url: '/recipes/appetizers/dips' }]
          },
          {
            name: 'Desserts',
            url: '/recipes/desserts',
            children: [{ name: 'Cakes', url: '/recipes/desserts/cakes' }]
          }
        ],
        methodsList: [
          { name: 'Air Fryer', url: '/methods/air-fryer' }
        ],
        holidays: [
          { name: 'Christmas', url: '/holidays/christmas' }
        ],
        specialDiets: [
          { name: 'Gluten Free', url: '/special-diets/gluten-free' }
        ],
        bestRecipes: [
          {
            name: 'The Best Appetizers',
            url: '/the-best-recipes/the-best-appetizers',
            children: [{ name: 'The Best Dips', url: '/the-best-recipes/the-best-appetizers/the-best-dips' }]
          },
          {
            name: 'The Best Desserts',
            url: '/the-best-recipes/the-best-desserts'
          }
        ],
        ingredients: [
          {
            name: 'Apple',
            url: '/tag/apple',
            count: 5,
            children: [{ name: 'Apple Cider', url: '/tag/apple-cider', count: 2 }]
          }
        ]
      }
    }).as('getRecipeIndex');

    cy.visit('/recipe-index');
    cy.wait('@getRecipeIndex');
  });

  it('should render page layout header, breadcrumbs, and newsletter footer', () => {
    cy.get('#index-title').should('contain.text', 'Recipe Index');
    cy.get('dml-breadcrumbs').should('contain.text', 'Home').and('contain.text', 'Recipe Index');
    cy.get('footer').should('contain.text', 'Never miss a beat!');
    cy.get('footer button').should('contain.text', 'Join the Studio Newsletter');
  });

  it('should render featured categories and methods with proper imagery', () => {
    cy.get('dm-recipe-index-category-images').within(() => {
      cy.get('span').should('contain.text', 'Appetizers').and('contain.text', 'Desserts');
    });

    cy.get('dm-recipe-index-method-images').within(() => {
      cy.get('span').should('contain.text', 'Air Fryer');
    });
  });

  it('should render categorizations lists for categories, methods, holidays, and special diets', () => {
    // Recipes by Category
    cy.get('#category-list-title').should('contain.text', 'Recipes By Category');
    cy.get('dm-recipe-index-link-list').eq(0).within(() => {
      cy.get('a').contains('Appetizers').should('have.attr', 'href', '/recipes/appetizers');
      cy.get('a').contains('Dips').should('have.attr', 'href', '/recipes/appetizers/dips');
    });

    // Recipes by Method
    cy.get('#methods-list-title').should('contain.text', 'Recipes By Method');
    cy.get('dm-recipe-index-link-list').eq(1).within(() => {
      cy.get('a').contains('Air Fryer').should('have.attr', 'href', '/methods/air-fryer');
    });

    // Recipes by Holiday
    cy.get('#holidays-title').should('contain.text', 'Recipes By Holiday');
    cy.get('dm-recipe-index-link-list').eq(2).within(() => {
      cy.get('a').contains('Christmas').should('have.attr', 'href', '/holidays/christmas');
    });

    // Special Diets
    cy.get('#diets-title').should('contain.text', 'Special Diets');
    cy.get('dm-recipe-index-link-list').eq(3).within(() => {
      cy.get('a').contains('Gluten Free').should('have.attr', 'href', '/special-diets/gluten-free');
    });
  });

  it('should render the "The Best Recipes" section correctly', () => {
    cy.get('#best-recipes-title').should('contain.text', 'The Best Recipes');
    cy.get('dm-recipe-index-link-list').eq(4).within(() => {
      cy.get('a').contains('The Best Appetizers').should('have.attr', 'href', '/the-best-recipes/the-best-appetizers');
      cy.get('a').contains('The Best Dips').should('have.attr', 'href', '/the-best-recipes/the-best-appetizers/the-best-dips');
      cy.get('a').contains('The Best Desserts').should('have.attr', 'href', '/the-best-recipes/the-best-desserts');
    });
  });

  it('should render ingredients index with hierarchy', () => {
    cy.get('dm-recipe-index-ingredients').within(() => {
      cy.get('a').contains('Apple').should('contain.text', '(2)');
      cy.get('a').contains('Apple Cider').should('contain.text', '(2)').and('have.attr', 'href', '/tag/apple-cider');
    });
  });
});
