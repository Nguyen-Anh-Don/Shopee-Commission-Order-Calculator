document.addEventListener("DOMContentLoaded", function () {
    // Kiểm tra URL hiện tại
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        const urlPattern = /(\/report\/conversion_report|\/payment\/billing\/conversion_details)/; // Biểu thức chính quy để kiểm tra phần đường dẫn

        if (!urlPattern.test(currentUrl)) {
            // Xác định domain tương ứng theo ngôn ngữ
            const lang = navigator.language || navigator.userLanguage;
            let baseUrl = "https://affiliate.shopee.vn"; // Mặc định là tiếng Việt

            if (lang.startsWith("en")) {
                baseUrl = "https://affiliate.shopee.com.my"; // hoặc domain quốc tế nếu cần
            } else if (lang.startsWith("ph")) {
                baseUrl = "https://affiliate.shopee.ph";
            } else if (lang.startsWith("id")) {
                baseUrl = "https://affiliate.shopee.co.id";
            } else if (lang.startsWith("th")) {
                baseUrl = "https://affiliate.shopee.co.th";
            }

            // Tạo đối tượng URL từ domain phù hợp
            const urlObj = new URL(baseUrl);

            const expectedUrl = `${urlObj.origin}/report/conversion_report`; // Tạo đường dẫn đầy đủ
            const billingUrl = `${urlObj.origin}/payment/billing`; // Tạo đường dẫn đầy đủ cho trang hóa đơn

            document.getElementById("result").style.display = "none"; // Ẩn kết quả nếu URL không đúng
            document.getElementById("paginationWarning").style.display = "none"; // Ẩn cảnh báo phân trang nếu URL không đúng
            document.getElementById("scrollToBottom").style.display = "none"; // Ẩn nút cuộn nếu URL không đúng

            const usageInstructions = `
    <div class="alert alert-info mx-2 mb-1 p-1 small" style="border-left: 3px solid #0dcaf0;">
        <h6 class="alert-heading small mb-1">📋 Hướng dẫn sử dụng</h6>
        <p class="mb-0 small">Để sử dụng công cụ tính hoa hồng, vui lòng làm theo các bước sau:</p>
    </div>
    
    <div class="card mb-3 mx-2 small">
        <div class="card-body p-2">
            <h6 class="card-title mb-2 p-0">🔹 Các bước thực hiện:</h6>
            <ol class="mb-0" style="padding-left: 1.5rem;">
                <li class="mb-1">
                    <strong>Truy cập trang báo cáo:</strong>
                    <a href="${expectedUrl}" target="_blank" class="btn btn-sm btn-primary mt-1">
                        ${expectedUrl}
                    </a>
                    <br>hoặc trang đối soát
                    <a href="${billingUrl}" target="_blank" class="btn btn-sm btn-secondary mt-1">
                        ${billingUrl}
                    </a>
                </li>
                <li class="mb-1">
                    <strong>Bật thông tin bổ sung:</strong><br>
                    Nhấn vào biểu tượng <span class="badge bg-secondary">⚙️</span> <strong>hình răng cưa</strong> ở góc phải trên và bật tùy chọn <strong>"Thông tin bổ sung"</strong>
                </li>
                <li class="mb-1">
                    <strong>Chọn ngày cần xem:</strong> Chọn ngày bạn muốn xem kết quả. 
                    <div class="alert alert-warning mt-2 mb-0 py-2" style="font-size: 0.85rem;">
                        <strong>💡 Lưu ý:</strong> Nếu không thể chọn ngày hôm qua, hãy chọn ngày hôm kia trước, sau đó nhấn "Tìm kiếm". Lúc này, hệ thống sẽ cho phép bạn chọn lại ngày hôm qua.
                    </div>
                </li>
                <li class="mb-1">
                    <strong>Lọc dữ liệu:</strong><br>
                    Nhấn nút <span class="badge bg-success">🔍 Tìm kiếm</span> để lọc dữ liệu đơn hàng
                </li>
                <li class="mb-0">
                    <strong>Xem kết quả:</strong><br>
                    Cuối cùng, bấm vào biểu tượng tiện ích <span class="badge bg-primary">💰</span> ở góc trình duyệt để xem kết quả tính toán
                </li>
            </ol>
        </div>
    </div>
    
    <div class="card mb-3 mx-2">
        <div class="card-body p-2">
            <h6 class="card-title mb-2">🧰 Chức năng bổ sung:</h6>
            <div class="d-grid gap-2">
                <a href="/order-history.html" target="_blank" class="btn btn-outline-primary btn-sm">
                    📦 Xem lịch sử đơn hàng
                </a>
                <a href="/options.html" target="_blank" class="btn btn-outline-info btn-sm">
                    ⚙️ Cấu hình
                </a>
            </div>
        </div>
    </div>
    
    <div class="card mb-3 mx-2">
        <div class="card-body p-2">
            <h6 class="card-title mb-2">📚 Tài liệu & Hỗ trợ:</h6>
            <div class="d-grid gap-2">
                <a href="https://goink.me/MjsU" target="_blank" class="btn btn-outline-primary btn-sm">
                    🎥 Video hướng dẫn chi tiết
                </a>
                <a href="https://goink.me/ul2i" target="_blank" class="btn btn-outline-info btn-sm">
                    👥 Tham gia nhóm cộng đồng
                </a>
                <a href="https://goink.me/9enf" target="_blank" class="btn btn-outline-warning btn-sm">
                    ⭐ VIP: Lọc theo SubID
                </a>
            </div>
        </div>
    </div>
    
    <div class="alert alert-light border mb-3 mx-2 p-2 small" style="font-size: 0.85rem;">
        <div class="d-flex align-items-center mb-2">
            <span class="me-2">🌐</span>
            <strong>Xem thêm công cụ tại:</strong>
        </div>
        <a href="https://addlivetag.com/" target="_blank" class="text-decoration-none">https://addlivetag.com</a>
    </div>
    `;

            document.body.innerHTML += usageInstructions; // Thêm hướng dẫn sử dụng vào cuối nội dung
        } else {
            // Nếu URL đúng, tính tổng hoa hồng và hiển thị kết quả
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    function: calculateAllPages,
                },
                (results) => {
                    // Kiểm tra kết quả và xử lý lỗi
                    console.log("Script execution results:", results);

                    if (!results || !results[0]) {
                        console.error("Không có kết quả từ script");
                        document.getElementById("result").innerHTML = `
    <div class="alert alert-danger">
    <strong>Lỗi:</strong> Không thể lấy dữ liệu từ trang. Vui lòng đảm bảo bạn đang ở trang báo cáo đơn hàng và đã chọn ngày.
    </div>
    `;
                        return;
                    }

                    console.log("results[0]:", results[0]);
                    console.log("results[0].result:", results[0].result);

                    if (!results[0].result) {
                        console.error("Kết quả là null hoặc undefined. results[0]:", results[0]);
                        // Kiểm tra xem có lỗi trong quá trình thực thi không
                        if (results[0].error) {
                            console.error("Lỗi từ script execution:", results[0].error);
                        }
                        document.getElementById("result").innerHTML = `
    <div class="alert alert-danger">
    <strong>Lỗi:</strong> Không tìm thấy dữ liệu đơn hàng. Vui lòng kiểm tra lại:
    <ul>
    <li>Đã chọn ngày và nhấn "Tìm kiếm" chưa?</li>
    <li>Trang đã tải xong chưa?</li>
    <li>Có đơn hàng nào trong khoảng thời gian đã chọn không?</li>
    </ul>
    <small>Mở Console (F12) để xem chi tiết lỗi.</small>
    </div>
    `;
                        return;
                    }

                    // Kiểm tra nếu có lỗi trong kết quả
                    if (results[0].result.error) {
                        console.error("Lỗi từ calculateAllPages:", results[0].result.message);
                        document.getElementById("result").innerHTML = `
    <div class="alert alert-danger">
    <strong>Lỗi:</strong> ${results[0].result.message || "Đã xảy ra lỗi khi tính toán"}
    </div>
    `;
                        return;
                    }

                    const {
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
                        startDate,
                        endDate,
                        dateWarning,
                    } = results[0].result;

                    // Hàm format lại ngày
                    function formatDate(dateString) {
                        if (!dateString) return "";

                        // Tách chuỗi theo dấu gạch ngang
                        const parts = dateString.split("-");

                        // Đảm bảo có đủ 3 phần
                        if (parts.length === 3) {
                            const [day, month, year] = parts;
                            return `${day}/${month}/${year}`;
                        }

                        return dateString;
                    }

                    // Hàm hiển thị hoặc ẩn dòng và cập nhật nội dung dựa trên giá trị
                    function displayOrderRow(elementId, value, hiddenClass, badgeClass = null) {
                        const el = document.getElementById(elementId);
                        if (el && el.parentElement) {
                            if (value > 0) {
                                el.parentElement.classList.remove(hiddenClass);
                                if (badgeClass) {
                                    el.innerHTML = `<span class="${badgeClass}">${value}</span>`;
                                } else {
                                    el.textContent = value;
                                }
                            } else {
                                el.parentElement.classList.add(hiddenClass);
                            }
                        }
                    }

                    const startDateFormatted = formatDate(startDate);
                    const endDateFormatted = formatDate(endDate);

                    if (startDate === endDate) {
                        document.getElementById("startDate").textContent = startDateFormatted;
                        document.getElementById("endDate").textContent = "";
                    } else {
                        document.getElementById("startDate").textContent = startDateFormatted;
                        document.getElementById("endDate").textContent = ` - ${endDateFormatted}`;
                    }

                    // Hiển thị cảnh báo nếu các ngày khác nhau
                    if (dateWarning) {
                        document.getElementById("dateWarning").style.display = "block";
                    } else {
                        document.getElementById("dateWarning").style.display = "none";
                    }

                    document.getElementById("addlivetagInfo").style.display = "block";
                    document.getElementById("CommissionWarning").style.display = "block";

                    document.getElementById("totalCommission").textContent = totalCommission;
                    document.getElementById("xtraCommission").textContent = xtraCommission;
                    document.getElementById("shopeeCommission").textContent = shopeeCommission;
                    document.getElementById("totalGMV").textContent = totalGMV;
                    document.getElementById("totalOrders").innerHTML = totalOrders;
                    document.getElementById("canceledOrders").textContent = canceledOrders;
                    document.getElementById("unpaidOrders").textContent = unpaidOrders;
                    document.getElementById("videoOrders").textContent = videoOrders;
                    document.getElementById("liveOrders").textContent = liveOrders;
                    document.getElementById("socialOrders").textContent = socialOrders;
                    document.getElementById("zeroCommissionOrders").textContent = zeroCommissionOrders;

                    // Cập nhật các ô hoa hồng theo loại đơn
                    document.getElementById("totalCommissionCell").textContent = totalCommission;
                    document.getElementById("videoCommissionCell").textContent = videoCommission;
                    document.getElementById("liveCommissionCell").textContent = liveCommission;
                    document.getElementById("socialCommissionCell").textContent = socialCommission;
                    document.getElementById("zeroCommissionCell").textContent = zeroCommission;
                    document.getElementById("canceledCommissionCell").textContent = canceledCommission;

                    // Hiển thị hoặc ẩn dòng
                    displayOrderRow("canceledOrders", canceledOrders, "d-none", "badge bg-danger");
                    displayOrderRow("unpaidOrders", unpaidOrders, "d-none", "badge bg-secondary");
                    displayOrderRow("videoOrders", videoOrders, "d-none");
                    displayOrderRow("liveOrders", liveOrders, "d-none");
                    displayOrderRow("socialOrders", socialOrders, "d-none");
                    displayOrderRow("zeroCommissionOrders", zeroCommissionOrders, "d-none", "badge bg-warning text-dark");

                    if (results[0].result.allOrders) {
                        showTopShopAndProducts(results[0].result.allOrders);
                    }
                }
            );

            // Thêm sự kiện cho nút cuộn xuống cuối trang
            document.getElementById("scrollToBottom").addEventListener("click", function () {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: scrollToBottom,
                });
            });
        }
    });

    // Thêm xử lý sự kiện cho nút chụp ảnh
    document.getElementById("captureBtn")?.addEventListener("click", async function () {
        try {
            // Ẩn phần tử trước khi chụp
            const captureBtn = document.getElementById("captureBtn");
            captureBtn.style.visibility = "hidden";

            const topShopProduct = document.getElementById("top-shop-product");
            topShopProduct.style.display = "none";

            // Ẩn CommissionWarning
            const commissionWarning = document.getElementById("CommissionWarning");
            if (commissionWarning) {
                commissionWarning.style.display = "none";
            }

            await new Promise((resolve) => setTimeout(resolve, 200));

            // Chụp toàn bộ container
            const canvas = await html2canvas(document.documentElement, {
                backgroundColor: "#ffffff",
                scale: 2,
                logging: false,
                useCORS: true,
            });

            // Chuyển canvas thành blob
            canvas.toBlob(async function (blob) {
                try {
                    // Copy ảnh vào clipboard
                    const clipboardItem = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([clipboardItem]);

                    // Hiện thông báo thành công
                    const toast = document.createElement("div");
                    toast.className = "toast-notification";
                    toast.textContent = "Đã copy ảnh vào bộ nhớ đệm!";
                    document.body.appendChild(toast);

                    // Xóa toast sau khi animation kết thúc
                    setTimeout(() => {
                        document.body.removeChild(toast);
                    }, 2000);
                } catch (error) {
                    console.error("Error copying to clipboard:", error);
                    alert("Không thể copy ảnh vào bộ nhớ đệm. Vui lòng thử lại.");
                }

                // Hiện lại sau khi chụp
                captureBtn.style.visibility = "visible";
                topShopProduct.style.display = "block";
                commissionWarning.style.display = "block";
            }, "image/png");
        } catch (error) {
            console.error("Error capturing screenshot:", error);
            alert("Có lỗi khi chụp ảnh. Vui lòng thử lại.");
            document.getElementById("captureBtn").style.visibility = "visible";
        }
    });
});

// Hàm cuộn xuống cuối trang
function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}

function truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

// Hàm hiển thị shop và sản phẩm top
function showTopShopAndProducts(allOrders) {
    const shopCount = {};
    const shopCommission = {};
    const productCount = {};
    const productInfo = {};

    allOrders.forEach((order) => {
        order.orders.forEach((o) => {
            const shopName = o.items[0].shop_name || "Không rõ shop";
            shopCount[shopName] = (shopCount[shopName] || 0) + 1;
            shopCommission[shopName] = (shopCommission[shopName] || 0) + parseInt(o.items[0].item_commission || 0);

            o.items.forEach((item) => {
                console.log("item_id:", item.item_id, "name:", item.item_name, "commission:", item.item_commission, "ref:", item.referrer);

                const itemKey = `${item.item_id}`;
                productCount[itemKey] = (productCount[itemKey] || 0) + 1;

                if (!productInfo[itemKey]) {
                    productInfo[itemKey] = {
                        name: item.item_name || "Sản phẩm không rõ",
                        ref: item.referrer || "Không rõ",
                        commission: parseInt(item.item_commission || 0),
                    };
                } else {
                    productInfo[itemKey].commission += parseInt(item.item_commission || 0);
                }
            });
        });
    });

    // Top 3 shop
    const sortedShops = Object.keys(shopCount).sort((a, b) => shopCount[b] - shopCount[a]);
    const top3Shops = sortedShops.slice(0, 3);
    const shopListHtml = top3Shops
        .map((shop) => {
            const count = shopCount[shop];
            const commission = shopCommission[shop];
            return `${shop} — <strong>${count} đơn, ${commission.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</strong>`;
        })
        .join("<br>");
    document.getElementById("topShop").innerHTML = shopListHtml;

    // Top 5 sản phẩm theo hoa hồng
    const sortedProducts = Object.keys(productInfo).sort((a, b) => productInfo[b].commission - productInfo[a].commission);
    const topList = document.getElementById("topProducts");
    topList.innerHTML = "";

    sortedProducts.slice(0, 5).forEach((pid) => {
        const info = productInfo[pid];
        let type = "MXH";
        if (info.ref.includes("Shopeevideo")) type = "Video";
        else if (info.ref.includes("Shopeelive")) type = "Live";
        else if (info.ref) type = info.ref;

        const formattedCommission = info.commission.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

        const li = document.createElement("li");
        li.innerHTML = `${truncateText(info.name, 50)} — <strong>${productCount[pid]} đơn, ${formattedCommission} (${type})</strong>`;
        topList.appendChild(li);
    });
}

// Hàm tính tổng hoa hồng và xử lý nhiều trang
async function calculateAllPages() {
    const enableLog = true; // Flag to enable/disable logging

    // Function for conditional logging
    function debugLog(message, data = null) {
        if (enableLog) {
            console.log(message, data);
        }
    }

    try {
        let allOrders = [];
        let xtraCommission = 0;
        let shopeeCommission = 0;

        // Check start and end date inputs
        const startDateInput = document.querySelector(".ant-calendar-range-picker-input:nth-child(1)");
        const endDateInput = document.querySelector(".ant-calendar-range-picker-input:nth-child(3)");

        // Extract values from input fields
        const startDate = startDateInput ? startDateInput.value : "";
        const endDate = endDateInput ? endDateInput.value : "";

        let dateWarning = startDate !== endDate;
        debugLog("Start and end date values:", { startDate, endDate, dateWarning });

        // Function to select 100 entries per page
        async function select100PerPage() {
            const sizeChanger = document.querySelector(".ant-pagination-options-size-changer");
            if (sizeChanger && sizeChanger.innerText.includes("20 / trang")) {
                debugLog("Found page size changer, switching to 100 entries per page...");
                sizeChanger.click();
                await new Promise((r) => setTimeout(r, 500));
                const dropdownItems = document.querySelectorAll(".ant-select-dropdown-menu-item");
                for (const item of dropdownItems) {
                    if (item.innerText.includes("100")) {
                        item.click();
                        await new Promise((r) => setTimeout(r, 2000)); // Wait for reload
                        debugLog("Switched to 100 entries per page.");
                        break;
                    }
                }
            }
        }

        // Function to return to the first page
        async function goToFirstPage() {
            const prevButton = document.querySelector(".ant-pagination-prev");
            if (prevButton && prevButton.classList.contains("ant-pagination-disabled") === false) {
                const firstPageButton = document.querySelector(".ant-pagination-item-1");
                if (firstPageButton && !firstPageButton.classList.contains("ant-pagination-item-active")) {
                    debugLog("Returning to the first page...");
                    firstPageButton.click();
                    await new Promise((r) => setTimeout(r, 2000)); // Wait for page load
                }
            }
        }

        // Function to calculate Xtra and Shopee commission from DOM (like old code)
        function calculateXtraAndShopeeCommission() {
            // Tính hoa hồng Xtra
            const xtraCommissionElements = document.querySelectorAll(".commission-wrap ul li");
            xtraCommissionElements.forEach((element) => {
                const xtraText = element.textContent;
                if (xtraText && xtraText.includes("Hoa hồng Xtra")) {
                    const parts = xtraText.split(":");
                    if (parts.length > 1) {
                        const commissionText = parts[1].trim();
                        const commission = parseFloat(commissionText.replace(/[₫,.]/g, "").replace(/,/g, "."));
                        if (!isNaN(commission)) {
                            xtraCommission += commission;
                            // debugLog("Found Xtra commission:", commission);
                        }
                    }
                }
            });

            // Tính hoa hồng Shopee
            const shopeeCommissionElements = document.querySelectorAll(".commission-wrap ul li");
            shopeeCommissionElements.forEach((element) => {
                const shopeeText = element.textContent;
                if (shopeeText && shopeeText.includes("Hoa hồng từ Shopee")) {
                    const parts = shopeeText.split(":");
                    if (parts.length > 1) {
                        const commissionText = parts[1].trim();
                        const commission = parseFloat(commissionText.replace(/[₫,.]/g, "").replace(/,/g, "."));
                        if (!isNaN(commission)) {
                            shopeeCommission += commission;
                            // debugLog("Found Shopee commission:", commission);
                        }
                    }
                }
            });
        }

        // Function to scrape data from the current page (theo logic code cũ)
        function scrapeCurrentPage() {
            // Calculate Xtra and Shopee commission from DOM first
            calculateXtraAndShopeeCommission();

            // Try multiple selector patterns to find order rows
            let orderRows = document.querySelectorAll(".conversion-report-table tbody tr, .conversion-report-table tr");
            if (orderRows.length === 0) {
                orderRows = document.querySelectorAll(".ant-table-tbody tr");
            }
            if (orderRows.length === 0) {
                // Try finding rows within the conversion-report-table div
                const tableContainer = document.querySelector(".conversion-report-table");
                if (tableContainer) {
                    orderRows = tableContainer.querySelectorAll("tr");
                }
            }

            debugLog(`Scraping data from ${orderRows.length} rows on the current page.`);

            if (orderRows.length === 0) {
                debugLog("Warning: No order rows found. Trying alternative selectors...");
                // Last resort: try to find any table rows
                orderRows = document.querySelectorAll("table tbody tr, table tr");
                debugLog(`Found ${orderRows.length} rows with alternative selector.`);
            }

            // Logic xử lý: nhóm các row theo Order id để cộng GMV của tất cả sản phẩm trong cùng đơn hàng
            const orderMap = new Map(); // Map để nhóm các sản phẩm theo Order id

            orderRows.forEach((row) => {
                const shopNameEl = row.querySelector(".shop-details-wrapper>ul>li>span>a");
                const productNameEl = row.querySelector(".item-details-info-wrap .item-details-info-ceils>ul>li>span>a");

                // Lấy Order id từ row (có thể ở row đầu với rowspan)
                let orderId = null;
                const orderIdEl = row.querySelector(".report-order-details-wrapper .report-table-value-text-medium");
                if (orderIdEl) {
                    orderId = orderIdEl.textContent.trim();
                } else {
                    // Nếu không có trong row này, tìm trong các row trước đó (rowspan)
                    let prevRow = row.previousElementSibling;
                    while (prevRow && !orderId) {
                        const prevOrderIdEl = prevRow.querySelector(".report-order-details-wrapper .report-table-value-text-medium");
                        if (prevOrderIdEl) {
                            orderId = prevOrderIdEl.textContent.trim();
                            break;
                        }
                        prevRow = prevRow.previousElementSibling;
                    }
                }

                // Lấy hoa hồng từ commission-top-bold (tổng hoa hồng đơn hàng) - chỉ có ở row đầu
                const commissionEl = row.querySelector("li.commission-top-bold>span");

                const itemIdEl = row.querySelector(".item-details-info-ceils>ul>li:nth-child(2) span");

                // Lấy GMV từ commission-wrap có commission-top nhưng KHÔNG có text "Hoa hồng"
                // Phải kiểm tra kỹ vì một số class tên "commission" nhưng giá trị là GMV
                let gmvEl = null;
                const commissionWraps = row.querySelectorAll(".commission-wrap");
                for (const wrap of commissionWraps) {
                    const commissionTop = wrap.querySelector(".commission-top:not(.commission-top-bold)");
                    if (commissionTop) {
                        // Kiểm tra xem có chứa text "Hoa hồng" không
                        const wrapText = wrap.textContent || "";
                        if (!wrapText.includes("Hoa hồng")) {
                            // Đây là GMV
                            gmvEl = commissionTop.querySelector("span");
                            break;
                        }
                    }
                }

                let itemId = "0";
                if (itemIdEl) {
                    const text = itemIdEl.textContent.trim();
                    const match = text.match(/Item id:\s*(\d+)/);
                    if (match && match[1]) {
                        itemId = match[1];
                    }
                }

                const liList = row.querySelectorAll("ul.report-table-ul-8 li");
                let referrer = "MXH";
                let isCanceled = false;

                // Kiểm tra trạng thái đơn hàng
                const statusElements = row.querySelectorAll("span.an-tag");
                statusElements.forEach((statusEl) => {
                    const statusText = statusEl.textContent.trim();
                    if (statusText === "Đã hủy") {
                        isCanceled = true;
                    }
                });

                // Lấy kênh - có thể ở row đầu với rowspan
                let foundReferrer = false;
                for (const li of liList) {
                    const labelEl = li.querySelector(".report-table-label-large");
                    const valueEl = li.querySelector(".report-table-value-text-large");
                    if (labelEl && valueEl && labelEl.textContent.includes("Kênh:")) {
                        referrer = valueEl.textContent.trim();
                        foundReferrer = true;
                        break;
                    }
                }

                // Nếu không tìm thấy referrer trong row này, tìm trong row trước (rowspan)
                if (!foundReferrer) {
                    let prevRow = row.previousElementSibling;
                    while (prevRow) {
                        const prevLiList = prevRow.querySelectorAll("ul.report-table-ul-8 li");
                        for (const li of prevLiList) {
                            const labelEl = li.querySelector(".report-table-label-large");
                            const valueEl = li.querySelector(".report-table-value-text-large");
                            if (labelEl && valueEl && labelEl.textContent.includes("Kênh:")) {
                                referrer = valueEl.textContent.trim();
                                foundReferrer = true;
                                break;
                            }
                        }
                        if (foundReferrer) break;
                        prevRow = prevRow.previousElementSibling;
                    }
                }

                // Lấy shop name - có thể ở row đầu với rowspan
                let shopName = null;
                if (shopNameEl) {
                    shopName = shopNameEl.textContent.trim();
                } else {
                    // Tìm trong row trước (rowspan)
                    let prevRow = row.previousElementSibling;
                    while (prevRow) {
                        const prevShopNameEl = prevRow.querySelector(".shop-details-wrapper>ul>li>span>a");
                        if (prevShopNameEl) {
                            shopName = prevShopNameEl.textContent.trim();
                            break;
                        }
                        prevRow = prevRow.previousElementSibling;
                    }
                }

                // Lấy GMV của sản phẩm này
                let gmv = 0;
                if (gmvEl) {
                    const gmvText = gmvEl.textContent.trim();
                    // Xử lý cả trường hợp có chữ "k" (nghìn)
                    let processedGmvText = gmvText.replace(/[₫,.]/g, "").replace(/,/g, ".");
                    // Xử lý trường hợp có chữ "k" (nghìn)
                    if (processedGmvText.includes("k")) {
                        processedGmvText = processedGmvText.replace("k", "");
                        gmv = parseFloat(processedGmvText) * 1000;
                    } else {
                        gmv = parseFloat(processedGmvText);
                    }
                    if (!isNaN(gmv)) {
                        debugLog(`GMV found for item ${itemId}: ${gmv}`);
                    }
                }

                // Lấy hoa hồng tổng đơn hàng (chỉ có ở row đầu)
                let totalCommission = 0;
                if (commissionEl) {
                    totalCommission = parseFloat(commissionEl.textContent.replace(/[₫,.]/g, "").replace(/,/g, "."));
                } else {
                    // Tìm trong row trước (rowspan)
                    let prevRow = row.previousElementSibling;
                    while (prevRow) {
                        const prevCommissionEl = prevRow.querySelector("li.commission-top-bold>span");
                        if (prevCommissionEl) {
                            totalCommission = parseFloat(prevCommissionEl.textContent.replace(/[₫,.]/g, "").replace(/,/g, "."));
                            break;
                        }
                        prevRow = prevRow.previousElementSibling;
                    }
                }

                // Chỉ xử lý nếu có sản phẩm
                if (productNameEl && shopName) {
                    // Sử dụng Order id làm key, nếu không có thì dùng itemId
                    const key = orderId || `item_${itemId}`;

                    if (!orderMap.has(key)) {
                        orderMap.set(key, {
                            orderId: orderId,
                            shopName: shopName,
                            referrer: referrer,
                            totalCommission: totalCommission,
                            items: [],
                            totalGMV: 0,
                        });
                    }

                    const orderData = orderMap.get(key);

                    // Thêm sản phẩm vào order
                    orderData.items.push({
                        shop_name: shopName,
                        item_name: productNameEl.textContent.trim(),
                        item_commission: totalCommission, // Sử dụng tổng hoa hồng đơn hàng
                        item_id: itemId,
                        referrer: referrer,
                        item_gmv: gmv, // GMV của từng sản phẩm
                    });

                    // Cộng GMV vào tổng GMV của order
                    orderData.totalGMV += gmv;

                    debugLog(`Added item ${itemId} to order ${key}, gmv: ${gmv}, totalGMV: ${orderData.totalGMV}`);
                }
            });

            // Chuyển đổi Map thành mảng orders
            orderMap.forEach((orderData) => {
                // Cập nhật GMV cho tất cả items trong order (sử dụng tổng GMV)
                orderData.items.forEach((item) => {
                    item.item_gmv = orderData.totalGMV;
                });

                allOrders.push({
                    orders: [
                        {
                            items: orderData.items,
                        },
                    ],
                });

                debugLog(`Order ${orderData.orderId || "unknown"}: ${orderData.items.length} items, totalGMV: ${orderData.totalGMV}`);
            });
        }

        // Function to process orders data (inline version for injected script) - theo logic code cũ
        function processOrdersDataInline(orders, xtraComm, shopeeComm) {
            let totalCommission = 0;
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

            // Xử lý từng order - như code cũ
            orders.forEach((orderData) => {
                // Hỗ trợ cả format từ DOM scraping và API
                const ordersList = orderData.orders || (orderData.list ? orderData.list.flatMap((item) => item.orders || []) : []);

                ordersList.forEach((order) => {
                    const items = order.items || [];

                    if (items.length === 0) return;

                    // Lấy GMV và commission từ item đầu tiên (vì tất cả items trong cùng order đã có cùng giá trị = tổng của order)
                    const firstItem = items[0];
                    const orderGMV = parseFloat(firstItem.item_gmv || firstItem.actual_amount || firstItem.item_price || 0);
                    const orderCommission = parseFloat(firstItem.item_commission || 0);
                    const referrer = firstItem.referrer || orderData.referrer || "MXH";

                    totalGMV += orderGMV; // Chỉ cộng một lần cho mỗi order
                    totalCommission += orderCommission; // Chỉ cộng một lần cho mỗi order

                    debugLog(`Order: ${items.length} items, GMV: ${orderGMV}, Commission: ${orderCommission}`);

                    // Phân loại hoa hồng theo kênh
                    if (referrer.includes("Shopeevideo") || referrer.includes("Shopeevideo-Shopee")) {
                        videoCommission += orderCommission;
                    } else if (referrer.includes("Shopeelive") || referrer.includes("Shopeelive-Shopee")) {
                        liveCommission += orderCommission;
                    } else {
                        socialCommission += orderCommission;
                    }

                    // Kiểm tra hoa hồng 0đ
                    if (orderCommission === 0) {
                        zeroCommissionOrders++;
                        zeroCommission += orderCommission;
                    }

                    // Kiểm tra trạng thái đơn hàng
                    const orderStatus = order.order_status || orderData.checkout_status || "";
                    if (orderStatus === "CANCELED" || orderStatus === "Canceled" || order.cancel_reason) {
                        canceledCommission += orderCommission;
                    }

                    totalOrders++;
                });
            });

            // Đếm orders theo kênh và trạng thái - như code cũ
            orders.forEach((orderData) => {
                const ordersList = orderData.orders || (orderData.list ? orderData.list.flatMap((item) => item.orders || []) : []);
                ordersList.forEach((order) => {
                    const items = order.items || [];
                    if (items.length > 0) {
                        const referrer = items[0].referrer || orderData.referrer || "MXH";
                        const orderStatus = order.order_status || orderData.checkout_status || "";

                        if (referrer.includes("Shopeevideo") || referrer.includes("Shopeevideo-Shopee")) {
                            videoOrders++;
                        } else if (referrer.includes("Shopeelive") || referrer.includes("Shopeelive-Shopee")) {
                            liveOrders++;
                        }

                        if (orderStatus === "CANCELED" || orderStatus === "Canceled" || order.cancel_reason) {
                            canceledOrders++;
                        } else if (orderStatus === "UNPAID" || orderStatus === "Pending") {
                            unpaidOrders++;
                        }
                    }
                });
            });

            // Tính socialOrders như code cũ: totalOrders - videoOrders - liveOrders
            socialOrders = totalOrders - videoOrders - liveOrders;

            // Format kết quả - sử dụng xtraComm và shopeeComm từ DOM scraping - như code cũ
            return {
                totalCommission: totalCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                totalGMV: totalGMV.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                videoCommission: videoCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                liveCommission: liveCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                socialCommission: socialCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                canceledCommission: canceledCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                zeroCommission: zeroCommission.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                xtraCommission: (xtraComm / 2).toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                shopeeCommission: (shopeeComm / 2).toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                totalOrders: `${totalOrders - canceledOrders / 2 - unpaidOrders / 2} (${totalOrders} - <span class="badge bg-secondary">${unpaidOrders / 2}</span> - <span class="badge bg-danger">${canceledOrders / 2}</span>)`,
                canceledOrders: canceledOrders / 2,
                unpaidOrders: unpaidOrders / 2,
                videoOrders: videoOrders, // KHÔNG chia cho 2
                liveOrders: liveOrders, // KHÔNG chia cho 2
                socialOrders: socialOrders, // KHÔNG chia cho 2 - tính từ totalOrders
                zeroCommissionOrders: zeroCommissionOrders, // KHÔNG chia cho 2
            };
        }

        // Function to move to the next page and process
        async function processNextPage() {
            try {
                const nextPageButton = document.querySelector(".ant-pagination-next");

                if (nextPageButton && !nextPageButton.classList.contains("ant-pagination-disabled")) {
                    nextPageButton.click();
                    debugLog("Moving to the next page...");
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                    scrapeCurrentPage(); // Scrape data for the current page
                    return await processNextPage(); // Recursive call for subsequent pages - ensure await
                } else {
                    debugLog("Reached the last page. Total orders scraped: " + allOrders.length);
                    debugLog("Total Xtra commission scraped: " + xtraCommission);
                    debugLog("Total Shopee commission scraped: " + shopeeCommission);
                    const calculatedResults = processOrdersDataInline(allOrders, xtraCommission, shopeeCommission);
                    debugLog("Calculated results:", calculatedResults);
                    return {
                        ...calculatedResults,
                        startDate: startDate,
                        endDate: endDate,
                        dateWarning: dateWarning,
                        allOrders: allOrders,
                    };
                }
            } catch (error) {
                debugLog("Error in processNextPage:", error);
                // Return a valid result even if there's an error
                const calculatedResults = processOrdersDataInline(allOrders, xtraCommission, shopeeCommission);
                return {
                    ...calculatedResults,
                    startDate: startDate,
                    endDate: endDate,
                    dateWarning: dateWarning,
                    allOrders: allOrders,
                    error: true,
                    message: error.message || "Error processing pages",
                };
            }
        }

        await select100PerPage(); // Set 100 entries per page
        await goToFirstPage(); // Return to the first page
        scrapeCurrentPage(); // Scrape data for the first page
        debugLog("After first page scrape, allOrders length: " + allOrders.length);

        const result = await processNextPage(); // Process subsequent pages
        debugLog("Final result:", result);

        // Ensure we always return a valid object
        if (!result || typeof result !== "object") {
            debugLog("Warning: processNextPage returned invalid result, creating default");
            const calculatedResults = processOrdersDataInline(allOrders, xtraCommission, shopeeCommission);
            return {
                ...calculatedResults,
                startDate: startDate,
                endDate: endDate,
                dateWarning: dateWarning,
                allOrders: allOrders,
            };
        }

        return result;
    } catch (error) {
        console.error("Error in calculateAllPages:", error);
        return {
            error: true,
            message: error.message || "An error occurred during calculation",
            totalCommission: "0 ₫",
            xtraCommission: "0 ₫",
            shopeeCommission: "0 ₫",
            totalGMV: "0 ₫",
            totalOrders: "0",
            canceledOrders: 0,
            unpaidOrders: 0,
            videoOrders: 0,
            liveOrders: 0,
            socialOrders: 0,
            zeroCommissionOrders: 0,
            videoCommission: "0 ₫",
            liveCommission: "0 ₫",
            socialCommission: "0 ₫",
            canceledCommission: "0 ₫",
            zeroCommission: "0 ₫",
            startDate: "",
            endDate: "",
            dateWarning: false,
            allOrders: [],
        };
    }
}
