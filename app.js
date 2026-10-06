(() => {
  'use strict';
  const raw = window.RIGHTS_DATA || {};
  const data = {
    countries: Array.isArray(raw.countries) ? raw.countries : [],
    taiwan: Array.isArray(raw.taiwan) ? raw.taiwan : [],
    cases: Array.isArray(raw.cases) ? raw.cases : [],
    sources: Array.isArray(raw.sources) ? raw.sources : []
  };
  const $ = (id) => document.getElementById(id);
  const string = (value) => value == null ? '' : String(value);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = string(text);
    return node;
  };
  const safeUrl = (value) => {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  };
  const itemsOf = (country) => Array.isArray(country.items) ? country.items : [];
  const topics = [...new Set([...data.countries.flatMap(itemsOf), ...data.taiwan].map((item) => item.topic).filter(Boolean))];
  function addOption(select, value, label) {
    const option = el('option', '', label); option.value = string(value); select.append(option);
  }
  data.countries.forEach((country) => {
    addOption($('country-filter'), country.id, country.name);
    addOption($('compare-country'), country.id, country.name);
  });
  topics.forEach((topic) => {
    addOption($('topic-filter'), topic, topic);
    addOption($('compare-topic'), topic, topic);
  });
  if (topics.length) $('compare-topic').value = topics.includes('教育') ? '教育' : topics[0];

  function sourceLinks(sources) {
    const container = el('div', 'item-sources');
    (Array.isArray(sources) ? sources : []).forEach((source) => {
      const url = safeUrl(source.url);
      if (!url) return;
      const link = el('a', 'source-link', source.label || '查看原始資料');
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', (source.label || '查看原始資料') + '（在新分頁開啟）');
      const arrow = el('span', 'diagonal-arrow', ''); arrow.setAttribute('aria-hidden', 'true'); link.append(arrow);
      container.append(link);
    });
    return container;
  }
  function evidence(item) {
    const article = el('article', 'evidence-item');
    const tags = el('div', 'item-tags');
    if (item.topic) tags.append(el('span', 'topic-tag', item.topic));
    if (item.kind) tags.append(el('span', 'kind-tag', item.kind));
    article.append(tags, el('h4', '', item.title), el('p', '', item.text));
    if (item.date) article.append(el('span', 'item-date', '資料時間／脈絡：' + item.date));
    article.append(sourceLinks(item.sources));
    return article;
  }
  function countryCard(country, items, expanded) {
    const card = el('article', 'country-card');
    const header = el('div', 'country-card-top');
    const meta = el('div', 'country-meta');
    meta.append(el('span', '', country.region || '世界觀察'));
    const glyph = el('span', 'country-glyph diagonal-arrow', ''); glyph.setAttribute('aria-hidden', 'true'); meta.append(glyph);
    header.append(meta, el('h3', '', country.name), el('p', 'country-intro', country.intro));
    const tags = el('div', 'country-topics');
    [...new Set(items.map((item) => item.topic).filter(Boolean))].forEach((topic) => tags.append(el('span', 'topic-tag', topic)));
    const details = el('details', 'country-details');
    details.open = expanded;
    const summary = el('summary', '', '閱讀 ' + items.length + ' 則權利觀察');
    const body = el('div', 'country-items');
    items.forEach((item) => body.append(evidence(item)));
    details.append(summary, body);
    const footer = el('div', 'country-card-footer');
    footer.append(el('span', '', '制度 × 生活 × 改變'));
    const compare = el('button', 'country-compare', '與臺灣一起看 →');
    compare.type = 'button';
    compare.setAttribute('aria-label', '比較' + country.name + '與臺灣的權利資料');
    compare.addEventListener('click', () => {
      $('compare-country').value = string(country.id);
      $('compare-topic').value = $('topic-filter').value !== 'all' ? $('topic-filter').value : (items[0] && items[0].topic) || 'all';
      renderComparison();
      $('compare').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      $('compare-country').focus({ preventScroll: true });
    });
    footer.append(compare); card.append(header, tags, details, footer); return card;
  }
  function renderCountries() {
    const countryId = $('country-filter').value;
    const topic = $('topic-filter').value;
    const query = $('search-input').value.trim().toLocaleLowerCase();
    const grid = $('country-grid'); grid.replaceChildren();
    let itemCount = 0; let countryCount = 0;
    data.countries.forEach((country) => {
      if (countryId !== 'all' && string(country.id) !== countryId) return;
      const countryText = [country.name, country.region, country.intro].map(string).join(' ').toLocaleLowerCase();
      const items = itemsOf(country).filter((item) => {
        if (topic !== 'all' && item.topic !== topic) return false;
        const text = [item.topic, item.kind, item.title, item.text, item.date].map(string).join(' ').toLocaleLowerCase();
        return !query || countryText.includes(query) || text.includes(query);
      });
      if (!items.length) return;
      grid.append(countryCard(country, items, countryId !== 'all' || topic !== 'all' || !!query));
      itemCount += items.length; countryCount += 1;
    });
    $('results-count').textContent = '正在閱讀 ' + countryCount + ' 個地區 · ' + itemCount + ' 則觀察資料';
    $('empty-state').hidden = countryCount > 0;
    if (!data.countries.length) {
      $('empty-state').querySelector('h3').textContent = '資料尚未載入';
      $('empty-state').querySelector('p').textContent = '請重新整理網頁，或稍後再試。你仍可先閱讀下方思辨練習與資料閱讀說明。';
      $('empty-reset').hidden = true;
    }
  }
  function resetFilters() {
    $('country-filter').value = 'all'; $('topic-filter').value = 'all'; $('search-input').value = ''; renderCountries();
  }
  $('explore-filters').addEventListener('submit', (event) => event.preventDefault());
  $('explore-filters').addEventListener('reset', (event) => { event.preventDefault(); resetFilters(); });
  $('country-filter').addEventListener('change', renderCountries);
  $('topic-filter').addEventListener('change', renderCountries);
  $('search-input').addEventListener('input', renderCountries);
  $('empty-reset').addEventListener('click', () => { resetFilters(); $('country-filter').focus(); });
  function renderComparison() {
    const country = data.countries.find((entry) => string(entry.id) === $('compare-country').value);
    const topic = $('compare-topic').value;
    $('compare-country-title').textContent = country ? country.name : '待載入資料';
    const populate = (container, items) => {
      container.replaceChildren();
      const filtered = items.filter((item) => topic === 'all' || item.topic === topic);
      if (!filtered.length) { container.append(el('p', 'no-evidence', '本站尚未收錄這個主題的資料。資料缺席，不代表權利已獲保障，也不代表問題不存在。')); return; }
      filtered.forEach((item) => container.append(evidence(item)));
    };
    populate($('compare-country-content'), country ? itemsOf(country) : []);
    populate($('compare-taiwan-content'), data.taiwan);
  }
  $('compare-country').addEventListener('change', renderComparison);
  $('compare-topic').addEventListener('change', renderComparison);
  function renderCases() {
    const timeline = $('case-timeline');
    data.cases.forEach((item) => {
      const row = el('details', 'case-row');
      const summary = el('summary');
      summary.append(el('span', 'case-date', item.date), el('span', 'case-title', item.title));
      const body = el('div', 'case-body');
      body.append(el('p', '', item.text), sourceLinks(item.sources));
      row.append(summary, body); timeline.append(row);
    });
    if (!data.cases.length) timeline.append(el('p', 'no-evidence', '案例資料尚未載入。'));
  }
  function renderSources() {
    const list = $('source-list'); const seen = new Set();
    data.sources.forEach((source) => {
      const url = safeUrl(source.url);
      if (!url || seen.has(url)) return; seen.add(url);
      const row = el('div', 'source-row'); row.append(el('span', '', String(seen.size).padStart(2, '0')));
      const link = el('a', '', source.label || new URL(url).hostname);
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', (source.label || '原始資料') + '（在新分頁開啟）');
      row.append(link); list.append(row);
    });
    if (!seen.size) list.append(el('p', 'no-evidence', '主要來源尚未載入。'));
  }
  const questions = [
    { category: '法律與現實', question: '某地法律規定男女享有平等的工作機會。接下來，哪個提問最能幫助我們理解實際處境？', options: ['既然法律平等，就不需要更多資料了。', '實際招募、薪資與申訴管道是否也落實平等？', '只要找到一位成功女性，就能代表所有人的經驗。'], correct: 1, explanation: '法律是重要的保障，但要理解落實情況，仍需要招募、待遇、執行與不同群體經驗等資料。個人的成功也不能代表所有人的處境。' },
    { category: '資料與時間', question: '你找到一份五年前的報告。想用它介紹某地今天的狀況，最合適的做法是？', options: ['先標示資料年份，再查找後續法律、政策與調查更新。', '報告出自可靠機構，所以所有內容至今一定相同。', '只要資料超過一年，就完全沒有參考價值。'], correct: 0, explanation: '舊資料能幫助理解歷史與變化；要談今天的狀況，則應確認後續更新。可靠的來源仍有時間與涵蓋範圍的限制。' },
    { category: '差異與刻板印象', question: '讀到一位女性遭受不平等待遇的案例後，哪一種整理方式比較負責任？', options: ['將案例中的行為，當作整個文化的共同特徵。', '因為只是個案，就認定完全不值得討論。', '說清楚個案背景，並找其他證據確認問題的範圍。'], correct: 2, explanation: '個案可以揭露重要問題，也值得被理解。進一步判斷影響範圍時，需要更多證據，並避免把所有人歸為同一種經驗。' },
    { category: '比較與判斷', question: '兩個地區的報告使用不同年份、樣本與「就業」定義。你可以直接用其中的數字排名嗎？', options: ['數字較高的一方，一定在所有權利面向都更好。', '先確認定義與調查範圍，說明哪些部分可以比較。', '只要都用百分比表示，就一定能直接比較。'], correct: 1, explanation: '數字的定義、對象與時間會影響比較。即使指標可比，也不能用單一數字代替所有權利面向，更不能據此評斷一個群體。' }
  ];
  const quizNodes = [];
  function renderQuiz() {
    questions.forEach((question, index) => {
      const card = el('div', 'quiz-card'); const heading = el('div', 'quiz-card-header');
      heading.append(el('span', 'quiz-number', '0' + (index + 1)), el('span', 'quiz-category', question.category));
      const fieldset = el('fieldset'); const legend = el('legend', '', question.question); legend.id = 'quiz-label-' + index; fieldset.append(legend);
      const options = el('div', 'quiz-options'); const inputs = []; const labels = [];
      question.options.forEach((text, optionIndex) => {
        const label = el('label', 'quiz-option');
        const input = document.createElement('input'); input.type = 'radio'; input.name = 'question-' + index; input.value = String(optionIndex); input.required = true;
        label.append(input, el('span', '', text)); options.append(label); inputs.push(input); labels.push(label);
      });
      fieldset.append(options);
      const feedback = el('div', 'quiz-feedback'); feedback.id = 'quiz-feedback-' + index; feedback.hidden = true;
      const printAnswer = el('p', 'print-answer', '參考答案：' + question.options[question.correct] + ' ' + question.explanation);
      card.append(heading, fieldset, feedback, printAnswer); $('quiz-questions').append(card);
      quizNodes.push({ inputs, labels, feedback, fieldset });
    });
  }
  function clearFeedback() {
    quizNodes.forEach(({ labels, feedback, fieldset }) => {
      feedback.hidden = true; feedback.replaceChildren(); fieldset.removeAttribute('aria-describedby');
      labels.forEach((label) => label.classList.remove('is-correct', 'is-incorrect'));
    });
    $('quiz-result').hidden = true; $('quiz-result').replaceChildren();
  }
  $('quiz-form').addEventListener('change', () => {
    const count = quizNodes.filter(({ inputs }) => inputs.some((input) => input.checked)).length;
    $('quiz-progress').textContent = '已選擇 ' + count + ' / ' + questions.length + ' 題'; clearFeedback();
  });
  $('quiz-form').addEventListener('submit', (event) => {
    event.preventDefault(); clearFeedback();
    const missing = quizNodes.find(({ inputs }) => !inputs.some((input) => input.checked));
    const result = $('quiz-result');
    if (missing) {
      result.textContent = '還有題目沒選好。請先完成四個情境，再一起看看每個答案背後的理由。'; result.hidden = false;
      missing.inputs[0].focus(); return;
    }
    let correctCount = 0;
    quizNodes.forEach(({ inputs, labels, feedback, fieldset }, index) => {
      const question = questions[index]; const chosen = inputs.findIndex((input) => input.checked); const correct = chosen === question.correct;
      if (correct) correctCount += 1;
      labels[question.correct].classList.add('is-correct');
      if (!correct) labels[chosen].classList.add('is-incorrect');
      feedback.classList.toggle('retry', !correct);
      feedback.append(el('strong', '', correct ? '這個判斷有抓到重點。' : '換個角度，再想一步。'), el('span', '', question.explanation));
      feedback.hidden = false; fieldset.setAttribute('aria-describedby', feedback.id);
    });
    result.append(el('b', '', '完成了！你掌握了 ' + correctCount + ' / ' + questions.length + ' 個判讀重點。'), el('span', '', correctCount === questions.length ? '把這四種思考方法帶回上面的資料：看執行、查時間、辨範圍，再比較。' : '分數只是提示。看看每題的說明，再回到資料裡找找：哪個細節會讓你的判斷改變？'));
    result.hidden = false; result.focus({ preventScroll: true }); result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });
  $('quiz-form').addEventListener('reset', () => { clearFeedback(); $('quiz-progress').textContent = '已選擇 0 / ' + questions.length + ' 題'; });

  function renderPrintSummary() {
    const root = $('print-summary');
    root.replaceChildren();
    let website = '';
    try {
      const url = new URL(window.location.href);
      url.hash = ''; url.search = '';
      website = url.href;
    } catch { website = '請回到本網站查看完整資料與來源。'; }
    const references = (item) => {
      const paragraph = el('p', 'print-reference');
      if (item.date) paragraph.append(document.createTextNode('資料時間／脈絡：' + item.date + '。'));
      const valid = (Array.isArray(item.sources) ? item.sources : []).filter((source) => safeUrl(source.url));
      valid.slice(0, 2).forEach((source, index) => {
        paragraph.append(document.createTextNode(index ? '；' : '來源：'));
        const a = el('a', '', source.label || '原始資料');
        a.href = safeUrl(source.url); paragraph.append(a);
      });
      return paragraph;
    };
    const sheet = (number, subtitle) => {
      const page = el('section', 'print-sheet');
      const header = el('div', 'print-sheet-head');
      header.append(el('span', '', '權利不設限 · 學習摘要'), el('span', '', subtitle + ' / ' + number + ''));
      page.append(header); root.append(page); return page;
    };
    const observation = (country) => {
      const item = itemsOf(country)[0];
      if (!item) return el('p', '', country.name + '：暫無收錄資料。');
      const article = el('article', 'print-observation');
      const title = el('h3', '', country.name);
      title.append(el('span', '', item.topic + ' · ' + item.kind));
      article.append(title, el('h4', '', item.title), el('p', '', item.text), references(item));
      return article;
    };
    const first = sheet('01', '從世界開始');
    first.append(el('h1', '', '權利不設限'), el('p', 'print-lead', '看見不同處境，也珍惜需要一起維護的權利。'), el('p', '', '閱讀時，先問法律如何規定，再問生活是否落實。本摘要為各地選取一則觀察，不能代表一個地區的全部經驗。'));
    first.append(el('h2', '', '世界觀察 · 上'));
    data.countries.slice(0, 4).forEach((country) => first.append(observation(country)));
    const second = sheet('02', '對照與反思');
    second.append(el('h2', '', '世界觀察 · 下'));
    data.countries.slice(4).forEach((country) => second.append(observation(country)));
    const taiwan = el('section', 'print-taiwan');
    taiwan.append(el('h2', '', '回到臺灣：保障值得珍惜，也要持續維護'));
    taiwan.append(el('p', '', '受教、工作與參與公共生活的保障，經過爭取與改革而來。以下列出幾項制度重點；點擊標題可閱讀法規來源。'));
    const baselines = el('ul', 'print-baselines');
    ['教育', '就業與經濟', '政治參與', '免於暴力', '財產繼承'].forEach((topic) => {
      const item = data.taiwan.find((entry) => entry.topic === topic && string(entry.kind).includes('法律'));
      if (!item) return;
      const li = el('li');
      const source = (Array.isArray(item.sources) ? item.sources : []).find((entry) => safeUrl(entry.url));
      if (source) {
        const a = el('a', '', item.title); a.href = safeUrl(source.url); li.append(a);
      } else li.textContent = item.title;
      baselines.append(li);
    });
    taiwan.append(baselines);
    const gap = data.taiwan.find((item) => item.kind === '執行落差');
    if (gap) {
      const box = el('article', 'print-gap');
      box.append(el('h3', '', '仍要努力：' + gap.title), el('p', '', gap.text), references(gap));
      taiwan.append(box);
    }
    second.append(taiwan);
    const third = sheet('03', '帶問題走進討論');
    third.append(el('h2', '', '寫下你的觀察，和同學一起想'));
    third.append(el('p', 'print-lead', '先描述證據，再說出理由。談制度與行為，避免替群體貼標籤；你也可以選擇不分享個人經驗。'));
    const prompts = [
      ['有了平等的法律，就有平等的生活嗎？', '選一則資料，找出法律承諾與日常處境。你還需要什麼證據，才能理解兩者的距離？'],
      ['誰的聲音，還沒出現在資料裡？', '同一地區的女性是否都有相同經驗？從城鄉、收入、身心障礙或移民身分，提出一個新的問題。'],
      ['如果是我們的校園，可以先改變什麼？', '挑一個與選擇、參與或安全有關的情境。提出可實行的做法，想想要邀請誰一起討論。']
    ];
    prompts.forEach((prompt, index) => {
      const article = el('article', 'print-prompt');
      article.append(el('h3', '', String(index + 1).padStart(2, '0') + ' / ' + prompt[0]), el('p', '', prompt[1]));
      article.append(el('div', 'print-writing-line'), el('div', 'print-writing-line')); third.append(article);
    });
    const method = el('section', 'print-method');
    method.append(el('h3', '', '讀資料，也要讀它的限制'), el('p', '', '參考日期：2026 年 10 月 6 日。每則資料的年份與脈絡另列；舊報告與歷史事件不能保證今日情況完全相同。法律、執行情況與個案須分開閱讀，不同定義與調查範圍的資料不能直接排名。'), el('p', '', '本摘要為公民與性別平等教育用途，不提供個案法律意見。來源標題為可點擊連結；完整資料、案例與來源清單請見網站。'));
    const web = el('p', 'print-web', '完整網站：');
    const link = el('a', '', website); link.href = website; web.append(link);
    method.append(web); third.append(method);
  }

  $('print-button').addEventListener('click', () => window.print());
  renderCountries(); renderComparison(); renderCases(); renderSources(); renderQuiz(); renderPrintSummary();
})();
