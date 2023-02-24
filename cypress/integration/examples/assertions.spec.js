/// <reference types="Cypress" />



Cypress.Commands.add('getToken', (user, passwd) => {
  return cy.request({
      method: 'POST',
      url: 'https://barrigarest.wcaquino.me/signin',
      body: {
          email: user,
          senha: passwd,
          redirecionar: false
      }
  })
  .its('body.token')
  .should('not.be.empty');
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
    }).its('body.0.id');
  });
});


Cypress.Commands.add('resetRest', token => {
  return cy.request({
      method: 'GET',
      url: 'https://barrigarest.wcaquino.me/reset',
      headers: { Authorization: `JWT ${token}` }
  }).its('status')
  .should('eq', 200);
});


describe('Teste 2', () => {
  let token;

  beforeEach(() => {
      cy.getToken('a@a', 'a').then(t => {
          token = t;
          cy.resetRest(token);
      });
  });

  it('Criar uma conta na API', () => {
      cy.request({
          method: 'POST',
          url: 'https://barrigarest.wcaquino.me/contas',
          headers: { Authorization: `JWT ${token}` },
          body: {
              nome: 'Conta via rest'
          }
      }).as('response');

      cy.get('@response').then(res => {
          expect(res.status).to.eq(201);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('nome', 'Conta via rest');
      });
  });

  it('Alterar Conta', () => {
      cy.request({
          method: 'GET',
          url: 'https://barrigarest.wcaquino.me/contas',
          headers: { Authorization: `JWT ${token}` },
          qs: { 
              nome: 'Conta para alterar'
          }
      }).then(res => {
          cy.request({
              method: 'PUT',
              url: `https://barrigarest.wcaquino.me/contas/${res.body[0].id}`,
              headers: { Authorization: `JWT ${token}` },
              body: { 
                  nome: 'Conta Alterada VIA REST'
              }
          }).then(res => {
              expect(res.status).to.eq(200);
          });
      });
  });

  it('Criar uma conta na API com o mesmo nome', () => {
      cy.request({
          method: 'POST',
          url: 'https://barrigarest.wcaquino.me/contas',
          headers: { Authorization: `JWT ${token}` },
          body: {
            nome: 'Conta mesmo nome'
          }, 
          failOnStatusCode: false
      }).as('response');

      cy.get('@response').then(res => {
          console.log(res)
          expect(res.status).to.eq(400);
          expect(res.body.error).to.equal('Já existe uma conta com esse nome!');
      });
  });

  it('Criar uma transação', () => {
    cy.getContaByName('Conta para movimentacoes').then(contaID => {
      cy.request({
        method: 'POST',
        url: 'https://barrigarest.wcaquino.me/transacoes',
        headers: { Authorization: `JWT ${token}` },
        body: {
          conta_id: contaID,
          data_pagamento: Cypress.moment().add({days: 1}).format('DD/MM/YYYY'),
          data_transacao: Cypress.moment().format('DD/MM/YYYY'),
          descricao: "aaa",
          envolvido: "aaa",
          status: false,
          tipo: "REC",
          valor: "123",
        }   
      }).as('response'); 
  
      cy.get('@response').its('status').should('be.equal', 201);
      cy.get('@response').its('body.id').should('exist');
    });
  });
  

  it('Mostrar o balanço', () => {
    cy.request({
      url: 'https://barrigarest.wcaquino.me/saldo',
      method: 'GET',
      headers: { Authorization: `JWT ${token}` },
    }).then(res => {
      let saldoConta = null;
      res.body.forEach(c => { 
        if (c.conta === 'Conta para saldo') {
          saldoConta = c.saldo;
        }
      });
      expect(saldoConta).to.be.equal('534.00'); 
    });
  
    cy.request({
      url: 'https://barrigarest.wcaquino.me/transacoes',
      method: 'GET',
      headers: { Authorization: `JWT ${token}` },
      qs: { descricao: 'Movimentacao 1, calculo saldo' },
    }).then(res => {
      console.log(res.body[0]);
      cy.request({
        url: `https://barrigarest.wcaquino.me/transacoes/${res.body[0].id}`,
        method: 'PUT',
        headers: { Authorization: `JWT ${token}` },
        body: {
          status: true,
          data_transacao: Cypress.moment(res.body[0].data_transacao).format('DD/MM/YYYY'),
          data_pagamento: Cypress.moment(res.body[0].data_transacao).format('DD/MM/YYYY'),
          descricao: res.body[0].descricao,
          envolvido: res.body[0].envolvido,
          valor: res.body[0].valor,
          conta_id: res.body[0].conta_id
        }
      }).its('status').should('be.equal', 200);
    });
  
    cy.request({
      url: 'https://barrigarest.wcaquino.me/saldo',
      method: 'GET',
      headers: { Authorization: `JWT ${token}` }
    }).then(res => {
      let saldoConta = null;
      res.body.forEach(c => {
        if (c.conta === 'Conta para saldo') saldoConta =c.saldo;
      });
      expect(saldoConta).to.be.equal('4034.00');
    });
  });

  it('Remover transação', () => {
    cy.request({
      url: 'https://barrigarest.wcaquino.me/transacoes',
      method: 'GET',
      headers: { Authorization: `JWT ${token}` },
      qs: {descricao: 'Movimentacao para exclusao'}
    }).then(res=> {
      cy.request({
        url: `https://barrigarest.wcaquino.me/transacoes/${res.body[0].id}`,
        method: 'DELETE',
        headers: { Authorization: `JWT ${token}` },
      }).its('status').should('be.equal', 204)
    });  
  });
});