"""Pruebas end-to-end del asistente v3.4, sin APIs externas."""
from pathlib import Path
import json, urllib.parse, sys
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
style=soup.select_one('link[href="./styles.css"]');style.name='style';style.attrs={};style.string=(ROOT/'styles.css').read_text()
files={name:json.loads((ROOT/name).read_text()) for name in ('productos.json','rutas.json','campanas.json')}
script=soup.select_one('script[src="./app.js"]');script.attrs={};script.string='window.fetch=(u)=>Promise.resolve({ok:true,json:async()=>JSON.parse('+json.dumps(json.dumps(files,ensure_ascii=False))+')[String(u).split("/").pop()]});\n'+(ROOT/'app.js').read_text()
second=soup.select_one('script[src="./asistente.js"]');second.attrs={};second.string=(ROOT/'asistente.js').read_text()
html=str(soup)
checks=[]; errors=[]
def ok(desc):checks.append(desc);print('OK',desc,flush=True)
def assert_no_overflow(page):
    d=page.evaluate('({width:document.documentElement.scrollWidth,viewport:window.innerWidth})')
    assert d['width']<=d['viewport']+1,d
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
        page.set_default_timeout(4500)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append('CONSOLE '+m.text) if m.type=='error' else None)
        page.set_content(html,wait_until='load')
        page.wait_for_timeout(150)
        assert page.locator('#moduleGenerador').is_visible()
        assert page.locator('#tabAsistente').is_visible()
        assert page.locator('#dataStatus').inner_text().lower().find('error')<0
        ok('Carga generador, catálogo y asistente sin API')
        page.locator('#tabAsistente').click()
        assert page.locator('#moduleAsistente').is_visible()
        page.screenshot(path=str(ROOT/'qa'/'ASISTENTE_V3_4_ESCRITORIO.png'),full_page=True)
        ok('Pestaña de asistente y diseño escritorio')
        page.locator('[data-assistant-example="meta"]').click()
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantResult').is_visible()
        assert page.locator('#assistantChannel').input_value()=='meta'
        assert page.locator('#assistantIntent').input_value()=='combinado'
        assert page.locator('#assistantProduct').input_value()=='para-ti'
        assert page.locator('#assistantWeb').input_value().endswith('/u/marketplace')
        assert page.locator('#assistantApp').input_value()=='scotiabankpe:///notices'
        assert page.locator('#assistantCampaign').input_value()=='tc_beneficios_tactica_conversion'
        assert page.locator('#assistantDetail').input_value()=='boton_principal'
        ok('Interpreta Meta + Para ti + dos rutas + utm_campaign + detail')
        page.screenshot(path=str(ROOT/'qa'/'ASISTENTE_V3_4_INTERPRETACION.png'),full_page=True)
        page.get_by_role('button',name='Aplicar al generador').click()
        assert page.locator('#moduleGenerador').is_visible()
        assert page.locator('#webUrl').input_value().endswith('/u/marketplace')
        assert page.locator('#appUrl').input_value()=='scotiabankpe:///notices'
        assert page.locator('#guidedChannel').input_value()=='meta'
        assert page.locator('#sourceInternal').input_value()==''
        page.get_by_role('button',name='Continuar al paso 3').click()
        assert page.locator('#utmCampaign').input_value()=='tc_beneficios_tactica_conversion'
        assert page.locator('#utmSource').input_value()=='meta'
        page.get_by_role('button',name='Continuar al paso 4').click()
        page.get_by_role('button',name='Generar enlace →').click()
        final=page.locator('#finalUrl').inner_text()
        u=urllib.parse.urlparse(final);q=urllib.parse.parse_qs(u.query)
        assert q['utm_campaign']==['tc_beneficios_tactica_conversion'] and q['utm_source']==['meta']
        assert q['detail']==['boton_principal']
        assert urllib.parse.parse_qs(urllib.parse.urlparse(q['embeddedURL'][0]).query)['detail']==['boton_principal']
        ok('Aplica al generador y genera URL combinada correctamente')
        page.locator('#tabAsistente').click()
        page.locator('[data-assistant-example="interno"]').click()
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantChannel').input_value()=='internal'
        assert page.locator('#assistantIntent').input_value()=='web'
        assert page.locator('#assistantProduct').input_value()=='cambiar-dolares'
        page.get_by_role('button',name='Aplicar al generador').click()
        page.get_by_role('button',name='Continuar al paso 3').click()
        assert page.locator('#campaignFields').is_hidden()
        assert page.locator('#sourceInternal').input_value()=='campaign'
        assert page.locator('#detail').input_value()=='boton_cambio_dolares'
        page.get_by_role('button',name='Continuar al paso 4').click()
        page.get_by_role('button',name='Generar enlace →').click()
        q=urllib.parse.parse_qs(urllib.parse.urlparse(page.locator('#finalUrl').inner_text()).query)
        assert 'utm_source' not in q and 'embeddedURL' not in q
        assert q['source']==['campaign'] and q['detail']==['boton_cambio_dolares']
        ok('Botón interno conserva source/detail sin UTM')
        page.locator('#tabAsistente').click()
        page.locator('[data-assistant-example="ruta"]').click()
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantApp').input_value()=='scotiabankpe:///webView?path=/u/term/term-deposit/close/init'
        assert page.locator('#assistantWeb').input_value().endswith('/u/term/term-deposit/close/init')
        assert page.locator('#assistantCampaign').input_value()=='depositos_plazo_tactica_conversion'
        ok('Ruta explícita /u genera WebView y login, sin borrar path')
        page.locator('[data-assistant-example="clientes"]').click()
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantIntent').input_value()=='clientes'
        assert 'tecnología' in page.locator('#assistantChecks').inner_text().lower() or 'publicación' in page.locator('#assistantChecks').inner_text().lower()
        page.locator('#assistantFallback').fill('https://www.scotiabank.com.pe/personas')
        page.locator('.assistant-measurement').evaluate('(el) => el.open = true')
        page.locator('#assistantCampaign').fill('crm_clientes_tactica_conversion')
        page.get_by_role('button',name='Aplicar al generador').click()
        page.get_by_role('button',name='Continuar al paso 3').click()
        page.get_by_role('button',name='Continuar al paso 4').click()
        page.get_by_role('button',name='Generar enlace →').click()
        assert page.locator('#copyFinalButton').is_disabled()
        ok('Clientes / No clientes está bloqueado para publicación')
        page.locator('#tabAsistente').click()
        page.locator('#assistantRequest').fill('Quiero mandar un enlace nuevo a cualquier sitio sin ruta ni canal exacto.')
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantChannel').input_value()==''
        assert 'indica dónde compartirás' in page.locator('#assistantChecks').inner_text().lower()
        assert 'falta una url web' in page.locator('#assistantChecks').inner_text().lower()
        ok('Solicitud ambigua no inventa destinos; pide completar')
        # Caso real reportado por Marketing: producto parcial, sin canal, sin UTM y App/Web.
        page.locator('#assistantRequest').fill('Quiero un link para compra de deuda sin utms pero que me lleve al app o a web.')
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantChannel').input_value()=='other'
        assert page.locator('#assistantIntent').input_value()=='combinado'
        assert page.locator('#assistantProduct').input_value()==''  # No asumir Extra Línea
        assert page.locator('#assistantRouteSuggestion').is_visible()
        assert 'Compra de Deuda Extra Línea' in page.locator('#assistantRouteSuggestion').inner_text()
        assert 'utm_source' not in page.locator('#assistantChecks').inner_text().lower()
        assert 'utm_campaign está pendiente' not in page.locator('#assistantChecks').inner_text().lower()
        assert '1 dato(s) por revisar' in page.locator('#assistantChecks').inner_text()
        page.screenshot(path=str(ROOT/'qa'/'ASISTENTE_V3_4_1_COMPRA_DEUDA.png'),full_page=True)
        ok('Sin UTM ni canal no bloquea; sugiere Compra de Deuda Extra Línea sin inventar ruta')
        page.get_by_role('button',name='Sí, es ese producto').click()
        assert page.locator('#assistantProduct').input_value()=='compra-de-deuda-extra-linea'
        assert page.locator('#assistantWeb').input_value()=='https://mi.scotiabank.com.pe/login?redirectTo=/u/campaign/CD'
        assert page.locator('#assistantApp').input_value()=='scotiabankpe:///webView?path=/u/campaign/CD'
        assert '0 dato(s) por revisar' not in page.locator('#assistantChecks').inner_text()
        page.get_by_role('button',name='Aplicar al generador').click()
        assert page.locator('#guidedChannel').input_value()=='other'
        page.get_by_role('button',name='Continuar al paso 3').click()
        assert page.locator('#campaignFields').is_hidden()
        page.get_by_role('button',name='Continuar al paso 4').click()
        page.get_by_role('button',name='Generar enlace →').click()
        debt_final=page.locator('#finalUrl').inner_text()
        debt_params=urllib.parse.parse_qs(urllib.parse.urlparse(debt_final).query)
        assert not any(k.startswith('utm_') for k in debt_params), debt_params
        assert debt_params['embeddedURL'][0]=='scotiabankpe:///webView?path=/u/campaign/CD'
        ok('Tras confirmar el producto, genera combinado sin ninguna UTM')
        page.locator('#tabAsistente').click()
        page.locator('#assistantRequest').fill('Enviar a Cuenta Digital desde correo, directo a Open Market sin App.')
        page.locator('#assistantInterpret').click()
        assert 'Open Market' in page.locator('#assistantChecks').inner_text()
        assert page.locator('#assistantWeb').input_value()==''
        ok('No confunde KYC con Open Market')
        page.locator('#assistantRequest').fill('Hacer un link de email para un sitio. source=campaign detail=boton_a utm_source=masterbase utm_medium=email utm_campaign=tc_comprasexterior-millas_tactica_conversion')
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantSource').input_value()=='campaign'
        assert page.locator('#assistantUtmSource').input_value()=='masterbase'
        assert page.locator('#assistantDetail').input_value()=='boton_a'
        assert page.locator('#assistantCampaign').input_value()=='tc_comprasexterior-millas_tactica_conversion'
        ok('Distingue source de utm_source y permite campaña manual')
        page.locator('#assistantRequest').fill('Para una campaña quiero pegar <img src=x onerror=alert(1)> y que abra web')
        page.locator('#assistantInterpret').click()
        assert page.locator('#assistantResult img').count()==0
        ok('Entrada maliciosa no se inyecta como HTML')
        # Casos semánticos para evitar confundir audiencia y routing
        core=page.evaluate("""() => {
            const c=window.ASISTENTE_CORE;
            const norm=c.normalize;
            return {
                onlyWeb:c.detectIntent(norm('Email para no clientes, enviar a landing web')),
                routing:c.detectIntent(norm('Si no es cliente mandarlo a una landing')),
                noApp:c.detectIntent(norm('Cuenta digital directo a Open Market sin App')),
                campaign:c.interpret('Meta Ads, producto=tc campaña=millaspromo tipo=tactica objetivo=conversion', []).campaign,
                detail:c.interpret('Quiero identificar el botón principal en la landing', []).detail,
                noUtm:c.interpret('Quiero Meta sin UTM', []).noUtm
            };
        }""")
        assert core['onlyWeb']=='web',core
        assert core['routing']=='clientes',core
        assert core['noApp']=='web',core
        assert core['campaign']=='tc_millaspromo_tactica_conversion',core
        assert core['detail']=='boton_principal',core
        assert core['noUtm'] is True,core
        ok('Ambigüedades: público no cliente ≠ enrutamiento y «sin App» ≠ Solo App')
        ok('Campaña de 4 campos, detail semántico y solicitud externa sin UTM')
        for w in (1440,1024,768,390,320):
            page.set_viewport_size({'width':w,'height':860})
            page.locator('#tabAsistente').click()
            assert_no_overflow(page)
            if w in (390,320):
                page.screenshot(path=str(ROOT/'qa'/f'ASISTENTE_V3_4_MOVIL_{w}.png'),full_page=True)
            page.locator('#tabGenerador').click()
            assert_no_overflow(page)
            ok(f'Sin desplazamiento horizontal en asistente ni generador ({w}px)')
        assert not errors,errors
        ok('Sin errores de JavaScript en Chromium')
        browser.close()
finally:
    pass
print(f'RESULTADO: {len(checks)} pruebas aprobadas')
