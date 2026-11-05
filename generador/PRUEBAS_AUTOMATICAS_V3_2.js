// Pruebas locales de construcción de URL. Requiere Node.js 18+.
// No contactan los servidores de Scotiabank.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const src = fs.readFileSync(__dirname + '/app.js', 'utf8').replace(/\biniciar\(\);\s*$/, '');
const elems = new Map();
const checked = {measurementMode:'campana', linkDestinationMode:'web', guidedIntent:'web'};
const mock = id => {
 if(!elems.has(id)) elems.set(id,{
  value:'',checked:false,textContent:'',innerHTML:'',className:'',href:'',dataset:{},
  classList:{add(){},remove(){},toggle(){}}, setAttribute(){}, selectedOptions:[],
  options:[],scrollIntoView(){}
 });
 return elems.get(id);
};
const doc = {
 getElementById: id => mock(id),
 querySelector: selector => {
  const m = selector.match(/^input\[name="([^"]+)"\](?::checked|\[value="([^"]+)"\])?/);
  if (!m) return null;
  const [_,name,value] = m;
  if (value) return {value, get checked(){return checked[name]===value},set checked(val){if(val)checked[name]=value}};
  return checked[name] ? {value:checked[name]} : null;
 },
 querySelectorAll: () => [],
 createElement: name => ({value:'',textContent:'',addEventListener(){},appendChild(){},append(){},setAttribute(){},classList:{add(){},remove(){}},style:{}}),
};
const ctx = vm.createContext({console,document:doc,alert:m=>{throw Error('ALERTA INESPERADA: '+m)},window:{location:{href:''}},navigator:{},URL,Blob});
vm.runInContext(src,ctx,{filename:'app.js'});
const run = code=>vm.runInContext(code,ctx);
let n=0;
function check(name,fn){fn();n++;console.log('OK',n,name)}
const web='https://mi.scotiabank.com.pe/login?redirectTo=/u/marketplace';
const app='scotiabankpe:///notices';
const build=obj=>run('construirVariantesEnlace('+JSON.stringify(obj)+')');
const internal={modoMedicion:'interno',sourceCampanaInterno:true,detail:'boton_principal'};
check('Web solo interna: sin UTM ni embeddedURL',()=>{
 const x=build({webBase:web,appBase:app,modoDestino:'web',...internal});
 const url=new URL(x.finalUrl);
 assert.equal(url.searchParams.get('source'),'campaign');
 assert.equal(url.searchParams.get('detail'),'boton_principal');
 assert.equal(url.searchParams.get('embeddedURL'),null);
 assert.equal(url.searchParams.get('utm_source'),null);
});
check('Web + App: embeddedURL codificado UNA sola vez',()=>{
 const x=build({webBase:web,appBase:app,modoDestino:'combinado',...internal});
 const u=new URL(x.finalUrl);
 assert.equal(u.searchParams.get('embeddedURL'),x.appParametrizada);
 assert.equal(u.searchParams.get('redirectTo'),'/u/marketplace');
 assert.equal(x.appParametrizada,'scotiabankpe:///notices?source=campaign&detail=boton_principal');
 assert.equal((x.finalUrl.match(/embeddedURL=/g)||[]).length,1);
});
check('Solo App: no necesita URL Web',()=>{
 const x=build({webBase:'',appBase:app,modoDestino:'app',...internal});
 assert.ok(x.finalUrl.startsWith('scotiabankpe:///notices?'));
 assert.ok(!x.finalUrl.includes('embeddedURL'));
 assert.equal(x.webParametrizada,'');
});
check('Campaña Meta con utm_content en Web y App',()=>{
 const x=build({webBase:web,appBase:app,modoDestino:'combinado',modoMedicion:'campana',utmSource:'meta',utmMedium:'paid-social',utmCampaign:'Meta-Producto-Periodo',utmContent:'banner_principal',utmTerm:'segmento_a',detail:'cta_email'});
 const u=new URL(x.finalUrl), a=new URL(u.searchParams.get('embeddedURL'));
 for (const t of [u,a]) {
  assert.equal(t.searchParams.get('utm_source'),'meta');
  assert.equal(t.searchParams.get('utm_medium'),'paid-social');
  assert.equal(t.searchParams.get('utm_content'),'banner_principal');
  assert.equal(t.searchParams.get('utm_term'),'segmento_a');
  assert.equal(t.searchParams.get('source'),'campaign');
  assert.equal(t.searchParams.get('detail'),'cta_email');
 }
});
check('Solo Web Meta con UTM y sin ruta app',()=>{
 const x=build({webBase:web,appBase:app,modoDestino:'web',modoMedicion:'campana',utmSource:'meta',utmMedium:'paid-social',utmCampaign:'Meta-Producto'});
 assert.equal(new URL(x.finalUrl).searchParams.get('utm_source'),'meta');
 assert.equal(new URL(x.finalUrl).searchParams.get('embeddedURL'),null);
});
check('Solo App Meta con UTM (sin URL web)',()=>{
 const x=build({webBase:'',appBase:app,modoDestino:'app',modoMedicion:'campana',utmSource:'meta',utmMedium:'paid-social',utmCampaign:'Meta-Producto'});
 assert.equal(new URL(x.finalUrl).searchParams.get('utm_source'),'meta');
 assert.equal(x.webParametrizada,'');
});
check('Limpia UTM, source y _gl antiguos de enlace interno',()=>{
 const x=build({webBase:web+'&utm_source=viejo&utm_content=anterior&_gl=123&source=campaign&detail=antiguo',appBase:app+'?utm_medium=spam&detail=antiguo',modoDestino:'combinado',modoMedicion:'interno',sourceCampanaInterno:false,detail:'nuevo'});
 const u=new URL(x.finalUrl),a=new URL(u.searchParams.get('embeddedURL'));
 for (const t of [u,a]) {
  assert.equal(t.searchParams.get('utm_source'),null);
  assert.equal(t.searchParams.get('utm_content'),null);
  assert.equal(t.searchParams.get('utm_medium'),null);
  assert.equal(t.searchParams.get('source'),null);
  assert.equal(t.searchParams.get('detail'),'nuevo');
 }
 assert.equal(u.searchParams.get('_gl'),null);
});
check('Preserva la ruta WebView ;code=CD y sus separadores',()=>{
 const x=build({webBase:'https://mi.scotiabank.com.pe/login?redirectTo=/u/campaign;code=CD',appBase:'scotiabankpe:///webView?path=/u/campaign;code=CD',modoDestino:'combinado',...internal});
 const u=new URL(x.finalUrl);
 assert.equal(u.searchParams.get('redirectTo'),'/u/campaign;code=CD');
 assert.equal(new URL(u.searchParams.get('embeddedURL')).searchParams.get('path'),'/u/campaign;code=CD');
});
check('Sin detail nuevo elimina detail heredado',()=>{
 const x=build({webBase:web+'&detail=viejo',appBase:app+'?detail=viejo',modoDestino:'combinado',modoMedicion:'interno',detail:''});
 const u=new URL(x.finalUrl),a=new URL(u.searchParams.get('embeddedURL'));
 assert.equal(u.searchParams.get('detail'),null);
 assert.equal(a.searchParams.get('detail'),null);
});
check('Conserva fragmento #hash de URL Web',()=>{
 const x=build({webBase:web+'#seccion',modoDestino:'web',modoMedicion:'interno'});
 assert.ok(x.finalUrl.endsWith('#seccion'));
});
check('Clientes/no clientes: prepara cliente y NO incrusta landing como fallback falso',()=>{
 const x=build({webBase:web,appBase:app,modoDestino:'clientes',...internal});
 assert.equal(new URL(x.finalUrl).searchParams.get('embeddedURL'),x.appParametrizada);
 assert.ok(!x.finalUrl.includes('fallbackURL='));
});
check('Ficha para Tecnología diferencia no cliente y cliente, estado no publicable',()=>{
 mock('nonClientLandingUrl').value='https://mi.scotiabank.com.pe/openmarket/accounts/redirect-qr-code/digital';
 const x=build({webBase:web,appBase:app,modoDestino:'clientes',...internal});
 run('RESULTADO_ACTUAL='+JSON.stringify(x));
 const y=run('construirFichaTecnologia()');
 assert.equal(y.estado,'PENDIENTE_DE_TECNOLOGIA_NO_PUBLICABLE');
 assert.ok(y.no_cliente_landing.includes('openmarket'));
 assert.ok(!y.cliente_url_combinada_para_pruebas.includes('openmarket'));
});
check('Generador individual Web valida y muestra enlace interno',()=>{
 checked.linkDestinationMode='web'; checked.measurementMode='interno';
 mock('webUrl').value=web; mock('appUrl').value=app; mock('detail').value='cta_web';mock('internalSourceCampaign').checked=true;
 run('generarLink()');
 assert.equal(new URL(mock('finalUrl').textContent).searchParams.get('detail'),'cta_web');
 assert.equal(new URL(mock('finalUrl').textContent).searchParams.get('embeddedURL'),null);
});
check('Generador individual Solo App acepta web vacío',()=>{
 checked.linkDestinationMode='app';checked.measurementMode='interno';
 mock('webUrl').value='';mock('appUrl').value=app;mock('detail').value='cta_app';
 run('generarLink()');
 assert.ok(mock('finalUrl').textContent.startsWith('scotiabankpe:///notices?'));
});
check('Configuración por canal usa sugerencias del catálogo existente',()=>{
 const m=run('GUIA_CANALES.meta'); const g=run('GUIA_CANALES.google'); const e=run('GUIA_CANALES.email');
 assert.equal(m.source,'meta');assert.equal(m.medium,'paid-social');
 assert.equal(g.source,'google');assert.equal(g.medium,'paid-cpc');
 assert.equal(e.source,'masterbase');assert.equal(e.medium,'email');
});
check('Asistente: elegir canal interno desactiva UTM y muestra consejo',()=>{
 mock('guidedChannel').value='internal';
 mock('utmCampaign').value='';
 run('cambiarCanalGuiado()');
 assert.equal(checked.measurementMode,'interno');
 assert.ok(mock('guidedChannelAdvice').textContent.includes('evita UTM'));
});
check('Asistente: elegir modo combinado sincroniza controles técnicos',()=>{
 checked.guidedIntent='combinado';
 run('cambiarObjetivoGuiado()');
 assert.equal(checked.linkDestinationMode,'combinado');
 assert.ok(mock('destinationModeHelp').textContent.includes('embeddedURL'));
});
check('Source personalizado en enlace interno sin UTM, separado de detail',()=>{
 const x=build({webBase:web,appBase:app,modoDestino:'combinado',modoMedicion:'interno',sourceExtra:'crm_boletin',detail:'cta_principal'});
 const u=new URL(x.finalUrl), a=new URL(u.searchParams.get('embeddedURL'));
 assert.equal(u.searchParams.get('source'),'crm_boletin');
 assert.equal(a.searchParams.get('source'),'crm_boletin');
 assert.equal(u.searchParams.get('detail'),'cta_principal');
 assert.equal(u.searchParams.get('utm_source'),null);
 assert.equal(a.searchParams.get('utm_medium'),null);
});
check('Source en blanco no agrega source ni siquiera si venía del origen',()=>{
 const x=build({webBase:web+'&source=viejo',appBase:app+'?source=antiguo',modoDestino:'combinado',modoMedicion:'interno',sourceExtra:'',detail:''});
 const u=new URL(x.finalUrl),a=new URL(u.searchParams.get('embeddedURL'));
 assert.equal(u.searchParams.get('source'),null);assert.equal(a.searchParams.get('source'),null);
});
check('Source personalizado en campaña no reemplaza utm_source ni utm_medium',()=>{
 const x=build({webBase:web,appBase:app,modoDestino:'combinado',modoMedicion:'campana',utmSource:'google',utmMedium:'paid-cpc',utmCampaign:'Google-Producto-Periodo',sourceExtra:'aplicativo_promo',detail:'cta_app'});
 const u=new URL(x.finalUrl),a=new URL(u.searchParams.get('embeddedURL'));
 for (const q of [u,a]) {
   assert.equal(q.searchParams.get('source'),'aplicativo_promo');
   assert.equal(q.searchParams.get('utm_source'),'google');
   assert.equal(q.searchParams.get('utm_medium'),'paid-cpc');
   assert.equal(q.searchParams.get('detail'),'cta_app');
 }
});
check('Source con caracteres especiales se codifica correctamente',()=>{
 const x=build({webBase:web,modoDestino:'web',modoMedicion:'interno',sourceExtra:'canal A&B',detail:'botón & producto'});
 const u=new URL(x.finalUrl);
 assert.equal(u.searchParams.get('source'),'canal A&B');
 assert.equal(u.searchParams.get('detail'),'botón & producto');
 assert.equal(u.searchParams.get('utm_campaign'),null);
});
check('Campaña permite omitir source con el campo opcional en blanco',()=>{
 const x=build({webBase:web,modoDestino:'web',modoMedicion:'campana',utmSource:'meta',utmMedium:'paid-social',utmCampaign:'Meta-Producto',sourceExtra:''});
 const u=new URL(x.finalUrl);
 assert.equal(u.searchParams.get('source'),null);
 assert.equal(u.searchParams.get('utm_source'),'meta');
});
console.log(`\n${n} pruebas automáticas aprobadas. No validan navegación real, App Links ni Analytics.`);
