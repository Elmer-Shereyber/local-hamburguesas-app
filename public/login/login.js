import { login, redirectToRoleHome } from '../shared/auth.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { auth } from '../shared/firebase-config.js';
import { showAlert } from '../shared/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Elementos Login
    const cardLogin = document.getElementById('card-login');
    const loginForm = document.getElementById('login-form');
    const identifierInput = document.getElementById('identifier');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');
    const forgotPasswordContainer = document.getElementById('forgot-password-container');
    const linkForgotPassword = document.getElementById('link-forgot-password');

    // Elementos Recuperar Contraseña (HU-15)
    const cardReset = document.getElementById('card-reset');
    const resetDesc = document.getElementById('reset-desc');
    const resetForm = document.getElementById('reset-form');
    const resetEmailInput = document.getElementById('reset-email');
    const resetSuccessView = document.getElementById('reset-success-view');
    const btnSubmitReset = document.getElementById('btn-submit-reset');
    const linkBackLogin = document.getElementById('link-back-login');
    const btnReturnLogin = document.getElementById('btn-return-login');

    // CA01: La opción '¿Olvidaste tu contraseña?' está disponible únicamente cuando
    // se está intentando ingresar con correo (Administrador, no cajera ni cocina).
    identifierInput.addEventListener('input', () => {
        const val = identifierInput.value.trim();
        if (val.includes('@')) {
            forgotPasswordContainer.style.display = 'block';
        } else {
            forgotPasswordContainer.style.display = 'none';
        }
    });

    // Función auxiliar para restablecer la tarjeta a su estado inicial
    function resetearVistaRecuperacion() {
        resetForm.style.display = 'block';
        resetDesc.style.display = 'block';
        resetSuccessView.style.display = 'none';
        resetEmailInput.value = '';
    }

    // Cambiar a la vista de recuperación de contraseña
    linkForgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        errorMsg.textContent = '';
        resetearVistaRecuperacion();
        resetEmailInput.value = identifierInput.value.trim();
        cardLogin.style.display = 'none';
        cardReset.style.display = 'block';
        resetEmailInput.focus();
    });

    // Volver a la vista de login desde el enlace inicial
    linkBackLogin.addEventListener('click', (e) => {
        e.preventDefault();
        cardReset.style.display = 'none';
        cardLogin.style.display = 'block';
        identifierInput.focus();
    });

    // Volver a la vista de login tras haber enviado el enlace
    if (btnReturnLogin) {
        btnReturnLogin.addEventListener('click', () => {
            cardReset.style.display = 'none';
            cardLogin.style.display = 'block';
            resetearVistaRecuperacion();
            identifierInput.focus();
        });
    }

    // CA02, CA03: Procesar solicitud de restablecimiento con mensaje neutro
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = resetEmailInput.value.trim();
        if (!email) return;

        btnSubmitReset.disabled = true;
        btnSubmitReset.textContent = 'Enviando...';

        try {
            // Envío del enlace usando el servicio oficial de Firebase Authentication (CA02, CA04, CA05)
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.warn("Nota sobre recuperación:", error.message);
            // Por seguridad y según CA03, no se debe revelar si el correo existe o no
        } finally {
            btnSubmitReset.disabled = false;
            btnSubmitReset.textContent = 'Enviar Enlace';

            // Ocultar formulario e instrucciones, mostrar únicamente el mensaje y el botón para volver
            resetForm.style.display = 'none';
            resetDesc.style.display = 'none';
            resetSuccessView.style.display = 'block';
        }
    });

    // Manejo del formulario de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';
        
        const identifier = identifierInput.value.trim();
        const password = passwordInput.value;

        try {
            const { role } = await login(identifier, password);
            redirectToRoleHome(role);
        } catch (error) {
            errorMsg.textContent = "Credenciales inválidas.";
        }
    });
});
