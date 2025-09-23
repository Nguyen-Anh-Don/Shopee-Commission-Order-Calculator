const ALARM_NAME = "pollShopeeEvery5m";
const NOTIFY_KEY = "notified_date";
const LOGIN_NOTIF_ID = "loginRequired";
const YESTERDAY_DATA_NOTIF_ID = "yesterdayHasData";

let isPolling = false; // 1) khóa tránh gọi chồng

// === Tạo lịch 5 phút khi cài / khởi động Chrome
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 });
});
chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 });
});

// === Helper
function fmtYMD(d) {
    return d.toISOString().split("T")[0];
}

function getYesterdayRangeSeconds() {
    const now = new Date();
    const today00 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // hôm nay 00:00
    const startYesterday = new Date(today00.getTime() - 86400000);              // hôm qua 00:00
    const endYesterday = new Date(today00.getTime() - 1000);                    // hôm qua 23:59:59
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
        message: "Phiên đăng nhập Shopee Affiliate đã hết hạn.\nNhấp để mở Shopee Affiliate và đăng nhập lại."
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
        message: `Đang bắt đầu lên đơn hôm qua, đã hiện: ${totalText} đơn.`
  });
}

// === 1 listener click cho tất cả notification
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
    try { // 0) nếu hôm nay đã báo, bỏ qua sớm
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
    if (alarm.name !== ALARM_NAME) return;

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
        if (h < 6 || h >= 17) return;

        // 4) Gọi poll (không await) — có khoá isPolling trong pollShopee()
        //    thêm .catch để không leak lỗi Promise
        Promise.resolve().then(() => pollShopee()).catch((e) => {
            console.warn("[alarm] pollShopee error:", e);
        });
    } catch (err) {
        console.error("[alarm] handler error:", err);
    }
});

/*
// Mở trang welcome.html khi tiện ích được cài đặt
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({
            url: "https://chatvn.org/extension/thank-you.html"
        });
    }
});

// Mở trang feedback.html khi tiện ích bị gỡ cài đặt
chrome.runtime.setUninstallURL("https://chatvn.org/extension/uninstall.html");
*/