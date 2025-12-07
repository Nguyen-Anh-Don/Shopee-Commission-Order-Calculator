const ALARM_NAME = "pollShopeeEvery5m";
const SYNC_ALARM_NAME = "syncShopeeData";
const NOTIFY_KEY = "notified_date";
const LOGIN_NOTIF_ID = "loginRequired";
const YESTERDAY_DATA_NOTIF_ID = "yesterdayHasData";

let isPolling = false; // khóa tránh gọi chồng
let isSyncing = false; // Khóa tránh sync chồng

// === Tạo lịch 5 phút khi cài / khởi động Chrome
chrome.runtime.onInstalled.addListener((details) => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 });
    // Tạo alarm đồng bộ 6 giờ và chạy ngay lần đầu
    chrome.alarms.create(SYNC_ALARM_NAME, { periodInMinutes: 360 }); // 6 giờ = 360 phút

    // Tạo context menu
    chrome.contextMenus.create({
        id: "calculateCommission",
        title: "Tính toán hoa hồng trang hiện tại",
        contexts: ["page"],
        documentUrlPatterns: ["https://affiliate.shopee.vn/*"],
    });

    chrome.contextMenus.create({
        id: "openOrderHistory",
        title: "Mở lịch sử đơn hàng",
        contexts: ["page"],
        documentUrlPatterns: ["*://*.shopee.vn/*"],
    });

    chrome.contextMenus.create({
        id: "viewProductDetails",
        title: "Xem chi tiết sản phẩm",
        contexts: ["page"],
        documentUrlPatterns: ["*://*.shopee.vn/*"],
    });

    // Mở trang welcome khi cài đặt lần đầu
    if (details.reason === "install") {
        chrome.tabs.create({
            url: "https://addlivetag.com/extension/thank-you.html",
        });
    }

    // Chạy sync ngay lần đầu khi cài đặt
    syncShopeeData();
});

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 });
    chrome.alarms.create(SYNC_ALARM_NAME, { periodInMinutes: 360 });
    // Chạy sync khi khởi động lại
    syncShopeeData();
});

// === Helper
function fmtYMD(d) {
    return d.toISOString().split("T")[0];
}

function getYesterdayRangeSeconds() {
    const now = new Date();
    const today00 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // hôm nay 00:00
    const startYesterday = new Date(today00.getTime() - 86400000); // hôm qua 00:00
    const endYesterday = new Date(today00.getTime() - 1000); // hôm qua 23:59:59
    return {
        s: Math.floor(startYesterday.getTime() / 1000),
        e: Math.floor(endYesterday.getTime() / 1000),
    };
}

async function ensureDailyReset() {
    const today = fmtYMD(new Date());
    const { [NOTIFY_KEY]: notifiedDay } = await chrome.storage.local.get(NOTIFY_KEY);
    if (notifiedDay && notifiedDay !== today) {
        await chrome.storage.local.remove(NOTIFY_KEY);
    }
}

// === Notifications
async function showLoginNotif() {
    const all = await chrome.notifications.getAll();
    if (all && all[LOGIN_NOTIF_ID]) return; // đã có → không tạo thêm
    chrome.notifications.create(LOGIN_NOTIF_ID, {
        type: "basic",
        iconUrl: "/icon/icon128.png",
        title: "Công cụ tính hoa hồng Shopee",
        message: "Phiên đăng nhập Shopee Affiliate đã hết hạn.\nNhấp để mở Shopee Affiliate và đăng nhập lại.",
    });
}

async function showYesterdayDataNotif(total) {
    const all = await chrome.notifications.getAll();
    if (all && all[YESTERDAY_DATA_NOTIF_ID]) return; // tránh trùng
    const totalText = Number(total).toLocaleString("vi-VN");
    chrome.notifications.create(YESTERDAY_DATA_NOTIF_ID, {
        type: "basic",
        iconUrl: "/icon/icon128.png",
        title: "Công cụ tính hoa hồng Shopee",
        message: `Đang bắt đầu lên đơn hôm qua, đã hiện: ${totalText} đơn.`,
    });
}

// === listener click cho tất cả notification
chrome.notifications.onClicked.addListener((notifId) => {
    if (notifId === LOGIN_NOTIF_ID) {
        chrome.tabs.create({ url: "https://affiliate.shopee.vn/" });
        chrome.notifications.clear(LOGIN_NOTIF_ID);
    } else if (notifId === YESTERDAY_DATA_NOTIF_ID) {
        chrome.tabs.create({ url: "https://affiliate.shopee.vn/report/conversion_report" });
        chrome.notifications.clear(YESTERDAY_DATA_NOTIF_ID);
    }
});

// === Poll Shopee API (skip nếu hôm nay đã báo) ===
async function pollShopee() {
    if (isPolling) return; // 1) khoá
    isPolling = true;
    try {
        // 0) nếu hôm nay đã báo, bỏ qua sớm
        const today = fmtYMD(new Date());
        const { [NOTIFY_KEY]: notifiedDay } = await chrome.storage.local.get(NOTIFY_KEY);
        if (notifiedDay === today) {
            console.debug("pollShopee: đã thông báo hôm nay");
            return;
        }

        // 1) gọi API
        const { s, e } = getYesterdayRangeSeconds();
        const url = `https://affiliate.shopee.vn/api/v3/report/list?page_size=500&page_num=1&purchase_time_s=${s}&purchase_time_e=${e}&version=1`;

        const res = await fetch(url, { credentials: "include" });

        if (res.status === 401) {
            await showLoginNotif();
            return;
        }
        if (!res.ok) {
            console.warn("pollShopee: HTTP", res.status);
            return;
        }

        let json = null;
        try {
            json = await res.json();
        } catch (e) {
            console.warn("pollShopee: bad JSON", e);
            return;
        }

        if (json && json.code === 0) {
            const total = json.data?.total_count || 0;
            if (total > 0) {
                await showYesterdayDataNotif(total);
                await chrome.storage.local.set({ [NOTIFY_KEY]: today }); // báo 1 lần/ngày

                // Tự động đồng bộ dữ liệu khi phát hiện đơn hàng mới
                console.log(`pollShopee: phát hiện ${total} đơn hàng mới, bắt đầu đồng bộ...`);
                syncShopeeData().catch((e) => {
                    console.error("pollShopee: lỗi khi đồng bộ tự động:", e);
                });
            }
        }
    } catch (err) {
        console.error("pollShopee error:", err);
    } finally {
        isPolling = false; // 1) mở khoá
    }
}

// === Alarm handler (ổn định) ===
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        try {
            // 1) Reset cờ khi sang ngày mới
            await ensureDailyReset();

            // 2) User tắt thông báo? -> thoát sớm (mặc định undefined = bật)
            const { enableNotif } = await chrome.storage.local.get("enableNotif");

            if (enableNotif === false) {
                console.debug("[alarm] notifications disabled by user");
                return;
            }

            // 3) Chỉ check trong khung 06:00–17:00
            const h = new Date().getHours();
            if (h < 5 || h >= 17) return;

            // 4) Gọi poll (không await) — có khoá isPolling trong pollShopee()
            //    thêm .catch để không leak lỗi Promise
            Promise.resolve()
                .then(() => pollShopee())
                .catch((e) => {
                    console.warn("[alarm] pollShopee error:", e);
                });
        } catch (err) {
            console.error("[alarm] handler error:", err);
        }
    } else if (alarm.name === SYNC_ALARM_NAME) {
        // Xử lý alarm đồng bộ dữ liệu
        syncShopeeData().catch((e) => {
            console.error("[alarm] syncShopeeData error:", e);
        });
    }
});

// === Hàm đồng bộ dữ liệu từ API ===
async function syncShopeeData() {
    if (isSyncing) {
        console.debug("syncShopeeData: đang sync, bỏ qua");
        return;
    }

    isSyncing = true;

    try {
        // Cập nhật trạng thái
        await chrome.storage.local.set({
            syncStatus: "in_progress",
            lastSyncTime: Date.now(),
        });

        // Xác định khoảng thời gian: 30 ngày gần nhất
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startTime = Math.floor(thirtyDaysAgo.getTime() / 1000);
        const endTime = Math.floor(now.getTime() / 1000);

        let allOrders = [];
        let pageNum = 1;
        const pageSize = 500;
        let hasMore = true;

        // Lấy dữ liệu hiện có để deduplicate
        const { orderHistory = {} } = await chrome.storage.local.get("orderHistory");

        // Lặp qua tất cả các trang
        while (hasMore) {
            const url = `https://affiliate.shopee.vn/api/v3/report/list?page_size=${pageSize}&page_num=${pageNum}&purchase_time_s=${startTime}&purchase_time_e=${endTime}&version=1`;

            const res = await fetch(url, { credentials: "include" });

            if (res.status === 401) {
                await chrome.storage.local.set({
                    syncStatus: "error",
                    syncError: "UNAUTHORIZED",
                });
                await showLoginNotif();
                return;
            }

            if (!res.ok) {
                console.warn("syncShopeeData: HTTP", res.status);
                await chrome.storage.local.set({
                    syncStatus: "error",
                    syncError: `HTTP_${res.status}`,
                });
                return;
            }

            let json = null;
            try {
                json = await res.json();
            } catch (e) {
                console.warn("syncShopeeData: bad JSON", e);
                await chrome.storage.local.set({
                    syncStatus: "error",
                    syncError: "BAD_JSON",
                });
                return;
            }

            if (json && json.code === 0) {
                const list = json.data?.list || [];
                const totalCount = json.data?.total_count || 0;

                // Thêm orders vào mảng
                allOrders = allOrders.concat(list);

                // Kiểm tra xem còn trang nào không
                if (list.length === 0 || pageNum * pageSize >= totalCount) {
                    hasMore = false;
                } else {
                    pageNum++;
                    // Thêm delay nhỏ để tránh rate limit
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            } else {
                console.warn("syncShopeeData: API error", json);
                await chrome.storage.local.set({
                    syncStatus: "error",
                    syncError: json?.msg || "API_ERROR",
                });
                return;
            }
        }

        // Lưu orders vào lịch sử (sử dụng logic tương tự storeOrdersToHistory)
        let newOrdersCount = 0;
        allOrders.forEach((orderData) => {
            let key = null;

            if (orderData.orders && orderData.orders.length > 0) {
                const firstOrder = orderData.orders[0];
                if (firstOrder.order_id) {
                    key = `order_${firstOrder.order_id}`;
                }
            } else if (orderData.checkout_id) {
                key = `checkout_${orderData.checkout_id}`;
            }

            if (key && !orderHistory[key]) {
                orderHistory[key] = {
                    ...orderData,
                    storedAt: Date.now(),
                };
                newOrdersCount++;
            } else if (key) {
                // Cập nhật order đã có
                orderHistory[key] = {
                    ...orderHistory[key],
                    ...orderData,
                    updatedAt: Date.now(),
                };
            }
        });

        // Lưu lại vào storage
        await chrome.storage.local.set({ orderHistory });

        // Cập nhật trạng thái thành công
        await chrome.storage.local.set({
            syncStatus: "success",
            lastSyncTime: Date.now(),
            lastSyncCount: newOrdersCount,
            totalOrdersCount: Object.keys(orderHistory).length,
        });

        console.log(`syncShopeeData: thành công, ${newOrdersCount} orders mới, tổng ${Object.keys(orderHistory).length} orders`);
    } catch (err) {
        console.error("syncShopeeData error:", err);
        await chrome.storage.local.set({
            syncStatus: "error",
            syncError: err.message || "UNKNOWN_ERROR",
        });
    } finally {
        isSyncing = false;
    }
}

// === Xử lý click context menu ===
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "calculateCommission") {
        // Mở popup hoặc thực hiện tính toán
        chrome.action.openPopup();
    } else if (info.menuItemId === "viewProductDetails") {
        // Lấy product_id từ URL
        const url = new URL(tab.url);
        let productId = null;

        // Pattern 1: /product/...
        const productMatch = url.pathname.match(/\/product\/(\d+)/);
        if (productMatch) {
            productId = productMatch[1];
        } else {
            // Pattern 2: i. trong URL
            const iMatch = url.searchParams.get("i");
            if (iMatch) {
                productId = iMatch;
            }
        }

        if (productId) {
            // Gửi message đến content script để hiển thị thông tin
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: "SHOW_PRODUCT_STATS",
                    productId: productId,
                });
            } catch (e) {
                // Nếu content script chưa load, inject nó
                chrome.scripting
                    .executeScript({
                        target: { tabId: tab.id },
                        files: ["js/content.js"],
                    })
                    .then(() => {
                        chrome.tabs.sendMessage(tab.id, {
                            type: "SHOW_PRODUCT_STATS",
                            productId: productId,
                        });
                    });
            }
        } else {
            chrome.notifications.create({
                type: "basic",
                iconUrl: "/icon/icon128.png",
                title: "Công cụ tính hoa hồng Shopee",
                message: "Không tìm thấy ID sản phẩm trong URL này.",
            });
        }
    } else if (info.menuItemId === "openOrderHistory") {
        // Mở trang order-history.html
        chrome.tabs.create({
            url: chrome.runtime.getURL("order-history.html"),
        });
    }
});

// === Xử lý message từ content script và options ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "CALCULATE_PRODUCT_STATS") {
        // Tính toán thống kê sản phẩm
        calculateProductStatsInBackground(request.productId)
            .then((stats) => {
                sendResponse({ success: true, stats });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Giữ kết nối để gửi response bất đồng bộ
    } else if (request.type === "SYNC_NOW") {
        // Đồng bộ thủ công từ options page
        syncShopeeData()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    } else if (request.type === "CREATE_AFFILIATE_LINK") {
        // Tạo link tiếp thị liên kết
        createAffiliateLinkAPI(request.originalLink, request.subIds)
            .then((result) => {
                sendResponse({ success: true, ...result });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    } else if (request.type === "OPEN_ORDER_HISTORY") {
        // Mở trang order-history.html
        chrome.tabs.create({
            url: chrome.runtime.getURL("order-history.html"),
        });
        sendResponse({ success: true });
        return true;
    }
});

// Hàm tính toán thống kê sản phẩm trong background
async function calculateProductStatsInBackground(productId) {
    try {
        const { orderHistory = {} } = await chrome.storage.local.get("orderHistory");
        const productOrders = [];

        // Normalize productId để so sánh
        const normalizedProductId = String(productId).trim();
        console.log("Searching for productId:", normalizedProductId, "in orderHistory with", Object.keys(orderHistory).length, "orders");

        // Duyệt qua tất cả orders
        Object.values(orderHistory).forEach((orderData) => {
            const ordersList = orderData.orders || (orderData.list ? orderData.list.flatMap((item) => item.orders || []) : []);

            ordersList.forEach((order) => {
                const items = order.items || [];

                items.forEach((item) => {
                    // So sánh item_id với nhiều cách để đảm bảo tìm thấy
                    const itemId = String(item.item_id || "").trim();
                    const modelId = String(item.model_id || "").trim();

                    if (itemId === normalizedProductId || modelId === normalizedProductId) {
                        console.log("Found matching item:", {
                            item_id: itemId,
                            model_id: modelId,
                            productId: normalizedProductId,
                            item_name: item.item_name,
                        });
                        productOrders.push({
                            ...orderData,
                            item: item,
                            order: order,
                        });
                    }
                });
            });
        });

        console.log("Found", productOrders.length, "matching orders for productId:", normalizedProductId);

        if (productOrders.length === 0) {
            return {
                totalOrders: 0,
                totalGMV: 0,
                totalCommission: 0,
                lastOrderDate: null,
                lastOrderAmount: 0,
                channels: { video: 0, live: 0, social: 0 },
            };
        }

        // Sắp xếp theo thời gian
        productOrders.sort((a, b) => {
            const timeA = a.purchase_time || a.checkout_complete_time || 0;
            const timeB = b.purchase_time || b.checkout_complete_time || 0;
            return timeB - timeA;
        });

        // Nhóm các productOrders theo order (order_id hoặc checkout_id) để tránh cộng lặp GMV
        const orderMap = new Map();

        productOrders.forEach((orderData) => {
            const item = orderData.item;
            const orderKey = (orderData.order && orderData.order.order_id) || orderData.checkout_id || `order_${orderData.purchase_time}`;

            if (!orderMap.has(orderKey)) {
                orderMap.set(orderKey, {
                    orderData: orderData,
                    items: [],
                });
            }

            orderMap.get(orderKey).items.push(item);
        });

        let totalGMV = 0;
        let totalCommission = 0;
        let videoOrders = 0;
        let liveOrders = 0;
        let socialOrders = 0;
        let lastOrder = null;
        let lastOrderTime = 0;

        // Xử lý từng order (chỉ tính một lần cho mỗi order)
        orderMap.forEach((orderInfo) => {
            const orderData = orderInfo.orderData;
            const items = orderInfo.items;
            const firstItem = items[0];

            // Kiểm tra xem tất cả items có cùng GMV không (dữ liệu từ DOM scraping đã sửa)
            const firstItemGMV = parseFloat(firstItem.item_gmv || firstItem.actual_amount || firstItem.item_price || 0);
            const allItemsHaveSameGMV = items.every((item) => {
                const itemGMV = parseFloat(item.item_gmv || item.actual_amount || item.item_price || 0);
                return itemGMV === firstItemGMV;
            });

            let orderGMV = 0;
            let orderCommission = 0;

            if (allItemsHaveSameGMV && firstItem.item_gmv) {
                // Dữ liệu từ DOM scraping: mỗi item đã có item_gmv = tổng GMV order
                orderGMV = firstItemGMV;
                orderCommission = parseFloat(firstItem.item_commission || 0);
            } else {
                // Dữ liệu từ API: cộng tất cả actual_amount
                items.forEach((item) => {
                    const gmv = parseFloat(item.item_gmv || item.actual_amount || item.item_price || 0);
                    orderGMV += gmv;
                });

                // Commission: ưu tiên từ order level, nếu không có thì cộng từ items
                if (orderData.affiliate_net_commission !== undefined) {
                    orderCommission = parseFloat(orderData.affiliate_net_commission || orderData.estimated_total_commission || 0);
                } else {
                    items.forEach((item) => {
                        const commission = parseFloat((item.item_commission || 0) + (item.capped_brand_commission || 0));
                        orderCommission += commission;
                    });
                }
            }

            const referrer = firstItem.referrer || orderData.referrer || "MXH";

            orderGMV = orderGMV / 100000;
            orderCommission = orderCommission / 100000;

            totalGMV += orderGMV;
            totalCommission += orderCommission;

            if (referrer.includes("Shopeevideo") || referrer.includes("Shopeevideo-Shopee")) {
                videoOrders++;
            } else if (referrer.includes("Shopeelive") || referrer.includes("Shopeelive-Shopee")) {
                liveOrders++;
            } else {
                socialOrders++;
            }

            const purchaseTime = orderData.purchase_time || orderData.checkout_complete_time || 0;
            if (purchaseTime > lastOrderTime) {
                lastOrderTime = purchaseTime;
                lastOrder = {
                    ...orderData,
                    item: firstItem,
                    orderGMV: orderGMV,
                };
            }
        });

        let lastOrderDate = null;
        if (lastOrder && lastOrderTime > 0) {
            const date = new Date(lastOrderTime * 1000);
            lastOrderDate = date.toLocaleDateString("vi-VN");
        }

        return {
            totalOrders: orderMap.size, // Số lượng orders (không phải items)
            totalGMV: totalGMV,
            totalCommission: totalCommission,
            lastOrderDate: lastOrderDate,
            lastOrderAmount: lastOrder ? lastOrder.orderGMV || parseFloat((lastOrder.item.item_gmv || lastOrder.item.actual_amount || lastOrder.item.item_price || 0) / 100000) : 0,
            channels: {
                video: videoOrders,
                live: liveOrders,
                social: socialOrders,
            },
            formatted: {
                totalGMV: totalGMV.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                totalCommission: totalCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                lastOrderAmount: lastOrder ? (lastOrder.orderGMV || parseFloat((lastOrder.item.item_gmv || lastOrder.item.actual_amount || lastOrder.item.item_price || 0) / 100000)).toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "0 ₫",
            },
        };
    } catch (error) {
        console.error("Error calculating product stats:", error);
        throw error;
    }
}

// === Hàm tạo link tiếp thị liên kết ===
async function createAffiliateLinkAPI(originalLink, subIds = {}) {
    try {
        const url = "https://affiliate.shopee.vn/api/v3/gql?q=batchCustomLink";

        const query = `
            query batchGetCustomLink($linkParams: [CustomLinkParam!], $sourceCaller: SourceCaller){
                batchCustomLink(linkParams: $linkParams, sourceCaller: $sourceCaller){
                    shortLink
                    longLink
                    failCode
                }
            }
        `;

        const variables = {
            linkParams: [
                {
                    originalLink: originalLink,
                    advancedLinkParams: {
                        subId1: subIds.subId1 || "",
                        subId2: subIds.subId2 || "",
                        subId3: subIds.subId3 || "",
                        subId4: subIds.subId4 || "",
                        subId5: subIds.subId5 || "",
                    },
                },
            ],
            sourceCaller: "CUSTOM_LINK_CALLER",
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                Accept: "application/json, text/plain, */*",
            },
            credentials: "include",
            body: JSON.stringify({
                operationName: "batchGetCustomLink",
                query: query,
                variables: variables,
            }),
        });

        if (response.status === 401) {
            throw new Error("UNAUTHORIZED");
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        if (json.errors) {
            throw new Error(json.errors[0]?.message || "API Error");
        }

        if (json.data && json.data.batchCustomLink && json.data.batchCustomLink.length > 0) {
            const result = json.data.batchCustomLink[0];
            if (result.failCode) {
                throw new Error(`Fail code: ${result.failCode}`);
            }
            return {
                shortLink: result.shortLink || "",
                longLink: result.longLink || "",
            };
        }

        throw new Error("No data returned from API");
    } catch (error) {
        console.error("createAffiliateLinkAPI error:", error);
        throw error;
    }
}

// Mở trang feedback.html khi tiện ích bị gỡ cài đặt
chrome.runtime.setUninstallURL("https://addlivetag.com/extension/uninstall.html");
