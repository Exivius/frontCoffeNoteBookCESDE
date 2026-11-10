// Preferencias visuales y sonido; si el navegador limita el almacenamiento, la página sigue funcionando.
const clave = 'coffeeSoundEnabled';
let sonido = true;
try { sonido = localStorage.getItem(clave) !== 'false'; } catch { /* Preferencia de esta página. */ }
let audio;
const control = document.createElement('button');
control.type = 'button';
control.className = 'sound-toggle';
function actualizar() {
  control.textContent = sonido ? '🔊 Sonido' : '🔇 Silenciado';
  control.setAttribute('aria-label', sonido ? 'Silenciar sonidos de los controles' : 'Activar sonidos de los controles');
  control.setAttribute('aria-pressed', String(sonido));
}
function sonar() {
  if (!sonido) return;
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return;
  try {
    audio ||= new Contexto();
    audio.resume().then(() => {
      if (!sonido) return;
      const oscilador = audio.createOscillator();
      const volumen = audio.createGain();
      const ahora = audio.currentTime;
      oscilador.type = 'sine';
      oscilador.frequency.setValueAtTime(720, ahora);
      oscilador.frequency.exponentialRampToValueAtTime(1080, ahora + .045);
      volumen.gain.setValueAtTime(.035, ahora);
      volumen.gain.exponentialRampToValueAtTime(.001, ahora + .075);
      oscilador.connect(volumen);
      volumen.connect(audio.destination);
      oscilador.start(ahora);
      oscilador.stop(ahora + .08);
      oscilador.onended = () => { oscilador.disconnect(); volumen.disconnect(); };
    }).catch(() => {});
  } catch { /* El navegador puede limitar el audio. */ }
}
control.onclick = () => {
  sonido = !sonido;
  try { localStorage.setItem(clave, String(sonido)); } catch { /* Mantiene la preferencia en memoria. */ }
  actualizar();
  if (sonido) sonar();
};
actualizar();
(document.querySelector('.site-footer .footer-inner') || document.body).append(control);
document.addEventListener('click', evento => {
  const elemento = evento.target.closest('button,a,input,select,summary');
  if (!elemento || elemento === control || elemento.disabled) return;
  sonar();
  elemento.classList.remove('is-pressed');
  void elemento.offsetWidth;
  elemento.classList.add('is-pressed');
  setTimeout(() => elemento.classList.remove('is-pressed'), 180);
}, { capture: true });
