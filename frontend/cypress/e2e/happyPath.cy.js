describe('Admin Happy Path Flow', () => {
    const email = `testuser${Date.now()}@example.com`;
    const password = 'password123';
    const gameName = 'My Cypress Game';
  
    let sessionId = null;
  
    it('Happy Path', () => {
      //register
      cy.visit('http://localhost:3000/#/register');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').eq(0).type(password);
      cy.get('input[type="password"]').eq(1).type(password);
      cy.get('button[type="submit"]').click();
  
      cy.hash().should('eq', '#/dashboard');

      //create game
      cy.visit('http://localhost:3000/#/login');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();
        
      cy.get('input[type="text"]').first().type(gameName);
      cy.get('button').contains('Create Empty Game').click();
      cy.contains('h2', gameName).should('exist'); 

      //start game
      cy.contains('h2', gameName)
      .parents('div.relative')
      .within(() => {
        cy.contains('Start Game').click();
      });

      cy.contains('Session Started').should('exist');

      //stop game
      cy.window().then((win) => {
        const map = JSON.parse(win.localStorage.getItem('session_game_map'));
        const sessionId = Object.keys(map)[0];
        cy.visit(`http://localhost:3000/#/session/${sessionId}`);
      });

      cy.contains('Stop Game').click();
      cy.contains('Top 5 Players').should('exist');

      //log out
      cy.contains('Back to Dashboard').click();
      cy.contains('Logout').click();

      //log back
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.contains('My Games').should('exist');
    });
  
  });
  