describe('Admin Happy Path Flow', () => {
    const email = `testuser${Date.now()}@example.com`;
    const password = 'password123';
    const gameName = 'My Cypress Game';
    const question = 'Which food do you like?';
    const answer1 = 'potato';
    const answer2 = 'tomato';
  
  
    it('Happy Path', () => {
      //register and login
      cy.visit('http://localhost:3000/#/register');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').eq(0).type(password);
      cy.get('input[type="password"]').eq(1).type(password);
      cy.get('button[type="submit"]').click();

      cy.visit('http://localhost:3000/#/login');
      cy.wait(500);
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.hash().should('eq', '#/dashboard');

      //create game
      cy.get('input[type="text"]').first().type(gameName);
      cy.get('button').contains('Create Empty Game').click();
      cy.contains('h2', gameName).should('exist'); 

      //add question
      cy.contains('Edit').click();
      cy.get('input').eq(2).type(question);
      cy.contains('Add Question').click();

      //edit question
      cy.contains('button', 'Edit').click();
      cy.get('input[placeholder="Answer 1"]').type(answer1);
      cy.get('input[placeholder="Answer 2"]').type(answer2);
      cy.get('input[type="radio"], input[type="checkbox"]').eq(0).click();
      cy.contains('Save and Return').click();

      //log out
      cy.contains('← Back to Dashboard').first().click();
      cy.contains('Logout').click();
    });
  
  });
  