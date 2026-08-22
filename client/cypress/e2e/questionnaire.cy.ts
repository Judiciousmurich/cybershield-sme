describe('Questionnaire flow', () => {
  it('logs in, completes every domain, and marks the assessment complete', () => {
    const email = `sme.${Date.now()}@example.com`;
    const password = 'SecurePass1';

    cy.visit('/');
    cy.findByRole('button', { name: 'Register' }).click();
    cy.findByLabelText('Email').type(email);
    cy.findByLabelText('Password').type(password);
    cy.findByRole('button', { name: 'Register and continue' }).click();

    cy.location('pathname').should('eq', '/questionnaire');
    cy.contains('h1', 'Risk questionnaire').should('be.visible');

    cy.get('[data-domain-panel]').should('be.visible');

    for (let domain = 0; domain < 5; domain += 1) {
      cy.get('[data-question-id]').each(($question) => {
        cy.wrap($question).find('input[type="radio"]').first().check();
      });

      cy.contains('Answers save as you select them.').should('be.visible');

      if (domain < 4) {
        cy.findByRole('button', { name: 'Next domain' }).click();
      }
    }

    cy.findByRole('button', { name: 'Complete assessment' }).click();
    cy.location('pathname').should('eq', '/complete');
    cy.contains('h1', 'Assessment complete').should('be.visible');
    cy.get('[data-cy="assessment-status"]').should('contain', 'completed');

    cy.window().then((win) => {
      const token = win.sessionStorage.getItem('cybershield.token');
      const assessmentId = win.sessionStorage.getItem('cybershield.assessmentId');
      expect(token, 'auth token').to.be.a('string');
      expect(assessmentId, 'assessment id').to.be.a('string');

      cy.request({
        url: `/api/assessments/${assessmentId}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.assessment.status).to.eq('completed');
        expect(response.body.assessment.completed_at).to.not.eq(null);
      });
    });
  });
});
