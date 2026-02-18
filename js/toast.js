/**
 * toast.js - Sistema de notificaciones toast
 * Reemplaza todos los alert() del sistema
 * Versión: 1.0
 */

// ===== CONFIGURACIÓN =====
const TOAST_CONFIG = {
    duration: 4000, // 4 segundos
    animationTime: 300 // 0.3 segundos
};

// ===== MOSTRAR TOAST =====
function showToast(message, type = 'success') {
    console.log(`🍞 Toast ${type}:`, message);
    
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container no encontrado');
        return;
    }
    
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icono según tipo
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Agregar al container
    container.appendChild(toast);
    
    // Auto-remover después de la duración
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, TOAST_CONFIG.duration);
}

// ===== FUNCIONES DE AYUDA =====
function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showInfo(message) {
    showToast(message, 'info');
}

function showWarning(message) {
    showToast(message, 'warning');
}

// ===== EXPORTAR =====
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showInfo = showInfo;
window.showWarning = showWarning;

console.log('✅ toast.js cargado');