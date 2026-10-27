const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../contact-context.js'),'utf8');
function setup(){
  const node=()=>({handlers:{},attrs:{},addEventListener(type,fn){this.handlers[type]=fn},setAttribute(key,value){this.attrs[key]=value},getAttribute(key){return this.attrs[key]},focus(){this.focused=true}});
  const subject=node();subject.value='';subject.options=['','Direito Civil','Direito Empresarial','Família e patrimônio','Outra demanda'].map(value=>({value}));
  const name=node(),announcement=node(),whatsapp=node(),form=node();
  whatsapp.attrs.href='https://api.whatsapp.com/send?phone=554799225733';
  form.querySelector=selector=>({'#assunto':subject,'#nome':name}[selector]);
  const links=['Direito Civil','Direito Empresarial','Família e patrimônio','Inexistente'].map(area=>Object.assign(node(),{dataset:{contactArea:area}}));
  const document={querySelector:selector=>({'.contact-form':form,'#contact-context-status':announcement,'#contato .button-gold':whatsapp}[selector]),querySelectorAll:()=>links,addEventListener:(type,fn)=>fn()};
  vm.runInNewContext(code,{document,URL,Set,Array,queueMicrotask});
  return {subject,name,announcement,whatsapp,form,links};
}
test('cada área seleciona assunto e contextualiza WhatsApp preservando o telefone',()=>{
 const state=setup();
 for(const link of state.links.slice(0,3)){
  link.handlers.click();
  assert.equal(state.subject.value,link.dataset.contactArea);
  const url=new URL(state.whatsapp.attrs.href);
  assert.equal(url.searchParams.get('phone'),'554799225733');
  assert(url.searchParams.get('text').includes(link.dataset.contactArea));
  assert(state.name.focused);
 }
 state.links[3].handlers.click();assert.equal(state.subject.value,'Família e patrimônio');
});
test('troca manual e reset removem o contexto anterior',async()=>{
 const state=setup();state.links[0].handlers.click();
 state.subject.value='Outra demanda';state.subject.handlers.change();
 assert(new URL(state.whatsapp.attrs.href).searchParams.get('text').includes('Outra demanda'));
 state.form.handlers.reset();state.subject.value='';await new Promise(resolve=>queueMicrotask(resolve));
 assert.equal(new URL(state.whatsapp.attrs.href).searchParams.has('text'),false);
 assert.equal(state.announcement.textContent,'');
});
test('âncoras, campos e scripts locais continuam válidos',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(m[1]));
 for(const m of html.matchAll(/(?:aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g))for(const id of m[1].split(' '))assert(ids.includes(id));
 for(const m of html.matchAll(/<script src="([^"]+)"/g))assert(fs.existsSync(path.join(root,m[1])));
 assert(html.includes('name="assunto"'));
});
