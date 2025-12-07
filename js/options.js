$(function () {
    // Load trạng thái toggle
    chrome.storage.local.get("enableNotif", (v) => {
        $("#enableNotif").prop("checked", v.enableNotif !== false);
    });

    // Lưu trạng thái toggle
    $("#enableNotif").on("change", function () {
        chrome.storage.local.set({ enableNotif: this.checked });
    });

    // Load và hiển thị trạng thái đồng bộ
    loadSyncStatus();

    // Xử lý nút đồng bộ ngay
    $("#syncNowBtn").on("click", function () {
        const btn = $(this);
        btn.prop("disabled", true).text("Đang đồng bộ...");

        chrome.runtime.sendMessage({ type: "SYNC_NOW" }, (response) => {
            if (chrome.runtime.lastError) {
                alert("Lỗi: " + chrome.runtime.lastError.message);
                btn.prop("disabled", false).text("Đồng bộ ngay");
            } else {
                setTimeout(() => {
                    loadSyncStatus();
                    btn.prop("disabled", false).text("Đồng bộ ngay");
                }, 2000);
            }
        });
    });

    // Xử lý nút xem lịch sử
    $("#viewHistoryBtn").on("click", function () {
        chrome.tabs.create({ url: chrome.runtime.getURL("order-history.html") });
    });

    // Xử lý nút xuất CSV
    $("#exportCSVBtn").on("click", function () {
        exportToCSV();
    });

    // Xử lý nút xóa dữ liệu
    $("#clearDataBtn").on("click", function () {
        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu lịch sử? Hành động này không thể hoàn tác.")) {
            clearAllData();
        }
    });

    // Lắng nghe thay đổi storage để cập nhật UI
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && (changes.syncStatus || changes.lastSyncTime || changes.totalOrdersCount)) {
            loadSyncStatus();
        }
    });

    // Xử lý sidebar tab
    $("#sidebarNav .nav-link").on("click", function () {
        const sel = $(this).data("target");
        $("#sidebarNav .nav-link").removeClass("active");
        $(this).addClass("active");
        $(".tab-pane").removeClass("active").filter(sel).addClass("active");
        history.replaceState(null, "", sel);
    });

    // Mở tab mặc định hoặc theo hash
    const hash = location.hash && $(location.hash + ".tab-pane").length ? location.hash : "#pane-settings";
    $(`#sidebarNav .nav-link[data-target="${hash}"]`).trigger("click");
});

// Load trạng thái đồng bộ
function loadSyncStatus() {
    chrome.storage.local.get(["syncStatus", "lastSyncTime", "totalOrdersCount", "syncError"], (data) => {
        // Hiển thị trạng thái
        const status = data.syncStatus || "unknown";
        const statusEl = $("#syncStatus");

        statusEl.removeClass("bg-secondary bg-success bg-danger bg-warning");

        if (status === "success") {
            statusEl.addClass("bg-success").text("Thành công");
        } else if (status === "error") {
            statusEl.addClass("bg-danger").text("Lỗi: " + (data.syncError || "Unknown"));
        } else if (status === "in_progress") {
            statusEl.addClass("bg-warning").text("Đang đồng bộ...");
        } else {
            statusEl.addClass("bg-secondary").text("Chưa đồng bộ");
        }

        // Hiển thị thời gian đồng bộ cuối
        if (data.lastSyncTime) {
            const date = new Date(data.lastSyncTime);
            $("#lastSyncTime").text(date.toLocaleString("vi-VN"));
        } else {
            $("#lastSyncTime").text("Chưa có");
        }

        // Hiển thị số đơn hàng
        if (data.totalOrdersCount !== undefined) {
            $("#totalOrdersCount").text(data.totalOrdersCount.toLocaleString("vi-VN"));
        } else {
            chrome.storage.local.get("orderHistory", (result) => {
                const count = result.orderHistory ? Object.keys(result.orderHistory).length : 0;
                $("#totalOrdersCount").text(count.toLocaleString("vi-VN"));
            });
        }
    });
}

// Xuất dữ liệu ra CSV
function exportToCSV() {
    chrome.storage.local.get("orderHistory", (data) => {
        const orderHistory = data.orderHistory || {};
        const orders = Object.values(orderHistory);

        if (orders.length === 0) {
            alert("Không có dữ liệu để xuất.");
            return;
        }

        // Tạo header CSV
        const headers = ["Checkout ID", "Order ID", "Product ID", "Product Name", "Shop Name", "Purchase Time", "Order Status", "Commission", "GMV", "Referrer", "Channel"];

        // Tạo dữ liệu CSV
        const rows = [headers.join(",")];

        orders.forEach((orderData) => {
            const checkoutId = orderData.checkout_id || "";
            const purchaseTime = orderData.purchase_time ? new Date(orderData.purchase_time * 1000).toLocaleString("vi-VN") : "";
            const orderStatus = orderData.checkout_status || "";

            const ordersList = orderData.orders || [];
            ordersList.forEach((order) => {
                const orderId = order.order_id || "";
                const items = order.items || [];

                items.forEach((item) => {
                    const productId = item.item_id || "";
                    const productName = (item.item_name || "").replace(/"/g, '""');
                    const shopName = (item.shop_name || "").replace(/"/g, '""');
                    const commission = item.item_commission || 0;
                    const gmv = item.item_gmv || item.actual_amount || item.item_price || 0;
                    const referrer = item.referrer || orderData.referrer || "MXH";

                    let channel = "MXH";
                    if (referrer.includes("Shopeevideo") || referrer.includes("Shopeevideo-Shopee")) {
                        channel = "Video";
                    } else if (referrer.includes("Shopeelive") || referrer.includes("Shopeelive-Shopee")) {
                        channel = "Live";
                    }

                    const row = [checkoutId, orderId, productId, `"${productName}"`, `"${shopName}"`, purchaseTime, orderStatus, commission, gmv, referrer, channel];

                    rows.push(row.join(","));
                });
            });
        });

        // Tạo file CSV
        const csvContent = rows.join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `shopee_orders_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    });
}

// Xóa toàn bộ dữ liệu
function clearAllData() {
    chrome.storage.local.remove(["orderHistory", "lastSyncTime", "syncStatus", "totalOrdersCount", "lastSyncCount", "syncError"], () => {
        alert("Đã xóa toàn bộ dữ liệu.");
        loadSyncStatus();
    });
}
