Cypress.Commands.add('getToken', async (user, passwd) => {
  const response = await cy.request({
    method: 'POST',
    url: 'https://barrigarest.wcaquino.me/signin',
    body: {
      email: user,
      senha: passwd,
      redirecionar: false
    }
  });
  return response.body.token;
});

Cypress.Commands.add('resetRest', (user, passwd) => {
  return cy.getToken(user, passwd).then(token => {
    return cy.request({
      method: 'GET',
      url: 'https://barrigarest.wcaquino.me/reset',
      headers: { Authorization: `JWT ${token}` }
    }).its('status').should('be.equal', 200);
  });
});

Cypress.Commands.add('getContaByName', name => {
  return cy.getToken('a@a', 'a').then(token => {
    return cy.request({
      method: 'GET',
      url: 'https://barrigarest.wcaquino.me/contas',
      headers: { Authorization: `JWT ${token}` },
      qs: { 
        nome: name
      }
    }).its('status').should('be.equal', 200);
  });
});
