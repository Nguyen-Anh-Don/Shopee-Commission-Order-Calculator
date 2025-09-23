// Helper
function fmtTime(ts) {
    if (!ts) return "—";
    try {
        const d = new Date(ts);
        return d.toLocaleString("vi-VN");
    } catch {
        return "—";
    }
}

function renderState({ enableNotif, notified_date, lastPoll }) {
    // chip trạng thái
    const chip = $("#notifState");
    chip.toggleClass("on", enableNotif !== false)
        .toggleClass("off", enableNotif === false)
        .text(enableNotif === false ? "Tắt" : "Bật");

    // switch
    $("#enableNotif").prop("checked", enableNotif !== false);

    // ngày đã thông báo
    const today = new Date().toISOString().split("T")[0];
    $("#notifiedToday").text(notified_date === today ? "Đã báo" : "Chưa");

    // lần poll gần nhất
    $("#lastPollAt").text(fmtTime(lastPoll?.time));
    $("#lastTotal").text(
        typeof lastPoll?.total === "number"
            ? lastPoll.total.toLocaleString("vi-VN")
            : "—",
    );
}

async function loadState() {
    chrome.runtime.sendMessage({ type: "getSettings" }, (res) => {
        // res: { enableNotif, notified_date, lastPoll }
        renderState(res || {});
    });
}

$(function () {
    // sync ban đầu
    loadState();

    // toggle notif
    $("#enableNotif").on("change", function () {
        const value = this.checked;
        chrome.runtime.sendMessage({ type: "setEnableNotif", value }, () =>
            loadState(),
        );
    });

    // manual poll
    $("#btnPollNow").on("click", function () {
        $(this).prop("disabled", true).text("⏳ Đang kiểm tra...");
        chrome.runtime.sendMessage({ type: "manualPoll" }, (res) => {
            // đợi 1 chút để background ghi lastPoll
            setTimeout(() => {
                loadState();
                $("#btnPollNow")
                    .prop("disabled", false)
                    .text("🔄 Kiểm tra ngay");
            }, 800);
        });
    });
});