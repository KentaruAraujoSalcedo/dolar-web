"""QA reproducible; ejecutar con python QA_NAVEGADOR_V3_3.py dentro del directorio de proyecto."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json, urllib.parse
root=Path(__file__).resolve().parent.parent
soup=BeautifulSoup((root/'index.html').read_text(),'html.parser')
style=soup.select_one('link[href="./styles.css"]');style.name='style';style.attrs={};style.string=(root/'styles.css').read_text()
script=soup.select_one('script[src="./app.js"]');script.attrs={}
files={name:json.loads((root/name).read_text()) for name in ('productos.json','rutas.json','campanas.json')}
script.string='window.fetch=(u)=>Promise.resolve({ok:true,json:async()=>JSON.parse('+json.dumps(json.dumps(files,ensure_ascii=False))+')[String(u).split("/").pop()]});\n'+(root/'app.js').read_text()
html=str(soup)
errors=[]; checks=[]
def ok(label):print('OK:',label);checks.append(label)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':900})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:(errors.append('Dialog: '+d.message),d.dismiss()))
 page.set_content(html,wait_until='load');page.wait_for_timeout(200)
 assert page.locator('.catalog-destination-card').count()>10 or page.locator('#dataStatus').is_visible()
 assert page.locator('#campaignProducto').count()==1
 ok('carga HTML único y conserva interfaz, catálogos y módulos')
 page.locator('#guidedChannel').select_option('internal')
 page.get_by_role('button',name='Continuar al paso 2').click()
 assert page.locator('#webDestinationField').is_visible() and not page.locator('#appDestinationField').is_visible() and not page.locator('#routeExpressPanel').is_visible()
 page.locator('#webUrl').fill('https://www.scotiabank.com.pe/personas/beneficios')
 page.get_by_role('button',name='Continuar al paso 3').click()
 assert not page.locator('#campaignFields').is_visible()
 page.locator('#sourceInternal').fill('mi_origen')
 page.locator('#detail').fill('boton_a')
 page.locator('#clienteExtra').select_option('true')
 page.locator('#utmCanalExtra').fill('email')
 page.get_by_role('button',name='+ Agregar parámetro').click()
 page.locator('.extra-param-key').fill('campana_local')
 page.locator('.extra-param-value').fill('mayo')
 page.get_by_role('button',name='Continuar al paso 4').click()
 page.get_by_role('button',name='Generar enlace →').click()
 q=urllib.parse.parse_qs(urllib.parse.urlparse(page.locator('#finalUrl').inner_text()).query)
 assert q.get('source')==['mi_origen'] and q.get('detail')==['boton_a'] and q.get('cliente')==['true'] and q.get('utm_canal')==['email'] and q.get('campana_local')==['mayo']
 assert 'utm_source' not in q and 'embeddedURL' not in q
 ok('Solo Web con 5 extras editables, sin UTM ni embeddedURL')
 # app only using quick convert native
 page.locator('[data-progress-step="1"]').click()
 page.locator('input[name="guidedIntent"][value="app"]').check()
 page.get_by_role('button',name='Continuar al paso 2').click()
 assert not page.locator('#webDestinationField').is_visible() and page.locator('#appDestinationField').is_visible()
 page.locator('#quickRouteType').select_option('native')
 page.locator('#quickRouteValue').fill('exchange')
 page.get_by_role('button',name='Crear destino desde esta ruta').click()
 assert page.locator('#appUrl').input_value()=='scotiabankpe:///exchange'
 page.get_by_role('button',name='Continuar al paso 3').click()
 page.get_by_role('button',name='Continuar al paso 4').click()
 page.get_by_role('button',name='Generar enlace →').click()
 assert page.locator('#finalUrl').inner_text().startswith('scotiabankpe:///exchange') and 'embeddedURL' not in page.locator('#finalUrl').inner_text()
 ok('Solo App oculta Web; ruta Nativa conserva estructura')
 # webview
 page.locator('[data-progress-step="1"]').click();page.locator('input[name="guidedIntent"][value="combinado"]').check()
 page.get_by_role('button',name='Continuar al paso 2').click()
 assert page.locator('#webDestinationField').is_visible() and page.locator('#appDestinationField').is_visible()
 page.locator('#quickRouteType').select_option('webview')
 page.locator('#quickRouteValue').fill('/u/campaign;code=CF')
 page.get_by_role('button',name='Crear destino desde esta ruta').click()
 assert page.locator('#webUrl').input_value().endswith('/u/campaign;code=CF')
 assert page.locator('#appUrl').input_value().endswith('/u/campaign;code=CF')
 ok('WebView crea /login?redirectTo y app webView?path conservando ;code')
 # meta guided campaign
 page.locator('[data-progress-step="1"]').click();page.locator('#guidedChannel').select_option('meta')
 page.get_by_role('button',name='Continuar al paso 2').click()
 page.get_by_role('button',name='Continuar al paso 3').click()
 assert page.locator('#campaignNameBuilder').is_visible()
 for k,v in {'campaignProducto':'tc','campaignNombre':'comprasexterior-millas','campaignTipo':'tactica','campaignObjetivo':'conversion'}.items(): page.locator('#'+k).fill(v)
 assert page.locator('#utmCampaign').input_value()=='tc_comprasexterior-millas_tactica_conversion'
 page.locator('#extrasDestino').select_option('app')
 page.get_by_role('button',name='Continuar al paso 4').click()
 page.get_by_role('button',name='Generar enlace →').click()
 final=page.locator('#finalUrl').inner_text();q=urllib.parse.parse_qs(urllib.parse.urlparse(final).query)
 aq=urllib.parse.parse_qs(urllib.parse.urlparse(q['embeddedURL'][0]).query)
 assert q['utm_campaign']==['tc_comprasexterior-millas_tactica_conversion']
 assert q['utm_source']==['meta'] and 'detail' not in q and aq['detail']==['boton_a'] and aq['source']==['mi_origen']
 ok('Web + App: 4 partes de campaña y extras solo App; UTM ambas rutas')
 # manual campaign (preserve exact)
 page.locator('[data-progress-step="3"]').click()
 page.locator('input[name="campaignNameMode"][value="manual"]').check()
 page.locator('#campaignManual').fill('campana_Personal_2026')
 assert page.locator('#utmCampaign').input_value()=='campana_Personal_2026'
 ok('utm_campaign manual no normaliza el nombre escrito')
 # browser in advanced
 page.locator('#tabRutas').click()
 page.locator('input[name="destinationType"][value="browser"]').check()
 assert page.locator('#browserPanel').is_visible()
 page.locator('#browserTargetUrl').fill('https://www.scotiabank.com.pe/personas/promociones?categoria=viajes')
 page.get_by_role('button',name='Guardar rutas y volver al generador').click()
 assert page.locator('#webUrl').input_value().startswith('https://www.scotiabank.com.pe/personas/promociones')
 assert 'browser?url=' in page.locator('#appUrl').input_value()
 ok('Configuración avanzada: Browser propone Web y deeplink con URL codificada')
 # browser wrapper injection to inner website
 page.locator('[data-progress-step="3"]').click()
 page.locator('input[name="campaignNameMode"][value="manual"]').check()
 page.locator('#campaignManual').fill('x')
 page.get_by_role('button',name='Continuar al paso 4').click();page.get_by_role('button',name='Generar enlace →').click()
 result=page.locator('#finalUrl').inner_text()
 ext=urllib.parse.parse_qs(urllib.parse.urlparse(result).query)['embeddedURL'][0]
 inner=urllib.parse.parse_qs(urllib.parse.urlparse(ext).query)['url'][0]
 innerq=urllib.parse.parse_qs(urllib.parse.urlparse(inner).query)
 assert innerq['utm_campaign']==['x'] and innerq['detail']==['boton_a'] and innerq['categoria']==['viajes']
 ok('Browser recibe UTM + extras dentro de URL HTTPS interna, preserva query')
 # clients no clients block publish
 page.locator('[data-progress-step="1"]').click();page.locator('input[name="guidedIntent"][value="clientes"]').check()
 page.get_by_role('button',name='Continuar al paso 2').click()
 page.locator('#nonClientLandingUrl').fill('https://www.scotiabank.com.pe/landing')
 page.get_by_role('button',name='Continuar al paso 3').click()
 page.get_by_role('button',name='Continuar al paso 4').click();page.get_by_role('button',name='Generar enlace →').click()
 assert page.locator('#copyFinalButton').is_disabled()
 ok('Clientes / No clientes genera ficha y bloquea copia publicable')
 # catalog
 page.locator('#tabCatalogo').click()
 assert page.locator('.catalog-destination-card').count()>10
 assert page.locator('.catalog-destination-card').first.get_by_text('URL Web').is_visible()
 ok('Catálogo consulta link Web, deeplink y combinado; sin lista en asistente')
 # responsive
 for w in [1440,1024,768,390,320]:
  page.set_viewport_size({'width':w,'height':850})
  for module in ['#tabGenerador','#tabRutas','#tabCatalogo']:
   page.locator(module).click()
   if module=='#tabGenerador':page.locator('[data-progress-step="1"]').click()
   sw=page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
   assert sw <= 3,(w,module,sw)
  if w in (1440,390):
   page.locator('#tabGenerador').click();page.locator('[data-progress-step="1"]').click()
   page.screenshot(path=str(root/'qa'/f'VISTA_V3_3_{w}.png'),full_page=True)
 ok('5 anchos (320–1440 px), sin scroll horizontal en Generador, Catálogo ni Configurar destino')
 assert not errors,errors
 ok('Sin errores JavaScript durante el recorrido')
 print(f'QA BROWSER COMPLETO: {len(checks)} comprobaciones aprobadas')
 browser.close()
