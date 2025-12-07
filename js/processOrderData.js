// File xử lý logic trung tâm cho dữ liệu đơn hàng Shopee

/**
 * Tính toán các chỉ số từ mảng orders
 * @param {Array} orders - Mảng các đơn hàng (từ DOM scraping hoặc API)
 * @param {Object} options - Tùy chọn xử lý
 * @returns {Object} Kết quả tính toán
 */
function processOrdersData(orders, options = {}) {
    let totalCommission = 0;
    let xtraCommission = 0;
    let shopeeCommission = 0;
    let totalGMV = 0;

    let totalOrders = 0;
    let canceledOrders = 0;
    let unpaidOrders = 0;

    let videoOrders = 0;
    let liveOrders = 0;
    let socialOrders = 0;

    let zeroCommissionOrders = 0;

    let videoCommission = 0;
    let liveCommission = 0;
    let socialCommission = 0;
    let canceledCommission = 0;
    let zeroCommission = 0;

    // Xử lý từng order
    orders.forEach((orderData) => {
        // Hỗ trợ cả format từ DOM scraping và API
        const ordersList = orderData.orders || (orderData.list ? orderData.list.flatMap((item) => item.orders || []) : []);

        ordersList.forEach((order) => {
            const items = order.items || [];

            if (items.length === 0) return;

            // Tính tổng GMV của order: cộng tất cả actual_amount hoặc item_price của các items
            // (Với dữ liệu từ DOM scraping đã sửa, mỗi item đã có item_gmv = tổng GMV order, nên chỉ cần lấy một lần)
            let orderGMV = 0;
            let orderCommission = 0;
            let orderReferrer = null;
            let orderStatus = order.order_status || orderData.checkout_status || "";

            // Kiểm tra xem dữ liệu có phải từ DOM scraping đã sửa không (tất cả items có cùng item_gmv)
            const firstItemGMV = parseFloat(items[0].item_gmv || items[0].actual_amount || items[0].item_price || 0);
            const allItemsHaveSameGMV = items.every((item) => {
                const itemGMV = parseFloat(item.item_gmv || item.actual_amount || item.item_price || 0);
                return itemGMV === firstItemGMV;
            });

            if (allItemsHaveSameGMV && items[0].item_gmv) {
                // Dữ liệu từ DOM scraping đã sửa: mỗi item đã có item_gmv = tổng GMV order
                orderGMV = firstItemGMV;
                orderCommission = parseFloat(items[0].item_commission || 0);
                orderReferrer = items[0].referrer || orderData.referrer || "MXH";
            } else {
                // Dữ liệu từ API: cần cộng tất cả actual_amount hoặc item_price để có tổng GMV
                items.forEach((item) => {
                    const gmv = parseFloat(item.item_gmv || item.actual_amount || item.item_price || 0);
                    orderGMV += gmv;

                    // Lấy referrer từ item đầu tiên
                    if (!orderReferrer) {
                        orderReferrer = item.referrer || orderData.referrer || "MXH";
                    }
                });

                // Commission: ưu tiên lấy từ order level (gross_commission hoặc capped_commission)
                // Nếu không có, mới cộng từ item_commission của các items
                if (orderData.gross_commission !== undefined) {
                    orderCommission = parseFloat(orderData.gross_commission || orderData.capped_commission || 0);
                } else {
                    // Nếu không có ở order level, cộng từ item_commission
                    items.forEach((item) => {
                        const commission = parseFloat(item.item_commission || 0);
                        orderCommission += commission;
                    });
                }
            }

            // Cộng vào tổng (chỉ một lần cho mỗi order)
            totalGMV += orderGMV;
            totalCommission += orderCommission;

            // Phân loại theo kênh
            if (orderReferrer.includes("Shopeevideo") || orderReferrer.includes("Shopeevideo-Shopee")) {
                videoOrders++;
                videoCommission += orderCommission;
            } else if (orderReferrer.includes("Shopeelive") || orderReferrer.includes("Shopeelive-Shopee")) {
                liveOrders++;
                liveCommission += orderCommission;
            } else {
                socialOrders++;
                socialCommission += orderCommission;
            }

            // Kiểm tra hoa hồng 0đ
            if (orderCommission === 0) {
                zeroCommissionOrders++;
                zeroCommission += orderCommission;
            }

            // Kiểm tra trạng thái đơn hàng
            if (orderStatus === "CANCELED" || orderStatus === "Canceled" || order.cancel_reason) {
                canceledOrders++;
                canceledCommission += orderCommission;
            } else if (orderStatus === "UNPAID" || orderStatus === "Pending") {
                unpaidOrders++;
            }

            totalOrders++;
        });

        // Xử lý Xtra và Shopee commission từ API format
        if (orderData.gross_commission !== undefined) {
            // Từ API response
            const gross = parseFloat(orderData.gross_commission || 0);
            const capped = parseFloat(orderData.capped_commission || 0);
            const brand = parseFloat(orderData.total_brand_commission || 0);

            // Xtra commission = brand commission
            xtraCommission += brand;
            // Shopee commission = gross - capped (nếu có)
            shopeeCommission += gross - capped;
        }
    });

    // Format kết quả
    return {
        totalCommission: totalCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        xtraCommission: (xtraCommission / 2).toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        shopeeCommission: (shopeeCommission / 2).toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        totalGMV: totalGMV.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        totalOrders: `${totalOrders - canceledOrders / 2 - unpaidOrders / 2} (${totalOrders} - <span class="badge bg-secondary">${unpaidOrders / 2}</span> - <span class="badge bg-danger">${canceledOrders / 2}</span>)`,
        canceledOrders: canceledOrders / 2,
        unpaidOrders: unpaidOrders / 2,
        videoOrders: videoOrders,
        liveOrders: liveOrders,
        socialOrders: socialOrders,
        zeroCommissionOrders: zeroCommissionOrders,
        videoCommission: videoCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        liveCommission: liveCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        socialCommission: socialCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        canceledCommission: canceledCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        zeroCommission: zeroCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
        raw: {
            totalCommission,
            xtraCommission,
            shopeeCommission,
            totalGMV,
            totalOrders,
            canceledOrders,
            unpaidOrders,
            videoOrders,
            liveOrders,
            socialOrders,
            zeroCommissionOrders,
            videoCommission,
            liveCommission,
            socialCommission,
            canceledCommission,
            zeroCommission,
        },
    };
}

/**
 * Kiểm tra và loại bỏ trùng lặp orders
 * @param {Array} newOrders - Mảng orders mới
 * @param {Object} existingOrders - Object chứa orders đã có (key = checkout_id hoặc order_id)
 * @returns {Array} Mảng orders không trùng lặp
 */
function deduplicateOrders(newOrders, existingOrders = {}) {
    const uniqueOrders = [];

    newOrders.forEach((orderData) => {
        // Lấy checkout_id hoặc order_id làm key
        let key = null;

        if (orderData.checkout_id) {
            key = `checkout_${orderData.checkout_id}`;
        } else if (orderData.orders && orderData.orders.length > 0) {
            // Lấy order_id từ order đầu tiên
            const firstOrder = orderData.orders[0];
            if (firstOrder.order_id) {
                key = `order_${firstOrder.order_id}`;
            }
        }

        if (key && !existingOrders[key]) {
            uniqueOrders.push(orderData);
        }
    });

    return uniqueOrders;
}

/**
 * Lưu orders vào lịch sử trong chrome.storage.local
 * @param {Array} orders - Mảng orders cần lưu
 * @returns {Promise<Object>} Kết quả lưu trữ
 */
async function storeOrdersToHistory(orders) {
    try {
        // Lấy dữ liệu hiện có
        const { orderHistory = {} } = await chrome.storage.local.get("orderHistory");

        // Loại bỏ trùng lặp
        const uniqueOrders = deduplicateOrders(orders, orderHistory);

        // Lưu từng order với key là checkout_id hoặc order_id
        uniqueOrders.forEach((orderData) => {
            let key = null;

            if (orderData.checkout_id) {
                key = `checkout_${orderData.checkout_id}`;
            } else if (orderData.orders && orderData.orders.length > 0) {
                const firstOrder = orderData.orders[0];
                if (firstOrder.order_id) {
                    key = `order_${firstOrder.order_id}`;
                }
            }

            if (key) {
                // Lưu toàn bộ thông tin order
                orderHistory[key] = {
                    ...orderData,
                    storedAt: Date.now(),
                };
            }
        });

        // Lưu lại vào storage
        await chrome.storage.local.set({ orderHistory });

        return {
            success: true,
            newOrders: uniqueOrders.length,
            totalOrders: Object.keys(orderHistory).length,
        };
    } catch (error) {
        console.error("Error storing orders to history:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Lấy lịch sử bán hàng của một sản phẩm
 * @param {string|number} productId - ID sản phẩm (item_id)
 * @returns {Promise<Array>} Mảng các orders chứa sản phẩm này
 */
async function getProductHistory(productId) {
    try {
        const { orderHistory = {} } = await chrome.storage.local.get("orderHistory");
        const productOrders = [];

        // Duyệt qua tất cả orders
        Object.values(orderHistory).forEach((orderData) => {
            const ordersList = orderData.orders || (orderData.list ? orderData.list.flatMap((item) => item.orders || []) : []);

            ordersList.forEach((order) => {
                const items = order.items || [];

                items.forEach((item) => {
                    if (String(item.item_id) === String(productId)) {
                        productOrders.push({
                            ...orderData,
                            item: item,
                            order: order,
                        });
                    }
                });
            });
        });

        // Sắp xếp theo thời gian mua (mới nhất trước)
        productOrders.sort((a, b) => {
            const timeA = a.purchase_time || a.checkout_complete_time || 0;
            const timeB = b.purchase_time || b.checkout_complete_time || 0;
            return timeB - timeA;
        });

        return productOrders;
    } catch (error) {
        console.error("Error getting product history:", error);
        return [];
    }
}

/**
 * Tính toán thống kê cho một sản phẩm
 * @param {string|number} productId - ID sản phẩm
 * @returns {Promise<Object>} Thống kê sản phẩm
 */
async function calculateProductStats(productId) {
    try {
        const productOrders = await getProductHistory(productId);

        if (productOrders.length === 0) {
            return {
                totalOrders: 0,
                totalGMV: 0,
                totalCommission: 0,
                lastOrderDate: null,
                lastOrderAmount: 0,
                channels: {
                    video: 0,
                    live: 0,
                    social: 0,
                },
            };
        }

        let totalGMV = 0;
        let totalCommission = 0;
        let videoOrders = 0;
        let liveOrders = 0;
        let socialOrders = 0;
        let lastOrder = null;
        let lastOrderTime = 0;

        // Nhóm các productOrders theo order (checkout_id hoặc order_id) để tránh cộng lặp GMV
        const orderMap = new Map();

        productOrders.forEach((orderData) => {
            const item = orderData.item;
            const orderKey = orderData.checkout_id || (orderData.order && orderData.order.order_id) || `order_${orderData.purchase_time}`;

            if (!orderMap.has(orderKey)) {
                orderMap.set(orderKey, {
                    orderData: orderData,
                    items: [],
                });
            }

            orderMap.get(orderKey).items.push(item);
        });

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
                if (orderData.gross_commission !== undefined) {
                    orderCommission = parseFloat(orderData.gross_commission || orderData.capped_commission || 0);
                } else {
                    items.forEach((item) => {
                        const commission = parseFloat(item.item_commission || 0);
                        orderCommission += commission;
                    });
                }
            }

            const referrer = firstItem.referrer || orderData.referrer || "MXH";

            totalGMV += orderGMV;
            totalCommission += orderCommission;

            // Phân loại kênh
            if (referrer.includes("Shopeevideo") || referrer.includes("Shopeevideo-Shopee")) {
                videoOrders++;
            } else if (referrer.includes("Shopeelive") || referrer.includes("Shopeelive-Shopee")) {
                liveOrders++;
            } else {
                socialOrders++;
            }

            // Tìm đơn gần nhất
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

        // Format ngày đơn gần nhất
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
            lastOrderAmount: lastOrder ? lastOrder.orderGMV || parseFloat(lastOrder.item.item_gmv || lastOrder.item.actual_amount || lastOrder.item.item_price || 0) : 0,
            channels: {
                video: videoOrders,
                live: liveOrders,
                social: socialOrders,
            },
            formatted: {
                totalGMV: totalGMV.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                totalCommission: totalCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                lastOrderAmount: lastOrder ? (lastOrder.orderGMV || parseFloat(lastOrder.item.item_gmv || lastOrder.item.actual_amount || lastOrder.item.item_price || 0)).toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "0 ₫",
            },
        };
    } catch (error) {
        console.error("Error calculating product stats:", error);
        return {
            totalOrders: 0,
            totalGMV: 0,
            totalCommission: 0,
            lastOrderDate: null,
            lastOrderAmount: 0,
            channels: { video: 0, live: 0, social: 0 },
        };
    }
}

// Export functions để sử dụng trong các file khác
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        processOrdersData,
        storeOrdersToHistory,
        deduplicateOrders,
        getProductHistory,
        calculateProductStats,
    };
}
