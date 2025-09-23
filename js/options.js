$(function() {
    // Load trạng thái toggle
    chrome.storage.local.get("enableNotif", (v) => {
        $("#enableNotif").prop("checked", v.enableNotif !== false);
    });

    // Lưu trạng thái toggle
    $("#enableNotif").on("change", function() {
        chrome.storage.local.set({ enableNotif: this.checked });
    });

    // Xử lý sidebar tab
    $("#sidebarNav .nav-link").on("click", function() {
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