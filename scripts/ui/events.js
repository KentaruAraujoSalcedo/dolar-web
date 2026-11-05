import { state, setState } from '../state.js';
import { $, $$ } from './dom.js';
import { ensureOppositeSelect, syncAdornmentAndChips } from './labels.js';

export function bindEvents({ onChange }) {
  const montoEl = $('#monto');
  const selTengo = $('#moneda-tengo');
  const selQuiero = $('#moneda-quiero');
  const curHave = $('#cur-have');
  const curWant = $('#cur-want');

  function setMontoFromInput() {
    if (!montoEl) return;
    const raw = String(montoEl.value ?? '').trim().replace(',', '.');
    const val = raw === '' ? NaN : Number(raw);
    setState({ monto: Number.isFinite(val) && val > 0 ? val : NaN });
  }
  function paintCurrencyLine() {
    if (!selTengo || !selQuiero) return;
    if (curHave) curHave.textContent = selTengo.value === 'USD' ? 'Dólares (USD)' : 'Soles (PEN)';
    if (curWant) curWant.textContent = selQuiero.value === 'USD' ? 'Dólares (USD)' : 'Soles (PEN)';
    $$('.currency-tab').forEach(btn => {
      const active = btn.dataset.have === selTengo.value;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    // La compra relevante corresponde a USD -> PEN; la venta a PEN -> USD.
    $$('.rate-tab').forEach(btn => {
      const active = btn.dataset.rate === (selTengo.value === 'USD' ? 'compra' : 'venta');
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    const hint = document.getElementById('comparison-hint');
    if (hint) hint.textContent = selTengo.value === 'USD'
      ? 'Si vendes dólares, una compra más alta te conviene.'
      : 'Si compras dólares, una venta más baja te conviene.';
  }
  function updateInputChips() {
    syncAdornmentAndChips();
    const currency = state.modo === 'necesito' ? state.monedaQuiero : state.monedaTengo;
    const symbol = currency === 'USD' ? '$' : 'S/';
    $$('.quick-amt').forEach(btn => {
      const num = Number(btn.dataset.amt);
      if (Number.isFinite(num)) btn.textContent = `${symbol} ${num.toLocaleString('es-PE')}`;
    });
  }
  function changeDirection(have) {
    if (!selTengo || !selQuiero || !['USD','PEN'].includes(have)) return;
    selTengo.value = have;
    ensureOppositeSelect(selTengo, selQuiero);
    setState({ monedaTengo: selTengo.value, monedaQuiero: selQuiero.value });
    setMontoFromInput();
    updateInputChips();
    paintCurrencyLine();
    onChange({ type: 'currency' });
  }
  $$('input[name="modo"]').forEach(r => r.addEventListener('change', () => {
    if (!r.checked) return;
    setState({ modo: r.value });
    updateInputChips();
    onChange({ type: 'mode' });
  }));
  montoEl?.addEventListener('input', () => {
    setMontoFromInput();
    onChange({ type: 'amount' });
  });
  $$('.quick-amt').forEach(btn => btn.addEventListener('click', () => {
    const amount = Number(btn.dataset.amt);
    if (!montoEl || !Number.isFinite(amount)) return;
    montoEl.value = String(amount);
    montoEl.dispatchEvent(new Event('input', { bubbles: true }));
  }));
  $('#btn-swap')?.addEventListener('click', () => {
    if (!selTengo) return;
    changeDirection(selTengo.value === 'USD' ? 'PEN' : 'USD');
  });
  $$('.currency-tab').forEach(btn => btn.addEventListener('click', () => changeDirection(btn.dataset.have)));
  $$('.rate-tab').forEach(btn => btn.addEventListener('click', () => changeDirection(btn.dataset.rate === 'compra' ? 'USD' : 'PEN')));
  $('#btn-calcular')?.addEventListener('click', () => { setMontoFromInput(); onChange({type:'amount'}); });
  updateInputChips();
  paintCurrencyLine();
}
