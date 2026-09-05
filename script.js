// Estado del Carrito
let cart = [];
const WHATSAPP_PHONE = "5491138530778";

document.addEventListener("DOMContentLoaded", () => {
    renderMenu();
    setupCartListeners();
    setupDeliveryToggle();
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
                    <img src="${prod.img}" alt="${prod.nombre}" loading="lazy" class="product-img" onerror="this.src='img/menu/sandwich.jpg'">
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
    const cartTotalEl = document.getElementById("cart-total");
    const emptyMsg = document.getElementById("empty-cart-msg");
    const floatCart = document.getElementById("float-cart");
    const floatCount = document.getElementById("float-cart-count");
    const floatTotal = document.getElementById("float-cart-total");

    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.qty * item.precio), 0);

    if (cart.length === 0) {
        if (cartItemsEl) cartItemsEl.innerHTML = '<li id="empty-cart-msg">Tu carrito está vacío. ¡Elegí lo que más te guste!</li>';
        if (cartTotalEl) cartTotalEl.textContent = "Total: $0";
        if (floatCart) floatCart.classList.add("hidden");
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
                    <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
                    <button class="remove-btn" onclick="changeQty('${item.id}', -${item.qty})" title="Eliminar">&times;</button>
                </div>
            `;
            cartItemsEl.appendChild(li);
        });
    }

    if (cartTotalEl) {
        cartTotalEl.textContent = `Total: $${totalPrice.toLocaleString("es-AR")}`;
    }

    // Botón flotante móvil
    if (floatCart && floatCount && floatTotal) {
        floatCart.classList.remove("hidden");
        floatCount.textContent = `${totalQty} ${totalQty === 1 ? 'ítem' : 'ítems'}`;
        floatTotal.textContent = `$${totalPrice.toLocaleString("es-AR")}`;
    }
}

// Toggle Delivery / Retiro
function setupDeliveryToggle() {
    const deliveryRadio = document.querySelectorAll('input[name="tipo_entrega"]');
    const addressGroup = document.getElementById("address-group");

    deliveryRadio.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (addressGroup) {
                if (e.target.value === "delivery") {
                    addressGroup.style.display = "block";
                    document.getElementById("direccion").required = true;
                } else {
                    addressGroup.style.display = "none";
                    document.getElementById("direccion").required = false;
                }
            }
        });
    });
}

// Enviar Pedido por WhatsApp
function setupCartListeners() {
    const btnWhatsapp = document.getElementById("whatsapp-button");
    if (!btnWhatsapp) return;

    btnWhatsapp.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío. Por favor agrega productos antes de enviar el pedido.");
            return;
        }

        const nombre = document.getElementById("nombre").value.trim();
        if (!nombre) {
            alert("Por favor ingresá tu nombre.");
            document.getElementById("nombre").focus();
            return;
        }

        const tipoEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
        let direccion = "";
        if (tipoEntrega === "delivery") {
            direccion = document.getElementById("direccion").value.trim();
            if (!direccion) {
                alert("Por favor ingresá tu dirección para el delivery.");
                document.getElementById("direccion").focus();
                return;
            }
        }

        const pago = document.querySelector('input[name="forma_pago"]:checked').value;
        const aclaraciones = document.getElementById("aclaraciones").value.trim();

        const totalPedido = cart.reduce((acc, item) => acc + (item.qty * item.precio), 0);

        // Armado del mensaje de WhatsApp
        let mensaje = `🍔 *¡HOLA PERETTI! QUIERO HACER UN PEDIDO* 🍔\n\n`;
        mensaje += `👤 *Cliente:* ${nombre}\n`;
        mensaje += `📍 *Entrega:* ${tipoEntrega === 'delivery' ? '🛵 Delivery a domicilio' : '🏪 Retiro por local'}\n`;
        if (tipoEntrega === "delivery") {
            mensaje += `🏠 *Dirección:* ${direccion} (Chacarita / CABA)\n`;
        }
        mensaje += `💳 *Forma de Pago:* ${pago}\n`;
        if (pago.includes("Transferencia")) {
            mensaje += `   _(Alias: peretti.mp)_\n`;
        }
        if (aclaraciones) {
            mensaje += `📝 *Aclaraciones:* ${aclaraciones}\n`;
        }

        mensaje += `\n📋 *DETALLE DEL PEDIDO:*\n`;
        cart.forEach(item => {
            mensaje += ` • ${item.qty}x ${item.nombre} - $${(item.precio * item.qty).toLocaleString("es-AR")}\n`;
        });

        mensaje += `\n💰 *TOTAL:* $${totalPedido.toLocaleString("es-AR")}\n\n`;
        mensaje += `¡Muchas gracias! Aguardo confirmación. 🙌`;

        const encodedMsg = encodeURIComponent(mensaje);
        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

        window.open(url, "_blank");
    });
}

// Toast de notificación
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
    }, 2200);
}
