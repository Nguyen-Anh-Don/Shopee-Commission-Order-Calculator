// Content script cho trang sản phẩm Shopee

let widgetVisible = false;
let currentProductId = null;
let affiliateLinkWidgetVisible = false;

// Đọc product_id từ URL
function getProductIdFromURL() {
    const url = new URL(window.location.href);

    // Kiểm tra pattern 1: /product/... trong URL
    const productMatch = url.pathname.match(/\/product\/(\d+)\/(\d+)/);
    if (productMatch && productMatch.length > 2) {
        const shopId = productMatch[1];
        const productId = productMatch[2];
        return productId; // Return only productId as per requirement
    }

    // Kiểm tra pattern 2: -i. trong URL params
    const patternMatch = url.search.match(/-i\.(\d+)\.(\d+)/);
    if (patternMatch && patternMatch.length > 2) {
        const shopId = patternMatch[1];
        const productId = patternMatch[2];
        return productId; // Return only productId as per requirement
    }

    return null; // Return null if no pattern matches
}

// Tạo widget icon
function createWidgetIcon() {
    // Kiểm tra xem đã có widget chưa
    if (document.getElementById("shopee-commission-widget-icon")) {
        return;
    }

    const icon = document.createElement("div");
    icon.id = "shopee-commission-widget-icon";
    icon.innerHTML = "💰";
    icon.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #ee4d2d;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        opacity: 0.5;
        transition: transform 0.2s, opacity 0.2s;
    `;

    icon.addEventListener("mouseenter", () => {
        icon.style.transform = "scale(1.1)";
        icon.style.opacity = "1";
    });

    icon.addEventListener("mouseleave", () => {
        icon.style.transform = "scale(1)";
        icon.style.opacity = "0.5";
    });

    icon.addEventListener("click", () => {
        toggleWidget();
    });

    document.body.appendChild(icon);
}

// Tạo widget panel
function createWidgetPanel() {
    // Kiểm tra xem đã có panel chưa
    if (document.getElementById("shopee-commission-widget-panel")) {
        return;
    }

    const panel = document.createElement("div");
    panel.id = "shopee-commission-widget-panel";
    panel.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 80px;
        width: 350px;
        max-height: 500px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 999998;
        display: none;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    panel.innerHTML = `
        <div style="padding: 0.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px; color: #ee4d2d;">Lịch sử bán hàng</h3>
            <button id="widget-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
        </div>
        <div id="widget-content" style="padding: 0.5rem;">
            <div style="text-align: center; padding: 20px; color: #999;">Đang tải...</div>
        </div>
    `;

    document.body.appendChild(panel);

    // Xử lý nút đóng
    document.getElementById("widget-close-btn").addEventListener("click", () => {
        toggleWidget();
    });
}

// Hiển thị/ẩn widget
function toggleWidget() {
    const panel = document.getElementById("shopee-commission-widget-panel");
    if (!panel) return;

    widgetVisible = !widgetVisible;
    panel.style.display = widgetVisible ? "block" : "none";

    if (widgetVisible) {
        loadProductStats();
    }
}

// Load thống kê sản phẩm
async function loadProductStats() {
    const productId = getProductIdFromURL();
    if (!productId) {
        document.getElementById("widget-content").innerHTML = `
            <div style="text-align: center; padding: 20px; color: #999;">
                Không tìm thấy ID sản phẩm
            </div>
        `;
        return;
    }

    currentProductId = productId;

    // Gọi hàm calculateProductStats từ background
    chrome.runtime.sendMessage(
        {
            type: "CALCULATE_PRODUCT_STATS",
            productId: productId,
        },
        (response) => {
            if (chrome.runtime.lastError) {
                document.getElementById("widget-content").innerHTML = `
                <div style="text-align: center; padding: 20px; color: #f00;">
                    Lỗi: ${chrome.runtime.lastError.message}
                </div>
            `;
                return;
            }

            if (response && response.success) {
                console.log("Response:", response);
                displayProductStats(response.stats);
            } else {
                document.getElementById("widget-content").innerHTML = `
                <div style="text-align: center; padding: 20px; color: #999;">
                    ${response?.error || "Không có dữ liệu"}
                </div>
            `;
            }
        }
    );
}

// Hiển thị thống kê
function displayProductStats(stats) {
    if (!stats || stats.totalOrders === 0) {
        document.getElementById("widget-content").innerHTML = `
            <div style="text-align: center; padding: 20px; color: #999;">
                Chưa có dữ liệu bán hàng cho sản phẩm này
            </div>
        `;
        return;
    }

    const html = `
        <div style="padding: 10px; font-family: Arial, sans-serif;">
            <div style="margin-bottom: 10px;">
                <span style="font-size: 14px; color: #555;">Tổng số đơn:</span>
                <span style="font-size: 18px; font-weight: bold; color: #ee4d2d;">${stats.totalOrders}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
                <span style="font-size: 14px; color: #555;">Doanh số:</span>
                <span style="font-size: 16px; font-weight: bold; color: #333;">${stats.formatted?.totalGMV || "0 ₫"}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
                <span style="font-size: 14px; color: #555;">Hoa hồng:</span>
                <span style="font-size: 16px; font-weight: bold; color: #333;">${stats.formatted?.totalCommission || "0 ₫"}</span>
            </div>
            
            ${stats.lastOrderDate ? `<div style="font-size: 14px; color: #555;">Đơn gần nhất: ${stats.lastOrderDate}, Giá trị đơn: <span style="font-weight: bold; color: #ee4d2d;">${stats.formatted?.lastOrderAmount || "0 ₫"}</span></div>` : ""}
            
            <div style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <span style="font-size: 14px; color: #555;">Kênh bán hàng:</span>
                <div style="display: flex; gap: 8px; margin-top: 5px;">
                    <span style="padding: 4px 6px; background: #e3f2fd; border-radius: 3px; color: #1976d2; font-size: 12px;">
                        Video: ${stats.channels?.video || 0}
                    </span>
                    <span style="padding: 4px 6px; background: #fff3e0; border-radius: 3px; color: #f57c00; font-size: 12px;">
                        Live: ${stats.channels?.live || 0}
                    </span>
                    <span style="padding: 4px 6px; background: #f3e5f5; border-radius: 3px; color: #7b1fa2; font-size: 12px;">
                        MXH: ${stats.channels?.social || 0}
                    </span>
                </div>
            </div>
        </div>
    `;

    document.getElementById("widget-content").innerHTML = html;
}

// ========== Widget tạo link tiếp thị liên kết ==========

// Tạo widget icon cho link tiếp thị liên kết
function createAffiliateLinkWidgetIcon() {
    // Kiểm tra xem đã có widget chưa
    if (document.getElementById("shopee-link-widget-icon")) {
        return;
    }

    const icon = document.createElement("div");
    icon.id = "shopee-link-widget-icon";
    icon.innerHTML = "🔗";
    icon.style.cssText = `
        position: fixed;
        bottom: 120px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #ee4d2d;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        opacity: 0.5;
        transition: transform 0.2s, opacity 0.2s;
    `;

    icon.addEventListener("mouseenter", () => {
        icon.style.transform = "scale(1.1)";
        icon.style.opacity = "1";
    });

    icon.addEventListener("mouseleave", () => {
        icon.style.transform = "scale(1)";
        icon.style.opacity = "0.5";
    });

    icon.addEventListener("click", () => {
        toggleAffiliateLinkWidget();
    });

    document.body.appendChild(icon);
}

// Tạo widget panel cho link tiếp thị liên kết
function createAffiliateLinkWidgetPanel() {
    // Kiểm tra xem đã có panel chưa
    if (document.getElementById("shopee-link-widget-panel")) {
        return;
    }

    const panel = document.createElement("div");
    panel.id = "shopee-link-widget-panel";
    panel.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 80px;
        width: 400px;
        max-height: 600px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 999998;
        display: none;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    panel.innerHTML = `
        <div style="padding: 0.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px; color: #ee4d2d;">Tạo link tiếp thị liên kết</h3>
            <button id="affiliate-link-widget-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
        </div>
        <div id="affiliate-link-widget-content" style="padding: 0.5rem;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">URL:</label>
                <input type="text" id="affiliate-link-url-input" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;" />
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">Sub_id (tùy chọn):</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <input type="text" id="affiliate-link-sub1" placeholder="Sub_id1" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                    <input type="text" id="affiliate-link-sub2" placeholder="Sub_id2" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <input type="text" id="affiliate-link-sub3" placeholder="Sub_id3" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                    <input type="text" id="affiliate-link-sub4" placeholder="Sub_id4" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                </div>
                <input type="text" id="affiliate-link-sub5" placeholder="Sub_id5" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;" />
            </div>
            <button id="affiliate-link-create-btn" style="width: 100%; padding: 10px; background: #ee4d2d; color: white; border: none; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer; margin-bottom: 15px;">Tạo link</button>
            <div id="affiliate-link-result" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">Short Link:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="affiliate-link-short-result" readonly style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: #f5f5f5;" />
                        <button id="affiliate-link-short-copy-btn" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;">Copy</button>
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">Long Link:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="affiliate-link-long-result" readonly style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: #f5f5f5;" />
                        <button id="affiliate-link-long-copy-btn" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;">Copy</button>
                    </div>
                </div>
            </div>
            <div id="affiliate-link-error" style="display: none; margin-top: 10px; padding: 10px; background: #ffebee; color: #c62828; border-radius: 4px; font-size: 13px;"></div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <button id="affiliate-link-history-btn" style="width: 100%; padding: 8px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; cursor: pointer; margin-bottom: 10px;">Lịch sử</button>
                <div id="affiliate-link-history-list" style="display: none; max-height: 200px; overflow-y: auto;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    // Xử lý nút đóng
    document.getElementById("affiliate-link-widget-close-btn").addEventListener("click", () => {
        toggleAffiliateLinkWidget();
    });

    // Auto-fill URL khi mở panel
    const urlInput = document.getElementById("affiliate-link-url-input");
    if (urlInput) {
        urlInput.value = window.location.href;
    }

    // Event handlers sẽ được thêm trong các hàm riêng
    setupAffiliateLinkHandlers();
}

// Thiết lập event handlers cho widget link tiếp thị liên kết
function setupAffiliateLinkHandlers() {
    // Nút tạo link
    const createBtn = document.getElementById("affiliate-link-create-btn");
    if (createBtn) {
        createBtn.addEventListener("click", handleCreateAffiliateLink);
    }

    // Nút copy short link
    const shortCopyBtn = document.getElementById("affiliate-link-short-copy-btn");
    if (shortCopyBtn) {
        shortCopyBtn.addEventListener("click", () => {
            const input = document.getElementById("affiliate-link-short-result");
            if (input) copyToClipboard(input);
        });
    }

    // Nút copy long link
    const longCopyBtn = document.getElementById("affiliate-link-long-copy-btn");
    if (longCopyBtn) {
        longCopyBtn.addEventListener("click", () => {
            const input = document.getElementById("affiliate-link-long-result");
            if (input) copyToClipboard(input);
        });
    }

    // Nút xem lịch sử
    const historyBtn = document.getElementById("affiliate-link-history-btn");
    if (historyBtn) {
        historyBtn.addEventListener("click", toggleHistoryList);
    }
}

// Xử lý tạo link tiếp thị liên kết
async function handleCreateAffiliateLink() {
    const urlInput = document.getElementById("affiliate-link-url-input");
    const resultDiv = document.getElementById("affiliate-link-result");
    const errorDiv = document.getElementById("affiliate-link-error");
    const createBtn = document.getElementById("affiliate-link-create-btn");

    if (!urlInput || !resultDiv || !errorDiv || !createBtn) return;

    // Ẩn lỗi và kết quả cũ
    errorDiv.style.display = "none";
    resultDiv.style.display = "none";

    const originalLink = urlInput.value.trim();

    // Validate URL
    if (!originalLink) {
        showError("Vui lòng nhập URL");
        return;
    }

    if (!originalLink.includes("shopee.vn")) {
        showError("URL phải là trang Shopee (shopee.vn)");
        return;
    }

    // Lấy sub IDs
    const subIds = {
        subId1: document.getElementById("affiliate-link-sub1")?.value.trim() || "",
        subId2: document.getElementById("affiliate-link-sub2")?.value.trim() || "",
        subId3: document.getElementById("affiliate-link-sub3")?.value.trim() || "",
        subId4: document.getElementById("affiliate-link-sub4")?.value.trim() || "",
        subId5: document.getElementById("affiliate-link-sub5")?.value.trim() || "",
    };

    // Disable button và hiển thị loading
    createBtn.disabled = true;
    createBtn.textContent = "Đang tạo...";

    try {
        // Gọi API qua background script
        chrome.runtime.sendMessage(
            {
                type: "CREATE_AFFILIATE_LINK",
                originalLink: originalLink,
                subIds: subIds,
            },
            (response) => {
                createBtn.disabled = false;
                createBtn.textContent = "Tạo link";

                if (chrome.runtime.lastError) {
                    showError("Lỗi: " + chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.success) {
                    // Hiển thị kết quả
                    const shortInput = document.getElementById("affiliate-link-short-result");
                    const longInput = document.getElementById("affiliate-link-long-result");

                    if (shortInput) shortInput.value = response.shortLink || "";
                    if (longInput) longInput.value = response.longLink || "";

                    resultDiv.style.display = "block";

                    // Lưu vào lịch sử
                    saveAffiliateLink({
                        originalLink: originalLink,
                        subIds: subIds,
                        shortLink: response.shortLink || "",
                        longLink: response.longLink || "",
                    });
                } else {
                    let errorMsg = response?.error || "Không thể tạo link";
                    if (errorMsg === "UNAUTHORIZED") {
                        errorMsg = "Vui lòng đăng nhập vào https://affiliate.shopee.vn trước";
                    }
                    showError(errorMsg);
                }
            }
        );
    } catch (error) {
        createBtn.disabled = false;
        createBtn.textContent = "Tạo link";
        showError("Lỗi: " + error.message);
    }
}

// Hiển thị lỗi
function showError(message) {
    const errorDiv = document.getElementById("affiliate-link-error");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
}

// Copy vào clipboard
function copyToClipboard(inputElement) {
    inputElement.select();
    inputElement.setSelectionRange(0, 99999); // For mobile devices

    try {
        document.execCommand("copy");
        // Hiển thị feedback tạm thời
        const originalText = inputElement.nextElementSibling?.textContent || "";
        if (inputElement.nextElementSibling) {
            inputElement.nextElementSibling.textContent = "Đã copy!";
            setTimeout(() => {
                if (inputElement.nextElementSibling) {
                    inputElement.nextElementSibling.textContent = originalText;
                }
            }, 2000);
        }
    } catch (err) {
        console.error("Copy failed:", err);
    }
}

// Lưu link vào lịch sử
async function saveAffiliateLink(linkData) {
    try {
        const { affiliateLinkHistory = [] } = await chrome.storage.local.get("affiliateLinkHistory");

        const newLink = {
            ...linkData,
            createdAt: new Date().toLocaleString("vi-VN"),
            timestamp: Date.now(),
        };

        // Thêm vào đầu mảng
        affiliateLinkHistory.unshift(newLink);

        // Giới hạn 100 link gần nhất
        if (affiliateLinkHistory.length > 100) {
            affiliateLinkHistory.splice(100);
        }

        await chrome.storage.local.set({ affiliateLinkHistory });
    } catch (error) {
        console.error("Error saving affiliate link:", error);
    }
}

// Tải lịch sử link
async function loadAffiliateLinkHistory() {
    try {
        const { affiliateLinkHistory = [] } = await chrome.storage.local.get("affiliateLinkHistory");
        return affiliateLinkHistory;
    } catch (error) {
        console.error("Error loading affiliate link history:", error);
        return [];
    }
}

// Toggle hiển thị lịch sử
async function toggleHistoryList() {
    const historyList = document.getElementById("affiliate-link-history-list");
    const historyBtn = document.getElementById("affiliate-link-history-btn");

    if (!historyList || !historyBtn) return;

    if (historyList.style.display === "none" || !historyList.style.display) {
        // Hiển thị lịch sử
        const history = await loadAffiliateLinkHistory();

        if (history.length === 0) {
            historyList.innerHTML = '<div style="padding: 10px; text-align: center; color: #999; font-size: 13px;">Chưa có lịch sử</div>';
        } else {
            let html = '<div style="max-height: 300px; overflow-y: auto;">';
            history.forEach((link, index) => {
                html += `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; ${index === history.length - 1 ? "border-bottom: none;" : ""}">
                        <div style="font-size: 12px; color: #999; margin-bottom: 5px;">${link.createdAt}</div>
                        <div style="font-size: 12px; color: #555; margin-bottom: 5px; word-break: break-all;">${link.originalLink}</div>
                        <div style="display: flex; gap: 5px; margin-top: 5px;">
                            <input type="text" value="${link.shortLink || ""}" readonly style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; background: #f5f5f5;" />
                            <button class="history-copy-btn" data-link="${link.shortLink || ""}" style="padding: 4px 8px; background: #4CAF50; color: white; border: none; border-radius: 3px; font-size: 11px; cursor: pointer;">Copy</button>
                        </div>
                    </div>
                `;
            });
            html += "</div>";
            historyList.innerHTML = html;

            // Thêm event listeners cho các nút copy trong lịch sử
            historyList.querySelectorAll(".history-copy-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const link = e.target.getAttribute("data-link");
                    if (link) {
                        const tempInput = document.createElement("input");
                        tempInput.value = link;
                        document.body.appendChild(tempInput);
                        tempInput.select();
                        document.execCommand("copy");
                        document.body.removeChild(tempInput);

                        e.target.textContent = "Đã copy!";
                        setTimeout(() => {
                            e.target.textContent = "Copy";
                        }, 2000);
                    }
                });
            });
        }

        historyList.style.display = "block";
        historyBtn.textContent = "Ẩn lịch sử";
    } else {
        // Ẩn lịch sử
        historyList.style.display = "none";
        historyBtn.textContent = "Lịch sử";
    }
}

// Hiển thị/ẩn widget link tiếp thị liên kết
function toggleAffiliateLinkWidget() {
    const panel = document.getElementById("shopee-link-widget-panel");
    if (!panel) return;

    affiliateLinkWidgetVisible = !affiliateLinkWidgetVisible;
    panel.style.display = affiliateLinkWidgetVisible ? "block" : "none";

    if (affiliateLinkWidgetVisible) {
        // Auto-fill URL hiện tại
        const urlInput = document.getElementById("affiliate-link-url-input");
        if (urlInput) {
            urlInput.value = window.location.href;
        }
        // Ẩn kết quả và lịch sử khi mở lại
        document.getElementById("affiliate-link-result").style.display = "none";
        document.getElementById("affiliate-link-history-list").style.display = "none";
        document.getElementById("affiliate-link-error").style.display = "none";
    }
}

// Lắng nghe message từ background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SHOW_PRODUCT_STATS") {
        const productId = request.productId || getProductIdFromURL();
        if (productId) {
            currentProductId = productId;
            if (!widgetVisible) {
                toggleWidget();
            } else {
                loadProductStats();
            }
        }
        sendResponse({ success: true });
    }
    return true;
});

// Khởi tạo khi trang load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

function init() {
    const productId = getProductIdFromURL();
    if (productId) {
        createWidgetIcon();
        createWidgetPanel();
    }

    // Tạo widget link tiếp thị liên kết chỉ trên các trang https://shopee.vn/... (có path sau domain)
    const url = new URL(window.location.href);
    if (url.hostname === "shopee.vn" && url.pathname !== "/" && url.pathname.length > 1) {
        createAffiliateLinkWidgetIcon();
        createAffiliateLinkWidgetPanel();
    }

    // Theo dõi thay đổi URL cho SPA (Shopee không reload trang khi chuyển sản phẩm/mục)
    setupURLChangeDetection();
}

// Theo dõi thay đổi URL trong SPA
function setupURLChangeDetection() {
    let lastUrl = window.location.href;

    // Lắng nghe sự kiện popstate (back/forward button)
    window.addEventListener("popstate", handleURLChange);

    // Intercept pushState và replaceState để phát hiện thay đổi URL
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
        originalPushState.apply(history, args);
        setTimeout(handleURLChange, 100); // Delay để đảm bảo DOM đã cập nhật
    };

    history.replaceState = function (...args) {
        originalReplaceState.apply(history, args);
        setTimeout(handleURLChange, 100);
    };

    // Sử dụng MutationObserver để phát hiện thay đổi URL khi Shopee sử dụng các phương thức khác
    const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            handleURLChange();
        }
    });

    // Quan sát thay đổi trong document
    observer.observe(document, {
        childList: true,
        subtree: true,
    });

    // Kiểm tra URL định kỳ (fallback)
    setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            handleURLChange();
        }
    }, 1000);
}

// Xử lý khi URL thay đổi
function handleURLChange() {
    const url = new URL(window.location.href);

    // Kiểm tra và tạo widget link tiếp thị liên kết nếu cần
    if (url.hostname === "shopee.vn" && url.pathname !== "/" && url.pathname.length > 1) {
        // Kiểm tra xem icon đã tồn tại chưa
        if (!document.getElementById("shopee-link-widget-icon")) {
            createAffiliateLinkWidgetIcon();
        }
        // Kiểm tra xem panel đã tồn tại chưa
        if (!document.getElementById("shopee-link-widget-panel")) {
            createAffiliateLinkWidgetPanel();
        } else {
            // Cập nhật URL input nếu panel đang mở
            if (affiliateLinkWidgetVisible) {
                const urlInput = document.getElementById("affiliate-link-url-input");
                if (urlInput) {
                    urlInput.value = window.location.href;
                }
            }
        }
    } else {
        // Nếu không phải trang hợp lệ, xóa widget nếu có
        const icon = document.getElementById("shopee-link-widget-icon");
        const panel = document.getElementById("shopee-link-widget-panel");
        if (icon) icon.remove();
        if (panel) panel.remove();
    }

    // Kiểm tra và tạo widget commission nếu có productId
    const productId = getProductIdFromURL();
    if (productId) {
        if (!document.getElementById("shopee-commission-widget-icon")) {
            createWidgetIcon();
        }
        if (!document.getElementById("shopee-commission-widget-panel")) {
            createWidgetPanel();
        }
        // Cập nhật productId hiện tại
        if (currentProductId !== productId) {
            currentProductId = productId;
            // Nếu widget đang mở, reload stats
            if (widgetVisible) {
                loadProductStats();
            }
        }
    } else {
        // Nếu không có productId, xóa widget commission nếu có
        const icon = document.getElementById("shopee-commission-widget-icon");
        const panel = document.getElementById("shopee-commission-widget-panel");
        if (icon) icon.remove();
        if (panel) panel.remove();
    }
}
