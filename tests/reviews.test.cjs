const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const backend = fs.readFileSync(path.join(root, 'integracoes/avaliacoes/Code.gs'), 'utf8');
const frontend = fs.readFileSync(path.join(root, 'reviews.js'), 'utf8');
function server() {
  const context = vm.createContext({ Utilities: { formatDate: date => date.toISOString().slice(0, 10) } });
  vm.runInContext(backend, context);
  return expression => vm.runInContext(expression, context);
}

test('publica apenas autorização explícita e aprovação booleana; omite campos privados', () => {
  const run = server();
  const result = JSON.parse(run(`JSON.stringify(publicReviews_([
    ['private-id', new Date('2026-01-01'), 'Nome público', 'Texto autorizado', REVIEW.consent, true],
    ['id2', new Date(), 'Sem autorização', 'Privado', REVIEW.noConsent, true],
    ['id3', new Date(), 'Pendente', 'Privado', REVIEW.consent, false],
    ['id4', new Date(), 'Texto booleano', 'Privado', REVIEW.consent, 'true']
  ]))`));
  assert.equal(result.length, 1);
  assert.deepEqual(Object.keys(result[0]).sort(), ['date', 'name', 'rating', 'source', 'text']);
  assert.equal(result[0].text, 'Texto autorizado');
});

test('retirada remove imediatamente do feed e limita a seis mais recentes', () => {
  const run = server();
  assert.equal(run(`publicReviews_([['id', new Date(), 'Nome', 'Texto', REVIEW.consent, false]]).length`), 0);
  assert.equal(run(`publicReviews_(Array.from({length: 10}, (_, i) => [String(i), new Date(2026, 0, i+1), 'Nome', 'Texto', REVIEW.consent, true])).length`), 6);
});

test('neutraliza fórmulas da planilha sem modificar depoimentos comuns', () => {
  const run = server();
  assert.equal(run(`literal_('=IMPORTXML("url")')`), '\'=IMPORTXML("url")');
  assert.equal(run(`literal_('Atendimento claro.')`), 'Atendimento claro.');
});

async function browser(payload, endpoint = 'https://script.google.com/macros/s/test/exec', fail = false) {
  function element() { return { hidden: true, children: [], attrs: {}, handlers: {}, classList: {toggle() {}}, setAttribute(k,v) {this.attrs[k]=v}, addEventListener(k,v) {this.handlers[k]=v}, append(...nodes) { this.children.push(...nodes); }, replaceChildren(...nodes) { this.children = nodes; } }; }
  const section = element(), grid = element(), link = element();
  let requests = 0;
  const document = { hidden: false, querySelector: selector => ({ '#depoimentos': section, '#reviews-grid': grid, '#review-form-link': link })[selector], createElement: element, addEventListener() {} };
  const context = { document, URL, Date, Intl, AbortController, window: { REVIEWS_CONFIG: { endpoint, formUrl: '' }, fetch: true, setTimeout: () => 1, clearTimeout() {}, setInterval() {}, matchMedia: () => ({matches:true, addEventListener(){}}) }, fetch: async () => { requests++; if(fail) throw new Error(); return { ok: true, json: async () => payload }; } };
  vm.runInNewContext(frontend, context);
  await new Promise(resolve => setImmediate(resolve));
  return { section, grid, requests };
}

test('renderiza texto potencialmente malicioso como texto, sem HTML', async () => {
  const text = '<img src=x onerror=alert(1)>';
  const { section, grid } = await browser({ version: 1, reviews: [{ name: '<script>', text, date: '2026-01-01' }] });
  assert.equal(section.hidden, false);
  assert.equal(grid.children[0].children[0].children[0].textContent, text);
  assert(!frontend.includes('innerHTML'));
});

test('oculta seção sem configuração, sem avaliações ou em erro', async () => {
  assert.equal((await browser({}, '')).requests, 0);
  assert.equal((await browser({ version: 1, reviews: [] })).section.hidden, true);
  assert.equal((await browser({}, undefined, true)).section.hidden, true);
  assert.equal((await browser({ version: 1, reviews: [], unavailable: true })).section.hidden, true);
});

test('notas ausentes ou inválidas não viram cinco estrelas', () => {
 const run=server();
 for(const value of ['null','undefined','0','6','2.5','false',"''"]) assert.equal(run('nota_('+value+')'), null);
 for(const value of [1,2,3,4,5]) assert.equal(run('nota_('+value+')'), value);
 assert.equal(run("nota_('4')"),4);
 assert.equal(run("publicReviews_([['id',new Date(),'Nome','Texto',REVIEW.consent,true]])[0].rating"),null);
});

test('deck gira, pausa na interação e respeita movimento reduzido', async () => {
  function element() { return { hidden:true, children:[], attrs:{}, handlers:{}, classList:{toggle(){}}, setAttribute(k,v){this.attrs[k]=v}, addEventListener(k,v){this.handlers[k]=v}, append(...n){this.children.push(...n)}, replaceChildren(...n){this.children=n} }; }
  const selectors=['#depoimentos','#reviews-grid','#review-form-link','#reviews-controls','#reviews-prev','#reviews-next','#reviews-pause','#reviews-counter','#reviews-announcement','.reviews-stage'];
  const nodes=Object.fromEntries(selectors.map(s=>[s,element()]));
  const timers=new Map();let id=0;const motion={matches:false,addEventListener(type,fn){this.change=fn}};
  const context={URL,Date,Intl,AbortController,document:{hidden:false,querySelector:s=>nodes[s],createElement:element,addEventListener(){}},window:{REVIEWS_CONFIG:{endpoint:'https://script.google.com/macros/s/test/exec',formUrl:''},fetch:true,matchMedia:()=>motion,setTimeout(fn,delay){timers.set(++id,{fn,delay});return id},clearTimeout(i){timers.delete(i)},setInterval(){}},fetch:async()=>({ok:true,json:async()=>({version:1,reviews:[{name:'A',text:'Primeiro',rating:4},{name:'B',text:'Segundo',rating:null}]})})};
  vm.runInNewContext(frontend,context);await new Promise(resolve=>setImmediate(resolve));
  const grid=nodes['#reviews-grid'];
  assert.equal(grid.children[0].attrs['aria-hidden'],'false');assert.equal(grid.children[1].inert,true);
  assert.equal(grid.children[0].children[0].attrs['aria-label'],'Avaliação: 4 de 5 estrelas');
  assert.equal(grid.children[1].children.length,2);
  [...timers.values()].find(t=>t.delay===10000).fn();
  assert.equal(nodes['#reviews-counter'].textContent,'02 / 02');assert.equal(grid.children[0].inert,true);
  nodes['.reviews-stage'].handlers.focusin();assert.equal(nodes['#reviews-pause'].textContent,'Retomar rotação');
  nodes['#reviews-prev'].handlers.click();assert.equal(nodes['#reviews-counter'].textContent,'01 / 02');
  assert.equal(nodes['#reviews-announcement'].textContent,'Depoimento 1 de 2, de A.');
  nodes['#reviews-pause'].handlers.click();assert.equal(nodes['#reviews-pause'].textContent,'Pausar rotação');
  motion.matches=true;motion.change();assert.equal(nodes['#reviews-pause'].hidden,true);assert.equal(timers.size,0);
});
