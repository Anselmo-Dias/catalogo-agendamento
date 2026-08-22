/* ==========================================================================
   RAMU Cartomância — agendamento das consultas
   Usado pelo catálogo (index.html) e pelo link na bio (index.html na raiz).

   A página só precisa de um botão com data-escolha="pombogira|buzios".
   Ao clicar: abre a escolha de modalidade e, depois, a agenda do Cal.com.

   Para trocar um tipo de evento do Cal.com, mexa apenas em CONSULTAS.
   ========================================================================== */
(function () {
  'use strict';

  var CONSULTAS = {
    pombogira: {
      nome: 'Baralho Pombogira',
      opcoes: [
        { modo: 'Online',     detalhe: 'Por chamada de vídeo', preco: 'R$ 207',
          link: 'eu-ramu-adbzcd/baralho-pombogira-online',     ns: 'baralho-pombogira-online' },
        { modo: 'Presencial', detalhe: 'Em Aracaju – SE',      preco: 'R$ 257',
          link: 'eu-ramu-adbzcd/baralho-pombogira-presencial', ns: 'baralho-pombogira-presencial' }
      ]
    },
    buzios: {
      nome: 'Jogo de Búzios',
      opcoes: [
        { modo: 'Online',     detalhe: 'Por chamada de vídeo', preco: 'R$ 200',
          link: 'eu-ramu-adbzcd/jogo-de-buzios-online',        ns: 'jogo-de-buzios-online' },
        { modo: 'Presencial', detalhe: 'Em Aracaju – SE',      preco: 'R$ 250',
          link: 'eu-ramu-adbzcd/jogo-de-buzios-presencial',    ns: 'jogo-de-buzios-presencial' }
      ]
    }
  };

  var CONFIG_CAL = { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' };

  var todas = [];
  Object.keys(CONSULTAS).forEach(function (chave) {
    CONSULTAS[chave].opcoes.forEach(function (o) { todas.push(o); });
  });

  /* --- Gatilhos ocultos ----------------------------------------------------
     O embed do Cal.com abre a agenda ao clicar num elemento que carrega os
     data-cal-*. Cada modalidade ganha o seu, escondido; quem os aciona é a
     escolha de modalidade. Precisam existir antes do embed.js carregar.
     ------------------------------------------------------------------------ */
  var caixa = document.createElement('div');
  caixa.hidden = true;

  todas.forEach(function (opcao) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-cal-link', opcao.link);
    b.setAttribute('data-cal-namespace', opcao.ns);
    b.setAttribute('data-cal-config', JSON.stringify(CONFIG_CAL));
    opcao.gatilho = b;
    caixa.appendChild(b);
  });
  document.body.appendChild(caixa);

  /* --- Embed do Cal.com ---------------------------------------------------- */
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal.config = Cal.config || {};
  Cal.config.forwardQueryParams = true;

  todas.forEach(function (opcao) {
    Cal('init', opcao.ns, { origin: 'https://app.cal.com' });
    Cal.ns[opcao.ns]('ui', { hideEventTypeDetails: false, layout: 'month_view' });
  });

  /* --- Escolha de modalidade ----------------------------------------------- */
  var dialogo = document.createElement('dialog');
  dialogo.className = 'escolha';
  dialogo.setAttribute('aria-labelledby', 'escolha-titulo');
  dialogo.innerHTML =
    '<div class="escolha-cabeca">' +
      '<span class="rotulo">Escolha a modalidade</span>' +
      '<h2 id="escolha-titulo"></h2>' +
      '<button class="escolha-fechar" type="button" data-fechar aria-label="Fechar">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
          '<path d="M6 6l12 12M18 6L6 18"/>' +
        '</svg>' +
      '</button>' +
    '</div>' +
    '<div class="escolha-opcoes"></div>';
  document.body.appendChild(dialogo);

  var titulo = dialogo.querySelector('#escolha-titulo');
  var lista = dialogo.querySelector('.escolha-opcoes');
  var ultimoFoco = null;

  function abrir(chave, origem) {
    var servico = CONSULTAS[chave];
    if (!servico) return;

    ultimoFoco = origem;
    titulo.textContent = servico.nome;
    lista.textContent = '';

    servico.opcoes.forEach(function (opcao) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'escolha-opcao';
      item.innerHTML =
        '<span class="escolha-linha">' +
          '<span class="escolha-modo"></span>' +
          '<span class="escolha-preco"></span>' +
        '</span>' +
        '<span class="escolha-detalhe"></span>';
      item.querySelector('.escolha-modo').textContent = opcao.modo;
      item.querySelector('.escolha-preco').textContent = opcao.preco;
      item.querySelector('.escolha-detalhe').textContent = opcao.detalhe;

      item.addEventListener('click', function () {
        dialogo.close();
        opcao.gatilho.click();
      });

      lista.appendChild(item);
    });

    dialogo.showModal();
  }

  // Delegação: pega tambem os botoes que a pagina criar depois.
  document.addEventListener('click', function (e) {
    var botao = e.target.closest('[data-escolha]');
    if (botao) abrir(botao.getAttribute('data-escolha'), botao);
  });

  dialogo.querySelector('[data-fechar]').addEventListener('click', function () { dialogo.close(); });

  // clique fora do painel fecha
  dialogo.addEventListener('click', function (e) {
    if (e.target === dialogo) dialogo.close();
  });

  // devolve o foco ao botão de origem
  dialogo.addEventListener('close', function () { if (ultimoFoco) ultimoFoco.focus(); });
})();
