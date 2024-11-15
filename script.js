// Obtener los elementos del DOM
const ascensor = document.getElementById('ascensor');
const personaje = document.getElementById('personajeAsce');
const minero = document.getElementById('MineroAfk');
const carrito = document.getElementById('carrito');
const personajeCarrito = document.getElementById('personajeCarrito');

// Variables para el sistema de recursos
let recursosEnMina = 0;
let recursosRecolectados = 0;
let recursosTotal = 0; // Iniciamos con 10 de dinero
let nivelMina = 1;

// Costo base para subir de nivel
const costoBaseNivel = 15;

// Posiciones originales
const posicionesOriginales = {
    ascensor: {
        top: 440,
        left: 530
    },
    personaje: {
        top: 505,
        left: 560
    },
    minero: {
        left: 780
    },
    carrito: {
        left: 1135
    },
    personajeCarrito: {
        left: 1200
    }
};

// Posiciones objetivo
const posicionesObjetivo = {
    ascensor: {
        top: 715,
        left: 530
    },
    personaje: {
        top: 780,
        left: 560
    },
    minero: {
        left: 950
    },
    carrito: {
        left: 685
    },
    personajeCarrito: {
        left: 750
    }
};

// Duración de las animaciones
const duracionAnimacion = 2000;
const tiempoEspera = 1000;
const tiempoPicar = 5000;
const tiempoAgregarRecursos = 500;

// Función para mostrar una alerta bonita
function mostrarAlerta(mensaje) {
    Swal.fire({
        title: '¡Atención!',
        text: mensaje,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        background: '#fff',
        customClass: {
            popup: 'animated fadeInDown'
        }
    });
}

// Función para cambiar sprite y animación del minero
function cambiarAnimacionMinero(tipo) {
    minero.style.backgroundImage = `url(/Img/Minero${tipo}.png)`;
    minero.style.animationName = `minero${tipo}`;
}

// Función para mover elementos horizontalmente
async function moverElementoHorizontal(elemento, inicioX, finX, duracion) {
    return new Promise(resolve => {
        const inicioTiempo = performance.now();
        
        function actualizar(tiempoActual) {
            const tiempoTranscurrido = tiempoActual - inicioTiempo;
            const progreso = Math.min(tiempoTranscurrido / duracion, 1);
            
            const posicionActual = inicioX + (finX - inicioX) * easeInOutCubic(progreso);
            elemento.style.left = `${posicionActual}px`;
            
            if (progreso < 1) {
                requestAnimationFrame(actualizar);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(actualizar);
    });
}

// Función para el ciclo completo del minero
async function cicloMinero() {
    if (minero.dataset.animando === 'true') return;
    minero.dataset.animando = 'true';

    // Ir a picar
    cambiarAnimacionMinero('Caminar');
    await moverElementoHorizontal(minero, posicionesOriginales.minero.left, posicionesObjetivo.minero.left, duracionAnimacion);
    
    // Picar
    cambiarAnimacionMinero('Picar');
    await new Promise(resolve => setTimeout(resolve, tiempoPicar));
    
    // Volver
    cambiarAnimacionMinero('Devolver');
    await moverElementoHorizontal(minero, posicionesObjetivo.minero.left, posicionesOriginales.minero.left, duracionAnimacion);
    
    // Agregar recursos
    recursosEnMina += 50 * Math.pow(2, nivelMina - 1);
    actualizarInterfaz();
    
    // Volver a estado AFK
    cambiarAnimacionMinero('Afk');
    minero.dataset.animando = 'false';
}

// Función para animar movimiento simultáneo
function animarMovimientoSimultaneo(elementos, duracion, callback) {
    const inicioTiempo = performance.now();
    
    function actualizar(tiempoActual) {
        const tiempoTranscurrido = tiempoActual - inicioTiempo;
        const progreso = Math.min(tiempoTranscurrido / duracion, 1);
        
        const factorEasing = easeInOutCubic(progreso);
        
        elementos.forEach(({elemento, inicio, fin}) => {
            const posicionActual = inicio + (fin - inicio) * factorEasing;
            elemento.style.top = `${posicionActual}px`;
        });
        
        if (progreso < 1) {
            requestAnimationFrame(actualizar);
        } else if (callback) {
            callback();
        }
    }
    
    requestAnimationFrame(actualizar);
}

// Función de suavizado
function easeInOutCubic(t) {
    return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Función para mover el ascensor y recolectar recursos
function moverAscensor() {
    if (ascensor.dataset.animando === 'true') return;
    ascensor.dataset.animando = 'true';

    const elementosDescenso = [
        {
            elemento: ascensor,
            inicio: posicionesOriginales.ascensor.top,
            fin: posicionesObjetivo.ascensor.top
        },
        {
            elemento: personaje,
            inicio: posicionesOriginales.personaje.top,
            fin: posicionesObjetivo.personaje.top
        }
    ];

    const elementosAscenso = elementosDescenso.map(item => ({
        ...item,
        inicio: item.fin,
        fin: item.inicio
    }));

    // Bajar
    animarMovimientoSimultaneo(
        elementosDescenso,
        duracionAnimacion,
        () => {
            // Esperar y subir
            setTimeout(() => {
                animarMovimientoSimultaneo(
                    elementosAscenso,
                    duracionAnimacion,
                    () => {
                        // Agregar recursos
                        setTimeout(() => {
                            recursosRecolectados += recursosEnMina;
                            recursosEnMina = 0;
                            actualizarInterfaz();
                            ascensor.dataset.animando = 'false';
                        }, tiempoAgregarRecursos);
                    }
                );
            }, tiempoEspera);
        }
    );
}

// Incrementa la duración de la animación para hacer que el movimiento sea más lento
const duracionAnimacionLenta = 4000; // Ajusta a 4000ms o más según la velocidad deseada

// Función para mover el carrito y personaje simultáneamente con una animación lenta
async function moverCarrito() {
    if (carrito.dataset.animando === 'true' || recursosRecolectados <= 0) return;
    carrito.dataset.animando = 'true';

    // Mover carrito y personaje al mismo tiempo hacia la derecha lentamente
    await Promise.all([
        moverElementoHorizontal(carrito, posicionesOriginales.carrito.left, posicionesObjetivo.carrito.left, duracionAnimacionLenta),
        moverElementoHorizontal(personajeCarrito, posicionesOriginales.personajeCarrito.left, posicionesObjetivo.personajeCarrito.left, duracionAnimacionLenta)
    ]);

    // Transferir recursos
    recursosTotal += recursosRecolectados;
    recursosRecolectados = 0;

    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, tiempoEspera));

    // Volver a la posición original lentamente
    await Promise.all([
        moverElementoHorizontal(carrito, posicionesObjetivo.carrito.left, posicionesOriginales.carrito.left, duracionAnimacionLenta),
        moverElementoHorizontal(personajeCarrito, posicionesObjetivo.personajeCarrito.left, posicionesOriginales.personajeCarrito.left, duracionAnimacionLenta)
    ]);

    actualizarInterfaz();
    carrito.dataset.animando = 'false';
}

// Función para subir de nivel la mina
function subirNivelMina() {
    const costoNivel = costoBaseNivel * Math.pow(2, nivelMina - 1);
    
    if (recursosTotal >= costoNivel) {
        recursosTotal -= costoNivel;
        nivelMina++;
        actualizarInterfaz();
    } else {
        mostrarAlerta(`¡Dinero insuficiente! Necesitas ${costoNivel} monedas para subir al nivel ${nivelMina + 1}`);
    }
}

// Función para actualizar la interfaz
function actualizarInterfaz() {
    document.getElementById('recursosEnMina').textContent = recursosEnMina;
    document.getElementById('recursosRecolectados').textContent = recursosRecolectados;
    document.getElementById('recursosTotal').textContent = recursosTotal;
    document.getElementById('nivelMina').textContent = nivelMina;
}

// Inicializar eventos
minero.addEventListener('click', cicloMinero);
ascensor.addEventListener('click', moverAscensor);
document.getElementById('botonNivel').addEventListener('click', subirNivelMina);
carrito.addEventListener('click', moverCarrito);