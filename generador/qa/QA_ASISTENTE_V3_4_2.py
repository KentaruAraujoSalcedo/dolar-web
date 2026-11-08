from pathlib import Path
import json,re,shutil,subprocess,sys
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
ROOT=Path('/mnt/data/generador_v3_4_2')
OUT=ROOT/'qa';OUT.mkdir(exist_ok=True)

def page_markup():
 html=(ROOT/'index.html').read_text(encoding='utf-8')
 style=(ROOT/'styles.css').read_text(encoding='utf-8')
 js=(ROOT/'app.js').read_text(encoding='utf-8')
 ast=(ROOT/'asistente.js').read_text(encoding='utf-8')
 data={file:(ROOT/file).read_text(encoding='utf-8') for file in ['productos.json','rutas.json','campanas.json']}
 fetch='''<script>window.fetch=async function(url){const files=__DATA__;let key=String(url).split('/').pop().split('?')[0];return {ok:!!files[key],status:files[key]?200:404,json:async()=>JSON.parse(files[key])}}</script>'''.replace('__DATA__',json.dumps(data))
 html=re.sub(r'<link[^>]+href="\./styles\.css(?:\?[^\"]*)?"[^>]*>',lambda m:'<style>'+style+'</style>',html)
 html=re.sub(r'<script src="\./app\.js(?:\?[^\"]*)?"></script>',lambda m:'<script>'+js+'</script>',html)
 html=re.sub(r'<script src="\./asistente\.js(?:\?[^\"]*)?"></script>',lambda m:'<script>'+ast+'</script>',html)
 html=html.replace('<head>','<head>'+fetch,1)
 return html

def test():
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1220,'height':850},device_scale_factor=1)
  errs=[]
  page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(page_markup(),wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function('typeof PRODUCTOS !== "undefined" && PRODUCTOS.length===58')
  assert not errs,errs
  results.append('Catalogo: 58 productos cargados desde productos.json')
  page.locator('#tabAsistente').click()
  phrase='Necesito un link que no tenga utms y que funcione para app si tiene instalado y web. Quiero de compra de deuda'
  page.locator('#assistantRequest').fill(phrase)
  page.locator('#assistantInterpret').click()
  info=page.evaluate('''() => ({channel:document.querySelector('#assistantChannel').value, intent:document.querySelector('#assistantIntent').value, suggestion:!document.querySelector('#assistantRouteSuggestion').classList.contains('hidden'),name:document.querySelector('#assistantRouteSuggestionName').textContent,web:document.querySelector('#assistantRouteSuggestionWeb').textContent,app:document.querySelector('#assistantRouteSuggestionApp').textContent,check:document.querySelector('#assistantChecks').textContent,summary:document.querySelector('#assistantSummary').textContent})''')
  print('ACTUAL CASE:',json.dumps(info,ensure_ascii=False,indent=2))
  assert info['channel']=='other',info
  assert info['intent']=='combinado',info
  assert info['suggestion'],info
  assert info['name']=='Compra de Deuda Extra Línea',info
  assert info['web']=='https://mi.scotiabank.com.pe/login?redirectTo=/u/campaign/CD',info
  assert info['app']=='scotiabankpe:///webView?path=/u/campaign/CD',info
  assert 'Sin UTM' in info['summary'],info
  assert 'utm_campaign está pendiente' not in info['check']
  results.append('Solicitud exacta: Sin UTM, Web+App, sugerencia sin inventar ni exigir canal')
  page.screenshot(path=str(OUT/'PRUEBA_COMPRA_DEUDA_DESKTOP.png'),full_page=True)
  page.get_by_role('button',name='Sí, usar este producto').click()
  assert page.locator('#assistantProduct').input_value()=='compra-de-deuda-extra-linea'
  assert page.locator('#assistantWeb').input_value()==info['web']
  assert page.locator('#assistantApp').input_value()==info['app']
  results.append('Confirmacion: se copian ambas rutas reales de productos.json')
  page.get_by_role('button',name='Aplicar al generador').click()
  assert page.locator('#guidedChannel').input_value()=='other'
  page.get_by_role('button',name='Continuar al paso 3').click()
  assert page.locator('#campaignFields').is_hidden()
  page.get_by_role('button',name='Continuar al paso 4').click()
  page.get_by_role('button',name='Generar enlace →').click()
  final=page.locator('#finalUrl').inner_text()
  vals=parse_qs(urlparse(final).query)
  assert not [k for k in vals if k.startswith('utm_')],vals
  assert vals['embeddedURL'][0]==info['app'], vals
  assert vals['redirectTo'][0]=='/u/campaign/CD',vals
  results.append('Resultado final: URL combinada con embeddedURL, ninguna UTM y redirectTo correcto')
  page.locator('#tabAsistente').click()
  strings=[
    'Quiero compra de deuda sin UTM que abra app y web',
    'Quiero compra de deuda que no lleve UTMs y vaya a la app o la web',
    'Hacer link de compra de deuda sin ninguna utm para app y web',
    'Compra de deuda para app o web: no agregues utms',
    'Comprar deuda, nada de UTMs; app y web',
    'Crear enlace para app o web de compra de deudas, no quiero usar UTM',
    'Compra de deuda, cero utms, web y app'
  ]
  for text in strings:
   page.locator('#assistantRequest').fill(text)
   page.locator('#assistantInterpret').click()
   s=page.locator('#assistantSummary').inner_text()
   assert 'Sin UTM' in s,(text,s)
   assert page.locator('#assistantRouteSuggestion').is_visible(),text
   assert page.locator('#assistantChannel').input_value()=='other',text
  results.append(f'{len(strings)} variaciones naturales de no UTM/compra de deuda reconocidas')
  # Exact catalog product should pre-fill automatically
  page.locator('#assistantRequest').fill('En Meta Ads quiero llevar a Para ti en la app y en la web, utm_campaign=tc_beneficios_tactica_conversion')
  page.locator('#assistantInterpret').click()
  assert page.locator('#assistantProduct').input_value()=='para-ti'
  assert page.locator('#assistantChannel').input_value()=='meta'
  assert page.locator('#assistantWeb').input_value().endswith('/u/marketplace')
  assert page.locator('#assistantApp').input_value()=='scotiabankpe:///notices'
  results.append('Campaña Meta + Para ti: mantiene rutas existentes y UTM')
  # Ambiguous request requires data
  page.locator('#assistantRequest').fill('Necesito un enlace de web o app para un producto nuevo llamado Super Power X, sin UTM')
  page.locator('#assistantInterpret').click()
  assert page.locator('#assistantProduct').input_value()==''
  assert not page.locator('#assistantRouteSuggestion').is_visible()
  assert 'Falta una URL Web válida' in page.locator('#assistantChecks').inner_text()
  results.append('Producto desconocido: no inventa ninguna ruta')
  for w in [1440,768,390,320]:
   page.set_viewport_size({'width':w,'height':840})
   page.locator('#assistantRequest').fill(phrase)
   page.locator('#assistantInterpret').click()
   if w in (390,320): page.screenshot(path=str(OUT/f'PRUEBA_COMPRA_DEUDA_{w}.png'),full_page=True)
   metrics=page.evaluate('''() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth})''')
   assert metrics['scrollWidth']<=metrics['innerWidth']+2,(w,metrics)
  results.append('Responsive: 320/390/768/1440 sin scroll horizontal')
  assert not errs,errs
  results.append('Sin errores JavaScript en el navegador')
  browser.close()
 print('\n'.join(f'OK: {x}' for x in results))
 (OUT/'QA_RESULTADOS.md').write_text('# Resultados de QA v3.4.2\n\n'+'\n'.join('- ✅ '+x for x in results)+'\n\nPruebas ejecutadas localmente en Chromium con JSON reales simulados como respuestas fetch. No se realizaron peticiones de red a Scotiabank.\n',encoding='utf-8')
 return len(results)

if __name__=='__main__':test()
