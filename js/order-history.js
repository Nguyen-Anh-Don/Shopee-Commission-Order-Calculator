// Order History Viewer - Main JavaScript file
// Loads and processes synchronized order data from chrome.storage.local

let allOrders = [];
let filteredOrders = [];
let orderStats = {};
let gmvStats = {};
let comStats = {};
let performanceStats = {};
let topShops = [];
let topProducts = [];
let topSubIds = [];
let charts = {};

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
    loadOrderHistory();

    // Setup filter form
    const filterForm = document.getElementById("filterForm");
    if (filterForm) {
        filterForm.addEventListener("submit", function (e) {
            e.preventDefault();
            applyFilters();
        });
    }

    // Setup capture button
    const captureBtn = document.getElementById("captureBtn");
    if (captureBtn) {
        captureBtn.addEventListener("click", captureScreenshot);
    }

    // Setup open options button
    const openOptionsBtn = document.getElementById("openOptionsBtn");
    if (openOptionsBtn) {
        openOptionsBtn.addEventListener("click", function () {
            chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
        });
    }

    // Setup quick date buttons
    const quickDateButtons = document.querySelectorAll(".quick-date-btn");
    quickDateButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            const days = parseInt(this.getAttribute("data-days"));
            setQuickDateRange(days);

            // Update button active state
            quickDateButtons.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");

            // Apply filters immediately
            applyFilters();
        });
    });

    // Setup export buttons
    const exportCSVBtn = document.getElementById("exportCSVBtn");
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener("click", exportToCSV);
    }

    const exportJSONBtn = document.getElementById("exportJSONBtn");
    if (exportJSONBtn) {
        exportJSONBtn.addEventListener("click", exportToJSON);
    }

    const printReportBtn = document.getElementById("printReportBtn");
    if (printReportBtn) {
        printReportBtn.addEventListener("click", printReport);
    }
});

// Load order history from chrome.storage.local
async function loadOrderHistory() {
    try {
        const result = await chrome.storage.local.get("orderHistory");
        const orderHistory = result.orderHistory || {};

        console.log("Order history loaded:", Object.keys(orderHistory).length, "items");

        if (Object.keys(orderHistory).length === 0) {
            console.log("No order history found");
            showNoDataMessage();
            return;
        }

        // Convert API format to standard format
        allOrders = convertApiToStandardFormat(orderHistory);

        console.log("Converted orders:", allOrders.length);

        if (allOrders.length === 0) {
            console.log("No orders after conversion");
            // Show debug info - check first few items
            const keys = Object.keys(orderHistory);
            console.log("Total items in orderHistory:", keys.length);
            for (let i = 0; i < Math.min(5, keys.length); i++) {
                const key = keys[i];
                const item = orderHistory[key];
                console.log(`Sample item ${i + 1} (${key}):`, {
                    hasCheckoutId: !!item.checkout_id,
                    hasOrders: !!(item.orders && Array.isArray(item.orders)),
                    ordersLength: item.orders ? item.orders.length : 0,
                    hasItems: !!(item.items && Array.isArray(item.items)),
                    keys: Object.keys(item).slice(0, 10),
                });
            }
            showNoDataMessage();
            return;
        }

        // Set default date range (mặc định là hôm qua)
        setDefaultDateRange();

        // Apply filters with default date range (hôm qua)
        applyFilters();

        // Show main content
        document.getElementById("loadingMessage").style.display = "none";
        document.getElementById("mainContent").style.display = "block";
    } catch (error) {
        console.error("Error loading order history:", error);
        showNoDataMessage();
    }
}

// Helper function to extract channel from JSON or string
function extractChannel(channelData) {
    if (!channelData) return "";

    // If it's already a string and not JSON, return it
    if (typeof channelData === "string") {
        // Try to parse as JSON
        try {
            const parsed = JSON.parse(channelData);
            if (parsed && typeof parsed === "object") {
                // Priority: internal_source > direct_source > last_external_source
                if (parsed.internal_source && parsed.internal_source.trim() !== "") {
                    return parsed.internal_source;
                } else if (parsed.direct_source && parsed.direct_source.trim() !== "") {
                    return parsed.direct_source;
                } else if (parsed.last_external_source && parsed.last_external_source.trim() !== "") {
                    return parsed.last_external_source;
                }
            }
        } catch (e) {
            // Not JSON, return as is
            return channelData;
        }
    }

    // If it's an object, extract channel with priority
    if (typeof channelData === "object" && channelData !== null) {
        // Priority: internal_source > direct_source > last_external_source
        if (channelData.internal_source && channelData.internal_source.trim() !== "") {
            return channelData.internal_source;
        } else if (channelData.direct_source && channelData.direct_source.trim() !== "") {
            return channelData.direct_source;
        } else if (channelData.last_external_source && channelData.last_external_source.trim() !== "") {
            return channelData.last_external_source;
        }
    }

    return "";
}

// Convert API format to standard format (similar to PHP lines 214-303)
function convertApiToStandardFormat(orderHistory) {
    const orders = [];
    let id = 0;

    // orderHistory is an object with keys like "checkout_123" or "order_456"
    Object.entries(orderHistory).forEach(([key, row]) => {
        // Skip if it's not a valid order object
        if (!row || typeof row !== "object") {
            console.log("Skipping invalid row:", key, row);
            return;
        }

        // Skip metadata objects (like report_payment_validation_info, etc.)
        // Check for keys that indicate metadata objects
        if (key.includes("report_") || key.includes("validation_") || key.includes("payment_")) {
            // This is likely a metadata object, skip it
            return;
        }

        // From background.js, each object should have checkout_id and orders array
        // Check if this object has order data
        const hasCheckoutId = !!row.checkout_id;
        const hasOrdersArray = row.orders && Array.isArray(row.orders);
        const hasItemsArray = row.items && Array.isArray(row.items);
        const hasListArray = row.list && Array.isArray(row.list);

        // If no order-related fields at all, skip
        if (!hasCheckoutId && !hasOrdersArray && !hasItemsArray && !hasListArray && !row.order_sn && !row.order_id) {
            // Might be metadata, but log it for debugging
            if (Object.keys(row).length > 5) {
                // Only log if it has many fields (likely metadata)
                return;
            }
        }

        // Handle both formats: direct order data or data.list format
        // From background.js, each row is a checkout object with orders array
        let ordersList = [];

        if (row.orders && Array.isArray(row.orders) && row.orders.length > 0) {
            // Direct format: row.orders is an array (most common from background.js)
            ordersList = row.orders;
        } else if (row.list && Array.isArray(row.list)) {
            // Nested format: row.list contains items with orders
            ordersList = row.list.flatMap((item) => (item.orders && Array.isArray(item.orders) ? item.orders : []));
        } else if (row.items && Array.isArray(row.items) && row.items.length > 0) {
            // Single order format: row itself is an order with items
            ordersList = [row];
        } else if (row.checkout_id && !row.orders) {
            // Has checkout_id but no orders array - might be empty checkout, skip
            return;
        }

        if (ordersList.length === 0) {
            // No orders in this checkout, skip
            return;
        }

        ordersList.forEach((order) => {
            // Skip if order is not an object
            if (!order || typeof order !== "object") {
                return;
            }

            // Calculate order_value and total_product_commission
            let orderValue = 0;
            let totalProductCommission = 0;

            // Get items - should be order.items array
            const items = order.items;

            if (!items || !Array.isArray(items) || items.length === 0) {
                // Order has no items, skip it
                return;
            }

            items.forEach((product) => {
                if (product && typeof product === "object") {
                    if (product.actual_amount) {
                        orderValue += parseFloat(product.actual_amount) || 0;
                    }
                    if (product.item_commission || product.capped_brand_commission) {
                        totalProductCommission += parseFloat(product.item_commission || 0) + parseFloat(product.capped_brand_commission || 0);
                    }
                }
            });

            // Flatten using first product
            if (items.length > 0) {
                const product = items[0];

                if (!product || typeof product !== "object") {
                    return;
                }

                // Convert purchase_time and click_time from seconds to milliseconds if needed
                // Check if already in milliseconds (if > year 2000 in milliseconds)
                const purchaseTimeRaw = row.purchase_time || order.purchase_time;
                const clickTimeRaw = row.click_time || order.click_time;
                const completionTimeRaw = row.checkout_complete_time || order.checkout_complete_time;

                const purchaseTime = purchaseTimeRaw ? (purchaseTimeRaw > 946684800000 ? purchaseTimeRaw : purchaseTimeRaw * 1000) : null;
                const clickTime = clickTimeRaw ? (clickTimeRaw > 946684800000 ? clickTimeRaw : clickTimeRaw * 1000) : null;
                const completionTime = completionTimeRaw ? (completionTimeRaw > 946684800000 ? completionTimeRaw : completionTimeRaw * 1000) : null;

                // Map shop_type
                let shopType = "";
                if (order.shop_type === 1) {
                    shopType = "C2C(Non-CB)";
                } else if (order.shop_type === 3) {
                    shopType = "Mall";
                } else if (order.shop_type === 5) {
                    shopType = "Preferred";
                }

                // Map status - check both row and order level
                let status = row.checkout_status || order.checkout_status || order.order_status || "";
                // Check shopee_order_status if status is not clear (3 = cancelled)
                const shopeeOrderStatus = row.shopee_order_status || order.shopee_order_status;
                if (shopeeOrderStatus === 3) {
                    status = "Đã hủy";
                } else if (status === "CANCEL" || status === "CANCELED" || status === "Canceled" || status === "CANCELLED") {
                    status = "Đã hủy";
                } else if (status === "UNPAID" || status === "Pending" || status === "PENDING" || status === "Waiting for payment" || status === "WAITING_FOR_PAYMENT") {
                    status = "Đang chờ xử lý";
                } else if (status === "COMPLETED" || status === "Completed") {
                    status = "Đã hoàn thành";
                } else if (!status) {
                    status = "Đã hoàn thành"; // Default status
                }

                // Format dates
                const formatDate = (timestamp) => {
                    if (!timestamp) return "";
                    const date = new Date(timestamp);
                    return date.toISOString().slice(0, 19).replace("T", " ");
                };

                // Map channel - check multiple sources
                // Try to get channel from various sources
                let channel = "";
                // Check multiple possible sources
                const channelSource =
                    row.last_external_source ||
                    order.last_external_source ||
                    row.referrer ||
                    order.referrer ||
                    row.channel ||
                    order.channel ||
                    product.referrer ||
                    product.channel ||
                    row.first_external_source ||
                    order.first_external_source ||
                    row.direct_source ||
                    order.direct_source ||
                    row.indirect_source ||
                    order.indirect_source ||
                    "";

                // Extract internal_source if channel is JSON
                channel = extractChannel(channelSource);

                // If no channel found, try internal_source directly
                if (!channel) {
                    channel = row.internal_source || order.internal_source || product.internal_source || "";
                }

                // If still no channel, set default
                if (!channel) {
                    channel = "";
                }

                // Calculate actual_order_value from actual_amount for this specific item
                const actualOrderValue = product.actual_amount ? (product.actual_amount > 1000 ? parseFloat(product.actual_amount) / 100000 : parseFloat(product.actual_amount)) : 0;

                // Create standard format order
                // Use row data for checkout-level fields, order data for order-level fields
                const item = {
                    id: id++,
                    order_id: order.order_sn || order.order_id || "",
                    status: status,
                    checkout_id: row.checkout_id || "",
                    order_time: formatDate(purchaseTime),
                    completion_time: formatDate(completionTime),
                    click_time: formatDate(clickTime),
                    click_time_ts: clickTime, // Lưu timestamp gốc để so sánh chính xác
                    purchase_time_ts: purchaseTime, // Lưu timestamp gốc để lọc theo purchase_time
                    shop_name: product.shop_name || "",
                    shop_id: String(product.shop_id || ""),
                    shop_type: shopType,
                    item_id: String(product.item_id || ""),
                    item_name: product.item_name || "",
                    model_id: String(product.model_id || ""),
                    product_type: "Normal Product",
                    promotion_id: product.promotion_id || "",
                    l1_category: product.global_category_lv1_name || "",
                    l2_category: product.global_category_lv2_name || "",
                    l3_category: product.global_category_lv3_name || "",
                    price: product.item_price ? (product.item_price > 1000 ? product.item_price / 100000 : product.item_price) : 0,
                    quantity: product.qty ? parseInt(product.qty) : 0,
                    commission_type: product.brand_commission_rate && product.brand_commission_rate > 0 ? "XTRA Comm" : "",
                    strategic_partner: "",
                    order_value: orderValue > 1000 ? orderValue / 100000 : orderValue,
                    actual_order_value: actualOrderValue, // Giá trị đơn tính theo actual_amount của item này
                    refund_amount: product.refunded_amount ? (product.refunded_amount > 1000 ? parseFloat(product.refunded_amount) / 100000 : parseFloat(product.refunded_amount)) : 0,
                    shopee_commission_rate: product.platform_commission_rate ? (product.platform_commission_rate > 1 ? parseFloat(product.platform_commission_rate) / 100 : parseFloat(product.platform_commission_rate)) : 0,
                    shopee_commission_amount: product.item_commission ? (product.item_commission > 1000 ? parseFloat(product.item_commission) / 100000 : parseFloat(product.item_commission)) : 0,
                    seller_commission_rate: product.brand_commission_rate ? (product.brand_commission_rate > 1 ? parseFloat(product.brand_commission_rate) / 100 : parseFloat(product.brand_commission_rate)) : 0,
                    xtra_commission_amount: product.capped_brand_commission ? (product.capped_brand_commission > 1000 ? parseFloat(product.capped_brand_commission) / 100000 : parseFloat(product.capped_brand_commission)) : 0,
                    total_product_commission: totalProductCommission > 1000 ? totalProductCommission / 100000 : totalProductCommission,
                    shopee_order_commission: row.capped_commission ? (row.capped_commission > 1000 ? parseFloat(row.capped_commission) / 100000 : parseFloat(row.capped_commission)) : 0,
                    seller_order_commission: row.total_brand_commission ? (row.total_brand_commission > 1000 ? parseFloat(row.total_brand_commission) / 100000 : parseFloat(row.total_brand_commission)) : 0,
                    total_order_commission: row.estimated_total_commission_with_mcn ? (parseFloat(row.estimated_total_commission_with_mcn) >= 100000 ? parseFloat(row.estimated_total_commission_with_mcn) / 100000 : parseFloat(row.estimated_total_commission_with_mcn) / 100) : 0,
                    mnc_name: row.linked_mcn_name || "",
                    mnc_contract_code: row.mcn_agreement_id || "",
                    mcn_management_fee_rate: row.linked_mcn_commission_rate ? (row.linked_mcn_commission_rate > 1 ? parseFloat(row.linked_mcn_commission_rate) / 100 : parseFloat(row.linked_mcn_commission_rate)) : 0,
                    mcn_management_fee: row.mcn_management_fee_commission ? (row.mcn_management_fee_commission > 1000 ? parseFloat(row.mcn_management_fee_commission) / 100000 : parseFloat(row.mcn_management_fee_commission)) : 0,
                    affiliate_commission_rate: 98,
                    net_affiliate_commission: row.affiliate_net_commission ? (row.affiliate_net_commission > 1000 ? parseFloat(row.affiliate_net_commission) / 100000 : parseFloat(row.affiliate_net_commission)) : 0,
                    estimated_total_commission: row.estimated_total_commission ? (row.estimated_total_commission > 1000 ? parseFloat(row.estimated_total_commission) / 100000 : parseFloat(row.estimated_total_commission)) : 0,
                    product_link_status: product.display_item_status || "",
                    product_notes: "",
                    attribute_type: "Đơn hàng từ các Shop khác nhau",
                    buyer_status: row.user_status === "Existing" || order.user_status === "Existing" ? "Đã tồn tại" : "Mới",
                    sub_id1: row.utm_content || order.utm_content || "",
                    sub_id2: row.click_id || order.click_id || "",
                    sub_id3: row.product_type || order.product_type || "",
                    sub_id4: row.internal_source || order.internal_source || "",
                    sub_id5: row.indirect_source || order.indirect_source || "",
                    channel: channel,
                };

                orders.push(item);
            }
        });
    });

    return orders;
}

// Helper function to format date as YYYY-MM-DD in local timezone
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Set default date range - mặc định là hôm qua
function setDefaultDateRange() {
    // Mặc định hiển thị hôm qua - sử dụng local timezone
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateLocal(yesterday);

    document.getElementById("start_date").value = yesterdayStr;
    document.getElementById("end_date").value = yesterdayStr;

    // Set active state for "Hôm qua" button
    const quickDateButtons = document.querySelectorAll(".quick-date-btn");
    quickDateButtons.forEach((btn) => {
        if (btn.getAttribute("data-days") === "1") {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// Set quick date range (for quick date buttons)
function setQuickDateRange(days) {
    const now = new Date();

    // End date luôn là hôm qua (không bao gồm hôm nay)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Start date: từ hôm qua lùi về (days - 1) ngày
    // Ví dụ: 30 ngày qua = từ hôm qua lùi về 29 ngày (tổng 30 ngày)
    const startDate = new Date(yesterday);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    document.getElementById("start_date").value = formatDateLocal(startDate);
    document.getElementById("end_date").value = formatDateLocal(yesterday);
    document.getElementById("start_time").value = "00:00";
    document.getElementById("end_time").value = "23:59";
}

// Show no data message
function showNoDataMessage() {
    document.getElementById("loadingMessage").style.display = "none";
    const noDataEl = document.getElementById("noDataMessage");
    if (noDataEl) {
        noDataEl.style.display = "block";
    }
}

// Apply filters
function applyFilters() {
    const startDate = document.getElementById("start_date").value;
    const startTime = document.getElementById("start_time").value || "00:00";
    const endDate = document.getElementById("end_date").value;
    const endTime = document.getElementById("end_time").value || "23:59";
    const subId = document.getElementById("sub_id").value.trim();
    const subIdType = document.getElementById("sub_id_type").value;
    const subIdField = document.getElementById("sub_id_field").value.trim();

    const isFieldFilter = subIdType && subIdField !== "";

    // Convert to timestamps - use local timezone to avoid timezone issues
    let startTs = null;
    let endTs = null;

    if (startDate) {
        const [year, month, day] = startDate.split("-").map(Number);
        const [hour, minute] = (startTime || "00:00").split(":").map(Number);
        startTs = new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
    }

    if (endDate) {
        const [year, month, day] = endDate.split("-").map(Number);
        const [hour, minute] = (endTime || "23:59").split(":").map(Number);
        endTs = new Date(year, month - 1, day, hour, minute, 59, 999).getTime();
    }

    // Filter orders
    filteredOrders = allOrders.filter((order) => {
        // Check purchase_time - ưu tiên dùng timestamp gốc
        // Fallback: purchase_time_ts -> order_time -> click_time_ts -> click_time -> completion_time
        let purchaseTime = order.purchase_time_ts;
        if (!purchaseTime && order.order_time) {
            purchaseTime = new Date(order.order_time).getTime();
        }
        if (!purchaseTime || isNaN(purchaseTime)) {
            purchaseTime = order.click_time_ts;
        }
        if (!purchaseTime || isNaN(purchaseTime)) {
            purchaseTime = order.click_time ? new Date(order.click_time).getTime() : null;
        }
        if (!purchaseTime || isNaN(purchaseTime)) {
            purchaseTime = order.completion_time ? new Date(order.completion_time).getTime() : null;
        }
        if (!purchaseTime || isNaN(purchaseTime)) return false;

        // Filter by date range
        if (startTs !== null && purchaseTime < startTs) return false;
        if (endTs !== null && purchaseTime > endTs) return false;

        // Filter by sub_id
        if (isFieldFilter) {
            return order[subIdType] === subIdField;
        } else {
            if (subId === "") return true;
            for (let i = 1; i <= 5; i++) {
                const key = `sub_id${i}`;
                if (order[key] === subId) return true;
            }
            return false;
        }
    });

    // Update date display (format: DD/MM/YYYY)
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    };
    const startDateEl = document.getElementById("startDate");
    const endDateEl = document.getElementById("endDate");
    if (startDateEl) startDateEl.textContent = formatDisplayDate(startDate) || "";
    if (endDateEl) {
        const endDateFormatted = formatDisplayDate(endDate);
        if (endDateFormatted && endDateFormatted !== formatDisplayDate(startDate)) {
            endDateEl.textContent = ` - ${endDateFormatted}`;
        } else {
            endDateEl.textContent = "";
        }
    }

    // Reprocess data
    processOrdersData();
}

// Process orders data and calculate statistics
function processOrdersData() {
    if (filteredOrders.length === 0) {
        clearAllDisplays();
        // Hiển thị thông báo không có kết quả khi lọc
        const noFilterResultsEl = document.getElementById("noFilterResultsMessage");
        if (noFilterResultsEl) {
            noFilterResultsEl.style.display = "block";
        }
        // Ẩn phần kết quả (charts, tables, etc.) nhưng giữ phần lọc
        const resultsSectionEl = document.getElementById("result-capture");
        if (resultsSectionEl) {
            resultsSectionEl.style.display = "none";
        }
        return;
    }

    // Ẩn thông báo không có kết quả nếu có dữ liệu
    const noFilterResultsEl = document.getElementById("noFilterResultsMessage");
    if (noFilterResultsEl) {
        noFilterResultsEl.style.display = "none";
    }
    // Hiển thị phần kết quả
    const resultsSectionEl = document.getElementById("result-capture");
    if (resultsSectionEl) {
        resultsSectionEl.style.display = "block";
    }

    // Initialize stats
    orderStats = {
        total: 0,
        video: 0,
        live: 0,
        social: 0,
        zero: 0,
        cancelled: 0,
    };

    gmvStats = {
        total: 0,
        video: 0,
        live: 0,
        social: 0,
        average_order_value: 0,
        by_category: {},
        by_day: {},
        by_hour: {},
    };

    comStats = {
        total: 0,
        video: 0,
        live: 0,
        social: 0,
        average_commission: 0,
        commission_rate: 0,
        by_category: {},
        by_day: {},
        by_hour: {},
        xtra_rate: 0,
        shopee_rate: 0,
    };

    let totalGmv = 0;
    let totalCommission = 0;
    let xtraCommission = 0;
    let shopeeCommission = 0;

    const gmvByDay = {};
    const comByDay = {};
    const gmvByHour = {};
    const comByHour = {};
    const gmvByCategory = {};
    const comByCategory = {};
    const productPerformance = {};
    const rawTopShops = {};
    const subIdStats = {};

    // Track unique order_ids for counting orders
    const uniqueOrderIds = new Set();
    const orderIdToData = {}; // Map order_id to order data for commission calculation

    // Process each order item
    filteredOrders.forEach((order) => {
        // Track unique order_id - mỗi order_id là 1 đơn hàng
        if (order.order_id && order.order_id.trim() !== "") {
            uniqueOrderIds.add(order.order_id);
            // Store order data for commission calculation
            if (!orderIdToData[order.order_id]) {
                orderIdToData[order.order_id] = {
                    order_id: order.order_id,
                    total_order_commission: parseFloat(order.total_order_commission) || 0, // Lấy từ checkout level (estimated_total_commission_with_mcn)
                    channel: order.channel || "",
                    status: order.status || "",
                    actual_order_value: 0, // Sẽ tổng tất cả actual_amount của items trong order này
                    purchase_time_ts: order.purchase_time_ts,
                    order_time: order.order_time,
                };
            }
            // Accumulate actual_order_value - tổng actual_amount của tất cả items trong cùng order_id
            orderIdToData[order.order_id].actual_order_value += parseFloat(order.actual_order_value) || 0;
        }

        // Basic stats - GMV and commission will be calculated from unique orders later
        xtraCommission += parseFloat(order.xtra_commission_amount) || 0;
        shopeeCommission += parseFloat(order.shopee_commission_amount) || 0;

        // Stats by day - dùng purchase_time (order_time)
        const orderTime = order.purchase_time_ts || (order.order_time ? new Date(order.order_time).getTime() : null);
        if (orderTime) {
            const orderDate = new Date(orderTime);
            const day = orderDate.toISOString().split("T")[0];
            const hour = String(orderDate.getHours()).padStart(2, "0");

            // GMV by day and hour will be calculated from unique orders later
        }

        // Stats by category will be calculated from unique orders later

        // Product performance - order_count will be calculated from unique orders later
        const category = order.l1_category || "Khác";
        const productKey = `${order.shop_id}__${order.item_id}`;
        if (!productPerformance[productKey]) {
            // Channel classification
            let channel = "";
            if (order.channel === "Shopeevideo-Shopee") {
                channel = "video";
            } else if (order.channel === "Shopeelive-Shopee") {
                channel = "live";
            } else {
                channel = "social";
            }

            productPerformance[productKey] = {
                item_id: order.item_id,
                shop_id: order.shop_id,
                name: order.item_name,
                link: `https://shopee.vn/product/${order.shop_id}/${order.item_id}`,
                order_count: 0,
                gmv: 0,
                commission: 0,
                commission_rate: 0,
                category: category,
                channel: channel,
            };
        }
        // GMV and commission will be calculated from unique orders later

        // Shop stats - order_count will be calculated from unique orders later
        const shopKey = order.shop_id;
        if (!rawTopShops[shopKey]) {
            rawTopShops[shopKey] = {
                shop_name: order.shop_name,
                shop_id: order.shop_id,
                link: order.shop_id ? `https://shopee.vn/shop/${order.shop_id}` : "",
                order_count: 0,
                gmv: 0,
                commission: 0,
                commission_rate: 0,
            };
        }
        // GMV and commission will be calculated from unique orders later

        // Sub ID stats
        for (let i = 1; i <= 5; i++) {
            const sid = order[`sub_id${i}`];
            if (sid && sid.trim() !== "") {
                if (!subIdStats[sid]) {
                    subIdStats[sid] = {
                        count: 0,
                        commission: 0,
                    };
                }
                subIdStats[sid].count++;
                // Commission will be calculated from unique orders later
            }
        }
    });

    // Calculate GMV and commission from unique orders
    Object.values(orderIdToData).forEach((orderData) => {
        // Calculate GMV from actual_order_value (sum of all items in the order)
        totalGmv += parseFloat(orderData.actual_order_value) || 0;
        totalCommission += parseFloat(orderData.total_order_commission) || 0;

        // Channel classification for unique orders
        let channel = "";
        if (orderData.channel === "Shopeevideo-Shopee") {
            orderStats.video++;
            channel = "video";
        } else if (orderData.channel === "Shopeelive-Shopee") {
            orderStats.live++;
            channel = "live";
        } else {
            orderStats.social++;
            channel = "social";
        }

        gmvStats[channel] += parseFloat(orderData.actual_order_value) || 0;
        comStats[channel] += parseFloat(orderData.total_order_commission) || 0;

        // Check zero value and cancelled status
        if (parseFloat(orderData.actual_order_value) === 0) {
            orderStats.zero++;
        }
        if (orderData.status === "Đã hủy") {
            orderStats.cancelled++;
        }
    });

    // Set total order count from unique order_ids
    orderStats.total = uniqueOrderIds.size;

    // Recalculate GMV and commission by day, hour, and category from unique orders
    // Lưu category cho mỗi order_id (lấy từ item đầu tiên hoặc tổng hợp)
    const orderIdToCategory = {};
    filteredOrders.forEach((order) => {
        if (order.order_id && order.order_id.trim() !== "") {
            if (!orderIdToCategory[order.order_id]) {
                orderIdToCategory[order.order_id] = order.l1_category || "Khác";
            }
        }
    });

    // Tính GMV và commission theo day, hour, category từ unique orders
    Object.values(orderIdToData).forEach((orderData) => {
        const orderTime = orderData.purchase_time_ts || (orderData.order_time ? new Date(orderData.order_time).getTime() : null);
        if (orderTime) {
            const orderDate = new Date(orderTime);
            const day = orderDate.toISOString().split("T")[0];
            const hour = String(orderDate.getHours()).padStart(2, "0");

            // GMV by day and hour
            gmvByDay[day] = (gmvByDay[day] || 0) + (parseFloat(orderData.actual_order_value) || 0);
            gmvByHour[hour] = (gmvByHour[hour] || 0) + (parseFloat(orderData.actual_order_value) || 0);

            // Commission by day and hour
            comByDay[day] = (comByDay[day] || 0) + (parseFloat(orderData.total_order_commission) || 0);
            comByHour[hour] = (comByHour[hour] || 0) + (parseFloat(orderData.total_order_commission) || 0);

            // GMV and commission by category
            const category = orderIdToCategory[orderData.order_id] || "Khác";
            gmvByCategory[category] = (gmvByCategory[category] || 0) + (parseFloat(orderData.actual_order_value) || 0);
            comByCategory[category] = (comByCategory[category] || 0) + (parseFloat(orderData.total_order_commission) || 0);
        }
    });

    // Recalculate product and shop GMV and commission from unique orders
    // Mỗi order_id chỉ tính 1 lần cho mỗi product/shop
    const productOrderMap = {};
    const shopOrderMap = {};

    filteredOrders.forEach((order) => {
        if (order.order_id && order.order_id.trim() !== "" && orderIdToData[order.order_id]) {
            const productKey = `${order.shop_id}__${order.item_id}`;
            const shopKey = order.shop_id;

            if (!productOrderMap[productKey]) {
                productOrderMap[productKey] = new Set();
            }
            if (!shopOrderMap[shopKey]) {
                shopOrderMap[shopKey] = new Set();
            }

            // Track unique order_ids per product and shop
            productOrderMap[productKey].add(order.order_id);
            shopOrderMap[shopKey].add(order.order_id);
        }
    });

    // Calculate order_count, GMV and commission for products
    // GMV = tổng actual_order_value của các orders có chứa product này
    // Commission = tổng total_order_commission của các orders có chứa product này
    Object.keys(productOrderMap).forEach((productKey) => {
        let productGmv = 0;
        let productCommission = 0;
        const uniqueOrderCount = productOrderMap[productKey].size;
        productOrderMap[productKey].forEach((orderId) => {
            if (orderIdToData[orderId]) {
                productGmv += parseFloat(orderIdToData[orderId].actual_order_value) || 0;
                productCommission += parseFloat(orderIdToData[orderId].total_order_commission) || 0;
            }
        });
        if (productPerformance[productKey]) {
            productPerformance[productKey].order_count = uniqueOrderCount;
            productPerformance[productKey].gmv = productGmv;
            productPerformance[productKey].commission = productCommission;
        }
    });

    // Calculate order_count, GMV and commission for shops
    // GMV = tổng actual_order_value của các orders từ shop này
    // Commission = tổng total_order_commission của các orders từ shop này
    Object.keys(shopOrderMap).forEach((shopKey) => {
        let shopGmv = 0;
        let shopCommission = 0;
        const uniqueOrderCount = shopOrderMap[shopKey].size;
        shopOrderMap[shopKey].forEach((orderId) => {
            if (orderIdToData[orderId]) {
                shopGmv += parseFloat(orderIdToData[orderId].actual_order_value) || 0;
                shopCommission += parseFloat(orderIdToData[orderId].total_order_commission) || 0;
            }
        });
        if (rawTopShops[shopKey]) {
            rawTopShops[shopKey].order_count = uniqueOrderCount;
            rawTopShops[shopKey].gmv = shopGmv;
            rawTopShops[shopKey].commission = shopCommission;
        }
    });

    // Recalculate sub ID commission from unique orders
    // Mỗi order_id chỉ tính 1 lần cho mỗi sub_id
    Object.keys(subIdStats).forEach((sid) => {
        const orderIdsForSubId = new Set();
        filteredOrders.forEach((order) => {
            for (let i = 1; i <= 5; i++) {
                if (order[`sub_id${i}`] === sid && order.order_id && order.order_id.trim() !== "") {
                    orderIdsForSubId.add(order.order_id);
                }
            }
        });

        let subIdCommission = 0;
        orderIdsForSubId.forEach((orderId) => {
            if (orderIdToData[orderId]) {
                subIdCommission += parseFloat(orderIdToData[orderId].total_order_commission) || 0;
            }
        });
        subIdStats[sid].commission = subIdCommission;
        subIdStats[sid].count = orderIdsForSubId.size; // Count unique order_ids
    });

    // Calculate rates
    gmvStats.total = totalGmv;
    gmvStats.average_order_value = uniqueOrderIds.size > 0 ? totalGmv / uniqueOrderIds.size : 0;
    gmvStats.by_category = gmvByCategory;
    gmvStats.by_day = gmvByDay;
    gmvStats.by_hour = gmvByHour;

    comStats.total = totalCommission;
    comStats.average_commission = uniqueOrderIds.size > 0 ? totalCommission / uniqueOrderIds.size : 0;
    comStats.commission_rate = totalGmv > 0 ? (totalCommission / totalGmv) * 100 : 0;
    comStats.by_category = comByCategory;
    comStats.by_day = comByDay;
    comStats.by_hour = comByHour;
    comStats.xtra_rate = totalCommission > 0 ? (xtraCommission / totalCommission) * 100 : 0;
    comStats.shopee_rate = totalCommission > 0 ? (shopeeCommission / totalCommission) * 100 : 0;

    // Calculate product commission rates
    Object.values(productPerformance).forEach((product) => {
        if (product.gmv > 0) {
            product.commission_rate = Math.round((product.commission / product.gmv) * 100 * 100) / 100;
        }
    });

    // Sort products by commission
    const sortedProducts = Object.values(productPerformance).sort((a, b) => b.commission - a.commission);
    performanceStats.top_performing_products = sortedProducts.slice(0, 10);
    performanceStats.low_performing_products = sortedProducts.slice(-10).reverse();

    // Sort shops
    topShops = Object.values(rawTopShops)
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 5);
    topShops.forEach((shop) => {
        if (shop.gmv > 0) {
            shop.commission_rate = Math.round((shop.commission / shop.gmv) * 100 * 100) / 100;
        }
    });

    // Top products
    topProducts = sortedProducts.slice(0, 5);

    // Top sub IDs
    topSubIds = Object.entries(subIdStats)
        .sort((a, b) => {
            if (a[1].count === b[1].count) {
                return b[1].commission - a[1].commission;
            }
            return b[1].count - a[1].count;
        })
        .slice(0, 10)
        .map(([subId, data]) => ({ subId, ...data }));

    // Update displays
    updateStatisticsDisplay(totalGmv, totalCommission, xtraCommission, shopeeCommission);
    updateCharts();
    updateTables();
    updateTopLists();
    updateSubIdDatalists();
}

// Clear all displays
function clearAllDisplays() {
    document.getElementById("totalGmv").textContent = "0 ₫";
    document.getElementById("totalCommission").textContent = "0 ₫";
    document.getElementById("xtraCommission").textContent = "0 ₫";
    document.getElementById("shopeeCommission").textContent = "0 ₫";
    // Clear other displays...
}

// Update statistics display
function updateStatisticsDisplay(totalGmv, totalCommission, xtraCommission, shopeeCommission) {
    // Update commission boxes (with non-breaking space)
    document.getElementById("totalGmv").innerHTML = formatCurrency(totalGmv).replace(/ /g, "&nbsp;");
    document.getElementById("totalCommission").innerHTML = formatCurrency(totalCommission).replace(/ /g, "&nbsp;");
    document.getElementById("xtraCommission").innerHTML = formatCurrency(xtraCommission).replace(/ /g, "&nbsp;");
    document.getElementById("shopeeCommission").innerHTML = formatCurrency(shopeeCommission).replace(/ /g, "&nbsp;");

    // Update order statistics table
    const orderTotalEl = document.getElementById("orderTotal");
    const orderZeroBadgeEl = document.getElementById("orderZeroBadge");
    const orderCancelledBadgeEl = document.getElementById("orderCancelledBadge");
    const totalOrdersEl = document.getElementById("totalOrders");
    if (orderTotalEl) orderTotalEl.textContent = orderStats.total;
    if (orderZeroBadgeEl) orderZeroBadgeEl.textContent = orderStats.zero;
    if (orderCancelledBadgeEl) orderCancelledBadgeEl.textContent = orderStats.cancelled;
    // Update the text node before the first span in totalOrders
    if (totalOrdersEl && totalOrdersEl.firstChild && totalOrdersEl.firstChild.nodeType === Node.TEXT_NODE) {
        totalOrdersEl.firstChild.textContent = `${orderStats.total} (`;
    }

    // Update video orders
    const videoOrdersEl = document.getElementById("videoOrders");
    if (videoOrdersEl) videoOrdersEl.textContent = orderStats.video;
    const videoCommissionCellEl = document.getElementById("videoCommissionCell");
    if (videoCommissionCellEl) videoCommissionCellEl.innerHTML = formatCurrency(comStats.video).replace(/ /g, "&nbsp;");

    // Update live orders (show/hide based on count)
    const liveOrderRow = document.getElementById("liveOrderRow");
    const liveOrdersEl = document.getElementById("liveOrders");
    const liveCommissionCellEl = document.getElementById("liveCommissionCell");
    if (orderStats.live > 0) {
        if (liveOrderRow) liveOrderRow.classList.remove("d-none");
        if (liveOrdersEl) liveOrdersEl.textContent = orderStats.live;
        if (liveCommissionCellEl) liveCommissionCellEl.innerHTML = formatCurrency(comStats.live).replace(/ /g, "&nbsp;");
    } else {
        if (liveOrderRow) liveOrderRow.classList.add("d-none");
    }

    // Update social orders
    const socialOrdersEl = document.getElementById("socialOrders");
    if (socialOrdersEl) socialOrdersEl.textContent = orderStats.social;
    const socialCommissionCellEl = document.getElementById("socialCommissionCell");
    if (socialCommissionCellEl) socialCommissionCellEl.innerHTML = formatCurrency(comStats.social).replace(/ /g, "&nbsp;");

    // Update zero commission orders
    const zeroCommissionOrdersEl = document.getElementById("zeroCommissionOrders");
    if (zeroCommissionOrdersEl) {
        zeroCommissionOrdersEl.innerHTML = orderStats.zero > 0 ? `<span class="badge bg-warning text-dark">${orderStats.zero}</span>` : "0";
    }
    const zeroCommissionCellEl = document.getElementById("zeroCommissionCell");
    if (zeroCommissionCellEl) zeroCommissionCellEl.innerHTML = "0&nbsp;₫";

    // Update cancelled orders (show/hide based on count)
    const canceledOrderRow = document.getElementById("canceledOrderRow");
    const canceledOrdersEl = document.getElementById("canceledOrders");
    const canceledCommissionCellEl = document.getElementById("canceledCommissionCell");
    if (orderStats.cancelled > 0) {
        if (canceledOrderRow) canceledOrderRow.classList.remove("d-none");
        if (canceledOrdersEl) canceledOrdersEl.textContent = orderStats.cancelled;
        if (canceledCommissionCellEl) canceledCommissionCellEl.innerHTML = "0&nbsp;₫";
    } else {
        if (canceledOrderRow) canceledOrderRow.classList.add("d-none");
    }

    // Update total commission cell
    const totalCommissionCellEl = document.getElementById("totalCommissionCell");
    if (totalCommissionCellEl) totalCommissionCellEl.innerHTML = formatCurrency(totalCommission).replace(/ /g, "&nbsp;");

    // Keep old IDs for backward compatibility (if they exist elsewhere)
    const orderVideoCountEl = document.getElementById("orderVideoCount");
    if (orderVideoCountEl) orderVideoCountEl.textContent = orderStats.video;
    const orderLiveCountEl = document.getElementById("orderLiveCount");
    if (orderLiveCountEl) orderLiveCountEl.textContent = orderStats.live;
    const orderSocialCountEl = document.getElementById("orderSocialCount");
    if (orderSocialCountEl) orderSocialCountEl.textContent = orderStats.social;
    const orderZeroCountEl = document.getElementById("orderZeroCount");
    if (orderZeroCountEl) orderZeroCountEl.textContent = orderStats.zero;
    const orderCancelledCountEl = document.getElementById("orderCancelledCount");
    if (orderCancelledCountEl) orderCancelledCountEl.textContent = orderStats.cancelled;

    // Hiển thị tổng hoa hồng trong phần Thống kê đơn hàng (backward compatibility)
    const orderCommissionTotalEl = document.getElementById("orderCommissionTotal");
    if (orderCommissionTotalEl) {
        orderCommissionTotalEl.textContent = formatCurrency(totalCommission);
    }

    document.getElementById("gmvTotal").textContent = formatCurrency(gmvStats.total);
    document.getElementById("gmvAverage").textContent = formatCurrency(gmvStats.average_order_value);
    document.getElementById("gmvVideo").textContent = formatCurrency(gmvStats.video);
    document.getElementById("gmvLive").textContent = formatCurrency(gmvStats.live);
    document.getElementById("gmvSocial").textContent = formatCurrency(gmvStats.social);

    document.getElementById("comTotal").textContent = formatCurrency(comStats.total);
    document.getElementById("comAverage").textContent = formatCurrency(comStats.average_commission);
    document.getElementById("comVideo").textContent = formatCurrency(comStats.video);
    document.getElementById("comLive").textContent = formatCurrency(comStats.live);
    document.getElementById("comSocial").textContent = formatCurrency(comStats.social);
    document.getElementById("comXtraRate").textContent = formatPercent(comStats.xtra_rate);
    document.getElementById("comShopeeRate").textContent = formatPercent(comStats.shopee_rate);
    document.getElementById("comRate").textContent = formatPercent(comStats.commission_rate);
}

// Format currency
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return Math.round(num).toLocaleString("vi-VN") + " ₫";
}

// Format currency without symbol (for charts and tables)
function formatCurrencyNumber(value) {
    const num = parseFloat(value) || 0;
    return Math.round(num);
}

// Format percent
function formatPercent(value) {
    return Math.round(value * 100) / 100 + "%";
}

// Update charts
function updateCharts() {
    // Register ChartDataLabels plugin if available
    if (typeof ChartDataLabels !== "undefined") {
        Chart.register(ChartDataLabels);
    }

    // Destroy existing charts
    Object.values(charts).forEach((chart) => {
        if (chart) chart.destroy();
    });
    charts = {};

    if (filteredOrders.length === 0) return;

    // Calculate totals for commission chart
    let xtraCommission = 0;
    let shopeeCommission = 0;
    filteredOrders.forEach((order) => {
        xtraCommission += parseFloat(order.xtra_commission_amount) || 0;
        shopeeCommission += parseFloat(order.shopee_commission_amount) || 0;
    });

    // Commission doughnut chart
    const commissionCtx = document.getElementById("commissionChart");
    if (commissionCtx) {
        charts.commission = new Chart(commissionCtx.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: [`Shopee (${formatCurrency(shopeeCommission)})`, `Xtra (${formatCurrency(xtraCommission)})`],
                datasets: [
                    {
                        data: [shopeeCommission, xtraCommission],
                        backgroundColor: ["#06b6d4", "#ec4899"],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ": " + formatCurrency(context.parsed);
                            },
                        },
                    },
                    datalabels: {
                        color: "#222",
                        font: { weight: "bold", size: 14 },
                        formatter: function (value) {
                            return formatCurrency(value);
                        },
                    },
                },
            },
            plugins: typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : [],
        });
    }

    // Order type bar chart
    const orderTypeCtx = document.getElementById("orderTypeChart");
    if (orderTypeCtx) {
        charts.orderType = new Chart(orderTypeCtx.getContext("2d"), {
            type: "bar",
            data: {
                labels: ["Đơn video", "Đơn live", "Đơn social", "Đơn 0đ", "Đơn hủy"],
                datasets: [
                    {
                        label: "Số lượng",
                        data: [orderStats.video, orderStats.live, orderStats.social, orderStats.zero, orderStats.cancelled],
                        backgroundColor: ["#ec4899", "#06b6d4", "#fde047", "#8dd873", "#667eea"],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ": " + context.parsed.y;
                            },
                        },
                    },
                    datalabels: {
                        anchor: "end",
                        align: "top",
                        font: { weight: "bold", size: 15, family: "Segoe UI" },
                        color: "#222",
                        formatter: function (value) {
                            return value;
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                    },
                },
            },
            plugins: typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : [],
        });
    }

    // Channel bar chart
    const channelCounts = {};
    filteredOrders.forEach((order) => {
        const ch = (order.channel || "").trim() || "Khác";
        channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    });

    const channelCtx = document.getElementById("channelChart");
    if (channelCtx) {
        charts.channel = new Chart(channelCtx.getContext("2d"), {
            type: "bar",
            data: {
                labels: Object.keys(channelCounts),
                datasets: [
                    {
                        label: "Số đơn",
                        data: Object.values(channelCounts),
                        backgroundColor: ["#f36f21", "#ec4899", "#06b6d4", "#fde047", "#8dd873", "#667eea", "#a78bfa", "#fbbf24", "#38bdf8", "#f87171"],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ": " + context.parsed.y;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                    },
                },
            },
        });
    }

    // GMV by day line chart
    if (Object.keys(gmvStats.by_day).length > 0) {
        const gmvByDayCtx = document.getElementById("gmvByDayChart");
        if (gmvByDayCtx) {
            const sortedDays = Object.keys(gmvStats.by_day).sort();
            charts.gmvByDay = new Chart(gmvByDayCtx.getContext("2d"), {
                type: "line",
                data: {
                    labels: sortedDays,
                    datasets: [
                        {
                            label: "GMV theo ngày",
                            data: sortedDays.map((day) => gmvStats.by_day[day]),
                            borderColor: "#0d47a1",
                            backgroundColor: "rgba(13, 71, 161, 0.1)",
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return "GMV: " + formatCurrency(context.parsed.y);
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return formatCurrency(value);
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    // GMV by hour bar chart
    if (Object.keys(gmvStats.by_hour).length > 0) {
        const gmvByHourCtx = document.getElementById("gmvByHourChart");
        if (gmvByHourCtx) {
            const sortedHours = Object.keys(gmvStats.by_hour).sort();
            charts.gmvByHour = new Chart(gmvByHourCtx.getContext("2d"), {
                type: "bar",
                data: {
                    labels: sortedHours,
                    datasets: [
                        {
                            label: "GMV theo giờ",
                            data: sortedHours.map((hour) => gmvStats.by_hour[hour]),
                            backgroundColor: "rgba(13, 71, 161, 0.7)",
                            borderColor: "#0d47a1",
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return "GMV: " + formatCurrency(context.parsed.y);
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return formatCurrency(value);
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    // GMV by category pie chart
    if (Object.keys(gmvStats.by_category).length > 0) {
        const gmvByCategoryCtx = document.getElementById("gmvByCategoryChart");
        if (gmvByCategoryCtx) {
            charts.gmvByCategory = new Chart(gmvByCategoryCtx.getContext("2d"), {
                type: "pie",
                data: {
                    labels: Object.keys(gmvStats.by_category),
                    datasets: [
                        {
                            label: "GMV theo danh mục",
                            data: Object.values(gmvStats.by_category),
                            backgroundColor: ["#f36f21", "#ec4899", "#06b6d4", "#fde047", "#8dd873", "#667eea", "#a78bfa", "#fbbf24", "#38bdf8", "#f87171", "#f36f21", "#ec4899", "#06b6d4", "#fde047", "#8dd873"],
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "right" },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || "";
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ": " + formatCurrency(value) + " (" + percentage + "%)";
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    // Commission by day line chart
    if (Object.keys(comStats.by_day).length > 0) {
        const comByDayCtx = document.getElementById("comByDayChart");
        if (comByDayCtx) {
            const sortedDays = Object.keys(comStats.by_day).sort();
            charts.comByDay = new Chart(comByDayCtx.getContext("2d"), {
                type: "line",
                data: {
                    labels: sortedDays,
                    datasets: [
                        {
                            label: "Hoa hồng theo ngày",
                            data: sortedDays.map((day) => comStats.by_day[day]),
                            borderColor: "#1b5e20",
                            backgroundColor: "rgba(27, 94, 32, 0.1)",
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return "Hoa hồng: " + formatCurrency(context.parsed.y);
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return formatCurrency(value);
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    // Commission by hour bar chart
    if (Object.keys(comStats.by_hour).length > 0) {
        const comByHourCtx = document.getElementById("comByHourChart");
        if (comByHourCtx) {
            const sortedHours = Object.keys(comStats.by_hour).sort();
            charts.comByHour = new Chart(comByHourCtx.getContext("2d"), {
                type: "bar",
                data: {
                    labels: sortedHours,
                    datasets: [
                        {
                            label: "Hoa hồng theo giờ",
                            data: sortedHours.map((hour) => comStats.by_hour[hour]),
                            backgroundColor: "rgba(27, 94, 32, 0.7)",
                            borderColor: "#1b5e20",
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return "Hoa hồng: " + formatCurrency(context.parsed.y);
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return formatCurrency(value);
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    // Commission by category pie chart
    if (Object.keys(comStats.by_category).length > 0) {
        const comByCategoryCtx = document.getElementById("comByCategoryChart");
        if (comByCategoryCtx) {
            charts.comByCategory = new Chart(comByCategoryCtx.getContext("2d"), {
                type: "pie",
                data: {
                    labels: Object.keys(comStats.by_category),
                    datasets: [
                        {
                            label: "Hoa hồng theo danh mục",
                            data: Object.values(comStats.by_category),
                            backgroundColor: ["#1b5e20", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#9e9e9e", "#607d8b", "#f36f21", "#ec4899", "#06b6d4", "#fde047"],
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "right" },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || "";
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return label + ": " + formatCurrency(value) + " (" + percentage + "%)";
                                },
                            },
                        },
                    },
                },
            });
        }
    }
}

// Update tables
let dataTables = {
    all: null,
    pending: null,
    cancelled: null,
};

function updateTables() {
    // Destroy existing DataTables
    if (dataTables.all) {
        dataTables.all.destroy();
        dataTables.all = null;
    }
    if (dataTables.pending) {
        dataTables.pending.destroy();
        dataTables.pending = null;
    }
    if (dataTables.cancelled) {
        dataTables.cancelled.destroy();
        dataTables.cancelled = null;
    }

    // Prepare data for tables - use raw numbers for sorting
    const allOrdersData = filteredOrders.map((order) => ({
        data: [
            order.order_id || "",
            order.shop_name || "",
            order.item_name || "",
            order.actual_order_value || 0,
            order.quantity || 0,
            order.total_order_commission || 0,
            order.status || "",
            order.channel || "",
            order.sub_id1 || "",
            order.sub_id2 || "",
            order.sub_id3 || "",
            order.sub_id4 || "",
            order.sub_id5 || "",
        ],
        order: order,
    }));

    const pendingOrdersData = filteredOrders
        .filter((order) => order.status === "Đang chờ xử lý")
        .map((order) => ({
            data: [
                order.order_id || "",
                order.shop_name || "",
                order.item_name || "",
                order.actual_order_value || 0,
                order.quantity || 0,
                order.total_order_commission || 0,
                order.status || "",
                order.channel || "",
                order.sub_id1 || "",
                order.sub_id2 || "",
                order.sub_id3 || "",
                order.sub_id4 || "",
                order.sub_id5 || "",
            ],
            order: order,
        }));

    const cancelledOrdersData = filteredOrders
        .filter((order) => order.status === "Đã hủy")
        .map((order) => ({
            data: [
                order.order_id || "",
                order.shop_name || "",
                order.item_name || "",
                order.actual_order_value || 0,
                order.quantity || 0,
                order.total_order_commission || 0,
                order.status || "",
                order.channel || "",
                order.sub_id1 || "",
                order.sub_id2 || "",
                order.sub_id3 || "",
                order.sub_id4 || "",
                order.sub_id5 || "",
            ],
            order: order,
        }));

    // Update counts
    document.getElementById("allOrdersCount").textContent = filteredOrders.length;

    // Initialize DataTables
    const dtOptions = {
        responsive: true,
        pageLength: 200,
        order: [[0, "desc"]],
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/vi.json",
        },
        columnDefs: [
            { targets: [2], width: "250px" }, // Item name column
        ],
    };

    // Helper function to render table row
    function renderTableRow(rowData, order) {
        const tr = document.createElement("tr");
        rowData.forEach((cell, index) => {
            const td = document.createElement("td");
            if (index === 3) {
                // Price column
                td.textContent = formatCurrency(cell);
                td.setAttribute("data-order", cell); // For sorting
            } else if (index === 5) {
                // Commission column
                td.textContent = formatCurrency(cell);
                td.setAttribute("data-order", cell); // For sorting
            } else if (index === 6) {
                // Status column
                const badgeClass = cell === "Đã hủy" ? "bg-danger" : cell === "Đang chờ xử lý" ? "bg-warning" : "bg-success";
                td.innerHTML = `<span class="badge ${badgeClass}">${escapeHtml(cell)}</span>`;
            } else {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });
        return tr;
    }

    // All orders table
    const allTable = document.querySelector("#orders-table-all");
    if (allTable) {
        const tbody = allTable.querySelector("tbody");
        tbody.innerHTML = "";

        allOrdersData.forEach((item) => {
            tbody.appendChild(renderTableRow(item.data, item.order));
        });

        const finalDtOptions = {
            ...dtOptions,
            columnDefs: [
                ...dtOptions.columnDefs,
                { targets: [3, 5], type: "num" }, // Price and commission columns for numeric sorting
            ],
        };

        dataTables.all = $("#orders-table-all").DataTable(finalDtOptions);
    }

    // Pending orders table
    const pendingTable = document.querySelector("#orders-table-pending");
    if (pendingTable) {
        const tbody = pendingTable.querySelector("tbody");
        tbody.innerHTML = "";

        pendingOrdersData.forEach((item) => {
            tbody.appendChild(renderTableRow(item.data, item.order));
        });

        const finalDtOptions = {
            ...dtOptions,
            columnDefs: [...dtOptions.columnDefs, { targets: [3, 5], type: "num" }],
        };

        dataTables.pending = $("#orders-table-pending").DataTable(finalDtOptions);
    }

    // Cancelled orders table
    const cancelledTable = document.querySelector("#orders-table-cancelled");
    if (cancelledTable) {
        const tbody = cancelledTable.querySelector("tbody");
        tbody.innerHTML = "";

        cancelledOrdersData.forEach((item) => {
            tbody.appendChild(renderTableRow(item.data, item.order));
        });

        const finalDtOptions = {
            ...dtOptions,
            columnDefs: [...dtOptions.columnDefs, { targets: [3, 5], type: "num" }],
        };

        dataTables.cancelled = $("#orders-table-cancelled").DataTable(finalDtOptions);
    }

    // Handle tab switching to redraw tables
    const tabLinks = document.querySelectorAll('#orderTab a[data-bs-toggle="tab"]');
    tabLinks.forEach((link) => {
        link.addEventListener("shown.bs.tab", function () {
            // Redraw tables when tab is shown
            setTimeout(() => {
                if (dataTables.all) dataTables.all.columns.adjust();
                if (dataTables.pending) dataTables.pending.columns.adjust();
                if (dataTables.cancelled) dataTables.cancelled.columns.adjust();
            }, 100);
        });
    });
}

// Update top lists
function updateTopLists() {
    // Top shops
    const topShopsList = document.getElementById("topShopsList");
    topShopsList.innerHTML = "";
    if (topShops.length === 0) {
        topShopsList.innerHTML = '<li class="list-group-item">Chưa có dữ liệu</li>';
    } else {
        topShops.forEach((shop) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap p-2";
            li.innerHTML = `
                <div>
                    ${shop.link ? `<a href="${shop.link}" target="_blank">${escapeHtml(shop.shop_name)}</a>` : escapeHtml(shop.shop_name)}
                    <br>
                    <span class="text-muted" style="font-size:12px;">Shop ID: ${escapeHtml(shop.shop_id)}</span>
                </div>
                <div class="text-right ml-auto" style="min-width: 150px;">
                    <span class="badge bg-info" style="font-size:13px;">Đơn: ${shop.order_count}</span>
                    <span class="badge bg-secondary" style="font-size:13px;">GMV: ${formatCurrency(shop.gmv)}</span>
                    <span class="badge bg-success" style="font-size:13px;">Hoa hồng: ${formatCurrency(shop.commission)}</span>
                    <span class="badge bg-warning" style="font-size:13px;">Tỉ lệ HH: ${shop.commission_rate}%</span>
                </div>
            `;
            topShopsList.appendChild(li);
        });
    }

    // Top products
    const topProductsList2 = document.getElementById("topProductsList2");
    topProductsList2.innerHTML = "";
    if (topProducts.length === 0) {
        topProductsList2.innerHTML = '<li class="list-group-item">Chưa có dữ liệu</li>';
    } else {
        topProducts.forEach((product) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap p-2";
            li.innerHTML = `
                <div style="min-width:200px;">
                    ${product.link ? `<a href="${product.link}" target="_blank">${escapeHtml(product.name)}</a>` : escapeHtml(product.name)}
                    <br>
                    <span class="text-muted" style="font-size:12px;">Item ID: ${escapeHtml(product.item_id)}</span>
                </div>
                <div class="text-right ml-auto" style="min-width: 220px;">
                    <span class="badge bg-info" style="font-size:13px;">Đơn: ${product.order_count}</span>
                    <span class="badge bg-secondary" style="font-size:13px;">GMV: ${formatCurrency(product.gmv)}</span>
                    <span class="badge bg-success" style="font-size:13px;">Hoa hồng: ${formatCurrency(product.commission)}</span>
                    <span class="badge bg-warning" style="font-size:13px;">Tỉ lệ HH: ${product.commission_rate}%</span>
                </div>
            `;
            topProductsList2.appendChild(li);
        });
    }

    // Top sub IDs
    const topSubIdsList = document.getElementById("topSubIdsList");
    topSubIdsList.innerHTML = "";
    if (topSubIds.length === 0) {
        topSubIdsList.innerHTML = '<li class="list-group-item">Chưa có dữ liệu SubID</li>';
    } else {
        topSubIds.forEach((item) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center p-2";
            li.innerHTML = `
                <div>
                    <strong>${escapeHtml(item.subId)}</strong>
                    <span class="text-muted">(${item.count} đơn)</span>
                </div>
                <span class="badge bg-info badge-pill">${formatCurrency(item.commission)}</span>
            `;
            topSubIdsList.appendChild(li);
        });
    }

    // Top performing products
    const topProductsList = document.getElementById("topProductsList");
    topProductsList.innerHTML = "";
    if (performanceStats.top_performing_products && performanceStats.top_performing_products.length > 0) {
        performanceStats.top_performing_products.slice(0, 5).forEach((product) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <div>
                    <a href="${product.link}" target="_blank">${escapeHtml(product.name)}</a>
                    <div class="small text-muted">ID: ${escapeHtml(product.item_id)}</div>
                </div>
                <div class="text-right">
                    <span class="badge bg-info">Đơn: ${product.order_count}</span>
                    <span class="badge bg-success">HH: ${formatCurrency(product.commission)}</span>
                </div>
            `;
            topProductsList.appendChild(li);
        });
    } else {
        topProductsList.innerHTML = "<p>Chưa có dữ liệu</p>";
    }

    // Low performing products
    const lowProductsList = document.getElementById("lowProductsList");
    lowProductsList.innerHTML = "";
    if (performanceStats.low_performing_products && performanceStats.low_performing_products.length > 0) {
        performanceStats.low_performing_products.slice(0, 5).forEach((product) => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <div>
                    <a href="${product.link}" target="_blank">${escapeHtml(product.name)}</a>
                    <div class="small text-muted">ID: ${escapeHtml(product.item_id)}</div>
                </div>
                <div class="text-right">
                    <span class="badge bg-info">Đơn: ${product.order_count}</span>
                    <span class="badge bg-success">HH: ${formatCurrency(product.commission)}</span>
                </div>
            `;
            lowProductsList.appendChild(li);
        });
    } else {
        lowProductsList.innerHTML = "<p>Chưa có dữ liệu</p>";
    }

    // Performance warnings
    const performanceWarnings = document.getElementById("performanceWarnings");
    performanceWarnings.innerHTML = "";
    if (comStats.commission_rate < 5) {
        const warning = document.createElement("div");
        warning.className = "alert-box alert-warning";
        warning.innerHTML = "<strong>Cảnh báo:</strong> Tỷ lệ hoa hồng thấp (< 5%). Cân nhắc tập trung vào sản phẩm có hoa hồng cao hơn.";
        performanceWarnings.appendChild(warning);
    }
    if (orderStats.total > 0 && orderStats.cancelled / orderStats.total > 0.2) {
        const warning = document.createElement("div");
        warning.className = "alert-box alert-warning";
        warning.innerHTML = "<strong>Cảnh báo:</strong> Tỷ lệ đơn hủy cao (> 20%). Cần xem xét lại chất lượng sản phẩm hoặc quy trình bán hàng.";
        performanceWarnings.appendChild(warning);
    }
    if (orderStats.total > 0 && orderStats.zero / orderStats.total > 0.1) {
        const warning = document.createElement("div");
        warning.className = "alert-box alert-warning";
        warning.innerHTML = "<strong>Cảnh báo:</strong> Tỷ lệ đơn 0đ cao (> 10%). Có thể do sản phẩm hết hàng hoặc lỗi hệ thống.";
        performanceWarnings.appendChild(warning);
    }
}

// Update sub ID datalists
let subIdSets = {
    all: new Set(),
    sub_id1: new Set(),
    sub_id2: new Set(),
    sub_id3: new Set(),
    sub_id4: new Set(),
    sub_id5: new Set(),
};

function updateSubIdDatalists() {
    // Reset sets
    subIdSets = {
        all: new Set(),
        sub_id1: new Set(),
        sub_id2: new Set(),
        sub_id3: new Set(),
        sub_id4: new Set(),
        sub_id5: new Set(),
    };

    allOrders.forEach((order) => {
        for (let i = 1; i <= 5; i++) {
            const sid = order[`sub_id${i}`];
            if (sid && sid.trim() !== "") {
                subIdSets.all.add(sid);
                subIdSets[`sub_id${i}`].add(sid);
            }
        }
    });

    // Update all sub IDs datalist
    const allSubIdList = document.getElementById("all_sub_id_list");
    if (allSubIdList) {
        allSubIdList.innerHTML = "";
        Array.from(subIdSets.all)
            .sort()
            .forEach((sid) => {
                const option = document.createElement("option");
                option.value = sid;
                allSubIdList.appendChild(option);
            });
    }

    // Update field-specific datalist on change
    const subIdTypeSelect = document.getElementById("sub_id_type");
    const subIdFieldList = document.getElementById("subid_field_list");

    if (subIdTypeSelect && subIdFieldList) {
        // Remove existing listeners
        const newSelect = subIdTypeSelect.cloneNode(true);
        subIdTypeSelect.parentNode.replaceChild(newSelect, subIdTypeSelect);

        // Add new listener
        document.getElementById("sub_id_type").addEventListener("change", function () {
            subIdFieldList.innerHTML = "";
            const selected = this.value;
            if (selected && subIdSets[selected]) {
                Array.from(subIdSets[selected])
                    .sort()
                    .forEach((sid) => {
                        const option = document.createElement("option");
                        option.value = sid;
                        subIdFieldList.appendChild(option);
                    });
            }
        });
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Export to CSV
function exportToCSV() {
    if (!filteredOrders || filteredOrders.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    const headers = ["ID đơn hàng", "Tên Shop", "Tên Item", "Giá trị đơn", "Số lượng", "Tổng hoa hồng", "Trạng thái", "Kênh", "SubID1", "SubID2", "SubID3", "SubID4", "SubID5"];
    const csvContent = [
        headers.join(","),
        ...filteredOrders.map((o) =>
            [
                `"${o.order_id}"`,
                `"${o.shop_name}"`,
                `"${(o.item_name || "").replace(/"/g, '""')}"`,
                o.actual_order_value,
                o.quantity,
                o.net_affiliate_commission,
                `"${o.status}"`,
                `"${o.channel}"`,
                `"${o.sub_id1 || ""}"`,
                `"${o.sub_id2 || ""}"`,
                `"${o.sub_id3 || ""}"`,
                `"${o.sub_id4 || ""}"`,
                `"${o.sub_id5 || ""}"`,
            ].join(",")
        ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `shopee_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export to JSON
function exportToJSON() {
    if (!filteredOrders || filteredOrders.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }
    const jsonContent = JSON.stringify(filteredOrders, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `shopee_orders_${new Date().toISOString().slice(0, 10)}.json`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Print report
function printReport() {
    window.print();
}

// Capture screenshot
async function captureScreenshot() {
    const resultCapture = document.getElementById("result-capture");
    if (!resultCapture) return;

    try {
        const canvas = await html2canvas(resultCapture, {});
        canvas.toBlob(async function (blob) {
            try {
                const clipboardItem = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([clipboardItem]);

                // Show toast notification
                const toast = document.createElement("div");
                toast.className = "toast-notification";
                toast.textContent = "Đã copy ảnh vào bộ nhớ đệm!";
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            } catch (error) {
                console.error("Lỗi khi copy vào clipboard:", error);
                alert("Không thể copy ảnh vào bộ nhớ đệm. Vui lòng thử lại.");
            }
        }, "image/png");
    } catch (error) {
        console.error("Lỗi khi chụp ảnh:", error);
        alert("Có lỗi khi chụp ảnh. Vui lòng thử lại.");
    }
}
