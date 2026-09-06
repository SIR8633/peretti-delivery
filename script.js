// Estado del Carrito y Configuración
let cart = [];
const WHATSAPP_PHONE = "5491138530778";
const DELIVERY_FEE = 500;

document.addEventListener("DOMContentLoaded", () => {
    renderMenu();
    setupCartListeners();
    setupPaymentToggle();
});

// Renderizar el Menú
function renderMenu() {
    const container = document.getElementById("menu-container");
    if (!container) return;
    container.innerHTML = "";

    for (const [categoria, productos] of Object.entries(menuData)) {
        const catSection = document.createElement("div");
        catSection.className = "category-section";

        const catTitle = document.createElement("h3");
        catTitle.className = "category-title";
        catTitle.textContent = categoria;
        catSection.appendChild(catTitle);

        const grid = document.createElement("div");
        grid.className = "products-grid";

        productos.forEach(prod => {
            const card = document.createElement("div");
            card.className = "product-card";

            const badgeHtml = prod.badge ? `<span class="product-badge">${prod.badge}</span>` : "";

            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${prod.img}" alt="${prod.nombre}" loading="lazy" class="product-img" onerror="this.src='img/menu/papas.jpg'">
                    ${badgeHtml}
                </div>
                <div class="product-info">
                    <h4 class="product-title">${prod.nombre}</h4>
                    <p class="product-desc">${prod.descripcion}</p>
                    <div class="product-footer">
                        <span class="product-price">$${prod.precio.toLocaleString("es-AR")}</span>
                        <button class="btn-add" onclick="addToCart('${prod.id}')">
                            <span class="btn-icon">+</span> Agregar
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        catSection.appendChild(grid);
        container.appendChild(catSection);
    }
}

// Buscar producto por ID
function findProduct(id) {
    for (const productos of Object.values(menuData)) {
        const found = productos.find(p => p.id === id);
        if (found) return found;
    }
    return null;
}

// Agregar al Carrito
function addToCart(id) {
    const prod = findProduct(id);
    if (!prod) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...prod, qty: 1 });
    }

    updateCartUI();
    showToast(`¡${prod.nombre} agregado!`);
}

// Modificar cantidad
function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }

    updateCartUI();
}

// Actualizar Interfaz del Carrito
function updateCartUI() {
    const cartItemsEl = document.getElementById("cart-items");
    const subtotalEl = document.getElementById("cart-subtotal");
    const deliveryFeeEl = document.getElementById("cart-delivery");
    const totalEl = document.getElementById("cart-total");
    const floatCart = document.getElementById("float-cart");
    const floatCount = document.getElementById("float-cart-count");
    const floatTotal = document.getElementById("float-cart-total");

    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.precio), 0);
    const totalFinal = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;

    if (cart.length === 0) {
        if (cartItemsEl) cartItemsEl.innerHTML = '<li id="empty-cart-msg">Tu carrito está vacío. ¡Elegí lo que más te guste del menú!</li>';
        if (subtotalEl) subtotalEl.textContent = "$0";
        if (deliveryFeeEl) deliveryFeeEl.textContent = "$0";
        if (totalEl) totalEl.textContent = "$0";
        if (floatCart) floatCart.classList.add("hidden");
        updateCashChangeCalculation(0);
        return;
    }

    if (cartItemsEl) {
        cartItemsEl.innerHTML = "";
        cart.forEach(item => {
            const li = document.createElement("li");
            li.className = "cart-item";
            li.innerHTML = `
                <div class="cart-item-info">
                    <strong>${item.nombre}</strong>
                    <span class="cart-item-price">$${(item.precio * item.qty).toLocaleString("es-AR")}</span>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="changeQty('${item.id}', -1)" title="Restar uno">-</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty('${item.id}', 1)" title="Sumar uno">+</button>
                    <button class="remove-btn" onclick="changeQty('${item.id}', -${item.qty})" title="Eliminar">&times;</button>
                </div>
            `;
            cartItemsEl.appendChild(li);
        });
    }

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString("es-AR")}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = `$${DELIVERY_FEE.toLocaleString("es-AR")}`;
    if (totalEl) totalEl.textContent = `$${totalFinal.toLocaleString("es-AR")}`;

    // Botón flotante móvil
    if (floatCart && floatCount && floatTotal) {
        floatCart.classList.remove("hidden");
        floatCount.textContent = `${totalQty} ${totalQty === 1 ? 'ítem' : 'ítems'}`;
        floatTotal.textContent = `$${totalFinal.toLocaleString("es-AR")}`;
    }

    updateCashChangeCalculation(totalFinal);
}

// Configurar toggle y cálculo de Efectivo
function setupPaymentToggle() {
    const radios = document.querySelectorAll('input[name="forma_pago"]');
    const cashContainer = document.getElementById("cash-options-container");
    const cashInput = document.getElementById("monto_abona");
    const btnPagoJusto = document.getElementById("btn-pago-justo");

    radios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (cashContainer) {
                if (e.target.value === "efectivo") {
                    cashContainer.classList.remove("hidden");
                } else {
                    cashContainer.classList.add("hidden");
                }
            }
        });
    });

    if (cashInput) {
        cashInput.addEventListener("input", () => {
            const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.precio), 0);
            const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;
            updateCashChangeCalculation(total);
        });
    }

    if (btnPagoJusto) {
        btnPagoJusto.addEventListener("click", () => {
            const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.precio), 0);
            const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;
            if (cashInput) cashInput.value = total > 0 ? total : "";
            updateCashChangeCalculation(total);
        });
    }
}

// Calcular vuelto de efectivo
function updateCashChangeCalculation(total) {
    const cashInput = document.getElementById("monto_abona");
    const changeFeedback = document.getElementById("cash-change-feedback");
    if (!cashInput || !changeFeedback) return;

    const val = parseFloat(cashInput.value);
    if (!val || val <= 0 || total <= 0) {
        changeFeedback.innerHTML = "";
        return;
    }

    if (val === total) {
        changeFeedback.innerHTML = `<span class="change-exact">✓ Pago justo (sin cambio)</span>`;
    } else if (val > total) {
        const vuelto = val - total;
        changeFeedback.innerHTML = `<span class="change-info">💵 El repartidor llevará tu vuelto de: <strong>$${vuelto.toLocaleString("es-AR")}</strong></span>`;
    } else {
        changeFeedback.innerHTML = `<span class="change-warn">⚠️ El monto ingresado es menor al total ($${total.toLocaleString("es-AR")})</span>`;
    }
}

// Enviar Pedido por WhatsApp
function setupCartListeners() {
    const btnWhatsapp = document.getElementById("whatsapp-button");
    if (!btnWhatsapp) return;

    btnWhatsapp.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío. ¡Elegí algo rico del menú antes de enviar!");
            return;
        }

        const nombre = document.getElementById("nombre").value.trim();
        if (!nombre) {
            alert("Por favor indicanos tu nombre.");
            document.getElementById("nombre").focus();
            return;
        }

        const direccion = document.getElementById("direccion").value.trim();
        if (!direccion) {
            alert("Por favor ingresá tu dirección para el delivery (calle, altura, piso/depto).");
            document.getElementById("direccion").focus();
            return;
        }

        const pagoSeleccionado = document.querySelector('input[name="forma_pago"]:checked').value;
        const aclaraciones = document.getElementById("aclaraciones").value.trim();

        const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.precio), 0);
        const total = subtotal + DELIVERY_FEE;

        let detallePago = "";
        if (pagoSeleccionado === "transferencia") {
            detallePago = "📱 Transferencia (Alias: peretti.mp)";
        } else {
            const cashVal = parseFloat(document.getElementById("monto_abona").value);
            if (cashVal && cashVal > total) {
                const vuelto = cashVal - total;
                detallePago = `💵 Efectivo (pago con $${cashVal.toLocaleString("es-AR")} - vuelto de $${vuelto.toLocaleString("es-AR")})`;
            } else if (cashVal && cashVal === total) {
                detallePago = "💵 Efectivo (pago justo)";
            } else {
                detallePago = "💵 Efectivo";
            }
        }

        // Armado del mensaje en tono argentino cercano y profesional
        let mensaje = `🍔 *¡Hola Peretti! Quiero hacer un pedido:* 🍔\n\n`;
        mensaje += `👤 *Nombre:* ${nombre}\n`;
        mensaje += `🛵 *Entrega:* Delivery en Chacarita y alrededores\n`;
        mensaje += `🏠 *Dirección:* ${direccion}\n\n`;

        mensaje += `📋 *DETALLE DEL PEDIDO:*\n`;
        cart.forEach(item => {
            mensaje += ` • ${item.qty}x ${item.nombre} ($${(item.precio * item.qty).toLocaleString("es-AR")})\n`;
        });

        mensaje += `\n📦 *Subtotal:* $${subtotal.toLocaleString("es-AR")}\n`;
        mensaje += `🛵 *Envío:* $${DELIVERY_FEE.toLocaleString("es-AR")}\n`;
        mensaje += `💰 *TOTAL A ABONAR:* $${total.toLocaleString("es-AR")}\n\n`;

        mensaje += `💳 *Forma de pago:* ${detallePago}\n`;
        if (aclaraciones) {
            mensaje += `📝 *Aclaraciones:* ${aclaraciones}\n`;
        }

        mensaje += `\n¡Muchas gracias! Aguardo confirmación y demora estimada. 🙌`;

        const encoded = encodeURIComponent(mensaje);
        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
        window.open(url, "_blank");
    });
}

// Toast de notificación rápido
function showToast(msg) {
    let toast = document.getElementById("peretti-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "peretti-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = "toast-show";
    setTimeout(() => {
        toast.className = "";
    }, 2000);
}
