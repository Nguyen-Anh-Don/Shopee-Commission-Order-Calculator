// Cấu hình server để xử lý dữ liệu
// Prevent duplicate declaration if script is loaded multiple times
if (typeof SERVER_CONFIG === 'undefined') {
    var SERVER_CONFIG = {
        serverUrl: "https://data-vultr.addlivetag.com/input/",

        // Bật chia sẻ dữ liệu phân tích sản phẩm
        enabled: true,

        // Cấu hình price tracking
        priceTracking: {
            endpoint: "https://data-vultr.addlivetag.com/price-tracking/",
            defaultDays: 90,
            defaultCurrency: "VND"
        }
    };
}
