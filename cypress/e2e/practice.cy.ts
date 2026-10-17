// The e2e run exercises the paste-your-own-text path so it needs no OpenAI
// key: enter text, type some of it correctly, make a mistake, and copy only
// the correct prefix.
describe('typing practice', () => {
  it('turns spoken text into copyable practice', () => {
    cy.visit('/');

    cy.get('.manual textarea').type('play the game');
    cy.contains('button', 'Start typing practice').click();

    cy.get('[data-testid="practice-display"]').should('contain', 'play the game');

    const input = cy.get('#practice-input');
    // Correct start: green characters.
    input.type('play th');
    cy.get('[data-testid="practice-display"] .correct').should('have.length', 7);
    // A mistake turns the expected character red.
    input.type('x');
    cy.get('[data-testid="practice-display"] .wrong').should('have.length', 1);
    // Backspace repairs it.
    input.type('{backspace}');
    cy.get('[data-testid="practice-display"] .wrong').should('have.length', 0);

    cy.window().then((win) => cy.stub(win.navigator.clipboard, 'writeText').resolves());
    cy.contains('button', 'Copy my correct text').click();
    cy.window().then((win) => expect(win.navigator.clipboard.writeText).to.have.been.calledWith('play th'));

    cy.contains('button', 'New text').click();
    cy.contains('Tap and speak your text').should('be.visible');
  });
});
