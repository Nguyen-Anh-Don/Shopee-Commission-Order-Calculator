// IndexedDB Helper Module for Shopee Extension
// Manages orders, clicks, and affiliate links storage

const DB_NAME = "shopeeExtensionDB";
const DB_VERSION = 1;

let db = null;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB open error:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create orders object store
            if (!database.objectStoreNames.contains("orders")) {
                const ordersStore = database.createObjectStore("orders", { keyPath: "key" });
                ordersStore.createIndex("purchase_time", "purchase_time", { unique: false });
                ordersStore.createIndex("checkout_id", "checkout_id", { unique: false });
                ordersStore.createIndex("order_id", "order_id", { unique: false });
            }

            // Create clicks object store
            if (!database.objectStoreNames.contains("clicks")) {
                const clicksStore = database.createObjectStore("clicks", { keyPath: "key" });
                clicksStore.createIndex("click_time", "click_time", { unique: false });
                clicksStore.createIndex("click_id", "click_id", { unique: false });
            }

            // Create affiliateLinks object store
            if (!database.objectStoreNames.contains("affiliateLinks")) {
                const linksStore = database.createObjectStore("affiliateLinks", {
                    keyPath: "id",
                    autoIncrement: true,
                });
                linksStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
    });
}

// ===== ORDERS OPERATIONS =====

// Save a single order
async function saveOrder(key, orderData) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["orders"], "readwrite");
        const store = transaction.objectStore("orders");

        const order = {
            key: key,
            data: orderData,
            purchase_time: orderData.purchase_time || orderData.checkout_complete_time || 0,
            checkout_id: orderData.checkout_id || "",
            order_id: orderData.orders?.[0]?.order_id || "",
        };

        const request = store.put(order);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Save multiple orders (batch operation)
async function saveOrders(ordersObject) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["orders"], "readwrite");
        const store = transaction.objectStore("orders");

        let completed = 0;
        const total = Object.keys(ordersObject).length;
        let hasError = false;

        if (total === 0) {
            resolve();
            return;
        }

        Object.entries(ordersObject).forEach(([key, orderData]) => {
            const order = {
                key: key,
                data: orderData,
                purchase_time: orderData.purchase_time || orderData.checkout_complete_time || 0,
                checkout_id: orderData.checkout_id || "",
                order_id: orderData.orders?.[0]?.order_id || "",
            };

            const request = store.put(order);

            request.onsuccess = () => {
                completed++;
                if (completed === total && !hasError) {
                    resolve();
                }
            };

            request.onerror = () => {
                if (!hasError) {
                    hasError = true;
                    reject(request.error);
                }
            };
        });
    });
}

// Get a single order by key
async function getOrder(key) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["orders"], "readonly");
        const store = transaction.objectStore("orders");
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };

        request.onerror = () => reject(request.error);
    });
}

// Get all orders
async function getAllOrders() {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["orders"], "readonly");
        const store = transaction.objectStore("orders");
        const request = store.getAll();

        request.onsuccess = () => {
            // Convert back to object format for backward compatibility
            const orderHistory = {};
            request.result.forEach((item) => {
                orderHistory[item.key] = item.data;
            });
            resolve(orderHistory);
        };

        request.onerror = () => reject(request.error);
    });
}

// Delete a single order
async function deleteOrder(key) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["orders"], "readwrite");
        const store = transaction.objectStore("orders");
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Clear all orders
async function clearOrders() {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["orders"], "readwrite");
        const store = transaction.objectStore("orders");
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ===== CLICKS OPERATIONS =====

// Save a single click
async function saveClick(key, clickData) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["clicks"], "readwrite");
        const store = transaction.objectStore("clicks");

        const click = {
            key: key,
            data: clickData,
            click_time: clickData.click_time || 0,
            click_id: clickData.click_id || "",
        };

        const request = store.put(click);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Save multiple clicks (batch operation)
async function saveClicks(clicksObject) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["clicks"], "readwrite");
        const store = transaction.objectStore("clicks");

        let completed = 0;
        const total = Object.keys(clicksObject).length;
        let hasError = false;

        if (total === 0) {
            resolve();
            return;
        }

        Object.entries(clicksObject).forEach(([key, clickData]) => {
            const click = {
                key: key,
                data: clickData,
                click_time: clickData.click_time || 0,
                click_id: clickData.click_id || "",
            };

            const request = store.put(click);

            request.onsuccess = () => {
                completed++;
                if (completed === total && !hasError) {
                    resolve();
                }
            };

            request.onerror = () => {
                if (!hasError) {
                    hasError = true;
                    reject(request.error);
                }
            };
        });
    });
}

// Get a single click by key
async function getClick(key) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["clicks"], "readonly");
        const store = transaction.objectStore("clicks");
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };

        request.onerror = () => reject(request.error);
    });
}

// Get all clicks
async function getAllClicks() {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["clicks"], "readonly");
        const store = transaction.objectStore("clicks");
        const request = store.getAll();

        request.onsuccess = () => {
            // Convert back to object format for backward compatibility
            const clickHistory = {};
            request.result.forEach((item) => {
                clickHistory[item.key] = item.data;
            });
            resolve(clickHistory);
        };

        request.onerror = () => reject(request.error);
    });
}

// Delete a single click
async function deleteClick(key) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["clicks"], "readwrite");
        const store = transaction.objectStore("clicks");
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Clear all clicks
async function clearClicks() {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["clicks"], "readwrite");
        const store = transaction.objectStore("clicks");
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ===== AFFILIATE LINKS OPERATIONS =====

// Save an affiliate link
async function saveAffiliateLink(linkData) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["affiliateLinks"], "readwrite");
        const store = transaction.objectStore("affiliateLinks");

        const link = {
            ...linkData,
            timestamp: linkData.timestamp || Date.now(),
        };

        const request = store.add(link);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Get all affiliate links
async function getAllAffiliateLinks() {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["affiliateLinks"], "readonly");
        const store = transaction.objectStore("affiliateLinks");
        const index = store.index("timestamp");
        const request = index.getAll();

        request.onsuccess = () => {
            // Sort by timestamp descending (newest first) and limit to 100
            const links = request.result
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, 100)
                .map((item) => {
                    // Remove the auto-increment id from the result
                    const { id, ...linkData } = item;
                    return linkData;
                });
            resolve(links);
        };

        request.onerror = () => reject(request.error);
    });
}

// Delete an affiliate link by id
async function deleteAffiliateLink(id) {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["affiliateLinks"], "readwrite");
        const store = transaction.objectStore("affiliateLinks");
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Clear all affiliate links
async function clearAffiliateLinks() {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["affiliateLinks"], "readwrite");
        const store = transaction.objectStore("affiliateLinks");
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Export API
const idb = {
    // Orders
    saveOrder,
    saveOrders,
    getOrder,
    getAllOrders,
    deleteOrder,
    clearOrders,

    // Clicks
    saveClick,
    saveClicks,
    getClick,
    getAllClicks,
    deleteClick,
    clearClicks,

    // Affiliate Links
    saveAffiliateLink,
    getAllAffiliateLinks,
    deleteAffiliateLink,
    clearAffiliateLinks,

    // Init
    initDB,
};

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = idb;
}

// Make available globally
if (typeof window !== "undefined") {
    window.idb = idb;
}

