// Injected script chạy trong main world của trang web
// File này được tiêm vào trang để có thể intercept fetch và XMLHttpRequest
(function () {
    "use strict";

    const isDebug = true;

    if (isDebug) {
        console.log("[Affiliate Offer] Injected script is running in MAIN world.");
    }

    let requestIntercepted = false;
    let interceptAttempts = 0;
    const MAX_ATTEMPTS = 30;

    // ================== UTILITY FUNCTIONS ==================

    /**
     * Kiểm tra nếu URL là API product offer
     * Chỉ kiểm tra pattern chính xác để tránh false positive
     */
    function isProductOfferApi(url) {
        if (!url) return false;
        const urlStr = typeof url === "string" ? url : url.toString();

        // Chỉ kiểm tra pattern chính xác của API product offer
        // Tránh match với các URL khác có chứa "offer" hoặc "product"
        const patterns = ["/api/v3/offer/product", "api/v3/offer/product"];

        // Kiểm tra pattern chính xác
        const hasPattern = patterns.some((pattern) => {
            const index = urlStr.indexOf(pattern);
            // Đảm bảo pattern không nằm trong domain của bên thứ 3 (như google.com)
            if (index === -1) return false;
            // Kiểm tra xem có phải là domain affiliate.shopee.vn không
            const beforePattern = urlStr.substring(0, index);
            return beforePattern.includes("affiliate.shopee.vn") || beforePattern === "" || beforePattern.endsWith("/") || urlStr.startsWith("/");
        });

        return hasPattern;
    }

    /**
     * Xử lý response data và gửi về content script
     * Chỉ xử lý một lần để tránh trùng lặp
     */
    function handleProductOfferData(data) {
        // Kiểm tra nếu đã xử lý rồi thì bỏ qua
        if (requestIntercepted) {
            return false;
        }

        if (data && data.code === 0 && data.data) {
            if (isDebug) {
                console.log("[Affiliate Offer] ✓ Đã bắt được dữ liệu product offer");
            }
            requestIntercepted = true;

            // Dừng tất cả các monitoring và retry
            clearAllIntervals();

            // Gửi dữ liệu về cho content script thông qua window.postMessage
            window.postMessage(
                {
                    type: "SHOPEE_PRODUCT_OFFER_DATA",
                    payload: data.data,
                },
                "*"
            ); // '*' có thể thay bằng origin cụ thể để bảo mật hơn

            return true;
        }
        return false;
    }

    /**
     * Lưu tất cả interval IDs của script này để có thể clear sau
     */
    const activeIntervals = [];

    /**
     * Wrapper cho setInterval để track intervals của script này
     */
    function trackedSetInterval(callback, delay) {
        const id = setInterval(() => {
            callback();
        }, delay);
        activeIntervals.push(id);
        return id;
    }

    /**
     * Clear tất cả intervals của script này
     */
    function clearAllIntervals() {
        activeIntervals.forEach((id) => clearInterval(id));
        activeIntervals.length = 0;
    }

    // ================== FETCH INTERCEPTION ==================

    /**
     * Intercept fetch requests
     */
    function interceptFetch() {
        if (!window.fetch) {
            if (isDebug) {
                console.warn("[Affiliate Offer] window.fetch không tồn tại");
            }
            return;
        }

        const originalFetch = window.fetch;

        window.fetch = function (...args) {
            const [resource, config] = args;
            const promise = originalFetch.apply(this, args);

            // Kiểm tra nếu là API product offer (chỉ log khi thực sự match)
            if (isProductOfferApi(resource)) {
                if (isDebug) {
                    console.log("[Affiliate Offer] ✓ Bắt được fetch request đến product offer API");
                }
                promise
                    .then((response) => {
                        if (isDebug) {
                            console.log("[Affiliate Offer] Response status:", response.status, response.statusText);
                        }

                        // Clone response để không ảnh hưởng đến trang web
                        const clonedResponse = response.clone();

                        // Kiểm tra response status trước
                        if (!response.ok) {
                            if (isDebug) {
                                console.error("[Affiliate Offer] Response không OK:", response.status, response.statusText);
                            }
                            // Vẫn thử parse để xem có data không
                            clonedResponse.text().then((text) => {
                                if (isDebug) {
                                    console.log("[Affiliate Offer] Response text:", text.substring(0, 200));
                                }
                            });
                            return;
                        }

                        clonedResponse
                            .json()
                            .then((data) => {
                                if (isDebug) {
                                    console.log("[Affiliate Offer] Parsed data:", data);
                                }
                                handleProductOfferData(data);
                            })
                            .catch((err) => {
                                if (isDebug) {
                                    console.error("[Affiliate Offer] Lỗi khi parse JSON:", err);
                                }
                                // Thử parse text để debug
                                response
                                    .clone()
                                    .text()
                                    .then((text) => {
                                        if (isDebug) {
                                            console.log("[Affiliate Offer] Response as text:", text.substring(0, 500));
                                        }
                                    });
                            });
                    })
                    .catch((err) => {
                        if (isDebug) {
                            console.error("[Affiliate Offer] Lỗi khi chặn fetch request:", err);
                        }
                    });
            }

            return promise;
        };

        if (isDebug) {
            console.log("[Affiliate Offer] Đã thiết lập intercept cho fetch");
        }
    }

    // ================== XMLHttpRequest INTERCEPTION ==================

    /**
     * Intercept XMLHttpRequest - Phiên bản mạnh mẽ hơn
     */
    function interceptXMLHttpRequest() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this._url = url;
            this._method = method;
            this._requestHeaders = {};

            return originalOpen.apply(this, [method, url, ...rest]);
        };

        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
            if (!this._requestHeaders) {
                this._requestHeaders = {};
            }
            this._requestHeaders[header] = value;
            return originalSetRequestHeader.apply(this, [header, value]);
        };

        XMLHttpRequest.prototype.send = function (...args) {
            // Kiểm tra nếu là API product offer và chưa bắt được request
            if (isProductOfferApi(this._url) && !requestIntercepted) {
                if (isDebug) {
                    console.log("[Affiliate Offer] ✓ Bắt được XHR request đến product offer API");
                }

                // Lưu lại this để sử dụng trong event listeners
                const xhr = this;
                let dataProcessed = false; // Flag để tránh xử lý trùng lặp

                // Hàm xử lý response (dùng chung cho cả onload và addEventListener)
                const processResponse = function () {
                    // Tránh xử lý trùng lặp
                    if (dataProcessed || requestIntercepted) return;

                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (handleProductOfferData(data)) {
                                dataProcessed = true;
                            }
                        } catch (err) {
                            if (isDebug) {
                                console.error("[Affiliate Offer] Lỗi khi parse XHR JSON:", err);
                            }
                        }
                    }
                };

                // Ghi lại sự kiện load
                const originalOnload = this.onload;
                this.onload = function (event) {
                    processResponse();
                    // Gọi lại hàm onload gốc nếu có
                    if (originalOnload) {
                        return originalOnload.apply(this, arguments);
                    }
                };

                // Ghi lại sự kiện error
                const originalOnerror = this.onerror;
                this.onerror = function (event) {
                    if (isDebug) {
                        console.error("[Affiliate Offer] XHR request error");
                    }
                    // Gọi lại hàm onerror gốc nếu có
                    if (originalOnerror) {
                        return originalOnerror.apply(this, arguments);
                    }
                };

                // Thêm event listener cho load (chỉ một lần)
                this.addEventListener("load", processResponse, { once: true });

                this.addEventListener(
                    "error",
                    function () {
                        if (isDebug) {
                            console.error("[Affiliate Offer] XHR request error");
                        }
                    },
                    { once: true }
                );
            }

            return originalSend.apply(this, args);
        };

        if (isDebug) {
            console.log("[Affiliate Offer] Đã thiết lập intercept cho XMLHttpRequest");
        }
    }

    // ================== MONITORING & RETRY ==================

    /**
     * Thiết lập lại interceptors
     */
    function resetInterceptors() {
        // Dừng ngay nếu đã bắt được request
        if (requestIntercepted) {
            return;
        }

        interceptAttempts++;

        // Chỉ log mỗi 5 lần để giảm noise
        if (interceptAttempts % 5 === 0 || interceptAttempts === 1) {
            if (isDebug) {
                console.log(`[Affiliate Offer] Thiết lập lại interceptors (lần ${interceptAttempts})`);
            }
        }

        // Thiết lập lại interceptors
        interceptFetch();
        interceptXMLHttpRequest();

        // Nếu đã thử đủ số lần hoặc đã bắt được request, dừng lại
        if (interceptAttempts >= MAX_ATTEMPTS || requestIntercepted) {
            if (!requestIntercepted) {
                if (isDebug) {
                    console.warn("[Affiliate Offer] Không thể bắt được request API sau 30 giây. Vui lòng thử lại.");
                }
            }
            return;
        }

        // Tiếp tục thử lại sau 1 giây
        setTimeout(resetInterceptors, 1000);
    }

    /**
     * Theo dõi script tags được thêm vào trang
     */
    function monitorScriptTags() {
        // Dừng nếu đã bắt được request
        if (requestIntercepted) return;

        // Chỉ chạy khi document.head hoặc document.documentElement tồn tại
        if (!document.head && !document.documentElement) {
            // Đợi DOM sẵn sàng
            setTimeout(monitorScriptTags, 100);
            return;
        }

        const observer = new MutationObserver(function (mutations) {
            // Dừng nếu đã bắt được request
            if (requestIntercepted) {
                observer.disconnect();
                return;
            }

            mutations.forEach(function (mutation) {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach(function (node) {
                        if (node.tagName === "SCRIPT" && node.src && node.src.includes("mdap")) {
                            // Thử thiết lập lại interceptors sau khi script mdap được tải
                            node.addEventListener("load", function () {
                                if (!requestIntercepted) {
                                    interceptFetch();
                                    interceptXMLHttpRequest();
                                }
                            });
                        }
                    });
                }
            });
        });

        observer.observe(document.head || document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Theo dõi biến toàn cục có thể chứa dữ liệu
     */
    function monitorGlobalVariables() {
        let checkCount = 0;
        const maxChecks = 30;

        // Theo dõi các biến toàn cục có thể chứa dữ liệu
        const checkInterval = trackedSetInterval(() => {
            // Dừng nếu đã bắt được request
            if (requestIntercepted) {
                clearInterval(checkInterval);
                return;
            }

            checkCount++;

            // Kiểm tra các biến toàn cục có thể chứa dữ liệu
            if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.productOffer) {
                if (handleProductOfferData({ code: 0, data: window.__INITIAL_STATE__.productOffer })) {
                    clearInterval(checkInterval);
                    return;
                }
            }

            // Thêm các kiểm tra khác nếu cần
            if (window.SHOPEE_AFFILIATE_DATA) {
                if (handleProductOfferData({ code: 0, data: window.SHOPEE_AFFILIATE_DATA })) {
                    clearInterval(checkInterval);
                    return;
                }
            }

            // Dừng kiểm tra sau maxChecks lần
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
            }
        }, 1000);
    }

    // ================== INITIALIZATION ==================

    /**
     * Khởi tạo
     */
    function init() {
        if (isDebug) {
            console.log("[Affiliate Offer] Injected script initialized in MAIN world");
        }

        // Thiết lập interceptors ngay lập tức
        interceptFetch();
        interceptXMLHttpRequest();

        // Thiết lập theo dõi script tags
        monitorScriptTags();

        // Thiết lập theo dõi biến toàn cục
        monitorGlobalVariables();

        // Bắt đầu cơ chế chạy lại interceptors mỗi giây trong 30 giây
        // Chỉ chạy nếu chưa bắt được request
        if (!requestIntercepted) {
            setTimeout(resetInterceptors, 1000);
        }
    }

    // Chạy ngay khi script load
    init();
})();
