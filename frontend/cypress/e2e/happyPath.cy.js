describe('Admin Happy Path Flow', () => {
    const email = `testuser${Date.now()}@example.com`;
    const password = 'password123';
    const gameName = 'My Cypress Game';
  
    let sessionId = null;
  
    it('Happy Path', () => {
      // register  
      cy.visit('http://localhost:3000/#/register');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').eq(0).type(password);
      cy.get('input[type="password"]').eq(1).type(password);
      cy.get('button[type="submit"]').click();
  
      cy.hash().should('eq', '#/dashboard');
      
      //create
      cy.get('input[type="text"]').first().type(gameName);
      cy.get('button').contains('Create Empty Game').click();
    });
  
  });
  