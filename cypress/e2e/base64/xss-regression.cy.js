describe('CT-005 - Experimento de Regressão de Segurança XSS', () => {

  // =====================================================
  // CONFIGURAÇÃO DO EXPERIMENTO
  // =====================================================

  // Permite ativar a simulação pelo terminal
  const simularRegressao =
    String(Cypress.expose('simularRegressaoXss')) === 'true';

  // Selecionar a aplicação que será avaliada no R1
  const paginaSobTeste = simularRegressao
    ? 'app/index-vulnerable.html'
    : 'app/index.html';

  // Título esperado para cada versão
  const tituloEsperado = simularRegressao
    ? 'Laboratório Base64 - Versão Vulnerável'
    : 'Laboratório Base64 - Versão Segura';


  // =====================================================
  // PAYLOAD DE XSS CONTROLADO
  // =====================================================

  // Não envia informações para servidores externos.
  // Apenas altera uma variável quando executado.

  const payload =
    '<img src="imagem-xss-inexistente.png" ' +
    'onerror="window.__xssExecutado = true">';

  // Preparar o payload em Base64
  const payloadBase64 = Cypress.Buffer
    .from(payload, 'utf8')
    .toString('base64');


  // =====================================================
  // FUNÇÃO REUTILIZÁVEL
  // =====================================================

  function executarDecodificacao() {

    // Inicializar indicador de execução de JavaScript
    cy.window().then((win) => {
      win.__xssExecutado = false;
    });

    // Informar payload codificado em Base64
    cy.get('[data-cy="entrada"]')
      .type(payloadBase64, {
        parseSpecialCharSequences: false
      });

    // Executar decodificação
    cy.get('[data-cy="decodificar"]').click();

  }


  // =====================================================
  // CT-005.R1 - VALIDAR PROTEÇÃO CONTRA XSS
  // =====================================================

  it('CT-005.R1 - Deve impedir interpretação HTML e execução XSS',
    { baseUrl: null }, () => {

    // Acessar a versão selecionada
    cy.visit(paginaSobTeste);

    // Confirmar que a página correta foi carregada
    cy.title()
      .should('eq', tituloEsperado);

    // Executar decodificação do payload
    executarDecodificacao();

    // Verificar que não foi criado elemento de imagem
    cy.get('[data-cy="resultado"]')
      .find('img')
      .should('not.exist');

    // Verificar que o conteúdo permaneceu como texto
    cy.get('[data-cy="resultado"]')
      .should('have.text', payload);

    // Confirmar ausência de execução JavaScript
    cy.window()
      .its('__xssExecutado')
      .should('eq', false);

  });


  // =====================================================
  // CT-005.R2 - CONFIRMAR VULNERABILIDADE CONTROLADA
  // =====================================================

  it('CT-005.R2 - Deve identificar XSS na versão vulnerável',
    { baseUrl: null }, () => {

    // Acessar exclusivamente a versão vulnerável
    cy.visit('app/index-vulnerable.html');

    // Confirmar que a versão vulnerável foi carregada
    cy.title()
      .should('eq', 'Laboratório Base64 - Versão Vulnerável');

    // Executar decodificação do payload
    executarDecodificacao();

    // Confirmar que o HTML foi interpretado
    cy.get('[data-cy="resultado"]')
      .find('img')
      .should('exist');

    // Confirmar execução do manipulador onerror
    cy.window()
      .its('__xssExecutado')
      .should('eq', true);

  });

});
