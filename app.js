/* ==========================================================================
   Ramu — link na bio
   Sem dependências. Vídeos e mapa só carregam quando o visitante pede.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     CONFIGURAÇÃO — é só editar este bloco
     ====================================================================== */
  var CONFIG = {
    // Catálogo de serviços: hoje fica na pasta servicos/, ao lado do link na bio.
    // Se um dia ele virar domínio próprio, é só trocar pela URL completa —
    // o código detecta o https:// e passa a abrir em nova aba sozinho.
    catalogo: 'servicos/index.html',

    // Índice do atendimento padrão na lista abaixo.
    lojaPrincipal: 0,

    // Horário: 0 = domingo … 6 = sábado. [abre, fecha] em horas. null = fechado.
    // O texto exibido na página é montado a partir daqui — mude só neste lugar.
    // Atendimento 13h às 23h. Sem atendimento às quartas (3) e domingos (0).
    horario: { 0: null, 1: [13, 23], 2: [13, 23], 3: null, 4: [13, 23], 5: [13, 23], 6: [13, 23] },

    // Local de atendimento. whatsapp = só dígitos: 55 + DDD + número.
    // Para voltar a ter mais de um endereço, basta acrescentar outro objeto aqui.
    lojas: [
      {
        nome: 'WhatsApp',
        whatsapp: '5579999171874',
        telefone: '(79) 99917-1874',
        endereco: 'Rua Dois, 121 — Santa Maria<br />Aracaju/SE',
        query: 'Rua Dois, 121 - Santa Maria, Aracaju - SE'
      }
    ]
  };
  /* ====================================================================== */

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function abrir(url) { window.open(url, '_blank', 'noopener'); }

  /* --- WhatsApp ------------------------------------------------------------
     data-wa="mensagem"          → vai para a loja principal
     data-wa-loja="0|1"          → vai para aquela loja
     -------------------------------------------------------------------------- */
  function loja(i) {
    return CONFIG.lojas[i] || CONFIG.lojas[CONFIG.lojaPrincipal] || CONFIG.lojas[0];
  }

  function waLink(msg, iLoja) {
    return 'https://wa.me/' + loja(iLoja).whatsapp + '?text=' + encodeURIComponent(msg || 'Olá!');
  }

  $$('[data-wa]').forEach(function (el) {
    var alvo = el.hasAttribute('data-wa-loja')
      ? parseInt(el.getAttribute('data-wa-loja'), 10)
      : CONFIG.lojaPrincipal;
    var url = waLink(el.getAttribute('data-wa'), alvo);
    if (el.tagName === 'A') {
      el.href = url;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    } else {
      el.addEventListener('click', function () { abrir(url); });
    }
  });

  /* --- Preenche nome e telefone de cada loja nos links -------------------- */
  $$('[data-loja-nome]').forEach(function (el) {
    el.textContent = loja(parseInt(el.getAttribute('data-loja-nome'), 10)).nome;
  });
  $$('[data-loja-fone]').forEach(function (el) {
    var l = loja(parseInt(el.getAttribute('data-loja-fone'), 10));
    el.textContent = 'Fale direto • ' + l.telefone;
  });

  /* --- Link do catálogo --------------------------------------------------- */
  (function catalogo() {
    var externo = /^https?:\/\//i.test(CONFIG.catalogo);

    // data-catalogo="" vai para o catalogo; data-catalogo="#servico-x" vai
    // direto para aquele card. Assim so o CONFIG.catalogo precisa ser mantido.
    $$('[data-catalogo]').forEach(function (el) {
      el.href = CONFIG.catalogo + el.getAttribute('data-catalogo');
      // Link externo abre em nova aba; caminho interno abre na mesma.
      if (externo) {
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
    });
  })();

  /* --- Abas: links x serviços ---------------------------------------------
     O painel de serviços é uma segunda "tela" da mesma página. #servicos na
     URL já abre nele — serve para linkar direto da bio.
     ------------------------------------------------------------------------ */
  (function abas() {
    var abas = $$('.abas [role="tab"]');
    if (!abas.length) return;

    var trilho = abas[0].closest('.abas');

    function mostrar(aba, focar) {
      // Posicao da pilula deslizante fica no container, via data-ativa.
      if (trilho) trilho.setAttribute('data-ativa', String(abas.indexOf(aba)));

      abas.forEach(function (t) {
        var ativa = t === aba;
        t.classList.toggle('is-on', ativa);
        t.setAttribute('aria-selected', ativa ? 'true' : 'false');
        // Só a aba ativa entra na navegação por Tab; entre abas usa-se as setas.
        t.tabIndex = ativa ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !ativa;
      });
      if (focar) aba.focus();
    }

    abas.forEach(function (aba, i) {
      aba.addEventListener('click', function () { mostrar(aba); });

      aba.addEventListener('keydown', function (e) {
        var passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!passo) return;
        e.preventDefault();
        mostrar(abas[(i + passo + abas.length) % abas.length], true);
      });
    });

    if (location.hash === '#servicos') mostrar(abas[1]);
  })();

  /* --- Horário: pílula de status e linha do rodapé ------------------------ */
  (function horario() {
    var DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    var hh = function (h) { return (h < 10 ? '0' : '') + h + 'h'; };

    // Monta "Seg a Sáb • 08h às 18h" a partir dos dias abertos com a mesma faixa.
    function resumo() {
      var abertos = [];
      for (var d = 0; d <= 6; d++) if (CONFIG.horario[d]) abertos.push(d);
      if (!abertos.length) return 'Consulte nosso horário';

      var faixa = CONFIG.horario[abertos[0]];
      var mesmaFaixa = abertos.every(function (d) {
        return CONFIG.horario[d][0] === faixa[0] && CONFIG.horario[d][1] === faixa[1];
      });
      var seguidos = abertos[abertos.length - 1] - abertos[0] === abertos.length - 1;
      var horas = hh(faixa[0]) + ' às ' + hh(faixa[1]);

      if (!mesmaFaixa) return 'Consulte nosso horário';
      if (abertos.length === 1) return DIAS[abertos[0]] + ' • ' + horas;
      if (seguidos) return DIAS[abertos[0]] + ' a ' + DIAS[abertos[abertos.length - 1]] + ' • ' + horas;
      return abertos.map(function (d) { return DIAS[d]; }).join(', ') + ' • ' + horas;
    }

    var texto = resumo();

    var linha = $('#horario');
    if (linha) linha.innerHTML = texto.replace(/^([^•]+)•/, '<b>$1</b>•');

    var el = $('#status');
    if (!el) return;
    var agora = new Date();
    var faixa = CONFIG.horario[agora.getDay()];
    var aberto = !!faixa && agora.getHours() >= faixa[0] && agora.getHours() < faixa[1];
    el.classList.toggle('is-open', aberto);
    $('.status__text', el).textContent = aberto
      ? 'Aberto agora • até ' + hh(faixa[1])
      : 'Fechado • ' + texto.replace(' • ', ', ');   // evita dois bullets seguidos
  })();

  /* --- Ano ---------------------------------------------------------------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* --- Reveal ------------------------------------------------------------- */
  (function reveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--delay', (i * 60) + 'ms');
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* --- Mapa embutido ------------------------------------------------------- */
  (function mapa() {
    var map = $('#map');
    var facade = $('#mapFacade');
    var addr = $('#mapAddr');
    var route = $('#mapRoute');
    var tabs = $$('.tab[role="tab"]');
    if (!map) return;

    var atual = 0;
    var carregado = false;

    function embed() {
      var loja = CONFIG.lojas[atual];
      var frame = $('iframe', map);
      if (!frame) {
        frame = document.createElement('iframe');
        frame.loading = 'lazy';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        frame.title = 'Mapa da unidade';
        frame.setAttribute('allowfullscreen', '');
        map.appendChild(frame);
      }
      frame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(loja.query) +
                  '&hl=pt-BR&z=16&output=embed';
      carregado = true;
      if (facade) facade.classList.add('is-hidden');
    }

    function selecionar(i) {
      atual = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); });
      if (addr) addr.innerHTML = CONFIG.lojas[i].endereco;
      if (carregado) embed();
    }

    tabs.forEach(function (t, i) {
      t.textContent = CONFIG.lojas[i].nome.replace(/^Loja (do )?/, '');
      t.addEventListener('click', function () { selecionar(i); });
    });

    if (facade) {
      facade.addEventListener('click', embed);
      facade.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); embed(); }
      });
    }

    if (route) {
      route.addEventListener('click', function () {
        abrir('https://www.google.com/maps/dir/?api=1&destination=' +
              encodeURIComponent(CONFIG.lojas[atual].query));
      });
    }

    selecionar(0);
  })();

})();
