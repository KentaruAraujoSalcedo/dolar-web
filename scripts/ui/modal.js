// ==============================
// File: scripts/ui/modal.js
// Modal engine genérico (SUNAT + Ranking) - sin ESC duplicado
// ==============================

let lastActiveEl = null;

function isOpen(modalEl) {
  return modalEl?.getAttribute("aria-hidden") === "false";
}

export function openModal(modalEl) {
  if (!modalEl || isOpen(modalEl)) return;

  lastActiveEl = document.activeElement;

  modalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const closeBtn = modalEl.querySelector('[data-close], .modal__close');
  const focusTarget = closeBtn || modalEl.querySelector(".modal__panel") || modalEl;
  focusTarget?.focus?.({ preventScroll: true });
}

export function closeModal(modalEl) {
  if (!modalEl || !isOpen(modalEl)) return;

  modalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastActiveEl && typeof lastActiveEl.focus === "function") {
    lastActiveEl.focus({ preventScroll: true });
  }
  lastActiveEl = null;
}

// ✅ 1 SOLO handler global (no se duplica aunque llames initModal 10 veces)
function bindGlobalEscOnce() {
  if (window.__modalEscBound) return;

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    const openEl = document.querySelector('.modal[aria-hidden="false"]');
    if (!openEl) return;

    closeModal(openEl);
  });

  window.__modalEscBound = true;
}

export function initModal({ modalId, openerSelector, onOpen, onClose } = {}) {
  const modalEl = typeof modalId === "string"
    ? document.getElementById(modalId)
    : modalId;

  if (!modalEl) return null;

  bindGlobalEscOnce();

  // Click overlay / close buttons
  modalEl.addEventListener("click", (e) => {
    const t = e.target;

    if (t?.matches?.("[data-close]") || t?.classList?.contains("modal__overlay")) {
      e.preventDefault();
      closeModal(modalEl);
      onClose?.();
    }
  });

  // Focus trap simple
  modalEl.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    if (!isOpen(modalEl)) return;

    const focusables = modalEl.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Opener
  if (openerSelector) {
    const opener = document.querySelector(openerSelector);
    opener?.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(modalEl);
      onOpen?.();
    });
  }

  return {
    modalEl,
    open: () => {
      openModal(modalEl);
      onOpen?.();
    },
    close: () => {
      closeModal(modalEl);
      onClose?.();
    },
  };
}