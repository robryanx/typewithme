// The mic cannot be scripted in a headless browser, so these specs inject
// practice text through the ?text=... query parameter (read once on mount,
// purely local — no API call) and exercise the full flow: green characters,
// mistakes, backspace, and copying only the correct prefix.
describe('typing practice', () => {
  it('turns text into copyable practice', () => {
    cy.visit('/?text=play%20the%20game');

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

  it('reverses the practice text and starts fresh', () => {
    cy.visit('/?text=abc');

    const input = cy.get('#practice-input');
    input.type('a');
    cy.get('[data-testid="practice-display"] .correct').should('have.length', 1);

    cy.contains('button', 'Reverse text').click();
    cy.get('[data-testid="practice-display"]').should('contain', 'cba');
    cy.get('[data-testid="practice-display"] .correct').should('have.length', 0);
    cy.get('[data-testid="practice-display"] .pending').should('have.length', 3);

    // The reversed target 'cba' can be typed green to completion.
    input.type('cba');
    cy.get('[data-testid="practice-display"] .correct').should('have.length', 3);
    cy.contains('button', 'Un-reverse text').should('be.visible');
  });

  it('ignores empty injected text', () => {
    cy.visit('/?text=');
    cy.contains('Tap and speak your text').should('be.visible');
  });

  it('explains what to fix when the microphone is blocked', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects(new DOMException('denied', 'NotAllowedError'));
      },
    });
    cy.get('button.mic').click();
    cy.contains('blocked here').should('be.visible');
  });
});
