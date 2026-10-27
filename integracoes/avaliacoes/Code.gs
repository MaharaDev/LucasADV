/** Google Apps Script — execute instalar() uma vez na conta do escritório. */
const REVIEW = Object.freeze({
  consent: 'Autorizo a publicação do meu depoimento e da identificação informada no site de Lucas Fernando Tomaz Bento. Entendo que posso solicitar a retirada pelos canais de contato do site.',
  noConsent: 'Não autorizo a publicação. Meu comentário é apenas um feedback privado.',
  headers: ['ID da resposta', 'Data', 'Identificação pública', 'Depoimento original', 'Autorização', 'Publicar', 'Nota (1 a 5)'],
  sheet: 'Moderação'
});

function instalar() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    let spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      spreadsheetId = SpreadsheetApp.create('Avaliações — Lucas Fernando Tomaz Bento').getId();
      props.setProperty('SPREADSHEET_ID', spreadsheetId);
    }
    const book = SpreadsheetApp.openById(spreadsheetId);
    let moderation = book.getSheetByName(REVIEW.sheet);
    if (!moderation) moderation = book.insertSheet(REVIEW.sheet);
    if (moderation.getLastRow() === 0) {
      moderation.getRange(1, 1, 1, REVIEW.headers.length).setValues([REVIEW.headers]);
      moderation.setFrozenRows(1);
      moderation.getRange('A1:F1').setBackground('#351c20').setFontColor('#ffffff').setFontWeight('bold');
      moderation.getRange('F1').setNote('Marque somente após conferir autenticidade, autorização e ausência de informações sensíveis. Desmarque para retirar do site.');
      moderation.setColumnWidth(3, 200);
      moderation.setColumnWidth(4, 500);
      moderation.setColumnWidth(5, 400);
    }
    let formId = props.getProperty('FORM_ID');
    let form;
    if (!formId) {
      form = FormApp.create('Sua experiência com o atendimento — Lucas Fernando Tomaz Bento', false);
      props.setProperty('FORM_ID', form.getId());
    } else form = FormApp.openById(formId);
    // Guard against duplicate questions when setup is run again.
    if (!props.getProperty('ITEMS_READY')) {
      if (form.getItems().length) throw new Error('Configuração parcial: confira o formulário antes de repetir a instalação.');
      form.setDescription('Compartilhe sua experiência com a atenção, a comunicação e a clareza do atendimento. Não inclua nomes de terceiros, dados sensíveis, números de processos, valores ou resultados de casos. A participação é voluntária e a publicação depende de autorização e revisão. Para solicitar retirada, utilize os canais do site do escritório.');
      form.setCollectEmail(false).setAllowResponseEdits(false).setPublishingSummary(false);
      form.setConfirmationMessage('Obrigado pelo feedback! Sua resposta será revisada. Apenas depoimentos autorizados e aprovados poderão aparecer no site.');
      const name = form.addTextItem().setTitle('Como você autoriza ser identificado(a)?').setHelpText('Use primeiro nome ou iniciais. Não informe CPF, telefone ou outros dados pessoais.').setRequired(true);
      name.setValidation(FormApp.createTextValidation().requireTextLengthLessThanOrEqualTo(80).build());
      const text = form.addParagraphTextItem().setTitle('Como foi sua experiência com o atendimento?').setRequired(true);
      text.setValidation(FormApp.createParagraphTextValidation().requireTextLengthLessThanOrEqualTo(800).build());
      const consent = form.addMultipleChoiceItem().setTitle('Autorização de publicação').setChoiceValues([REVIEW.consent, REVIEW.noConsent]).setRequired(true);
      props.setProperties({ NAME_ITEM: String(name.getId()), TEXT_ITEM: String(text.getId()), CONSENT_ITEM: String(consent.getId()), ITEMS_READY: 'true' });
    }
    if (!props.getProperty('DESTINATION_READY')) {
      form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheetId);
      props.setProperty('DESTINATION_READY', 'true');
    }
    adicionarEstrelas_();
    const exists = ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'receberAvaliacao');
    if (!exists) ScriptApp.newTrigger('receberAvaliacao').forForm(form).onFormSubmit().create();
    console.log('PLANILHA PRIVADA: ' + book.getUrl());
    console.log('EDITAR FORMULÁRIO: ' + form.getEditUrl());
    console.log('FORMULÁRIO: ' + form.getPublishedUrl());
    console.log('Revise o formulário e publique-o no Google Forms antes de compartilhar o link.');
    return { spreadsheetUrl: book.getUrl(), formEditUrl: form.getEditUrl(), formUrl: form.getPublishedUrl() };
  } finally { lock.releaseLock(); }
}

function receberAvaliacao(event) {
  if (!event || !event.response) throw new Error('Esta função é executada pelo gatilho de envio do formulário.');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')).getSheetByName(REVIEW.sheet);
    const id = event.response.getId();
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().some(row => row[0] === id)) return;
    const answers = {};
    event.response.getItemResponses().forEach(item => { answers[String(item.getItem().getId())] = String(item.getResponse()); });
    const row = [id, event.response.getTimestamp(), literal_(answers[props.getProperty('NAME_ITEM')]), literal_(answers[props.getProperty('TEXT_ITEM')]), literal_(answers[props.getProperty('CONSENT_ITEM')]), false, nota_(answers[props.getProperty('RATING_ITEM')])] ;
    const next = sheet.getLastRow() + 1;
    sheet.getRange(next, 1, 1, row.length).setValues([row]);
    sheet.getRange(next, 2).setNumberFormat('dd/MM/yyyy HH:mm');
    sheet.getRange(next, 3, 1, 3).setWrap(true);
    sheet.getRange(next, 6).insertCheckboxes();
  } finally { lock.releaseLock(); }
}

// Prevent submitted spreadsheet formulas from executing in the moderation sheet.
function literal_(value) {
  const text = String(value || '');
  return /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
}

function publicReviews_(rows) {
  return rows.filter(row => row[5] === true && row[4] === REVIEW.consent)
    .filter(row => typeof row[2] === 'string' && row[2].trim() && row[2].length <= 80 && typeof row[3] === 'string' && row[3].trim() && row[3].length <= 800)
    .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
    .slice(0, 6)
    .map(row => ({ name: row[2], text: row[3], rating: nota_(row[6]), date: Utilities.formatDate(new Date(row[1]), 'America/Sao_Paulo', 'yyyy-MM-dd'), source: 'Depoimento recebido pelo formulário do escritório' }));
}

/** Only this public response is exposed: no raw responses, IDs or private sheet URL. */
function doGet() {
  let payload;
  try {
    const props = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')).getSheetByName(REVIEW.sheet);
    const count = sheet.getLastRow() - 1;
    const rows = count > 0 ? sheet.getRange(2, 1, count, 7).getValues() : [];
    payload = { version: 1, reviews: publicReviews_(rows) };
  } catch (error) {
    payload = { version: 1, reviews: [], unavailable: true };
  }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}


/** Run atualizarEstrelas() once to upgrade an existing installation. */
function atualizarEstrelas() { adicionarEstrelas_(); console.log('Nota de 1 a 5 configurada no formulário e na coluna G.'); }
function adicionarEstrelas_() {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  if (!props.getProperty('RATING_ITEM')) {
    const item = form.addScaleItem().setTitle('Como você avalia o atendimento?').setBounds(1, 5).setLabels('1 — Muito insatisfeito(a)', '5 — Muito satisfeito(a)').setRequired(true);
    props.setProperty('RATING_ITEM', String(item.getId()));
  }
  const sheet = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')).getSheetByName(REVIEW.sheet);
  sheet.getRange('G1').setValue('Nota (1 a 5)').setBackground('#351c20').setFontColor('#ffffff').setFontWeight('bold');
  sheet.getRange('G1').setNote('Nota original enviada pelo autor. Avaliações antigas sem nota não recebem estrelas.');
}
function nota_(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5 ? number : null;
}
