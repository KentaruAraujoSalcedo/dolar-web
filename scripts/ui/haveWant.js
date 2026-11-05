// Dirección real del cambio. El modo "necesito" modifica qué monto introduce
// el usuario, no invierte la moneda que tiene ni la que desea obtener.
import { state } from '../state.js';
export function getHaveWant() {
  return { have: state.monedaTengo, want: state.monedaQuiero };
}
