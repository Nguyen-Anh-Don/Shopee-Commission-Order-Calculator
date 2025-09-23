// Tính mốc thời gian “hôm qua 00:00:00” → “hôm qua 23:59” theo local time
function getYesterdayRangeSeconds() {
    const now = new Date(); // local
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // hôm nay 00:00
    const startYesterday = new Date(y.getTime() - 24 * 60 * 60 * 1000); // hôm qua 00:00
    // Kết thúc: hôm qua 23:59 (theo yêu cầu), nếu muốn 23:59:59 thay phút = 59, giây = 59
    const endYesterday = new Date(y.getTime() - 1000 * 60); // 23:59:00 hôm qua

    const s = Math.floor(startYesterday.getTime() / 1000);
    const e = Math.floor(endYesterday.getTime() / 1000);
    return { s, e };
}

async function pollShopee() {
    try {
        const { s, e } = getYesterdayRangeSeconds();
        const url = `https://affiliate.shopee.vn/api/v3/report/list?page_size=500&page_num=1&purchase_time_s=${s}&purchase_time_e=${e}&version=1`;

        const res = await fetch(url, {
            method: "GET",
            credentials: "include" // dùng cookie đăng nhập hiện có
        });

        // Nếu bị redirect hoặc 401 coi như chưa đăng nhập
        if (res.status === 401) {
            chrome.runtime.sendMessage({ type: "POLL_RESULT", ok: false, reason: "UNAUTHORIZED" });
            return;
        }
        if (!res.ok) {
            chrome.runtime.sendMessage({ type: "POLL_RESULT", ok: false, reason: `HTTP_${res.status}` });
            return;
        }

        const json = await res.json().catch(() => null);
        if (!json || json.code !== 0) {
            chrome.runtime.sendMessage({ type: "POLL_RESULT", ok: false, reason: "BAD_RESPONSE" });
            return;
        }

        const total = json ? .data ? .total_count ? ? 0;
        // Theo yêu cầu: nếu total_count > 0 ⇒ có dữ liệu (đơn/hoa hồng) → thông báo
        chrome.runtime.sendMessage({ type: "POLL_RESULT", ok: true, totalCount: Number(total) || 0 });
    } catch (err) {
        chrome.runtime.sendMessage({ type: "POLL_RESULT", ok: false, reason: "NETWORK_ERROR" });
    }
}

// Nhận lệnh từ background
chrome.runtime.onMessage.addListener((msg) => {
    if (msg ? .type === "POLL_NOW") pollShopee();
});