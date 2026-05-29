// Módulos (copiar el contenido de cada módulo aquí o importarlos)
// Para simplificar, te doy el código completo unificado:

// ---------- MÓDULO STORAGE ----------
const STORAGE_KEYS = {
    PACIENTES: 'nutrimre_pacientes',
    CONSULTAS: 'nutrimre_consultas'
};

const storage = {
    getPacientes: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PACIENTES) || '[]'),
    setPacientes: (pacientes) => localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(pacientes)),
    getConsultas: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTAS) || '[]'),
    setConsultas: (consultas) => localStorage.setItem(STORAGE_KEYS.CONSULTAS, JSON.stringify(consultas)),
    clearAllData: () => {
        localStorage.removeItem(STORAGE_KEYS.PACIENTES);
        localStorage.removeItem(STORAGE_KEYS.CONSULTAS);
    }
};

// ---------- MÓDULO IMC ----------
function calcularIMC(peso, altura) {
    if (!peso || !altura || altura <= 0) return null;
    const imc = peso / (altura * altura);
    return Math.round(imc * 10) / 10;
}

function obtenerDiagnostico(imc) {
    if (imc === null) return 'Sin datos';
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
}

// ---------- MÓDULO PACIENTE ----------
function registrarPaciente(nombre, edad, peso, altura) {
    if (!nombre || !edad || !peso || !altura) {
        return { success: false, msg: 'Todos los campos son obligatorios' };
    }
    
    const pacientes = storage.getPacientes();
    const nuevoId = Date.now();
    const imc = calcularIMC(parseFloat(peso), parseFloat(altura));
    const diagnostico = obtenerDiagnostico(imc);
    
    const paciente = {
        id: nuevoId,
        nombre: nombre.trim(),
        edad: parseInt(edad),
        pesoKg: parseFloat(peso),
        alturaMts: parseFloat(altura),
        imc: imc,
        diagnostico: diagnostico,
        fechaRegistro: new Date().toISOString()
    };
    
    pacientes.push(paciente);
    storage.setPacientes(pacientes);
    return { success: true, paciente };
}

function getPacienteById(id) {
    const pacientes = storage.getPacientes();
    return pacientes.find(p => p.id === id) || null;
}

function getAllPacientes() {
    return storage.getPacientes();
}

// ---------- MÓDULO CONSULTA ----------
function crearConsulta(pacienteId, fecha, hora, evolucion, planAlimentacion, consultaIdEditar = null) {
    if (!pacienteId || !fecha || !hora) {
        return { success: false, msg: 'Seleccione paciente, fecha y hora' };
    }
    
    const paciente = getPacienteById(parseInt(pacienteId));
    if (!paciente) return { success: false, msg: 'Paciente no existe' };
    
    const consultas = storage.getConsultas();
    
    if (consultaIdEditar) {
        const index = consultas.findIndex(c => c.id === parseInt(consultaIdEditar));
        if (index !== -1) {
            consultas[index] = {
                ...consultas[index],
                fecha, hora,
                evolucion: evolucion || '',
                planAlimentacion: planAlimentacion || '',
                fechaModificacion: new Date().toISOString()
            };
            storage.setConsultas(consultas);
            return { success: true, msg: 'Consulta actualizada', consulta: consultas[index] };
        }
        return { success: false, msg: 'Consulta no encontrada' };
    }
    
    const nuevaConsulta = {
        id: Date.now(),
        pacienteId: paciente.id,
        pacienteNombre: paciente.nombre,
        fecha, hora,
        evolucion: evolucion || '',
        planAlimentacion: planAlimentacion || '',
        fechaCreacion: new Date().toISOString()
    };
    consultas.push(nuevaConsulta);
    storage.setConsultas(consultas);
    return { success: true, consulta: nuevaConsulta };
}

function getConsultasOrdenadas() {
    const consultas = storage.getConsultas();
    return [...consultas].sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora}`);
        const dateB = new Date(`${b.fecha}T${b.hora}`);
        return dateB - dateA;
    });
}

function eliminarConsulta(consultaId) {
    const consultas = storage.getConsultas();
    const nuevas = consultas.filter(c => c.id !== parseInt(consultaId));
    storage.setConsultas(nuevas);
}

function getConsultaById(id) {
    const consultas = storage.getConsultas();
    return consultas.find(c => c.id === parseInt(id));
}

// ---------- AUTENTICACIÓN ----------
function login(nombre) {
    if (!nombre || nombre.trim() === '') {
        return false;
    }
    sessionStorage.setItem('nutrimre_logged', 'true');
    sessionStorage.setItem('nutrimre_nombre', nombre.trim());
    return true;
}

function logout() {
    sessionStorage.removeItem('nutrimre_logged');
    sessionStorage.removeItem('nutrimre_nombre');
}

function isAuthenticated() {
    return sessionStorage.getItem('nutrimre_logged') === 'true';
}

function getCurrentUser() {
    return sessionStorage.getItem('nutrimre_nombre');
}

// ---------- RENDERIZADO ----------
let editMode = false;
let editingConsultaId = null;

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderPacientesLista() {
    const pacientes = getAllPacientes();
    const container = document.getElementById('listaPacientes');
    if (!container) return;
    
    if (pacientes.length === 0) {
        container.innerHTML = '<div class="text-muted">No hay pacientes registrados.</div>';
        return;
    }
    
    container.innerHTML = pacientes.map(pac => `
        <div class="paciente-item">
            <div>
                <strong>${escapeHtml(pac.nombre)}</strong><br>
                <span class="badge-imc">IMC: ${pac.imc} (${pac.diagnostico})</span><br>
                <small>Edad: ${pac.edad} años | Peso: ${pac.pesoKg}kg | Alt: ${pac.alturaMts}m</small>
            </div>
            <button class="btn-select" data-id="${pac.id}">Seleccionar</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.btn-select').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const select = document.getElementById('selectPacienteConsulta');
            if (select) select.value = id;
            document.getElementById('consultaMsg').innerHTML = `✅ Paciente seleccionado.`;
        });
    });
}

function renderSelectPacientes() {
    const select = document.getElementById('selectPacienteConsulta');
    if (!select) return;
    const pacientes = getAllPacientes();
    select.innerHTML = '<option value="">-- Seleccionar paciente --</option>' + 
        pacientes.map(p => `<option value="${p.id}">${escapeHtml(p.nombre)} (IMC:${p.imc})</option>`).join('');
}

function renderHistorial() {
    const container = document.getElementById('historialConsultas');
    if (!container) return;
    const consultas = getConsultasOrdenadas();
    
    if (consultas.length === 0) {
        container.innerHTML = '<div class="text-muted">Sin consultas registradas.</div>';
        return;
    }
    
    container.innerHTML = consultas.map(cons => {
        const paciente = getPacienteById(cons.pacienteId);
        const nombrePac = paciente ? paciente.nombre : cons.pacienteNombre;
        return `
            <div class="consulta-item" data-id="${cons.id}">
                <div class="consulta-header">
                    <strong>👤 ${escapeHtml(nombrePac)}</strong>
                    <small>📅 ${cons.fecha} - ⏰ ${cons.hora}</small>
                    <div>
                        <button class="edit-consulta" data-id="${cons.id}">✏️ Editar</button>
                        <button class="delete-consulta" data-id="${cons.id}">🗑️ Borrar</button>
                    </div>
                </div>
                <div><em>Evolución:</em> ${escapeHtml(cons.evolucion)}</div>
                <div><em>Plan alimentación:</em> ${escapeHtml(cons.planAlimentacion)}</div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.edit-consulta').forEach(btn => {
        btn.addEventListener('click', () => editarConsulta(parseInt(btn.getAttribute('data-id'))));
    });
    document.querySelectorAll('.delete-consulta').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('¿Eliminar esta consulta?')) {
                eliminarConsulta(parseInt(btn.getAttribute('data-id')));
                renderHistorial();
                if (editMode && editingConsultaId === parseInt(btn.getAttribute('data-id'))) {
                    cancelarEdicion();
                }
            }
        });
    });
}

function editarConsulta(id) {
    const consulta = getConsultaById(id);
    if (!consulta) return;
    
    document.getElementById('selectPacienteConsulta').value = consulta.pacienteId;
    document.getElementById('fechaConsulta').value = consulta.fecha;
    document.getElementById('horaConsulta').value = consulta.hora;
    document.getElementById('evolucion').value = consulta.evolucion;
    document.getElementById('planAlimentacion').value = consulta.planAlimentacion;
    
    editMode = true;
    editingConsultaId = id;
    const crearBtn = document.getElementById('crearConsultaBtn');
    const cancelBtn = document.getElementById('cancelarEdicionConsulta');
    if (crearBtn) crearBtn.textContent = '💾 Guardar Cambios (Editar)';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    document.getElementById('consultaMsg').innerHTML = `✏️ Editando consulta del ${consulta.fecha}`;
}

function cancelarEdicion() {
    editMode = false;
    editingConsultaId = null;
    const crearBtn = document.getElementById('crearConsultaBtn');
    const cancelBtn = document.getElementById('cancelarEdicionConsulta');
    if (crearBtn) crearBtn.textContent = '📌 Guardar consulta';
    if (cancelBtn) cancelBtn.style.display = 'none';
    document.getElementById('evolucion').value = '';
    document.getElementById('planAlimentacion').value = '';
    document.getElementById('fechaConsulta').value = '';
    document.getElementById('horaConsulta').value = '';
    document.getElementById('consultaMsg').innerHTML = '';
}

function guardarConsulta() {
    const pacienteId = document.getElementById('selectPacienteConsulta').value;
    const fecha = document.getElementById('fechaConsulta').value;
    const hora = document.getElementById('horaConsulta').value;
    const evolucion = document.getElementById('evolucion').value;
    const plan = document.getElementById('planAlimentacion').value;
    
    if (editMode && editingConsultaId) {
        const result = crearConsulta(pacienteId, fecha, hora, evolucion, plan, editingConsultaId);
        if (result.success) {
            cancelarEdicion();
            renderHistorial();
            document.getElementById('consultaMsg').innerHTML = '✅ Consulta actualizada';
        } else {
            document.getElementById('consultaMsg').innerHTML = '❌ ' + result.msg;
        }
    } else {
        const result = crearConsulta(pacienteId, fecha, hora, evolucion, plan);
        if (result.success) {
            document.getElementById('evolucion').value = '';
            document.getElementById('planAlimentacion').value = '';
            document.getElementById('fechaConsulta').value = '';
            document.getElementById('horaConsulta').value = '';
            renderHistorial();
            document.getElementById('consultaMsg').innerHTML = '✅ Consulta guardada correctamente';
        } else {
            document.getElementById('consultaMsg').innerHTML = '❌ ' + result.msg;
        }
    }
}

function guardarPaciente() {
    const nombre = document.getElementById('pacNombre').value;
    const edad = document.getElementById('pacEdad').value;
    const peso = document.getElementById('pacPeso').value;
    const altura = document.getElementById('pacAltura').value;
    
    const res = registrarPaciente(nombre, edad, peso, altura);
    if (res.success) {
        document.getElementById('pacNombre').value = '';
        document.getElementById('pacEdad').value = '';
        document.getElementById('pacPeso').value = '';
        document.getElementById('pacAltura').value = '';
        document.getElementById('pacienteMsg').innerHTML = '✅ Paciente registrado, IMC calculado';
        renderPacientesLista();
        renderSelectPacientes();
        setTimeout(() => {
            document.getElementById('pacienteMsg').innerHTML = '';
        }, 3000);
    } else {
        document.getElementById('pacienteMsg').innerHTML = '⚠️ ' + res.msg;
    }
}

function clearAllData() {
    if (confirm('⚠️ ELIMINARÁ TODOS LOS PACIENTES Y CONSULTAS de forma permanente. ¿Continuar?')) {
        storage.clearAllData();
        renderPacientesLista();
        renderSelectPacientes();
        renderHistorial();
        cancelarEdicion();
    }
}

function showDashboard() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('displayNutri').textContent = getCurrentUser();
    renderPacientesLista();
    renderSelectPacientes();
    renderHistorial();
}

function showLogin() {
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('dashboardView').style.display = 'none';
}

// ---------- EVENTOS Y ARRANQUE ----------
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya hay sesión activa
    if (isAuthenticated()) {
        showDashboard();
    } else {
        showLogin();
    }
    
    // Eventos del login
    const ingresarBtn = document.getElementById('ingresarBtn');
    const nutriNombre = document.getElementById('nutriNombre');
    const loginError = document.getElementById('loginError');
    
    if (ingresarBtn) {
        ingresarBtn.addEventListener('click', () => {
            const nombre = nutriNombre.value;
            if (login(nombre)) {
                showDashboard();
            } else {
                loginError.style.display = 'block';
                setTimeout(() => {
                    loginError.style.display = 'none';
                }, 3000);
            }
        });
    }
    
    if (nutriNombre) {
        nutriNombre.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && ingresarBtn) {
                ingresarBtn.click();
            }
        });
    }
    
    // Eventos del dashboard
    const logoutBtn = document.getElementById('logoutBtn');
    const clearAllDataBtn = document.getElementById('clearAllDataBtn');
    const guardarPacienteBtn = document.getElementById('guardarPacienteBtn');
    const crearConsultaBtn = document.getElementById('crearConsultaBtn');
    const cancelarEdicionBtn = document.getElementById('cancelarEdicionConsulta');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            showLogin();
            cancelarEdicion();
        });
    }
    
    if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', clearAllData);
    if (guardarPacienteBtn) guardarPacienteBtn.addEventListener('click', guardarPaciente);
    if (crearConsultaBtn) crearConsultaBtn.addEventListener('click', guardarConsulta);
    if (cancelarEdicionBtn) cancelarEdicionBtn.addEventListener('click', cancelarEdicion);
});