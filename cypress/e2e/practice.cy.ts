// The practice flow needs a real microphone, so the e2e sticks to what is
// scriptable: the home screen renders, and a denied mic shows the friendly
// fallback message.
describe('typewithme', () => {
  it('shows the recorder on the home screen', () => {
    cy.visit('/');
    cy.contains('Tap and speak your text').should('be.visible');
    cy.get('button.mic').should('be.enabled');
  });

  it('explains what happened when the microphone is unavailable', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects(new DOMException('denied', 'NotAllowedError'));
      },
    });
    cy.get('button.mic').click();
    cy.contains('I could not use the microphone').should('be.visible');
  });
});
