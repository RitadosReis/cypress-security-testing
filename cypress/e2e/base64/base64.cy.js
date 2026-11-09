describe('Base64 - Testes Funcionais e de Segurança', () => {

  // =====================================================
  // CONFIGURAÇÃO DOS DADOS DE TESTE
  // =====================================================

  // Permite informar um texto personalizado pelo terminal.
  const textoPersonalizado = Cypress.expose('textoBase64');

  // Entradas padrão para CT-001 e CT-002.
  const textos = textoPersonalizado !== undefined
    ? [String(textoPersonalizado)]
    : [
        'test',
        'Cypress',
        'Seguranca da Informacao',
        '123456789',
        'Olá, mundo!',
        'QA 🔐 Security'
      ];


  // =====================================================
  // CT-001 - CODIFICAÇÃO BASE64
  // =====================================================

  textos.forEach((texto, indice) => {

    it(`CT-001.${indice + 1} - Codificar: ${texto}`,
      { baseUrl: null }, () => {

      // Calcular o resultado Base64 esperado.
      const resultadoEsperado = Cypress.Buffer
        .from(texto, 'utf8')
        .toString('base64');

      // Acessar a aplicação segura.
      cy.visit('app/index.html');

      // Tratar também entradas personalizadas vazias.
      // O Cypress não permite utilizar .type('').
      if (texto.length === 0) {

        cy.get('[data-cy="entrada"]')
          .should('have.value', '');

      } else {

        cy.get('[data-cy="entrada"]')
          .type(texto, {
            parseSpecialCharSequences: false
          });

      }

      // Executar codificação.
      cy.get('[data-cy="codificar"]').click();

      // Validar o resultado.
      cy.get('[data-cy="resultado"]')
        .should('have.text', resultadoEsperado);

    });

  });


  // =====================================================
  // CT-002 - DECODIFICAÇÃO BASE64
  // =====================================================

  textos.forEach((texto, indice) => {

    it(`CT-002.${indice + 1} - Decodificar: ${texto}`,
      { baseUrl: null }, () => {

      // Preparar a entrada Base64.
      const textoCodificado = Cypress.Buffer
        .from(texto, 'utf8')
        .toString('base64');

      // Acessar a aplicação segura.
      cy.visit('app/index.html');

      // Base64 de uma entrada vazia também é vazio.
      if (textoCodificado.length === 0) {

        cy.get('[data-cy="entrada"]')
          .should('have.value', '');

      } else {

        cy.get('[data-cy="entrada"]')
          .type(textoCodificado, {
            parseSpecialCharSequences: false
          });

      }

      // Executar decodificação.
      cy.get('[data-cy="decodificar"]').click();

      // Validar recuperação do texto original.
      cy.get('[data-cy="resultado"]')
        .should('have.text', texto);

    });

  });


  // =====================================================
  // CT-003 - TRATAMENTO DE ENTRADAS INVÁLIDAS
  // =====================================================

  describe('CT-003 - Validação de entradas inválidas', () => {

    const entradasInvalidas = [
      {
        descricao: 'Caracteres não permitidos',
        entrada: '###'
      },
      {
        descricao: 'Comprimento inválido',
        entrada: 'a'
      },
      {
        descricao: 'Padding excessivo',
        entrada: 'dGVzdA==='
      },
      {
        descricao: 'Bytes inválidos para UTF-8',
        entrada: '/w=='
      }
    ];


    // -----------------------------------------------------
    // CT-003.1 ATÉ CT-003.4
    // VALIDAÇÃO DE ENTRADAS INVÁLIDAS
    // -----------------------------------------------------

    entradasInvalidas.forEach((cenario, indice) => {

      it(`CT-003.${indice + 1} - ${cenario.descricao}`,
        { baseUrl: null }, () => {

        // Acessar a aplicação segura.
        cy.visit('app/index.html');

        // Informar a entrada inválida.
        cy.get('[data-cy="entrada"]')
          .type(cenario.entrada, {
            parseSpecialCharSequences: false
          });

        // Tentar decodificar.
        cy.get('[data-cy="decodificar"]').click();

        // Validar a mensagem de erro controlada.
        cy.get('[data-cy="resultado"]')
          .should('have.text', 'Erro na decodificação');

      });

    });


    // -----------------------------------------------------
    // CT-003.5 - RESULTADO ANTERIOR APÓS ERRO
    // -----------------------------------------------------

    it('CT-003.5 - Não manter resultado antigo após erro',
      { baseUrl: null }, () => {

      cy.visit('app/index.html');

      // Executar uma decodificação válida.
      cy.get('[data-cy="entrada"]')
        .type('dGVzdA==');

      cy.get('[data-cy="decodificar"]').click();

      cy.get('[data-cy="resultado"]')
        .should('have.text', 'test');

      // Substituir por uma entrada inválida.
      cy.get('[data-cy="entrada"]')
        .clear()
        .type('###');

      cy.get('[data-cy="decodificar"]').click();

      // O resultado anterior deve ser substituído.
      cy.get('[data-cy="resultado"]')
        .should('have.text', 'Erro na decodificação');

    });


    // -----------------------------------------------------
    // CT-003.6 - RECUPERAÇÃO APÓS ERRO
    // -----------------------------------------------------

    it('CT-003.6 - Recuperar funcionamento após entrada inválida',
      { baseUrl: null }, () => {

      cy.visit('app/index.html');

      // Executar uma entrada inválida.
      cy.get('[data-cy="entrada"]')
        .type('###');

      cy.get('[data-cy="decodificar"]').click();

      cy.get('[data-cy="resultado"]')
        .should('have.text', 'Erro na decodificação');

      // Informar uma nova entrada válida.
      cy.get('[data-cy="entrada"]')
        .clear()
        .type('Q3lwcmVzcw==');

      cy.get('[data-cy="decodificar"]').click();

      // Verificar a recuperação funcional.
      cy.get('[data-cy="resultado"]')
        .should('have.text', 'Cypress');

    });

  });


  // =====================================================
  // CT-004 - CARACTERES ESPECIAIS E UNICODE
  // =====================================================

  describe('CT-004 - Integridade de caracteres Unicode', () => {

    const entradasUnicode = [
      {
        descricao: 'Caracteres acentuados',
        texto: 'Árvore, ação e coração'
      },
      {
        descricao: 'Caracteres chineses',
        texto: '你好，世界'
      },
      {
        descricao: 'Caracteres árabes',
        texto: 'مرحبا بالعالم'
      },
      {
        descricao: 'Emojis e caracteres multibyte',
        texto: 'QA 🔐🚀'
      },
      {
        descricao: 'Acento Unicode combinante',
        texto: 'Cafe\u0301',
        entradaExata: true
      },
      {
        descricao: 'Símbolos especiais',
        texto: 'Preço: € 10 © ™'
      },
      {
        descricao: 'Caractere invisível',
        texto: 'A\u200BB',
        entradaExata: true
      }
    ];


    // -----------------------------------------------------
    // CT-004.1 ATÉ CT-004.7
    // CODIFICAÇÃO E DECODIFICAÇÃO UNICODE
    // -----------------------------------------------------

    entradasUnicode.forEach((cenario, indice) => {

      it(`CT-004.${indice + 1} - ${cenario.descricao}`,
        { baseUrl: null }, () => {

        const textoOriginal = cenario.texto;

        // Calcular o resultado Base64 esperado.
        const base64Esperado = Cypress.Buffer
          .from(textoOriginal, 'utf8')
          .toString('base64');

        // Acessar a aplicação segura.
        cy.visit('app/index.html');

        // Preencher o campo preservando Unicode.
        if (cenario.entradaExata) {

          cy.get('[data-cy="entrada"]')
            .invoke('val', textoOriginal)
            .trigger('input');

        } else {

          cy.get('[data-cy="entrada"]')
            .type(textoOriginal, {
              parseSpecialCharSequences: false
            });

        }

        // Confirmar a integridade da entrada.
        cy.get('[data-cy="entrada"]')
          .should('have.value', textoOriginal);

        // Executar codificação.
        cy.get('[data-cy="codificar"]').click();

        // Validar o Base64 produzido.
        cy.get('[data-cy="resultado"]')
          .should('have.text', base64Esperado);

        // Substituir a entrada pelo Base64.
        cy.get('[data-cy="entrada"]')
          .clear()
          .type(base64Esperado, {
            parseSpecialCharSequences: false
          });

        // Executar decodificação.
        cy.get('[data-cy="decodificar"]').click();

        // Validar recuperação exata do texto original.
        cy.get('[data-cy="resultado"]')
          .should('have.text', textoOriginal);

      });

    });


    // -----------------------------------------------------
    // CT-004.8 - NORMALIZAÇÃO UNICODE NFC E NFD
    // -----------------------------------------------------

    it('CT-004.8 - Diferenciar Unicode NFC e NFD',
      { baseUrl: null }, () => {

      const textoNFC = 'Café';
      const textoNFD = 'Cafe\u0301';

      // Calcular as representações Base64.
      const base64NFC = Cypress.Buffer
        .from(textoNFC, 'utf8')
        .toString('base64');

      const base64NFD = Cypress.Buffer
        .from(textoNFD, 'utf8')
        .toString('base64');

      // As sequências originais são diferentes.
      expect(textoNFC).not.to.equal(textoNFD);

      // Após normalização NFC, tornam-se equivalentes.
      expect(textoNFC.normalize('NFC'))
        .to.equal(textoNFD.normalize('NFC'));

      // As representações Base64 originais são diferentes.
      expect(base64NFC).not.to.equal(base64NFD);

      // Acessar a aplicação segura.
      cy.visit('app/index.html');

      // Codificar a representação NFC.
      cy.get('[data-cy="entrada"]')
        .type(textoNFC);

      cy.get('[data-cy="codificar"]').click();

      cy.get('[data-cy="resultado"]')
        .should('have.text', base64NFC);

      // Substituir pela representação NFD.
      cy.get('[data-cy="entrada"]')
        .invoke('val', textoNFD)
        .trigger('input');

      // Confirmar a entrada NFD.
      cy.get('[data-cy="entrada"]')
        .should('have.value', textoNFD);

      // Executar codificação NFD.
      cy.get('[data-cy="codificar"]').click();

      // Validar o resultado correspondente.
      cy.get('[data-cy="resultado"]')
        .should('have.text', base64NFD);

    });

  });


  // =====================================================
  // CT-005 - TRATAMENTO SEGURO DE HTML E XSS
  // =====================================================

  describe('CT-005 - Prevenção de interpretação HTML e XSS', () => {

    const entradasHTML = [
      {
        descricao: 'Tag HTML strong',
        conteudo: '<strong>QA Security</strong>'
      },
      {
        descricao: 'Imagem com evento onerror',
        conteudo: '<img src="imagem-inexistente.png" onerror="window.__xssExecutado=true">'
      },
      {
        descricao: 'SVG com evento onload',
        conteudo: '<svg onload="window.__xssExecutado=true"></svg>'
      },
      {
        descricao: 'Tag script',
        conteudo: '<script>window.__xssExecutado=true</script>'
      },
      {
        descricao: 'Iframe com srcdoc',
        conteudo: '<iframe srcdoc="<p>Teste</p>"></iframe>'
      },
      {
        descricao: 'Entidades HTML e tags aninhadas',
        conteudo: '&lt;b&gt;teste&lt;/b&gt;<div><em>Conteúdo</em></div>'
      }
    ];


    // -----------------------------------------------------
    // CT-005.1 ATÉ CT-005.6
    // VALIDAR PROTEÇÃO CONTRA INTERPRETAÇÃO HTML
    // -----------------------------------------------------

    entradasHTML.forEach((cenario, indice) => {

      it(`CT-005.${indice + 1} - ${cenario.descricao}`,
        { baseUrl: null }, () => {

        // Preparar o conteúdo codificado em Base64.
        const entradaBase64 = Cypress.Buffer
          .from(cenario.conteudo, 'utf8')
          .toString('base64');

        // Acessar exclusivamente a aplicação segura.
        cy.visit('app/index.html');

        // Confirmar a versão carregada.
        cy.title()
          .should('eq', 'Laboratório Base64 - Versão Segura');

        // Criar indicador de execução indevida.
        cy.window().then((win) => {
          win.__xssExecutado = false;
        });

        // Informar o conteúdo codificado.
        cy.get('[data-cy="entrada"]')
          .type(entradaBase64, {
            parseSpecialCharSequences: false
          });

        // Executar decodificação.
        cy.get('[data-cy="decodificar"]').click();

        // O resultado deve preservar o texto literal.
        cy.get('[data-cy="resultado"]')
          .should('have.text', cenario.conteudo);

        // Nenhum elemento HTML deve ser criado.
        cy.get('[data-cy="resultado"]')
          .find('*')
          .should('not.exist');

        // O indicador de execução deve permanecer falso.
        cy.window()
          .its('__xssExecutado')
          .should('eq', false);

      });

    });

  });


  // =====================================================
  // CT-006 - EXPOSIÇÃO DE INFORMAÇÕES SENSÍVEIS
  // =====================================================

  describe('CT-006 - Exposição de informações sensíveis', () => {

    // Credencial exclusivamente fictícia.
    const segredoFicticio =
      'CT006_CREDENCIAL_FICTICIA_42';

    const segredoBase64 = Cypress.Buffer
      .from(segredoFicticio, 'utf8')
      .toString('base64');

    // Chave utilizada pelo laboratório vulnerável.
    const nomeChave = 'ct006_credencial_simulada';

    // Ativar simulação de regressão pelo terminal.
    const simularRegressao =
      String(Cypress.expose('simularRegressaoExposicao')) === 'true';


    // -----------------------------------------------------
    // FUNÇÃO AUXILIAR - CODIFICAÇÃO DA CREDENCIAL
    // -----------------------------------------------------

    function codificarCredencial() {

      cy.get('[data-cy="entrada"]')
        .type(segredoFicticio, {
          parseSpecialCharSequences: false
        });

      cy.get('[data-cy="codificar"]').click();

      cy.get('[data-cy="resultado"]')
        .should('have.text', segredoBase64);

    }


    // -----------------------------------------------------
    // FUNÇÃO AUXILIAR - INSPEÇÃO DE ARMAZENAMENTO
    // -----------------------------------------------------

    function valoresArmazenados(storage) {

      return Array.from(
        { length: storage.length },
        (_, indice) => storage.key(indice)
      )
        .map((chave) => `${chave}=${storage.getItem(chave)}`)
        .join('\n');

    }


    // -----------------------------------------------------
    // CT-006.1 - REVERSIBILIDADE BASE64
    // -----------------------------------------------------

    it('CT-006.1 - Base64 permite recuperar credencial fictícia',
      { baseUrl: null }, () => {

      cy.visit('app/index.html');

      codificarCredencial();

      // Recuperar o resultado apresentado.
      cy.get('[data-cy="resultado"]')
        .invoke('text')
        .then((valorCodificado) => {

          // Recuperar o conteúdo sem chave secreta.
          const recuperado = Cypress.Buffer
            .from(valorCodificado, 'base64')
            .toString('utf8');

          expect(recuperado)
            .to.equal(segredoFicticio);

        });

    });


    // -----------------------------------------------------
    // CT-006.2 - LOCAL STORAGE
    // -----------------------------------------------------

    it('CT-006.2 - Não armazenar credencial no Local Storage',
      { baseUrl: null }, () => {

      // Na simulação de regressão, o mesmo teste
      // será executado contra a aplicação vulnerável.
      const pagina = simularRegressao
        ? 'app/index-exposure.html'
        : 'app/index.html';

      const titulo = simularRegressao
        ? 'Laboratório Base64 - Exposição Intencional'
        : 'Laboratório Base64 - Versão Segura';

      cy.visit(pagina);

      cy.title()
        .should('eq', titulo);

      codificarCredencial();

      // Inspecionar o armazenamento.
      cy.window().then((win) => {

        const conteudoArmazenado =
          valoresArmazenados(win.localStorage);

        // Nem o texto original nem o Base64
        // devem estar armazenados na aplicação segura.
        expect(conteudoArmazenado)
          .not.to.include(segredoFicticio);

        expect(conteudoArmazenado)
          .not.to.include(segredoBase64);

      });

    });


    // -----------------------------------------------------
    // CT-006.3 - SESSION STORAGE
    // -----------------------------------------------------

    it('CT-006.3 - Não armazenar credencial no Session Storage',
      { baseUrl: null }, () => {

      cy.visit('app/index.html');

      codificarCredencial();

      cy.window().then((win) => {

        const conteudoArmazenado =
          valoresArmazenados(win.sessionStorage);

        expect(conteudoArmazenado)
          .not.to.include(segredoFicticio);

        expect(conteudoArmazenado)
          .not.to.include(segredoBase64);

      });

    });


    // -----------------------------------------------------
    // CT-006.4 - EXPOSIÇÃO NA URL
    // -----------------------------------------------------

    it('CT-006.4 - Não incluir credencial na URL',
      { baseUrl: null }, () => {

      cy.visit('app/index.html');

      codificarCredencial();

      // Analisar a URL após o processamento.
      cy.location('href').then((url) => {

        expect(url)
          .not.to.include(segredoFicticio);

        expect(url)
          .not.to.include(segredoBase64);

      });

    });


    // -----------------------------------------------------
    // CT-006.5 - ARMAZENAMENTO VULNERÁVEL
    // -----------------------------------------------------

    it('CT-006.5 - Confirmar armazenamento inseguro',
      { baseUrl: null }, () => {

      // Acessar laboratório intencionalmente inseguro.
      cy.visit('app/index-exposure.html');

      cy.title()
        .should(
          'eq',
          'Laboratório Base64 - Exposição Intencional'
        );

      codificarCredencial();

      // Confirmar armazenamento do Base64.
      cy.window().then((win) => {

        expect(
          win.localStorage.getItem(nomeChave)
        ).to.equal(segredoBase64);

      });

    });


    // -----------------------------------------------------
    // CT-006.6 - RECUPERAÇÃO DA CREDENCIAL EXPOSTA
    // -----------------------------------------------------

    it('CT-006.6 - Recuperar credencial fictícia armazenada',
      { baseUrl: null }, () => {

      cy.visit('app/index-exposure.html');

      codificarCredencial();

      cy.window().then((win) => {

        // Simular leitura por JavaScript da mesma origem.
        const valorArmazenado =
          win.localStorage.getItem(nomeChave);

        expect(valorArmazenado)
          .to.be.a('string');

        // A credencial fictícia contém apenas ASCII.
        const textoRecuperado =
          win.atob(valorArmazenado);

        // Confirmar recuperação sem chave secreta.
        expect(textoRecuperado)
          .to.equal(segredoFicticio);

      });

    });

  });


  // =====================================================
  // CT-007 - PROCESSAMENTO DE ENTRADAS EXTENSAS
  // =====================================================

  describe('CT-007 - Integridade e robustez de entradas extensas', () => {

    // -----------------------------------------------------
    // DADOS DE TESTE
    // -----------------------------------------------------

    const cenarios = [
      {
        id: 'CT-007.1',
        descricao: 'Entrada vazia',
        texto: ''
      },
      {
        id: 'CT-007.2',
        descricao: 'Entrada ASCII de 1 KiB',
        texto: 'A'.repeat(1024)
      },
      {
        id: 'CT-007.3',
        descricao: 'Unicode de 16 KiB',
        texto: 'á🔐'.repeat(2730) + 'ABCD'
      },
      {
        id: 'CT-007.4',
        descricao: 'Entrada repetitiva de 64 KiB',
        texto: 'ABCD'.repeat(16 * 1024)
      },
      {
        id: 'CT-007.5',
        descricao: 'Entrada de 128 KiB',
        texto: 'Z'.repeat(128 * 1024)
      }
    ];


    // -----------------------------------------------------
    // FUNÇÃO AUXILIAR - PREENCHIMENTO DE ENTRADA
    // -----------------------------------------------------

    function preencherEntrada(texto) {

      // Inserir diretamente o valor no campo.
      cy.get('[data-cy="entrada"]')
        .then(($campo) => {

          $campo.val(texto);
          $campo.trigger('input');

        });

      // Confirmar a integridade do campo.
      cy.get('[data-cy="entrada"]')
        .invoke('val')
        .then((valorObtido) => {

          expect(
            valorObtido === texto,
            'Integridade do campo de entrada'
          ).to.equal(true);

        });

    }


    // -----------------------------------------------------
    // CT-007.1 ATÉ CT-007.5
    // CODIFICAÇÃO E DECODIFICAÇÃO DE ENTRADAS EXTENSAS
    // -----------------------------------------------------

    cenarios.forEach((cenario) => {

      it(`${cenario.id} - ${cenario.descricao}`,
        { baseUrl: null }, () => {

        const textoOriginal = cenario.texto;

        // Calcular o Base64 esperado.
        const base64Esperado = Cypress.Buffer
          .from(textoOriginal, 'utf8')
          .toString('base64');

        // Calcular o tamanho em bytes UTF-8.
        const tamanhoBytes = Cypress.Buffer
          .byteLength(textoOriginal, 'utf8');

        // Registrar volumes sem imprimir todo o conteúdo.
        cy.log(`Entrada: ${tamanhoBytes} bytes`);
        cy.log(`Base64: ${base64Esperado.length} caracteres`);


        // -----------------------------------------------
        // ETAPA 1 - ACESSAR A APLICAÇÃO SEGURA
        // -----------------------------------------------

        cy.visit('app/index.html');

        cy.title()
          .should('eq', 'Laboratório Base64 - Versão Segura');


        // -----------------------------------------------
        // ETAPA 2 - CODIFICAÇÃO
        // -----------------------------------------------

        preencherEntrada(textoOriginal);

        cy.get('[data-cy="codificar"]').click();

        // Validar comprimento e conteúdo exatos.
        cy.get('[data-cy="resultado"]')
          .invoke('text')
          .then((resultado) => {

            expect(
              resultado.length,
              'Comprimento da saída Base64'
            ).to.equal(base64Esperado.length);

            expect(
              resultado === base64Esperado,
              'Integridade da codificação'
            ).to.equal(true);

          });


        // -----------------------------------------------
        // ETAPA 3 - DECODIFICAÇÃO
        // -----------------------------------------------

        preencherEntrada(base64Esperado);

        cy.get('[data-cy="decodificar"]').click();

        // Validar recuperação integral do texto.
        cy.get('[data-cy="resultado"]')
          .invoke('text')
          .then((resultado) => {

            expect(
              resultado.length,
              'Comprimento do texto recuperado'
            ).to.equal(textoOriginal.length);

            expect(
              resultado === textoOriginal,
              'Integridade da decodificação'
            ).to.equal(true);

          });

      });

    });


    // -----------------------------------------------------
    // CT-007.6 - RECUPERAÇÃO APÓS ENTRADA EXTENSA
    // -----------------------------------------------------

    it('CT-007.6 - Recuperar funcionamento após entrada extensa',
      { baseUrl: null }, () => {

      const textoGrande = 'L'.repeat(64 * 1024);

      const base64Grande = Cypress.Buffer
        .from(textoGrande, 'utf8')
        .toString('base64');

      cy.visit('app/index.html');


      // -----------------------------------------------
      // ETAPA 1 - PROCESSAR ENTRADA EXTENSA
      // -----------------------------------------------

      preencherEntrada(textoGrande);

      cy.get('[data-cy="codificar"]').click();

      cy.get('[data-cy="resultado"]')
        .invoke('text')
        .then((resultado) => {

          expect(
            resultado === base64Grande,
            'Resultado da entrada extensa'
          ).to.equal(true);

        });


      // -----------------------------------------------
      // ETAPA 2 - PROCESSAR ENTRADA INVÁLIDA
      // -----------------------------------------------

      preencherEntrada('###');

      cy.get('[data-cy="decodificar"]').click();

      cy.get('[data-cy="resultado"]')
        .should('have.text', 'Erro na decodificação');


      // -----------------------------------------------
      // ETAPA 3 - PROCESSAR ENTRADA PEQUENA
      // -----------------------------------------------

      preencherEntrada('OK');

      cy.get('[data-cy="codificar"]').click();

      cy.get('[data-cy="resultado"]')
        .should('have.text', 'T0s=');

    });

  });


  // =====================================================
  // CT-008 - PERSISTÊNCIA DE DADOS NO NAVEGADOR
  // =====================================================

  describe('CT-008 - Persistência de dados no navegador',
    { testIsolation: true }, () => {

    // -----------------------------------------------------
    // CONFIGURAÇÃO DOS DADOS FICTÍCIOS
    // -----------------------------------------------------

    const credencialFicticia =
      'CT008_CREDENCIAL_FICTICIA_42';

    const credencialBase64 = Cypress.Buffer
      .from(credencialFicticia, 'utf8')
      .toString('base64');

    // Chave utilizada pela aplicação vulnerável.
    const chaveExposicao = 'ct006_credencial_simulada';

    // Dados utilizados exclusivamente no teste de sessão.
    const chaveSessao = 'ct008_marcador_de_sessao';
    const marcadorSessao = 'CT008_MARCADOR_FICTICIO';


    // -----------------------------------------------------
    // FUNÇÃO AUXILIAR - CODIFICAR CREDENCIAL
    // -----------------------------------------------------

    function codificarCredencial() {

      cy.get('[data-cy="entrada"]')
        .type(credencialFicticia, {
          parseSpecialCharSequences: false
        });

      cy.get('[data-cy="codificar"]').click();

      cy.get('[data-cy="resultado"]')
        .should('have.text', credencialBase64);

    }


    // -----------------------------------------------------
    // FUNÇÃO AUXILIAR - INSPECIONAR ARMAZENAMENTO
    // -----------------------------------------------------

    function contemCredencial(storage) {

      for (let i = 0; i < storage.length; i += 1) {

        const chave = storage.key(i) || '';
        const valor = storage.getItem(chave) || '';

        // Verificar chaves e valores armazenados.
        const encontrado = [chave, valor].some((item) =>
          item.includes(credencialFicticia) ||
          item.includes(credencialBase64)
        );

        if (encontrado) {
          return true;
        }

      }

      return false;

    }


    // -----------------------------------------------------
    // CT-008.1 - RESULTADO APÓS RECARREGAMENTO
    // -----------------------------------------------------

    it('CT-008.1 - Não reexibir resultado após recarregamento',
      { baseUrl: null }, () => {

      // Acessar a aplicação segura.
      cy.visit('app/index.html');

      // Codificar a credencial fictícia.
      codificarCredencial();

      // Recarregar a página.
      cy.reload();

      // O resultado anterior não deve reaparecer.
      cy.get('[data-cy="resultado"]')
        .should('have.text', '');

    });


    // -----------------------------------------------------
    // CT-008.2 - LOCAL STORAGE ANTES E DEPOIS DA RECARGA
    // -----------------------------------------------------

    it('CT-008.2 - Não persistir credencial no Local Storage da aplicação segura',
      { baseUrl: null }, () => {

      cy.visit('app/index.html');

      codificarCredencial();

      // Verificar se a credencial foi exposta
      // imediatamente após a codificação.
      cy.window().then((win) => {

        expect(
          contemCredencial(win.localStorage),
          'Credencial ausente do Local Storage antes da recarga'
        ).to.equal(false);

      });

      // Recarregar a página.
      cy.reload();

      // Inspecionar novamente o Local Storage.
      cy.window().then((win) => {

        expect(
          contemCredencial(win.localStorage),
          'Credencial ausente do Local Storage após a recarga'
        ).to.equal(false);

      });

    });


    // -----------------------------------------------------
    // CT-008.3 - SESSION STORAGE ANTES E DEPOIS DA RECARGA
    // -----------------------------------------------------

    it('CT-008.3 - Não persistir credencial no Session Storage da aplicação segura',
      { baseUrl: null }, () => {

      cy.visit('app/index.html');

      codificarCredencial();

      // Verificar se a credencial foi exposta
      // imediatamente após a codificação.
      cy.window().then((win) => {

        expect(
          contemCredencial(win.sessionStorage),
          'Credencial ausente do Session Storage antes da recarga'
        ).to.equal(false);

      });

      // Recarregar a página.
      cy.reload();

      // Inspecionar novamente o Session Storage.
      cy.window().then((win) => {

        expect(
          contemCredencial(win.sessionStorage),
          'Credencial ausente do Session Storage após a recarga'
        ).to.equal(false);

      });

    });


    // -----------------------------------------------------
    // CT-008.4 - PERSISTÊNCIA NA VERSÃO VULNERÁVEL
    // -----------------------------------------------------

    it('CT-008.4 - Comprovar persistência no Local Storage após recarga',
      { baseUrl: null }, () => {

      // Acessar o laboratório vulnerável.
      cy.visit('app/index-exposure.html');

      cy.title()
        .should(
          'eq',
          'Laboratório Base64 - Exposição Intencional'
        );

      // Codificar e armazenar a credencial fictícia.
      codificarCredencial();

      // Confirmar o armazenamento inicial.
      cy.window().then((win) => {

        expect(
          win.localStorage.getItem(chaveExposicao)
        ).to.equal(credencialBase64);

      });

      // Recarregar a aplicação.
      cy.reload();

      // Confirmar que o dado continua armazenado.
      cy.window().then((win) => {

        expect(
          win.localStorage.getItem(chaveExposicao)
        ).to.equal(credencialBase64);

      });

    });


    // -----------------------------------------------------
    // CT-008.5 - NAVEGAÇÃO NA MESMA ORIGEM
    // -----------------------------------------------------

    it('CT-008.5 - Comprovar persistência ao navegar na mesma origem',
      { baseUrl: null }, () => {

      // Acessar a aplicação intencionalmente vulnerável.
      cy.visit('app/index-exposure.html');

      // Armazenar a credencial fictícia.
      codificarCredencial();

      // Navegar para a aplicação segura.
      cy.visit('app/index.html');

      cy.title()
        .should(
          'eq',
          'Laboratório Base64 - Versão Segura'
        );

      // O dado permanece disponível na mesma origem.
      cy.window().then((win) => {

        expect(
          win.localStorage.getItem(chaveExposicao)
        ).to.equal(credencialBase64);

      });

    });


    // -----------------------------------------------------
    // CT-008.6 - PERSISTÊNCIA E REMOÇÃO DE SESSION STORAGE
    // -----------------------------------------------------

    it('CT-008.6 - Demonstrar persistência e remoção de Session Storage',
      { baseUrl: null }, () => {

      // Acessar a aplicação segura.
      cy.visit('app/index.html');

      // Inserir marcador exclusivamente fictício
      // para demonstrar o comportamento do navegador.
      cy.window().then((win) => {

        win.sessionStorage.setItem(
          chaveSessao,
          marcadorSessao
        );

        // Confirmar o armazenamento inicial.
        expect(
          win.sessionStorage.getItem(chaveSessao)
        ).to.equal(marcadorSessao);

      });

      // Recarregar a página.
      cy.reload();

      cy.window().then((win) => {

        // O marcador deve continuar armazenado.
        expect(
          win.sessionStorage.getItem(chaveSessao)
        ).to.equal(marcadorSessao);

        // Remover explicitamente o marcador.
        win.sessionStorage.removeItem(chaveSessao);

        // Confirmar que foi removido.
        expect(
          win.sessionStorage.getItem(chaveSessao)
        ).to.equal(null);

      });

    });

  });

});
