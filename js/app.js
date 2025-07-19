document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let profesores = JSON.parse(localStorage.getItem('profesores')) || [];
    let asignaturas = JSON.parse(localStorage.getItem('asignaturas')) || [];
    let grupos = JSON.parse(localStorage.getItem('grupos')) || [];
    
    // Elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const profesorForm = document.getElementById('profesor-form');
    const asignaturaForm = document.getElementById('asignatura-form');
    const grupoForm = document.getElementById('grupo-form');
    const generarHorarioBtn = document.getElementById('generar-horario');
    const resultadoHorario = document.getElementById('resultado-horario');
    const selectGrupo = document.getElementById('select-grupo');
    const modal = document.getElementById('modal-editar');
    const closeModal = document.querySelector('.close');
    
    // Inicializar la aplicación
    initTabs();
    renderProfesores();
    renderGrupos();
    renderAsignaturas();
    actualizarSelectGrupos();
    
    // Event listeners
    profesorForm.addEventListener('submit', handleProfesorSubmit);
    asignaturaForm.addEventListener('submit', handleAsignaturaSubmit);
    grupoForm.addEventListener('submit', handleGrupoSubmit);
    generarHorarioBtn.addEventListener('click', generarHorario);
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    
    // Event delegation para botones de acción
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('dia-checkbox')) {
            const dia = e.target.getAttribute('data-dia');
            const horasDia = document.querySelector(`.horas-dia[data-dia="${dia}"]`);
            horasDia.style.display = e.target.checked ? 'block' : 'none';
        }
        
        if (e.target.classList.contains('edit-profesor')) {
            editarProfesor(e.target.dataset.id);
        }
        
        if (e.target.classList.contains('delete-profesor')) {
            eliminarProfesor(e.target.dataset.id);
        }
        
        if (e.target.classList.contains('edit-asignatura')) {
            editarAsignatura(e.target.dataset.id);
        }
        
        if (e.target.classList.contains('delete-asignatura')) {
            eliminarAsignatura(e.target.dataset.id);
        }
        
        if (e.target.classList.contains('edit-grupo')) {
            editarGrupo(e.target.dataset.id);
        }
        
        if (e.target.classList.contains('delete-grupo')) {
            eliminarGrupo(e.target.dataset.id);
        }
        
        // Add event listeners for the new buttons
    document.getElementById('save-data').addEventListener('click', saveDataToJson);
    document.getElementById('load-data').addEventListener('click', function() {
        document.getElementById('file-input').click();
    });

    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.id = 'file-input';
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', loadDataFromJson);
    
    });
    
    // Función para generar color pastel basado en el nombre de la asignatura
    function getColorFromAsignatura(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const h = Math.abs(hash) % 360;
        const s = 60 + Math.abs(hash) % 20;
        const l = 80 + Math.abs(hash) % 10;
        
        return `hsl(${h}, ${s}%, ${l}%)`;
    }
    
    // Funciones de pestañas
    function initTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Actualizar lista de grupos cuando se selecciona la pestaña de Asignaturas
            if (tabId === 'asignaturas') {
                actualizarGruposAsignatura();
                actualizarSelectProfesores();
            }
        });
    });
}
function saveDataToJson() {
    // Collect all data
    const data = {
        profesores,
        asignaturas,
        grupos
    };

    // Convert data to JSON string
    const jsonStr = JSON.stringify(data, null, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([jsonStr], { type: 'application/json' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horarios_data.json';
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadDataFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // Load data into the application
            profesores = data.profesores || [];
            asignaturas = data.asignaturas || [];
            grupos = data.grupos || [];

            // Update localStorage
            localStorage.setItem('profesores', JSON.stringify(profesores));
            localStorage.setItem('asignaturas', JSON.stringify(asignaturas));
            localStorage.setItem('grupos', JSON.stringify(grupos));

            // Re-render the UI
            renderProfesores();
            renderAsignaturas();
            renderGrupos();
            actualizarSelectGrupos();
            actualizarGruposAsignatura();

            alert('Data loaded successfully!');
        } catch (error) {
            console.error('Error parsing JSON file:', error);
            alert('Error loading data. Please check the file format.');
        }
    };

    reader.readAsText(file);

    // Reset the file input
    event.target.value = '';
}    
    // Funciones para profesores
    function handleProfesorSubmit(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('profesor-nombre').value;
        const diasCheckboxes = document.querySelectorAll('.dia-checkbox:checked');
        
        if (diasCheckboxes.length === 0) {
            alert('Selecciona al menos un día de disponibilidad');
            return;
        }
        
        const disponibilidad = {};
        
        diasCheckboxes.forEach(checkbox => {
            const dia = checkbox.getAttribute('data-dia');
            const horasDia = document.querySelector(`.horas-dia[data-dia="${dia}"]`);
            const horaInicio = horasDia.querySelector('.hora-inicio').value;
            const horaFin = horasDia.querySelector('.hora-fin').value;
            
            disponibilidad[dia] = {
                disponible: true,
                horaInicio,
                horaFin
            };
        });
        
        const nuevoProfesor = {
            id: Date.now().toString(),
            nombre,
            disponibilidad
        };
        
        profesores.push(nuevoProfesor);
        localStorage.setItem('profesores', JSON.stringify(profesores));
        renderProfesores();
        profesorForm.reset();
        
        document.querySelectorAll('.horas-dia').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.dia-checkbox').forEach(cb => cb.checked = false);
    }
    
    function renderProfesores() {
        const lista = document.getElementById('profesores-lista');
        lista.innerHTML = '';
        
        profesores.forEach(profesor => {
            const disponibilidadText = Object.entries(profesor.disponibilidad)
                .map(([dia, info]) => `${dia}: ${info.horaInicio} - ${info.horaFin}`)
                .join(', ');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${profesor.nombre}</td>
                <td>${disponibilidadText}</td>
                <td>
                    <button class="action-button edit edit-profesor" data-id="${profesor.id}">Editar</button>
                    <button class="action-button delete delete-profesor" data-id="${profesor.id}">Eliminar</button>
                </td>
            `;
            lista.appendChild(row);
        });
        
        actualizarSelectProfesores();
    }
    
    function editarProfesor(id) {
        const profesor = profesores.find(p => p.id === id);
        if (!profesor) return;
        
        const modalContent = document.getElementById('modal-contenido');
        modalContent.innerHTML = `
            <h2>Editar Profesor</h2>
            <form id="editar-profesor-form">
                <input type="text" id="editar-profesor-nombre" value="${profesor.nombre}" required>
                <div class="disponibilidad">
                    <h3>Disponibilidad</h3>
                    <div class="dias-semana">
                        ${Object.entries({
                            lunes: 'Lunes',
                            martes: 'Martes',
                            miercoles: 'Miércoles',
                            jueves: 'Jueves',
                            viernes: 'Viernes'
                        }).map(([diaKey, diaNombre]) => `
                            <div class="dia">
                                <label>
                                    <input type="checkbox" class="dia-checkbox" data-dia="${diaKey}" 
                                        ${profesor.disponibilidad[diaKey] ? 'checked' : ''}>
                                    ${diaNombre}
                                </label>
                                <div class="horas-dia" data-dia="${diaKey}" 
                                    style="display: ${profesor.disponibilidad[diaKey] ? 'block' : 'none'}">
                                    <label>De 
                                        <input type="time" class="hora-inicio" value="${profesor.disponibilidad[diaKey]?.horaInicio || '08:00'}" 
                                            min="08:00" max="22:00"> a 
                                        <input type="time" class="hora-fin" value="${profesor.disponibilidad[diaKey]?.horaFin || '22:00'}" 
                                            min="08:00" max="22:00">
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button type="submit">Guardar Cambios</button>
            </form>
        `;
        
        modal.style.display = 'block';
        
        modalContent.querySelectorAll('.dia-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const dia = this.getAttribute('data-dia');
                const horasDia = modalContent.querySelector(`.horas-dia[data-dia="${dia}"]`);
                horasDia.style.display = this.checked ? 'block' : 'none';
            });
        });
        
        document.getElementById('editar-profesor-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nombre = document.getElementById('editar-profesor-nombre').value;
            const diasCheckboxes = this.querySelectorAll('.dia-checkbox:checked');
            
            if (diasCheckboxes.length === 0) {
                alert('Selecciona al menos un día de disponibilidad');
                return;
            }
            
            const disponibilidad = {};
            
            diasCheckboxes.forEach(checkbox => {
                const dia = checkbox.getAttribute('data-dia');
                const horasDia = this.querySelector(`.horas-dia[data-dia="${dia}"]`);
                const horaInicio = horasDia.querySelector('.hora-inicio').value;
                const horaFin = horasDia.querySelector('.hora-fin').value;
                
                disponibilidad[dia] = {
                    disponible: true,
                    horaInicio,
                    horaFin
                };
            });
            
            profesor.nombre = nombre;
            profesor.disponibilidad = disponibilidad;
            
            localStorage.setItem('profesores', JSON.stringify(profesores));
            renderProfesores();
            modal.style.display = 'none';
        });
    }
    
    function eliminarProfesor(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este profesor?')) {
            const asignaturasConEsteProfesor = asignaturas.filter(a => a.profesorId === id);
            
            if (asignaturasConEsteProfesor.length > 0) {
                alert('Este profesor está asignado a una o más asignaturas. No se puede eliminar.');
                return;
            }
            
            profesores = profesores.filter(p => p.id !== id);
            localStorage.setItem('profesores', JSON.stringify(profesores));
            renderProfesores();
        }
    }
    
    // Funciones para grupos
    function handleGrupoSubmit(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('grupo-nombre').value;
        
        const nuevoGrupo = {
            id: Date.now().toString(),
            nombre
        };
        
        grupos.push(nuevoGrupo);
        localStorage.setItem('grupos', JSON.stringify(grupos));
        renderGrupos();
        grupoForm.reset();
        actualizarSelectGrupos();
        actualizarGruposAsignatura();
    }
    
    function renderGrupos() {
        const lista = document.getElementById('grupos-lista');
        lista.innerHTML = '';
        
        grupos.forEach(grupo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${grupo.nombre}</td>
                <td>
                    <button class="action-button edit edit-grupo" data-id="${grupo.id}">Editar</button>
                    <button class="action-button delete delete-grupo" data-id="${grupo.id}">Eliminar</button>
                </td>
            `;
            lista.appendChild(row);
        });
    }
    
    function editarGrupo(id) {
        const grupo = grupos.find(g => g.id === id);
        if (!grupo) return;
        
        const modalContent = document.getElementById('modal-contenido');
        modalContent.innerHTML = `
            <h2>Editar Grupo</h2>
            <form id="editar-grupo-form">
                <input type="text" id="editar-grupo-nombre" value="${grupo.nombre}" required>
                <button type="submit">Guardar Cambios</button>
            </form>
        `;
        
        modal.style.display = 'block';
        
        document.getElementById('editar-grupo-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            grupo.nombre = document.getElementById('editar-grupo-nombre').value;
            
            localStorage.setItem('grupos', JSON.stringify(grupos));
            renderGrupos();
            actualizarSelectGrupos();
            actualizarGruposAsignatura();
            modal.style.display = 'none';
        });
    }
    
    function eliminarGrupo(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este grupo?')) {
            const asignaturasConEsteGrupo = asignaturas.filter(a => a.grupos && a.grupos.includes(id));
            
            if (asignaturasConEsteGrupo.length > 0) {
                alert('Este grupo está asignado a una o más asignaturas. No se puede eliminar.');
                return;
            }
            
            grupos = grupos.filter(g => g.id !== id);
            localStorage.setItem('grupos', JSON.stringify(grupos));
            renderGrupos();
            actualizarSelectGrupos();
            actualizarGruposAsignatura();
        }
    }
    
    function actualizarSelectGrupos() {
        const select = document.getElementById('select-grupo');
        select.innerHTML = '<option value="todos">Todos los grupos</option>';
        
        grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;
            option.textContent = grupo.nombre;
            select.appendChild(option);
        });
    }
    
    // Funciones para asignaturas
   function handleAsignaturaSubmit(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('asignatura-nombre').value;
    const horas = parseInt(document.getElementById('asignatura-horas').value);
    const profesorId = document.getElementById('profesor-asignatura').value;
    
    const profesor = profesores.find(p => p.id === profesorId);
    if (!profesor) {
        alert('Seleccione un profesor válido');
        return;
    }
    
    // Obtener grupos seleccionados
    const gruposSeleccionados = Array.from(
        document.querySelectorAll('#grupos-asignatura-lista input:checked')
    ).map(checkbox => checkbox.value);
    
    if (gruposSeleccionados.length === 0) {
        alert('Seleccione al menos un grupo para esta asignatura');
        return;
    }
    
    const nuevaAsignatura = {
        id: Date.now().toString(),
        nombre,
        horas,
        profesorId,
        profesorNombre: profesor.nombre,
        grupos: gruposSeleccionados
    };
    
    asignaturas.push(nuevaAsignatura);
    localStorage.setItem('asignaturas', JSON.stringify(asignaturas));
    renderAsignaturas();
    asignaturaForm.reset();
}
    
    function renderAsignaturas() {
        const lista = document.getElementById('asignaturas-lista');
        lista.innerHTML = '';
        
        asignaturas.forEach(asignatura => {
            const profesor = profesores.find(p => p.id === asignatura.profesorId) || {};
            const gruposAsignatura = asignatura.grupos ? asignatura.grupos.map(grupoId => {
                const grupo = grupos.find(g => g.id === grupoId);
                return grupo ? grupo.nombre : '';
            }).filter(Boolean) : [];
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${asignatura.nombre}</td>
                <td>${asignatura.horas}</td>
                <td>${profesor.nombre || 'No asignado'}</td>
                <td>${gruposAsignatura.map(nombre => `<span class="grupo-tag">${nombre}</span>`).join('')}</td>
                <td>
                    <button class="action-button edit edit-asignatura" data-id="${asignatura.id}">Editar</button>
                    <button class="action-button delete delete-asignatura" data-id="${asignatura.id}">Eliminar</button>
                </td>
            `;
            lista.appendChild(row);
        });
    }
    
    function editarAsignatura(id) {
    const asignatura = asignaturas.find(a => a.id === id);
    if (!asignatura) return;
    
    const modalContent = document.getElementById('modal-contenido');
    modalContent.innerHTML = `
        <h2>Editar Asignatura</h2>
        <form id="editar-asignatura-form">
            <input type="text" id="editar-asignatura-nombre" value="${asignatura.nombre}" required>
            <input type="number" id="editar-asignatura-horas" value="${asignatura.horas}" min="1" required>
            
            <div style="margin: 10px 0;">
                <label for="editar-profesor-asignatura">Profesor:</label>
                <select id="editar-profesor-asignatura" required>
                    ${profesores.map(p => `
                        <option value="${p.id}" ${p.id === asignatura.profesorId ? 'selected' : ''}>
                            ${p.nombre}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div style="margin: 10px 0;">
                <label>Grupos:</label>
                <div id="editar-grupos-asignatura-lista" class="checkbox-list">
                    ${grupos.map(grupo => `
                        <div class="checkbox-item">
                            <input type="checkbox" id="editar-grupo-${grupo.id}" value="${grupo.id}" 
                                ${asignatura.grupos.includes(grupo.id) ? 'checked' : ''}>
                            <label for="editar-grupo-${grupo.id}">${grupo.nombre}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <button type="submit">Guardar Cambios</button>
        </form>
    `;
    
    modal.style.display = 'block';
    
    document.getElementById('editar-asignatura-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener grupos seleccionados
        const gruposSeleccionados = Array.from(
            this.querySelectorAll('#editar-grupos-asignatura-lista input:checked')
        ).map(checkbox => checkbox.value);
        
        if (gruposSeleccionados.length === 0) {
            alert('Seleccione al menos un grupo para esta asignatura');
            return;
        }
        
        asignatura.nombre = document.getElementById('editar-asignatura-nombre').value;
        asignatura.horas = parseInt(document.getElementById('editar-asignatura-horas').value);
        asignatura.profesorId = document.getElementById('editar-profesor-asignatura').value;
        asignatura.grupos = gruposSeleccionados;
        
        const profesor = profesores.find(p => p.id === asignatura.profesorId);
        if (profesor) {
            asignatura.profesorNombre = profesor.nombre;
        }
        
        localStorage.setItem('asignaturas', JSON.stringify(asignaturas));
        renderAsignaturas();
        modal.style.display = 'none';
    });
}

    
    function eliminarAsignatura(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta asignatura?')) {
            asignaturas = asignaturas.filter(a => a.id !== id);
            localStorage.setItem('asignaturas', JSON.stringify(asignaturas));
            renderAsignaturas();
        }
    }
    
    function actualizarSelectProfesores() {
        const select = document.getElementById('profesor-asignatura');
        select.innerHTML = '<option value="">Seleccione un profesor</option>';
        
        profesores.forEach(profesor => {
            const option = document.createElement('option');
            option.value = profesor.id;
            option.textContent = profesor.nombre;
            select.appendChild(option);
        });
    }
    
    function actualizarGruposAsignatura() {
    const container = document.getElementById('grupos-asignatura-lista');
    container.innerHTML = '';
    
    if (grupos.length === 0) {
        container.innerHTML = '<p>No hay grupos creados todavía</p>';
        return;
    }
    
    grupos.forEach(grupo => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="grupo-${grupo.id}" name="grupos" value="${grupo.id}">
            <label for="grupo-${grupo.id}">${grupo.nombre}</label>
        `;
        container.appendChild(div);
    });
}
    
    // Algoritmo para generar horarios
 function generarHorario() {
    if (profesores.length === 0 || asignaturas.length === 0 || grupos.length === 0) {
        alert('Necesitas al menos un profesor, una asignatura y un grupo para generar un horario');
        return;
    }

    // Verificar asignaturas sin profesor o grupos
    const asignaturasInvalidas = asignaturas.filter(a => {
        return !profesores.some(p => p.id === a.profesorId) ||
               !a.grupos ||
               a.grupos.length === 0;
    });

    if (asignaturasInvalidas.length > 0) {
        alert(`Las siguientes asignaturas no tienen profesor o grupos asignados: ${asignaturasInvalidas.map(a => a.nombre).join(', ')}`);
        return;
    }

    // Calculate teacher workload before generating schedule
    const teacherWorkload = calcularCargaDocente();
    mostrarResumenCargaDocente(teacherWorkload);

    // Crear estructura básica del horario
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const horas = [];

    // Generar horas de 8:00 a 22:00 en intervalos de 1 hora
    for (let h = 8; h < 22; h++) {
        horas.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Estructura para guardar los horarios por grupo
    const horariosPorGrupo = {};
    grupos.forEach(grupo => {
        horariosPorGrupo[grupo.id] = {};
        dias.forEach(dia => {
            horariosPorGrupo[grupo.id][dia] = {};
            horas.forEach(hora => {
                horariosPorGrupo[grupo.id][dia][hora] = null;
            });
        });
    });

    // Estructura para guardar los horarios por profesor
    const horariosPorProfesor = {};
    profesores.forEach(profesor => {
        horariosPorProfesor[profesor.id] = {};
        dias.forEach(dia => {
            horariosPorProfesor[profesor.id][dia] = {};
            horas.forEach(hora => {
                horariosPorProfesor[profesor.id][dia][hora] = null;
            });
        });
    });

    // Estructura para controlar disponibilidad de profesores
    const disponibilidadProfesores = {};
    profesores.forEach(profesor => {
        disponibilidadProfesores[profesor.id] = {};
        dias.forEach(dia => {
            disponibilidadProfesores[profesor.id][dia] = {};
            if (profesor.disponibilidad[dia]?.disponible) {
                horas.forEach(hora => {
                    const disponible =
                        hora >= profesor.disponibilidad[dia].horaInicio &&
                        hora <= profesor.disponibilidad[dia].horaFin;
                    disponibilidadProfesores[profesor.id][dia][hora] = disponible;
                });
            }
        });
    });

    // Primero asignar asignaturas con más horas semanales
    const asignaturasOrdenadas = [...asignaturas].sort((a, b) => b.horas - a.horas);

    // Algoritmo de asignación mejorado para minimizar huecos
    asignaturasOrdenadas.forEach(asignatura => {
        const profesorAsignado = profesores.find(p => p.id === asignatura.profesorId);
        if (!profesorAsignado) return;

        // Para cada grupo asignado a esta asignatura
        asignatura.grupos.forEach(grupoId => {
            let horasAsignadas = 0;
            const horasPorGrupo = Math.ceil(asignatura.horas / asignatura.grupos.length);

            // 1. Primero intentar asignar bloques de 2 horas consecutivas
            dias.forEach(dia => {
                if (horasAsignadas >= horasPorGrupo) return;

                if (profesorAsignado.disponibilidad[dia]?.disponible) {
                    for (let i = 0; i < horas.length - 1; i++) {
                        if (horasAsignadas >= horasPorGrupo) break;

                        const hora1 = horas[i];
                        const hora2 = horas[i + 1];

                        // Verificar disponibilidad para bloque de 2 horas
                        const bloqueDisponible =
                            disponibilidadProfesores[profesorAsignado.id][dia][hora1] &&
                            disponibilidadProfesores[profesorAsignado.id][dia][hora2] &&
                            !horariosPorGrupo[grupoId][dia][hora1] &&
                            !horariosPorGrupo[grupoId][dia][hora2];

                        if (bloqueDisponible) {
                            // Verificar que profesor no esté asignado en otros grupos
                            let profesorLibre = true;
                            grupos.forEach(g => {
                                if (g.id !== grupoId && (
                                    horariosPorGrupo[g.id][dia][hora1]?.profesor === profesorAsignado.nombre ||
                                    horariosPorGrupo[g.id][dia][hora2]?.profesor === profesorAsignado.nombre
                                )) {
                                    profesorLibre = false;
                                }
                            });

                            if (profesorLibre) {
                                // Asignar bloque de 2 horas
                                horariosPorGrupo[grupoId][dia][hora1] = {
                                    asignatura: asignatura.nombre,
                                    profesor: profesorAsignado.nombre,
                                    asignaturaId: asignatura.id
                                };
                                horariosPorGrupo[grupoId][dia][hora2] = {
                                    asignatura: asignatura.nombre,
                                    profesor: profesorAsignado.nombre,
                                    asignaturaId: asignatura.id
                                };
                                horariosPorProfesor[profesorAsignado.id][dia][hora1] = {
                                    asignatura: asignatura.nombre,
                                    grupo: grupos.find(g => g.id === grupoId).nombre,
                                    asignaturaId: asignatura.id
                                };
                                horariosPorProfesor[profesorAsignado.id][dia][hora2] = {
                                    asignatura: asignatura.nombre,
                                    grupo: grupos.find(g => g.id === grupoId).nombre,
                                    asignaturaId: asignatura.id
                                };
                                disponibilidadProfesores[profesorAsignado.id][dia][hora1] = false;
                                disponibilidadProfesores[profesorAsignado.id][dia][hora2] = false;
                                horasAsignadas += 2;
                            }
                        }
                    }
                }
            });

            // 2. Si aún quedan horas, asignar individualmente intentando llenar huecos
            if (horasAsignadas < horasPorGrupo) {
                // Ordenar días por cantidad de horas libres (para llenar primero los días con más huecos)
                const diasOrdenados = [...dias].sort((a, b) => {
                    const horasLibresA = horas.filter(h =>
                        !horariosPorGrupo[grupoId][a][h] &&
                        disponibilidadProfesores[profesorAsignado.id][a][h]
                    ).length;
                    const horasLibresB = horas.filter(h =>
                        !horariosPorGrupo[grupoId][b][h] &&
                        disponibilidadProfesores[profesorAsignado.id][b][h]
                    ).length;
                    return horasLibresB - horasLibresA;
                });

                diasOrdenados.forEach(dia => {
                    if (horasAsignadas >= horasPorGrupo) return;

                    if (profesorAsignado.disponibilidad[dia]?.disponible) {
                        // Ordenar horas por proximidad a otras clases del mismo grupo
                        const horasOrdenadas = [...horas].sort((a, b) => {
                            const tieneClaseCercaA = tieneClaseCerca(horariosPorGrupo[grupoId][dia], horas.indexOf(a), horas);
                            const tieneClaseCercaB = tieneClaseCerca(horariosPorGrupo[grupoId][dia], horas.indexOf(b), horas);
                            return tieneClaseCercaB - tieneClaseCercaA;
                        });

                        horasOrdenadas.forEach(hora => {
                            if (horasAsignadas >= horasPorGrupo) return;

                            // Verificar disponibilidad
                            if (disponibilidadProfesores[profesorAsignado.id][dia][hora] &&
                                !horariosPorGrupo[grupoId][dia][hora]) {

                                // Verificar que profesor no esté en otro grupo
                                let profesorDisponible = true;
                                grupos.forEach(g => {
                                    if (g.id !== grupoId && horariosPorGrupo[g.id][dia][hora]?.profesor === profesorAsignado.nombre) {
                                        profesorDisponible = false;
                                    }
                                });

                                if (profesorDisponible) {
                                    // Verificar límite de 2 horas consecutivas
                                    const horaIndex = horas.indexOf(hora);
                                    const prev1 = horas[horaIndex - 1];
                                    const prev2 = horas[horaIndex - 2];

                                    if (
                                        (prev1 && horariosPorGrupo[grupoId][dia][prev1]?.asignatura === asignatura.nombre) ||
                                        (prev2 && horariosPorGrupo[grupoId][dia][prev2]?.asignatura === asignatura.nombre)
                                    ) {
                                        return;
                                    }

                                    // Asignar hora individual
                                    horariosPorGrupo[grupoId][dia][hora] = {
                                        asignatura: asignatura.nombre,
                                        profesor: profesorAsignado.nombre,
                                        asignaturaId: asignatura.id
                                    };
                                    horariosPorProfesor[profesorAsignado.id][dia][hora] = {
                                        asignatura: asignatura.nombre,
                                        grupo: grupos.find(g => g.id === grupoId).nombre,
                                        asignaturaId: asignatura.id
                                    };
                                    disponibilidadProfesores[profesorAsignado.id][dia][hora] = false;
                                    horasAsignadas++;
                                }
                            }
                        });
                    }
                });
            }
        });
    });

    const horariosFinales = compactarHorarios(horariosPorGrupo, dias, horas);

    // Mostrar todos los horarios
    mostrarTodosHorarios(horariosPorGrupo, dias, horas);
    mostrarHorariosProfesores(horariosPorProfesor, dias, horas);
}


// Helper function to check if a time slot is near other classes
// Helper function to check if a time slot is near other classes
function tieneClaseCerca(horarioDia, indexHora, horas) {
    const rangos = [
        [indexHora - 1, indexHora + 1],  // 1 hora antes/después
        [indexHora - 2, indexHora + 2]   // 2 horas antes/después
    ];
    
    for (const [inicio, fin] of rangos) {
        for (let i = inicio; i <= fin; i++) {
            if (i >= 0 && i < horas.length && i !== indexHora && horarioDia[horas[i]]) {
                return true;
            }
        }
    }
    return false;
}

function calcularCargaDocente() {
    const workload = {};

    // Initialize workload for each teacher
    profesores.forEach(profesor => {
        workload[profesor.id] = {
            nombre: profesor.nombre,
            horasDisponibles: 0,
            horasRequeridas: 0
        };

        // Calculate available hours
        Object.entries(profesor.disponibilidad).forEach(([dia, info]) => {
            if (info.disponible) {
                const start = parseInt(info.horaInicio.split(':')[0]);
                const end = parseInt(info.horaFin.split(':')[0]);
                workload[profesor.id].horasDisponibles += (end - start);
            }
        });
    });

    // Calculate required hours from subjects
    asignaturas.forEach(asignatura => {
        if (workload[asignatura.profesorId]) {
            workload[asignatura.profesorId].horasRequeridas += asignatura.horas;
        }
    });

    return workload;
}

function mostrarResumenCargaDocente(workload) {
    let html = '<div class="workload-summary"><h3>Resumen de Carga Docente</h3>';
    html += '<table class="workload-table"><thead><tr>';
    html += '<th>Profesor</th><th>Horas Disponibles</th><th>Horas Requeridas</th><th>Balance</th>';
    html += '</tr></thead><tbody>';

    Object.values(workload).forEach(teacher => {
        const balance = teacher.horasDisponibles - teacher.horasRequeridas;
        const balanceClass = balance < 0 ? 'negative' : 'positive';
        const emoji = balance < 0 ? '⚠️' : '✓';
        
        html += `<tr>
            <td>${teacher.nombre}</td>
            <td>${teacher.horasDisponibles}</td>
            <td>${teacher.horasRequeridas}</td>
            <td class="${balanceClass}">${balance} ${emoji}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    
    // Insert at the beginning of resultadoHorario
    resultadoHorario.innerHTML = html;
}
    function mostrarTodosHorarios(horariosPorGrupo, dias, horas) {
    const coloresAsignaturas = {};
    
    // Generate colors for each subject
    asignaturas.forEach(asignatura => {
        coloresAsignaturas[asignatura.id] = getColorFromAsignatura(asignatura.nombre);
    });

    let html = '<div class="horario"><h3>Horarios Generados</h3>';
    
    // Show schedules for all groups
    grupos.forEach(grupo => {
        html += `<div class="grupo-horario"><h4>Grupo: ${grupo.nombre}</h4>`;
        html += '<div class="table-container"><table class="horario-table"><thead><tr><th class="hora-header">Hora</th>';
        
        // Day headers with equal width
        dias.forEach(dia => {
            html += `<th class="dia-header">${dia.charAt(0).toUpperCase() + dia.slice(1)}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        // Time rows
        horas.forEach(hora => {
            html += `<tr><td class="hora-cell">${hora}</td>`;
            
            dias.forEach(dia => {
                const clase = horariosPorGrupo[grupo.id][dia][hora];
                html += `<td class="dia-cell">`;
                
                if (clase) {
                    const color = coloresAsignaturas[clase.asignaturaId] || '#f0f0f0';
                    html += `<div class="asignatura-cell" style="background-color: ${color}">`;
                    html += `<strong>${clase.asignatura}</strong><br>${clase.profesor}`;
                    html += `</div>`;
                } else {
                    // Highlight empty slots
                    html += `<div class="asignatura-cell empty">`;
                    html += `-`;
                    html += `</div>`;
                }
                
                html += `</td>`;
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div></div>';
    });
    
    html += '</div>';
    resultadoHorario.innerHTML += html;
}
function compactarHorarios(horariosPorGrupo, dias, horas) {
    // Create a deep copy of the schedule to modify
    const horariosCompactados = JSON.parse(JSON.stringify(horariosPorGrupo));
    
    // Para cada grupo, intentar mover clases hacia arriba para eliminar huecos
    grupos.forEach(grupo => {
        dias.forEach(dia => {
            for (let i = 1; i < horas.length; i++) {
                const horaActual = horas[i];
                const horaAnterior = horas[i-1];
                
                // Si la hora actual tiene clase y la anterior está vacía
                if (horariosCompactados[grupo.id][dia][horaActual] && 
                    !horariosCompactados[grupo.id][dia][horaAnterior]) {
                    
                    // Verificar si podemos mover la clase hacia arriba
                    const clase = horariosCompactados[grupo.id][dia][horaActual];
                    const profesor = profesores.find(p => p.nombre === clase.profesor);
                    
                    if (profesor && profesor.disponibilidad[dia]?.disponible) {
                        const horaInicioDisponible = profesor.disponibilidad[dia].horaInicio;
                        const horaFinDisponible = profesor.disponibilidad[dia].horaFin;
                        
                        if (horaAnterior >= horaInicioDisponible && horaAnterior <= horaFinDisponible) {
                            // Verificar que el profesor no esté ya asignado en esa hora en otro grupo
                            let profesorDisponible = true;
                            grupos.forEach(g => {
                                if (g.id !== grupo.id && horariosCompactados[g.id][dia][horaAnterior]?.profesor === clase.profesor) {
                                    profesorDisponible = false;
                                }
                            });
                            
                            if (profesorDisponible) {
                                // Mover la clase hacia arriba
                                horariosCompactados[grupo.id][dia][horaAnterior] = clase;
                                horariosCompactados[grupo.id][dia][horaActual] = null;
                            }
                        }
                    }
                }
            }
        });
    });

    return horariosCompactados;
}

function calcularCargaDocente() {
    const workload = {};

    // Initialize workload for each teacher
    profesores.forEach(profesor => {
        workload[profesor.id] = {
            nombre: profesor.nombre,
            horasDisponibles: 0,
            horasRequeridas: 0
        };

        // Calculate available hours
        Object.entries(profesor.disponibilidad).forEach(([dia, info]) => {
            if (info.disponible) {
                const start = parseInt(info.horaInicio.split(':')[0]);
                const end = parseInt(info.horaFin.split(':')[0]);
                workload[profesor.id].horasDisponibles += (end - start);
            }
        });
    });

    // Calculate required hours from subjects
    asignaturas.forEach(asignatura => {
        if (workload[asignatura.profesorId]) {
            workload[asignatura.profesorId].horasRequeridas += asignatura.horas;
        }
    });

    return workload;
}

function mostrarHorariosProfesores(horariosPorProfesor, dias, horas) {
    const coloresAsignaturas = {};

    // Generar colores para cada asignatura
    asignaturas.forEach(asignatura => {
        coloresAsignaturas[asignatura.id] = getColorFromAsignatura(asignatura.nombre);
    });

    let html = '<div class="horario"><h3>Horarios por Profesor</h3>';

    // Mostrar horarios de todos los profesores
    profesores.forEach(profesor => {
        html += `<div class="grupo-horario"><h4>Profesor: ${profesor.nombre}</h4>`;
        html += '<div class="table-container"><table class="horario-table"><thead><tr><th class="hora-header">Hora</th>';

        // Encabezados de días
        dias.forEach(dia => {
            html += `<th class="dia-header">${dia.charAt(0).toUpperCase() + dia.slice(1)}</th>`;
        });

        html += '</tr></thead><tbody>';

        // Filas de horas
        horas.forEach(hora => {
            html += `<tr><td class="hora-cell">${hora}</td>`;

            dias.forEach(dia => {
                const clase = horariosPorProfesor[profesor.id][dia][hora];
                html += `<td class="dia-cell">`;

                if (clase) {
                    const color = coloresAsignaturas[clase.asignaturaId] || '#f0f0f0';
                    html += `<div class="asignatura-cell" style="background-color: ${color}">`;
                    html += `<strong>${clase.asignatura}</strong><br>${clase.grupo}`;
                    html += `</div>`;
                } else {
                    // Resaltar celdas vacías
                    html += `<div class="asignatura-cell empty">`;
                    html += `-`;
                    html += `</div>`;
                }

                html += `</td>`;
            });

            html += '</tr>';
        });

        html += '</tbody></table></div></div>';
    });

    html += '</div>';
    resultadoHorario.innerHTML += html;
}


function mostrarResumenCargaDocente(workload) {
    let html = '<div class="workload-summary"><h3>Resumen de Carga Docente</h3>';
    html += '<table class="workload-table"><thead><tr>';
    html += '<th>Profesor</th><th>Horas Disponibles</th><th>Horas Requeridas</th><th>Balance</th>';
    html += '</tr></thead><tbody>';

    Object.values(workload).forEach(teacher => {
        const balance = teacher.horasDisponibles - teacher.horasRequeridas;
        const balanceClass = balance < 0 ? 'negative' : 'positive';
        const emoji = balance < 0 ? '⚠️' : '✓';
        
        html += `<tr>
            <td>${teacher.nombre}</td>
            <td>${teacher.horasDisponibles}</td>
            <td>${teacher.horasRequeridas}</td>
            <td class="${balanceClass}">${balance} ${emoji}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    
    // Insert at the beginning of resultadoHorario
    resultadoHorario.innerHTML = html;
}

    function mostrarHorario(horariosPorGrupo, dias, horas) {
        const grupoSeleccionado = document.getElementById('select-grupo').value;
        const coloresAsignaturas = {};
        
        // Generar colores para cada asignatura
        asignaturas.forEach(asignatura => {
            coloresAsignaturas[asignatura.id] = getColorFromAsignatura(asignatura.nombre);
        });
        
        let html = '<div class="horario"><h3>Horario Generado</h3>';
        
        if (grupoSeleccionado === 'todos') {
            // Mostrar horarios de todos los grupos
            grupos.forEach(grupo => {
                html += `<h4>Grupo: ${grupo.nombre}</h4>`;
                html += '<table class="horario-table"><thead><tr><th>Hora</th>';
                
                // Encabezados de días
                dias.forEach(dia => {
                    html += `<th>${dia.charAt(0).toUpperCase() + dia.slice(1)}</th>`;
                });
                
                html += '</tr></thead><tbody>';
                
                // Filas de horas
                horas.forEach(hora => {
                    html += `<tr><td class="hora-cell">${hora}</td>`;
                    
                    dias.forEach(dia => {
                        const clase = horariosPorGrupo[grupo.id][dia][hora];
                        html += `<td>`;
                        
                        if (clase) {
                            const color = coloresAsignaturas[clase.asignaturaId] || '#f0f0f0';
                            html += `<div class="asignatura-cell" style="background-color: ${color}">`;
                            html += `<strong>${clase.asignatura}</strong><br>${clase.profesor}`;
                            html += `</div>`;
                        }
                        
                        html += `</td>`;
                    });
                    
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
            });
        } else {
            // Mostrar horario de un grupo específico
            const grupo = grupos.find(g => g.id === grupoSeleccionado);
            if (grupo) {
                html += `<h4>Grupo: ${grupo.nombre}</h4>`;
                html += '<table class="horario-table"><thead><tr><th>Hora</th>';
                
                // Encabezados de días
                dias.forEach(dia => {
                    html += `<th>${dia.charAt(0).toUpperCase() + dia.slice(1)}</th>`;
                });
                
                html += '</tr></thead><tbody>';
                
                // Filas de horas
                horas.forEach(hora => {
                    html += `<tr><td class="hora-cell">${hora}</td>`;
                    
                    dias.forEach(dia => {
                        const clase = horariosPorGrupo[grupoSeleccionado][dia][hora];
                        html += `<td>`;
                        
                        if (clase) {
                            const color = coloresAsignaturas[clase.asignaturaId] || '#f0f0f0';
                            html += `<div class="asignatura-cell" style="background-color: ${color}">`;
                            html += `<strong>${clase.asignatura}</strong><br>${clase.profesor}`;
                            html += `</div>`;
                        }
                        
                        html += `</td>`;
                    });
                    
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
            }
        }
        
        html += '</div>';
        resultadoHorario.innerHTML = html;
    }
});


