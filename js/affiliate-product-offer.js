// Content script cho trang Product Offer trên Affiliate Shopee
(function () {
    "use strict";

    const TARGET_API_URL = "/api/v3/offer/product";
    let collectedData = null;
    let itemId = null;
    let uiRendered = false;

    // ================== UTILITY FUNCTIONS ==================

    /**
     * Lấy item_id từ URL
     * Pattern: https://affiliate.shopee.vn/offer/product_offer/{item_id}?trace=
     */
    function getItemIdFromUrl() {
        const url = new URL(window.location.href);
        const pathParts = url.pathname.split("/");
        const productOfferIndex = pathParts.indexOf("product_offer");

        if (productOfferIndex !== -1 && pathParts[productOfferIndex + 1]) {
            return pathParts[productOfferIndex + 1];
        }

        return null;
    }

    /**
     * Format số tiền VND
     */
    function formatVND(amount) {
        if (!amount) return "0 ₫";

        // Nếu là string chứa "₫", trả về nguyên bản
        if (typeof amount === "string" && amount.includes("₫")) {
            return amount;
        }

        // Nếu là số dạng string (ví dụ: "89900000000")
        let num = typeof amount === "string" ? parseInt(amount) : amount;
        if (isNaN(num)) return "0 ₫";

        // Chia cho 100000 vì giá có thể là giá * 100000
        if (num > 1000000) {
            num = num / 100000;
        }

        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
        }).format(num);
    }

    /**
     * Format timestamp thành ngày giờ
     */
    function formatTimestamp(timestamp) {
        if (!timestamp) return "N/A";
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    /**
     * Copy text to clipboard
     */
    function copyToClipboard(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand("copy");
            return true;
        } catch (err) {
            console.error("Failed to copy:", err);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }

    /**
     * Tạo badge cho rate
     */
    function getRateBadgeClass(value) {
        const numValue = typeof value === "string" ? parseFloat(value.replace("%", "")) : value;
        if (numValue >= 7) return "primary";
        if (numValue >= 5) return "success";
        return "warning";
    }

    /**
     * Lấy image URL từ image ID
     */
    function getImageUrl(imageId) {
        if (!imageId) return "";
        return `https://cf.shopee.vn/file/${imageId}`;
    }

    /**
     * Map channel ID sang tên kênh
     */
    function getChannelName(channelId) {
        const channelMap = {
            1: "Social Media",
            2: "Shopee Video",
            3: "Live Streaming",
        };
        return channelMap[channelId] || `Kênh ${channelId}`;
    }

    /**
     * Format duration từ giây sang MM:SS
     */
    function formatDuration(seconds) {
        if (!seconds) return "N/A";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    /**
     * Lấy video thumbnail URL từ thumb ID
     */
    function getVideoThumbnailUrl(thumbId) {
        if (!thumbId) return "";
        return `https://cf.shopee.vn/file/${thumbId}`;
    }

    /**
     * Tạo HTML cho danh sách video
     */
    function generateVideoListHTML(videoList) {
        if (!videoList || !Array.isArray(videoList) || videoList.length === 0) {
            return '<div style="color: #999; font-size: 13px;">Không có video</div>';
        }

        let html = '<div class="affiliate-video-list">';
        videoList.forEach((video, index) => {
            const thumbnailUrl = video.thumb_url ? getVideoThumbnailUrl(video.thumb_url) : "";
            const duration = video.duration ? formatDuration(video.duration) : "N/A";
            const format = video.default_format?.defn || "N/A";
            const videoUrl = video.default_format?.url || video.formats?.[0]?.url || "";

            html += `
                <div class="affiliate-video-item">
                    ${
                        thumbnailUrl
                            ? `
                    <div class="affiliate-video-thumbnail-wrapper">
                        <img src="${thumbnailUrl}" alt="Video ${index + 1}" class="affiliate-video-thumbnail" />
                        <div class="affiliate-video-duration">${duration}</div>
                    </div>
                    `
                            : ""
                    }
                    <div class="affiliate-video-info">
                        <div class="affiliate-video-title">Video ${index + 1}</div>
                        <div class="affiliate-video-meta">
                            <span>⏱️ ${duration}</span>
                            <span>📹 ${format}</span>
                        </div>
                        ${
                            videoUrl
                                ? `
                        <a href="${videoUrl}" target="_blank" class="affiliate-video-link">Xem video</a>
                        `
                                : ""
                        }
                    </div>
                </div>
            `;
        });
        html += "</div>";
        return html;
    }

    /**
     * Tính hoa hồng từ commission rate và giá
     */
    function calculateCommission(price, commissionRate) {
        if (!price || !commissionRate) return null;

        // Parse price (có thể là số hoặc string)
        let priceNum = typeof price === "string" ? parseInt(price) : price;
        if (isNaN(priceNum)) return null;

        // Nếu giá quá lớn, chia cho 100000
        if (priceNum > 1000000) {
            priceNum = priceNum / 100000;
        }

        // Parse commission rate (có thể là "7%" hoặc số)
        let rateNum = 0;
        if (typeof commissionRate === "string") {
            rateNum = parseFloat(commissionRate.replace("%", "")) || 0;
        } else {
            // Nếu là số (ví dụ: 7000 = 7%)
            rateNum = commissionRate > 100 ? commissionRate / 100 : commissionRate;
        }

        if (rateNum === 0) return null;

        const commission = (priceNum * rateNum) / 100;
        return formatVND(commission);
    }

    /**
     * Tính điểm chất lượng sản phẩm để highlight
     */
    function calculateProductScore(item, currentPrice) {
        let score = 0;
        const product = item.batch_item_for_item_card_full || {};

        // Điểm hoa hồng (0-3 điểm)
        const commissionRate = item.default_commission_rate || item.seller_commission_rate || "0%";
        const rateNum = typeof commissionRate === "string" ? parseFloat(commissionRate.replace("%", "")) : commissionRate > 100 ? commissionRate / 100 : commissionRate;
        if (rateNum >= 7) score += 3;
        else if (rateNum >= 5) score += 2;
        else if (rateNum >= 3) score += 1;

        // Điểm giá (0-2 điểm) - giá thấp hơn sản phẩm hiện tại
        if (currentPrice && product.price) {
            let itemPrice = typeof product.price === "string" ? parseInt(product.price) : product.price;
            let currentPriceNum = typeof currentPrice === "string" ? parseInt(currentPrice) : currentPrice;

            if (itemPrice > 1000000) itemPrice = itemPrice / 100000;
            if (currentPriceNum > 1000000) currentPriceNum = currentPriceNum / 100000;

            if (itemPrice < currentPriceNum * 0.9) score += 2; // Rẻ hơn 10%
            else if (itemPrice < currentPriceNum) score += 1; // Rẻ hơn
        }

        // Điểm đánh giá (0-2 điểm)
        const rating = product.item_rating?.rating_star || 0;
        if (rating >= 4.8) score += 2;
        else if (rating >= 4.5) score += 1;

        // Điểm số lượng đánh giá (0-1 điểm)
        const cmtCount = product.cmt_count || 0;
        if (cmtCount >= 500) score += 1;

        // Điểm số lượt thích (0-1 điểm)
        const likedCount = product.liked_count || 0;
        if (likedCount >= 1000) score += 1;

        return score;
    }

    /**
     * Tạo HTML cho danh sách sản phẩm tương tự
     */
    function generateSimilarProductsHTML(similarProducts, currentProductData) {
        if (!similarProducts || !similarProducts.list || !Array.isArray(similarProducts.list) || similarProducts.list.length === 0) {
            return '<div style="color: #999; font-size: 13px;">Không có sản phẩm tương tự</div>';
        }

        // Lấy giá sản phẩm hiện tại để so sánh
        const currentProduct = currentProductData?.batch_item_for_item_card_full || {};
        const currentPrice = currentProduct.price;

        let html = '<div class="affiliate-similar-products-grid">';
        similarProducts.list.forEach((item, index) => {
            const product = item.batch_item_for_item_card_full || {};
            const imageUrl = product.image ? getImageUrl(product.image) : "";
            const productName = product.name || "N/A";

            // Parse giá
            let itemPrice = product.price;
            let itemPriceNum = typeof itemPrice === "string" ? parseInt(itemPrice) : itemPrice;
            if (itemPriceNum > 1000000) itemPriceNum = itemPriceNum / 100000;
            const price = formatVND(product.price);

            // Tính hoa hồng
            let commission = item.commission;
            if (!commission || commission === "N/A") {
                // Tính từ seller_commission_rate hoặc default_commission_rate
                const commissionRate = item.seller_commission_rate || item.default_commission_rate;
                commission = calculateCommission(product.price, commissionRate);
            }
            if (!commission) commission = "N/A";

            // Lấy commission rate
            const commissionRate = item.default_commission_rate || item.seller_commission_rate || "N/A";

            // So sánh giá
            let priceComparison = "";
            if (currentPrice && product.price) {
                let currentPriceNum = typeof currentPrice === "string" ? parseInt(currentPrice) : currentPrice;
                if (currentPriceNum > 1000000) currentPriceNum = currentPriceNum / 100000;

                const diff = ((itemPriceNum - currentPriceNum) / currentPriceNum) * 100;
                if (diff < -5) {
                    priceComparison = `<span class="affiliate-price-comparison lower">↓ Rẻ hơn ${Math.abs(diff).toFixed(0)}%</span>`;
                } else if (diff > 5) {
                    priceComparison = `<span class="affiliate-price-comparison higher">↑ Đắt hơn ${diff.toFixed(0)}%</span>`;
                } else {
                    priceComparison = `<span class="affiliate-price-comparison same">≈ Tương đương</span>`;
                }
            }

            // Tính điểm để highlight
            const score = calculateProductScore(item, currentPrice);
            const isRecommended = score >= 6; // Sản phẩm tốt nếu điểm >= 6

            const longLink = item.long_link || "";
            const productLink = item.product_link || "";
            const productOfferLink = `https://affiliate.shopee.vn/offer/product_offer/${item.item_id}`;

            // Lấy các thông tin bổ sung
            const soldText = product.sold_text || "";
            const historicalSoldText = product.historical_sold_text || "";
            const likedCount = product.liked_count || 0;
            const discount = product.discount || "";
            const rating = product.item_rating?.rating_star || 0;
            const cmtCount = product.cmt_count || 0;

            html += `
                <div class="affiliate-similar-product-card ${isRecommended ? "recommended" : ""}">
                    ${isRecommended ? '<div class="affiliate-recommended-badge">⭐ Đề xuất</div>' : ""}
                    ${
                        imageUrl
                            ? `
                    <div class="affiliate-similar-product-image-wrapper">
                        <img src="${imageUrl}" alt="${productName}" class="affiliate-similar-product-image" />
                        ${discount ? `<div class="affiliate-similar-product-discount">-${discount}</div>` : ""}
                    </div>
                    `
                            : ""
                    }
                    <div class="affiliate-similar-product-info">
                        <div class="affiliate-similar-product-name" title="${productName}">${productName}</div>
                        <div class="affiliate-similar-product-price-row">
                            <span class="affiliate-similar-product-price">${price}</span>
                            ${priceComparison}
                        </div>
                        <div class="affiliate-similar-product-meta">
                            ${
                                rating > 0
                                    ? `
                            <div class="affiliate-similar-product-meta-item">
                                <span>⭐</span>
                                <span>${rating.toFixed(1)}</span>
                                ${cmtCount > 0 ? `<span>(${cmtCount})</span>` : ""}
                            </div>
                            `
                                    : ""
                            }
                            ${
                                likedCount > 0
                                    ? `
                            <div class="affiliate-similar-product-meta-item">
                                <span>❤️</span>
                                <span>${likedCount.toLocaleString("vi-VN")}</span>
                            </div>
                            `
                                    : ""
                            }
                            ${
                                soldText
                                    ? `
                            <div class="affiliate-similar-product-meta-item">
                                <span>🛒</span>
                                <span>${soldText}</span>
                            </div>
                            `
                                    : ""
                            }
                            ${
                                historicalSoldText
                                    ? `
                            <div class="affiliate-similar-product-meta-item">
                                <span>📈</span>
                                <span>${historicalSoldText}</span>
                            </div>
                            `
                                    : ""
                            }
                        </div>
                        <div class="affiliate-similar-product-commission">
                            <span class="affiliate-similar-product-commission-label">Hoa hồng:</span>
                            <span class="affiliate-similar-product-commission-value">${commission}</span>
                            <span class="affiliate-similar-product-rate">
                                <span class="affiliate-rate-badge ${getRateBadgeClass(commissionRate)}">${commissionRate}</span>
                            </span>
                        </div>
                        ${
                            longLink
                                ? `
                        <div class="affiliate-similar-product-actions">
                            <button class="affiliate-link-btn" data-copy="similar-long-link-${index}" style="font-size: 0.7rem; padding: 0.4rem 0.8rem;">Copy Link</button>
                            <input type="hidden" id="similar-long-link-${index}" value="${longLink}" />
                            <a href="${productOfferLink}" target="_blank" rel="noopener noreferrer" class="affiliate-product-direct-link-btn" style="font-size: 0.75rem; margin-left: 8px; padding: 0.4rem 0.8rem; text-decoration: none; color: #fff; background: #007aff; border: none; border-radius: 4px; display: inline-block;">Xem</a>
                        </div>
                        `
                                : ""
                        }
                    </div>
                </div>
            `;
        });
        html += "</div>";
        return html;
    }

    // ================== UI RENDERING ==================

    /**
     * Render UI chính
     */
    function renderProductOfferUI(data) {
        if (uiRendered || !data) return;

        // Tìm element có class product-offer-details
        let targetElement = document.querySelector(".product-offer-details");

        // Nếu không tìm thấy, thử các selector khác
        if (!targetElement) {
            // Thử tìm container chứa product offer
            targetElement = document.querySelector('[class*="product-offer"]') || document.querySelector('[class*="offer"]') || document.querySelector("main") || document.querySelector(".container") || document.body;
            console.log("[Affiliate Offer] Không tìm thấy .product-offer-details, sử dụng element khác:", targetElement);
        }

        if (!targetElement) {
            console.log("[Affiliate Offer] Không tìm thấy element phù hợp, đợi...");
            let retryCount = 0;
            const maxRetries = 10;
            const retryInterval = setInterval(() => {
                retryCount++;
                const element = document.querySelector(".product-offer-details") || document.querySelector("main") || document.querySelector(".container") || document.body;
                if (element || retryCount >= maxRetries) {
                    clearInterval(retryInterval);
                    if (element) {
                        renderProductOfferUI(data);
                    } else {
                        console.error("[Affiliate Offer] Không thể tìm thấy element sau nhiều lần thử");
                    }
                }
            }, 500);
            return;
        }

        uiRendered = true;
        collectedData = data;

        const wrapper = document.createElement("div");
        wrapper.className = "affiliate-product-offer-wrapper";
        wrapper.innerHTML = generateUIHTML(data);

        // Chèn sau targetElement hoặc vào cuối nếu không có nextSibling
        if (targetElement.nextSibling) {
            targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);
        } else {
            targetElement.parentNode.appendChild(wrapper);
        }

        // Gắn event listeners
        attachEventListeners(wrapper, data);

        console.log("[Affiliate Offer] Đã render UI thành công");
    }

    /**
     * Tạo HTML cho UI
     */
    function generateUIHTML(data) {
        const product = data.batch_item_for_item_card_full || {};
        const commissionRate = data.commission_rate || {};
        const commissionDetail = data.commission_rate_detail || {};

        return `
            <!-- Product Info Card -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>📦</span>
                    <span>Thông tin Sản phẩm</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-product-info">
                        ${
                            product.image
                                ? `
                        <img src="${getImageUrl(product.image)}" alt="${product.name || ""}" class="affiliate-product-image" />
                        `
                                : ""
                        }
                        <div class="affiliate-product-details">
                            <div class="affiliate-product-name">${product.name || "N/A"}</div>
                            <div class="affiliate-product-price-row">
                                <span class="affiliate-product-price">${formatVND(product.price)}</span>
                                ${
                                    product.price_before_discount
                                        ? `
                                <span class="affiliate-product-original-price">${formatVND(product.price_before_discount)}</span>
                                `
                                        : ""
                                }
                                ${
                                    product.discount
                                        ? `
                                <span class="affiliate-product-discount">-${product.discount}</span>
                                `
                                        : ""
                                }
                            </div>
                            <div class="affiliate-product-meta">
                                ${
                                    product.stock !== undefined
                                        ? `
                                <div class="affiliate-product-meta-item">
                                    <span>📦</span>
                                    <span>Tồn kho: <strong>${product.stock.toLocaleString("vi-VN")}</strong></span>
                                </div>
                                `
                                        : ""
                                }
                                ${
                                    product.sold !== undefined
                                        ? `
                                <div class="affiliate-product-meta-item">
                                    <span>🛒</span>
                                    <span>Đã bán 30 ngày qua: <strong>${product.sold}</strong></span>
                                </div>
                                `
                                        : ""
                                }
                                ${
                                    product.historical_sold_text
                                        ? `
                                <div class="affiliate-product-meta-item">
                                    <span>📈</span>
                                    <span>Lịch sử: <strong>${product.historical_sold_text}</strong></span>
                                </div>
                                `
                                        : ""
                                }
                                ${
                                    product.cmt_count !== undefined
                                        ? `
                                <div class="affiliate-product-meta-item">
                                    <span>💬</span>
                                    <span>Đánh giá: <strong>${product.cmt_count}</strong></span>
                                </div>
                                `
                                        : ""
                                }
                                ${
                                    product.liked_count !== undefined
                                        ? `
                                <div class="affiliate-product-meta-item">
                                    <span>❤️</span>
                                    <span>Yêu thích: <strong>${product.liked_count.toLocaleString("vi-VN")}</strong></span>
                                </div>
                                `
                                        : ""
                                }
                            </div>
                            ${
                                product.voucher_info
                                    ? `
                            <div class="affiliate-voucher-badge">
                                <span>🎫</span>
                                <span><strong>${product.voucher_info.voucher_code || ""}</strong> - ${product.voucher_info.label || ""}</span>
                            </div>
                            `
                                    : ""
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Overview Card -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>💰</span>
                    <span>Thông tin Hoa hồng & Sản phẩm</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-offer-grid">
                        ${
                            data.most_used_channel !== undefined
                                ? `
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Kênh ra đơn nhiều nhất</div>
                            <div class="affiliate-offer-stat-value secondary">${getChannelName(data.most_used_channel)}</div>
                        </div>
                        `
                                : ""
                        }
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Hoa hồng</div>
                            <div class="affiliate-offer-stat-value">${data.commission || "N/A"}</div>
                        </div>
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Tỷ lệ mặc định</div>
                            <div class="affiliate-offer-stat-value">${commissionRate.default_commission_rate || "N/A"}</div>
                        </div>
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Hoa hồng Shopee</div>
                            <div class="affiliate-offer-stat-value secondary">${commissionRate.shopee_commission || "N/A"}</div>
                        </div>
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Hoa hồng Seller</div>
                            <div class="affiliate-offer-stat-value secondary">${commissionRate.seller_commission || "N/A"}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Similar Products -->
            ${
                data.similar_product_offers && data.similar_product_offers.list && data.similar_product_offers.list.length > 0
                    ? `
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>🛍️</span>
                    <span>Sản phẩm Tương tự</span>
                </div>
                <div class="affiliate-offer-card-body">
                    ${generateSimilarProductsHTML(data.similar_product_offers, data)}
                </div>
            </div>
            `
                    : ""
            }
            
            <!-- Video List -->
            ${
                product.video_info_list && product.video_info_list.length > 0
                    ? `
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>🎥</span>
                    <span>Video Sản phẩm</span>
                </div>
                <div class="affiliate-offer-card-body">
                    ${generateVideoListHTML(product.video_info_list)}
                </div>
            </div>
            `
                    : ""
            }

            <!-- Links Section -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>🔗</span>
                    <span>Links Tiếp thị</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-links-section">
                        ${
                            data.long_link
                                ? `
                        <div class="affiliate-link-label">Long Link</div>
                        <div class="affiliate-link-item">
                            <input type="text" class="affiliate-link-input" value="${data.long_link}" readonly id="affiliate-long-link" />
                            <button class="affiliate-link-btn" data-copy="affiliate-long-link">Copy</button>
                        </div>
                        `
                                : ""
                        }
                        ${
                            data.productLink
                                ? `
                        <div class="affiliate-link-label">Product Link</div>
                        <div class="affiliate-link-item">
                            <input type="text" class="affiliate-link-input" value="${data.productLink}" readonly id="affiliate-product-link" />
                            <button class="affiliate-link-btn secondary" onclick="window.open('${data.productLink}', '_blank')">Mở</button>
                            <button class="affiliate-link-btn" data-copy="affiliate-product-link">Copy</button>
                        </div>
                        `
                                : ""
                        }
                    </div>
                </div>
            </div>

            <!-- Commission Rates Table -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>📊</span>
                    <span>Chi tiết Tỷ lệ Hoa hồng</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <table class="affiliate-commission-table">
                        <thead>
                            <tr>
                                <th>Loại</th>
                                <th>Tỷ lệ</th>
                                <th>Hoa hồng</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Web - User mới</td>
                                <td><span class="affiliate-rate-badge ${getRateBadgeClass(commissionRate.web_new_commission_rate)}">${commissionRate.web_new_commission_rate || "N/A"}</span></td>
                                <td>${commissionRate.web_new_commission || "N/A"}</td>
                            </tr>
                            <tr>
                                <td>Web - User cũ</td>
                                <td><span class="affiliate-rate-badge ${getRateBadgeClass(commissionRate.web_exist_commission_rate)}">${commissionRate.web_exist_commission_rate || "N/A"}</span></td>
                                <td>${commissionRate.web_exist_commission || "N/A"}</td>
                            </tr>
                            <tr>
                                <td>App - User mới</td>
                                <td><span class="affiliate-rate-badge ${getRateBadgeClass(commissionRate.app_new_commission_rate)}">${commissionRate.app_new_commission_rate || "N/A"}</span></td>
                                <td>${commissionRate.app_new_commission || "N/A"}</td>
                            </tr>
                            <tr>
                                <td>App - User cũ</td>
                                <td><span class="affiliate-rate-badge ${getRateBadgeClass(commissionRate.app_exist_commission_rate)}">${commissionRate.app_exist_commission_rate || "N/A"}</span></td>
                                <td>${commissionRate.app_exist_commission || "N/A"}</td>
                            </tr>
                            <tr>
                                <td>Platform - User mới</td>
                                <td><span class="affiliate-rate-badge ${getRateBadgeClass(commissionRate.new_platform_commission_rate)}">${commissionRate.new_platform_commission_rate || "N/A"}</span></td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td>Platform - User cũ</td>
                                <td><span class="affiliate-rate-badge ${getRateBadgeClass(commissionRate.exist_platform_commission_rate)}">${commissionRate.exist_platform_commission_rate || "N/A"}</span></td>
                                <td>-</td>
                            </tr>
                            ${
                                commissionRate.commission_cap
                                    ? `
                            <tr>
                                <td colspan="2"><strong>Giới hạn hoa hồng</strong></td>
                                <td><strong>${commissionRate.commission_cap}</strong></td>
                            </tr>
                            `
                                    : ""
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Commission Details by Channel -->
            ${
                commissionRate.shopee_commission_detail
                    ? `
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>📱</span>
                    <span>Hoa hồng theo Kênh</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-channel-section">
                        <div class="affiliate-channel-grid">
                            ${generateChannelCards(commissionRate.shopee_commission_detail)}
                        </div>
                    </div>
                </div>
            </div>
            `
                    : ""
            }

            <!-- Period Time -->
            ${
                data.period_start_time && data.period_end_time
                    ? `
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>⏰</span>
                    <span>Thời gian hiệu lực</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-period-info">
                        <div class="affiliate-period-label">Bắt đầu</div>
                        <div class="affiliate-period-value">${formatTimestamp(data.period_start_time)}</div>
                        <div class="affiliate-period-label" style="margin-top: 8px;">Kết thúc</div>
                        <div class="affiliate-period-value">${formatTimestamp(data.period_end_time)}</div>
                    </div>
                </div>
            </div>
            `
                    : ""
            }

        `;
    }

    /**
     * Tạo channel cards
     */
    function generateChannelCards(commissionDetail) {
        const channels = {
            "Shopee Video - Item Base - User mới": commissionDetail.shopee_video_item_base_new_commission_rate,
            "Shopee Video - Item Base - User cũ": commissionDetail.shopee_video_item_base_exist_commission_rate,
            "Shopee Video - Shop Base - User mới": commissionDetail.shopee_video_shop_base_new_commission_rate,
            "Shopee Video - Shop Base - User cũ": commissionDetail.shopee_video_shop_base_exist_commission_rate,
            "Live Streaming - Item Base - User mới": commissionDetail.live_streaming_item_base_new_commission_rate,
            "Live Streaming - Item Base - User cũ": commissionDetail.live_streaming_item_base_exist_commission_rate,
            "Live Streaming - Shop Base - User mới": commissionDetail.live_streaming_shop_base_new_commission_rate,
            "Live Streaming - Shop Base - User cũ": commissionDetail.live_streaming_shop_base_exist_commission_rate,
            "Social Media - Item Base - User mới": commissionDetail.social_media_item_base_new_commission_rate,
            "Social Media - Item Base - User cũ": commissionDetail.social_media_item_base_exist_commission_rate,
            "Social Media - Shop Base - User mới": commissionDetail.social_media_shop_base_new_commission_rate,
            "Social Media - Shop Base - User cũ": commissionDetail.social_media_shop_base_exist_commission_rate,
            "Social Media - Checkout Base - User mới": commissionDetail.social_media_check_out_base_new_commission_rate,
            "Social Media - Checkout Base - User cũ": commissionDetail.social_media_check_out_base_exist_commission_rate,
        };

        let html = "";
        for (const [label, rate] of Object.entries(channels)) {
            if (rate && rate !== "0%" && rate !== 0) {
                html += `
                    <div class="affiliate-channel-card">
                        <div class="affiliate-channel-title">
                            ${getChannelIcon(label)} ${label}
                        </div>
                        <div class="affiliate-channel-rate">${rate}</div>
                    </div>
                `;
            }
        }

        return html || '<div style="color: #999; font-size: 13px;">Không có dữ liệu</div>';
    }

    /**
     * Lấy icon cho channel
     */
    function getChannelIcon(label) {
        if (label.includes("Shopee Video")) return "🎥";
        if (label.includes("Live Streaming")) return "📺";
        if (label.includes("Social Media")) return "📱";
        return "📊";
    }

    /**
     * Gắn event listeners
     */
    function attachEventListeners(wrapper, data) {
        // Copy buttons
        wrapper.querySelectorAll("[data-copy]").forEach((btn) => {
            btn.addEventListener("click", function () {
                const inputId = this.getAttribute("data-copy");
                const input = document.getElementById(inputId);
                if (input && copyToClipboard(input.value)) {
                    const originalText = this.textContent;
                    this.textContent = "✓ Đã copy!";
                    this.style.background = "#28a745";
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.style.background = "";
                    }, 2000);
                }
            });
        });
    }

    // ================== SCRIPT INJECTION ==================

    /**
     * Tiêm injected script vào trang web (main world)
     */
    function injectScript() {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("js/injected-product-offer.js");
        script.onload = function () {
            console.log("[Affiliate Offer] injected-product-offer.js loaded.");
            this.remove(); // Xóa thẻ script sau khi đã tải xong
        };
        script.onerror = function () {
            console.error("[Affiliate Offer] Failed to load injected-product-offer.js");
        };
        (document.head || document.documentElement).appendChild(script);
    }

    /**
     * Xử lý dữ liệu nhận được từ injected script
     */
    function handleProductOfferData(data) {
        if (!data) return;

        console.log("[Affiliate Offer] Đã nhận được dữ liệu product offer từ injected script:", data);

        // Lưu dữ liệu vào biến toàn cục để sử dụng sau này
        window.SHOPEE_PRODUCT_OFFER_DATA = data;
        collectedData = data;

        // Đợi DOM sẵn sàng trước khi render
        const tryRender = () => {
            if (document.body) {
                renderProductOfferUI(data);
            } else {
                setTimeout(tryRender, 100);
            }
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", tryRender);
        } else {
            // Nếu DOM đã sẵn sàng, đợi một chút để đảm bảo element tồn tại
            setTimeout(tryRender, 500);
        }
    }

    /**
     * Lắng nghe message từ injected script
     */
    function setupMessageListener() {
        window.addEventListener("message", function (event) {
            // Chỉ xử lý tin nhắn từ chính trang web hiện tại
            if (event.source !== window) return;

            // Kiểm tra nếu là tin nhắn chứa dữ liệu chúng ta cần
            if (event.data.type && event.data.type === "SHOPEE_PRODUCT_OFFER_DATA") {
                console.log("[Affiliate Offer] Data received from injected script:", event.data.payload);
                handleProductOfferData(event.data.payload);
            }
        });
    }

    // ================== DASHBOARD HANDLING ==================

    let lastUrl = window.location.href;
    let dashboardInitDone = false;

    /**
     * Kiểm tra xem có đang ở trang dashboard không
     */
    function isDashboardPage() {
        const url = new URL(window.location.href);
        return url.pathname === "/dashboard" || url.pathname === "/dashboard/";
    }

    /**
     * Kiểm tra và xử lý khi URL thay đổi (cho SPA)
     */
    function checkUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log("[Affiliate Offer] URL changed to:", currentUrl);
            
            // Reset flag khi URL thay đổi
            dashboardInitDone = false;
            uiRendered = false;
            
            // Kiểm tra lại trang hiện tại
            if (isDashboardPage()) {
                initDashboard();
            } else {
                // Nếu không phải dashboard, thử init cho product offer
                const newItemId = getItemIdFromUrl();
                if (newItemId && newItemId !== itemId) {
                    itemId = newItemId;
                    console.log(`[Affiliate Offer] New item_id detected: ${itemId}`);
                    // Reset và chờ dữ liệu mới
                    collectedData = null;
                    uiRendered = false;
                }
            }
        }
    }

    /**
     * Thiết lập lắng nghe thay đổi route cho SPA
     */
    function setupRouteChangeListener() {
        // Lắng nghe popstate (back/forward button)
        window.addEventListener("popstate", () => {
            setTimeout(checkUrlChange, 100);
        });

        // Override pushState và replaceState để bắt khi React Router thay đổi route
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            setTimeout(checkUrlChange, 100);
        };

        history.replaceState = function(...args) {
            originalReplaceState.apply(history, args);
            setTimeout(checkUrlChange, 100);
        };

        // Kiểm tra định kỳ (fallback cho các trường hợp khác)
        setInterval(checkUrlChange, 1000);

        // Sử dụng MutationObserver để phát hiện khi DOM thay đổi (dashboard panel xuất hiện)
        const observer = new MutationObserver(() => {
            if (isDashboardPage() && !dashboardInitDone) {
                const dashboardPanel = document.querySelector(".no-style-panel.dashboard-panel");
                if (dashboardPanel) {
                    console.log("[Affiliate Offer] Dashboard panel detected via MutationObserver");
                    initDashboard();
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        console.log("[Affiliate Offer] Route change listener đã được thiết lập");
    }

    /**
     * Thêm nút "Phân tích đơn hàng" vào dashboard
     */
    function addOrderAnalysisButton() {
        // Đợi DOM sẵn sàng
        const tryAddButton = () => {
            const dashboardPanel = document.querySelector(".no-style-panel.dashboard-panel");

            if (!dashboardPanel) {
                // Nếu chưa tìm thấy, thử lại sau
                setTimeout(tryAddButton, 500);
                return;
            }

            // Kiểm tra xem đã có nút chưa
            if (document.getElementById("shopee-order-analysis-btn")) {
                return;
            }

            // Tạo nút
            const button = document.createElement("button");
            button.id = "shopee-order-analysis-btn";
            button.textContent = "Phân tích đơn hàng";
            button.style.cssText = `
                display: inline-block;
                padding: 10px 20px;
                margin: 10px 0;
                background-color: #ee4d2d;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            // Hover effect
            button.addEventListener("mouseenter", () => {
                button.style.backgroundColor = "#d73211";
            });
            button.addEventListener("mouseleave", () => {
                button.style.backgroundColor = "#ee4d2d";
            });

            // Click handler
            button.addEventListener("click", () => {
                chrome.runtime.sendMessage({
                    type: "OPEN_ORDER_HISTORY",
                });
            });

            // Thêm nút vào dashboard panel
            dashboardPanel.appendChild(button);

            console.log("[Affiliate Offer] Đã thêm nút 'Phân tích đơn hàng' vào dashboard");
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", tryAddButton);
        } else {
            tryAddButton();
        }
    }

    /**
     * Khởi tạo cho trang dashboard
     */
    function initDashboard() {
        if (!isDashboardPage()) {
            dashboardInitDone = false;
            return;
        }

        // Tránh chạy nhiều lần
        if (dashboardInitDone) {
            return;
        }

        console.log("[Affiliate Offer] Đang ở trang dashboard, thêm nút phân tích đơn hàng...");
        addOrderAnalysisButton();
        dashboardInitDone = true;
    }

    // ================== INITIALIZATION ==================

    /**
     * Khởi tạo
     */
    function init() {
        // Thiết lập lắng nghe thay đổi route cho SPA (phải chạy trước)
        setupRouteChangeListener();

        // Kiểm tra nếu đang ở trang dashboard
        if (isDashboardPage()) {
            initDashboard();
            return;
        }

        itemId = getItemIdFromUrl();

        if (!itemId) {
            console.log("[Affiliate Offer] Không tìm thấy item_id trong URL. Script sẽ không hoạt động.");
            return;
        }

        console.log(`[Affiliate Offer] Content script started for item_id: ${itemId}`);
        console.log(`[Affiliate Offer] Current URL: ${window.location.href}`);

        // Thiết lập lắng nghe message từ injected script
        setupMessageListener();

        // Tiêm script vào trang web (main world)
        injectScript();

        console.log("[Affiliate Offer] Đã khởi tạo content script, đang đợi dữ liệu từ injected script...");
    }

    // Chạy ngay khi script load - không đợi DOM
    // Script chạy ở document_start nên chạy init ngay
    init();
})();
