'use strict';
/* ManteniPro · app.js
   Secciones: utilidades · capa de datos · reglas · validación · renderizado · acciones · eventos · arranque */

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoy = () => iso(new Date());
const desplazar = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const diasHasta = f => Math.round((new Date(f + 'T00:00:00') - new Date(hoy() + 'T00:00:00')) / 864e5);
const fmtFecha = f => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const codOrden = id => 'OT-' + String(id).padStart(4, '0');

const DIAS_AVISO = 7;
const ESTADOS = { pendiente: ['Pendiente', '◔'], en_curso: ['En curso', '◑'], completada: ['Completada', '●'] };
const TITULOS = { dashboard: 'Panel principal', equipos: 'Equipos', ordenes: 'Órdenes de trabajo', mantenimientos: 'Pendientes y revisiones', api: 'Documentación API' };

let state = { equipos: [], ordenes: [], seq: { equipo: 0, orden: 100 } };
let confirmCb = null;

/* ---------- Capa de datos (localStorage) ----------
   INTEGRACIÓN BACKEND: sustituir load()/save() y las mutaciones de "acciones"
   por llamadas fetch a /api/v1/... cuando el backend esté disponible. */
const KEY = 'manteniPro.v1';

function datosDemo() {
  const equipos = [
    { id: 1, nombre: 'Bomba hidráulica principal', codigo: 'BH-101', ubicacion: 'Planta baja · Sala de bombas', fechaRevision: desplazar(-3) },
    { id: 2, nombre: 'Compresor de aire industrial', codigo: 'EQ-202', ubicacion: 'Nave 2 · Sector B', fechaRevision: desplazar(2) },
    { id: 3, nombre: 'Generador eléctrico diésel', codigo: 'GEN-30', ubicacion: 'Exterior · Zona sur', fechaRevision: desplazar(25) },
    { id: 4, nombre: 'Cinta transportadora', codigo: 'CT-004', ubicacion: 'Línea de empaque', fechaRevision: desplazar(5) }
  ];
  const ordenes = [
    { id: 101, equipoId: 2, descripcion: 'Revisión de niveles de aceite y cambio de filtros', fecha: desplazar(2), estado: 'en_curso', observaciones: 'Técnico en sitio realizando pruebas de presión.' },
    { id: 102, equipoId: 1, descripcion: 'Inspección de sellos mecánicos y prueba de vibración', fecha: desplazar(-1), estado: 'pendiente', observaciones: 'Repuestos listos en almacén.' },
    { id: 103, equipoId: 4, descripcion: 'Ajuste de tensión de banda y lubricación de rodamientos', fecha: desplazar(-6), estado: 'completada', observaciones: 'Trabajo finalizado sin novedades.' }
  ];
  return { equipos, ordenes, seq: { equipo: 4, orden: 103 } };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) { state = datosDemo(); save(); return; }
    const d = JSON.parse(raw);
    if (!Array.isArray(d.equipos) || !Array.isArray(d.ordenes) || !d.seq) throw new Error('Formato no válido');
    state = d;
  } catch (err) {
    console.error(err);
    state = datosDemo();
    toast('No se pudieron leer los datos guardados; se muestran los datos de demostración.', true);
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch (err) { console.error(err); toast('No se pudieron guardar los cambios en este navegador.', true); return false; }
}

/* ---------- Reglas de negocio ---------- */
const equipoPorId = id => state.equipos.find(e => e.id === Number(id));

function estadoRevision(fecha) {
  const d = diasHasta(fecha);
  if (d < 0) return { tipo: 'vencida', dias: d, texto: `Vencida hace ${plural(-d, 'día', 'días')}`, simbolo: '⚠' };
  if (d <= DIAS_AVISO) return { tipo: 'proxima', dias: d, texto: d === 0 ? 'Vence hoy' : `Vence en ${plural(d, 'día', 'días')}`, simbolo: '◔' };
  return { tipo: 'aldia', dias: d, texto: 'Al día', simbolo: '✓' };
}

function resumen() {
  const rev = { vencida: [], proxima: [], aldia: [] };
  state.equipos.forEach(e => rev[estadoRevision(e.fechaRevision).tipo].push(e));
  const cuenta = est => state.ordenes.filter(o => o.estado === est).length;
  const abiertas = state.ordenes.filter(o => o.estado !== 'completada');
  const atrasadas = abiertas.filter(o => diasHasta(o.fecha) < 0);
  rev.vencida.sort((a, b) => a.fechaRevision.localeCompare(b.fechaRevision));
  rev.proxima.sort((a, b) => a.fechaRevision.localeCompare(b.fechaRevision));
  return { rev, abiertas, atrasadas, pendientes: cuenta('pendiente'), enCurso: cuenta('en_curso'), completadas: cuenta('completada') };
}

function mensajeAsistente(r) {
  if (!state.equipos.length) return 'Aún no hay equipos registrados. Comience dando de alta el primero y yo me encargo de vigilar sus revisiones.';
  if (r.rev.vencida.length) return `Hay ${plural(r.rev.vencida.length, 'revisión vencida', 'revisiones vencidas')} que requieren su atención inmediata.`;
  if (r.atrasadas.length) return `Hay ${plural(r.atrasadas.length, 'orden', 'órdenes')} con la fecha programada ya superada.`;
  if (r.rev.proxima.length) return 'Hay revisiones próximas que conviene atender.';
  if (r.abiertas.length) return 'La jornada está organizada. Estas son sus tareas prioritarias.';
  return 'Todo bajo control.';
}

/* ---------- Validación ---------- */
function validarEquipo(v) {
  const e = {};
  if (!v.nombre) e.nombre = 'Indique el nombre del equipo.';
  if (v.codigo.length < 3) e.codigo = 'El código debe tener al menos 3 caracteres.';
  else if (state.equipos.some(q => q.id !== v.id && q.codigo.toLowerCase() === v.codigo.toLowerCase())) e.codigo = 'Ya existe un equipo con ese código.';
  if (!v.ubicacion) e.ubicacion = 'Indique la ubicación.';
  if (!v.fecha) e.fecha = 'Seleccione una fecha de revisión.';
  return e;
}

function validarOrden(v) {
  const e = {};
  if (!v.equipoId || !equipoPorId(v.equipoId)) e.equipo = 'Seleccione un equipo registrado.';
  if (!v.descripcion) e.descripcion = 'Describa el trabajo a realizar.';
  if (!v.fecha) e.fecha = 'Indique la fecha programada.';
  return e;
}

function mostrarErrores(prefijo, errores, campos) {
  campos.forEach(c => {
    const msg = $(`err-${prefijo}-${c}`), input = $(`${prefijo}-${c}`);
    msg.textContent = errores[c] || '';
    msg.hidden = !errores[c];
    input.setAttribute('aria-invalid', errores[c] ? 'true' : 'false');
    if (errores[c]) input.setAttribute('aria-describedby', msg.id); else input.removeAttribute('aria-describedby');
  });
  const primero = campos.find(c => errores[c]);
  if (primero) $(`${prefijo}-${primero}`).focus();
}

/* ---------- Renderizado ---------- */
const badgeOrden = est => `<span class="badge badge--${esc(est)}"><span aria-hidden="true">${ESTADOS[est][1]}</span>${ESTADOS[est][0]}</span>`;
const badgeRevision = r => `<span class="badge badge--${r.tipo}"><span aria-hidden="true">${r.simbolo}</span>${esc(r.texto)}</span>`;

function renderTodo() {
  renderOpcionesEquipo();
  renderDashboard();
  renderEquipos();
  renderOrdenes();
  renderMantenimientos();
}

function renderDashboard() {
  const r = resumen(), total = state.equipos.length;
  const hora = new Date().getHours();
  $('greeting').textContent = hora < 13 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches';
  $('assistant-msg').textContent = mensajeAsistente(r);
  $('kpi-equipos').textContent = total;
  $('kpi-pendientes').textContent = r.pendientes;
  $('kpi-encurso').textContent = r.enCurso;
  $('kpi-completadas').textContent = r.completadas;
  $('kpi-proximas').textContent = r.rev.proxima.length;
  $('kpi-vencidas').textContent = r.rev.vencida.length;
  $('nav-count').textContent = r.abiertas.length + r.rev.vencida.length + r.rev.proxima.length;

  const pct = n => total ? Math.round(n / total * 100) : 0;
  const filas = [['ok', 'Al día', r.rev.aldia.length], ['warn', 'Próximas a vencer', r.rev.proxima.length], ['danger', 'Vencidas', r.rev.vencida.length]];
  $('health').innerHTML = total
    ? `<div class="bar" role="img" aria-label="${filas.map(f => `${f[1]}: ${f[2]}`).join(', ')}">${filas.map(f => `<span class="seg--${f[0]}" style="width:${pct(f[2])}%"></span>`).join('')}</div>
       <ul class="legend">${filas.map(f => `<li><span><span class="dot seg--${f[0]}"></span>${f[1]}</span><strong>${f[2]} (${pct(f[2])} %)</strong></li>`).join('')}</ul>`
    : '<p class="empty">Sin equipos que mostrar.</p>';

  const avisos = [];
  r.rev.vencida.forEach(e => avisos.push(['danger', `Revisión vencida: ${e.nombre} (${e.codigo}), ${estadoRevision(e.fechaRevision).texto.toLowerCase()}.`]));
  r.rev.proxima.forEach(e => avisos.push(['warn', `${e.nombre} (${e.codigo}): ${estadoRevision(e.fechaRevision).texto.toLowerCase()}.`]));
  r.atrasadas.forEach(o => avisos.push(['warn', `${codOrden(o.id)} sigue sin finalizar y estaba programada para el ${fmtFecha(o.fecha)}.`]));
  if (!avisos.length) avisos.push(['ok', total ? 'Sin avisos. Todo bajo control.' : 'Sin avisos por ahora.']);
  const icono = { danger: '⚠', warn: '◔', ok: '✓' };
  $('avisos').innerHTML = avisos.map(a => `<li class="notice notice--${a[0]}"><span aria-hidden="true">${icono[a[0]]}</span><span>${esc(a[1])}</span></li>`).join('');

  const recientes = [...state.ordenes].sort((a, b) => b.id - a.id).slice(0, 5);
  $('dash-ordenes').innerHTML = recientes.map(o => {
    const e = equipoPorId(o.equipoId);
    return `<tr><td class="code">${codOrden(o.id)}</td><td>${esc(e?.nombre)}<span class="sub">${esc(e?.codigo)}</span></td><td>${esc(o.descripcion)}</td><td>${fmtFecha(o.fecha)}</td><td>${badgeOrden(o.estado)}</td></tr>`;
  }).join('');
  $('dash-ordenes-empty').hidden = recientes.length > 0;
}

function renderEquipos() {
  const q = $('search-equipos').value.trim().toLowerCase();
  const lista = state.equipos.filter(e => !q || e.nombre.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q));
  $('equipos-body').innerHTML = lista.map(e => `<tr>
    <td class="code">${esc(e.codigo)}</td><td><strong>${esc(e.nombre)}</strong></td><td>${esc(e.ubicacion)}</td>
    <td>${fmtFecha(e.fechaRevision)}<span class="sub">${badgeRevision(estadoRevision(e.fechaRevision))}</span></td>
    <td><div class="actions">
      <button class="btn btn--ghost btn--sm" data-action="historial" data-id="${e.id}">Historial</button>
      <button class="btn btn--ghost btn--sm" data-action="edit-equipo" data-id="${e.id}">Editar</button>
      <button class="btn btn--ghost btn--sm" data-action="del-equipo" data-id="${e.id}">Eliminar</button>
    </div></td></tr>`).join('');
  const vacio = $('equipos-empty');
  vacio.hidden = lista.length > 0;
  vacio.textContent = state.equipos.length ? 'Ningún equipo coincide con la búsqueda.' : 'No hay equipos registrados. Use «Registrar equipo» para añadir el primero.';
}

function renderOpcionesEquipo() {
  const opciones = state.equipos.map(e => `<option value="${e.id}">${esc(e.nombre)} (${esc(e.codigo)})</option>`).join('');
  const fe = $('filter-equipo'), actual = fe.value;
  fe.innerHTML = '<option value="">Todos los equipos</option>' + opciones;
  fe.value = state.equipos.some(e => String(e.id) === actual) ? actual : '';
  const oe = $('ord-equipo'), sel = oe.value;
  oe.innerHTML = '<option value="">— Seleccione un equipo —</option>' + opciones;
  oe.value = sel;
}

function renderOrdenes() {
  const fe = $('filter-equipo').value, fs = $('filter-estado').value, ff = $('filter-fecha').value;
  const lista = state.ordenes.filter(o => (!fe || o.equipoId === Number(fe)) && (!fs || o.estado === fs) && (!ff || o.fecha === ff))
    .sort((a, b) => b.id - a.id);
  $('ordenes-body').innerHTML = lista.map(o => {
    const e = equipoPorId(o.equipoId);
    return `<tr><td class="code">${codOrden(o.id)}</td><td>${esc(e?.nombre)}<span class="sub">${esc(e?.codigo)}</span></td>
      <td>${esc(o.descripcion)}</td><td>${fmtFecha(o.fecha)}</td><td>${badgeOrden(o.estado)}</td>
      <td>${esc(o.observaciones) || '—'}</td>
      <td><button class="btn btn--ghost btn--sm" data-action="edit-orden" data-id="${o.id}">Editar</button></td></tr>`;
  }).join('');
  const vacio = $('ordenes-empty');
  vacio.hidden = lista.length > 0;
  vacio.textContent = state.ordenes.length ? 'Ninguna orden coincide con los filtros seleccionados.' : 'No hay órdenes de trabajo. Use «Crear orden» para registrar la primera.';
}

function itemRevision(e) {
  const r = estadoRevision(e.fechaRevision);
  return `<li class="task"><div><strong>${esc(e.nombre)}</strong><small>${esc(e.codigo)} · ${esc(e.ubicacion)} · Revisión: ${fmtFecha(e.fechaRevision)}</small>${badgeRevision(r)}</div>
    <div class="task-actions"><button class="btn btn--ghost btn--sm" data-action="nueva-orden-equipo" data-id="${e.id}">Crear orden</button>
    <button class="btn btn--ghost btn--sm" data-action="edit-equipo" data-id="${e.id}">Editar</button></div></li>`;
}

function renderMantenimientos() {
  const r = resumen();
  $('mant-msg').textContent = mensajeAsistente(r);
  const vacio = t => `<li class="empty">${t}</li>`;
  $('list-vencidas').innerHTML = r.rev.vencida.map(itemRevision).join('') || vacio('Ninguna revisión vencida.');
  $('list-proximas').innerHTML = r.rev.proxima.map(itemRevision).join('') || vacio('Ninguna revisión próxima.');
  $('list-abiertas').innerHTML = [...r.abiertas].sort((a, b) => a.fecha.localeCompare(b.fecha)).map(o => {
    const e = equipoPorId(o.equipoId), atras = diasHasta(o.fecha) < 0;
    return `<li class="task"><div><strong>${codOrden(o.id)} · ${esc(e?.nombre)}</strong><small>${esc(o.descripcion)}</small>
      <small>Programada: ${fmtFecha(o.fecha)}${atras ? ' · <strong>Fecha superada</strong>' : ''}</small>${badgeOrden(o.estado)}</div>
      <div class="task-actions"><button class="btn btn--ghost btn--sm" data-action="edit-orden" data-id="${o.id}">Editar</button></div></li>`;
  }).join('') || vacio('No hay órdenes sin finalizar.');
}

function abrirHistorial(id) {
  const e = equipoPorId(id);
  if (!e) return;
  $('hist-title').textContent = `Historial · ${e.nombre}`;
  $('hist-sub').textContent = `${e.codigo} · ${e.ubicacion}`;
  const lista = state.ordenes.filter(o => o.equipoId === e.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  $('hist-list').innerHTML = lista.map(o => `<li class="task"><div><strong>${codOrden(o.id)} · ${fmtFecha(o.fecha)}</strong>
    <small>${esc(o.descripcion)}</small><small>Observaciones: ${esc(o.observaciones) || 'Sin observaciones'}</small></div>${badgeOrden(o.estado)}</li>`).join('')
    || '<li class="empty">Este equipo todavía no tiene órdenes de mantenimiento registradas.</li>';
  $('dlg-historial').showModal();
}

/* ---------- Acciones (crear / editar / eliminar) ---------- */
function abrirEquipo(id) {
  const e = id ? equipoPorId(id) : null;
  $('dlg-equipo-title').textContent = e ? 'Editar equipo' : 'Registrar equipo';
  $('eq-id').value = e ? e.id : '';
  $('eq-nombre').value = e?.nombre ?? '';
  $('eq-codigo').value = e?.codigo ?? '';
  $('eq-ubicacion').value = e?.ubicacion ?? '';
  $('eq-fecha').value = e?.fechaRevision ?? '';
  mostrarErrores('eq', {}, ['nombre', 'codigo', 'ubicacion', 'fecha']);
  $('dlg-equipo').showModal();
  $('eq-nombre').focus();
}

function guardarEquipo(ev) {
  ev.preventDefault();
  const v = { id: Number($('eq-id').value) || null, nombre: $('eq-nombre').value.trim(), codigo: $('eq-codigo').value.trim(), ubicacion: $('eq-ubicacion').value.trim(), fecha: $('eq-fecha').value };
  const errores = validarEquipo(v);
  mostrarErrores('eq', errores, ['nombre', 'codigo', 'ubicacion', 'fecha']);
  if (Object.keys(errores).length) return;
  if (v.id) {
    Object.assign(equipoPorId(v.id), { nombre: v.nombre, codigo: v.codigo, ubicacion: v.ubicacion, fechaRevision: v.fecha });
  } else {
    state.equipos.push({ id: ++state.seq.equipo, nombre: v.nombre, codigo: v.codigo, ubicacion: v.ubicacion, fechaRevision: v.fecha });
  }
  if (save()) toast(v.id ? 'Equipo actualizado correctamente.' : 'Equipo registrado correctamente.');
  $('dlg-equipo').close();
  renderTodo();
}

function pedirEliminarEquipo(id) {
  const e = equipoPorId(id);
  if (!e) return;
  const n = state.ordenes.filter(o => o.equipoId === e.id).length;
  $('confirm-text').textContent = `¿Eliminar «${e.nombre}» (${e.codigo})?` + (n ? ` También se eliminarán sus ${plural(n, 'orden asociada', 'órdenes asociadas')} para no dejar referencias rotas.` : '') + ' Esta acción no se puede deshacer.';
  confirmCb = () => {
    state.equipos = state.equipos.filter(q => q.id !== e.id);
    state.ordenes = state.ordenes.filter(o => o.equipoId !== e.id);
    if (save()) toast('Equipo eliminado.');
    renderTodo();
  };
  $('dlg-confirm').showModal();
}

function abrirOrden(id, equipoId) {
  if (!state.equipos.length) { toast('Registre primero un equipo para poder crear órdenes.', true); return; }
  const o = id ? state.ordenes.find(x => x.id === Number(id)) : null;
  $('dlg-orden-title').textContent = o ? `Editar ${codOrden(o.id)}` : 'Crear orden de trabajo';
  $('ord-id').value = o ? o.id : '';
  $('ord-equipo').value = o ? o.equipoId : (equipoId || '');
  $('ord-descripcion').value = o?.descripcion ?? '';
  $('ord-fecha').value = o?.fecha ?? '';
  $('ord-estado').value = o?.estado ?? 'pendiente';
  $('ord-observaciones').value = o?.observaciones ?? '';
  mostrarErrores('ord', {}, ['equipo', 'descripcion', 'fecha']);
  $('dlg-orden').showModal();
  $('ord-equipo').focus();
}

function guardarOrden(ev) {
  ev.preventDefault();
  const v = { id: Number($('ord-id').value) || null, equipoId: Number($('ord-equipo').value) || null, descripcion: $('ord-descripcion').value.trim(), fecha: $('ord-fecha').value, estado: $('ord-estado').value, observaciones: $('ord-observaciones').value.trim() };
  const errores = validarOrden(v);
  mostrarErrores('ord', errores, ['equipo', 'descripcion', 'fecha']);
  if (Object.keys(errores).length) return;
  if (v.id) {
    Object.assign(state.ordenes.find(o => o.id === v.id), { equipoId: v.equipoId, descripcion: v.descripcion, fecha: v.fecha, estado: v.estado, observaciones: v.observaciones });
  } else {
    state.ordenes.push({ id: ++state.seq.orden, equipoId: v.equipoId, descripcion: v.descripcion, fecha: v.fecha, estado: v.estado, observaciones: v.observaciones });
  }
  if (save()) toast(v.id ? 'Orden actualizada correctamente.' : 'Orden creada correctamente.');
  $('dlg-orden').close();
  renderTodo();
}

/* ---------- Navegación y avisos ---------- */
function irA(vista) {
  document.querySelectorAll('.view').forEach(s => { s.hidden = s.id !== `view-${vista}`; });
  document.querySelectorAll('.nav-btn').forEach(b => {
    const on = b.dataset.view === vista;
    b.classList.toggle('is-active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('page-title').textContent = TITULOS[vista];
  cerrarMenu();
  $('main').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function abrirMenu() { $('sidebar').classList.add('is-open'); $('scrim').hidden = false; $('btn-menu').setAttribute('aria-expanded', 'true'); }
function cerrarMenu() { $('sidebar').classList.remove('is-open'); $('scrim').hidden = true; $('btn-menu').setAttribute('aria-expanded', 'false'); }

function toast(msg, error = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (error ? ' toast--error' : '');
  t.textContent = msg;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

/* ---------- Eventos ---------- */
function registrarEventos() {
  document.addEventListener('click', ev => {
    const nav = ev.target.closest('[data-view]');
    if (nav) return irA(nav.dataset.view);
    if (ev.target.closest('[data-close]')) return ev.target.closest('dialog').close();
    const a = ev.target.closest('[data-action]');
    if (!a) return;
    const id = Number(a.dataset.id);
    ({
      'historial': () => abrirHistorial(id),
      'edit-equipo': () => abrirEquipo(id),
      'del-equipo': () => pedirEliminarEquipo(id),
      'edit-orden': () => abrirOrden(id),
      'nueva-orden-equipo': () => abrirOrden(null, id)
    })[a.dataset.action]?.();
  });
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', ev => { if (ev.target === d) d.close(); }));
  ['btn-nuevo-equipo', 'btn-registrar-equipo'].forEach(i => $(i).addEventListener('click', () => abrirEquipo()));
  ['btn-nueva-orden', 'btn-crear-orden'].forEach(i => $(i).addEventListener('click', () => abrirOrden()));
  $('form-equipo').addEventListener('submit', guardarEquipo);
  $('form-orden').addEventListener('submit', guardarOrden);
  $('search-equipos').addEventListener('input', renderEquipos);
  ['filter-equipo', 'filter-estado', 'filter-fecha'].forEach(i => $(i).addEventListener('change', renderOrdenes));
  $('btn-limpiar').addEventListener('click', () => { $('filter-equipo').value = ''; $('filter-estado').value = ''; $('filter-fecha').value = ''; renderOrdenes(); });
  $('confirm-ok').addEventListener('click', () => { $('dlg-confirm').close(); confirmCb?.(); confirmCb = null; });
  $('btn-menu').addEventListener('click', abrirMenu);
  $('scrim').addEventListener('click', cerrarMenu);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') cerrarMenu(); });
}

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => { load(); registrarEventos(); renderTodo(); });
