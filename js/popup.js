document.addEventListener('DOMContentLoaded', function () {

    // Kiểm tra URL hiện tại
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        const urlPattern = /\/report\/conversion_report/; // Biểu thức chính quy để kiểm tra phần đường dẫn

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

            document.getElementById('result').style.display = 'none'; // Ẩn kết quả nếu URL không đúng
            document.getElementById('paginationWarning').style.display = 'none'; // Ẩn cảnh báo phân trang nếu URL không đúng
            document.getElementById('scrollToBottom').style.display = 'none'; // Ẩn nút cuộn nếu URL không đúng

            const usageInstructions = `
                <ol>
                    <li>Truy cập trang <a href="${expectedUrl}" target="_blank">${expectedUrl}</a></li>
                    <li>Nhấn vào biểu tượng <strong>hình răng cưa</strong> góc phải và bật tùy chọn <strong>“Thông tin bổ sung”</strong></li>
                    <li><strong>Chọn ngày</strong> bạn muốn xem kết quả. Nếu không thể chọn ngày hôm qua, hãy chọn ngày hôm kia trước, sau đó nhấn "Tìm kiếm". Lúc này, hệ thống sẽ cho phép bạn chọn lại ngày hôm qua.</li>
                    <li>Nhấn nút <strong>“Tìm kiếm”</strong> để lọc dữ liệu</li>
                    <li>Cuối cùng, bấm vào biểu tượng tiện ích (extension) ở góc trình duyệt để xem kết quả tính toán</li>
                </ol>
                <hr class="my-2">
                <div class="container mt-2">
                    <p class="mb-1">Video thao tác: <a href="https://goink.me/MjsU" target="_blank">https://www.youtube.com/watch?v=vKaXK7rjjAw</a></p>
                    <p class="mb-1">Nhóm: <a href="https://goink.me/ul2i" target="_blank">Cộng đồng Tiếp thị liên kết Shopee - Affiliate Marketing Shopee</a></p>
                </div>
            `;

            document.body.innerHTML += usageInstructions; // Thêm hướng dẫn sử dụng vào cuối nội dung
        } else {
            // Nếu URL đúng, tính tổng hoa hồng và hiển thị kết quả
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: calculateAllPages
            }, (results) => {
                if (results && results[0]) {
                    const { totalCommission, xtraCommission, shopeeCommission, totalOrders, canceledOrders, unpaidOrders, videoOrders, liveOrders, socialOrders, zeroCommissionOrders, startDate, endDate, dateWarning } = results[0].result;

                    // Hàm format lại ngày
                    function formatDate(dateString) {
                        if (!dateString) return '';
                        
                        // Tách chuỗi theo dấu gạch ngang
                        const parts = dateString.split('-');
                        
                        // Đảm bảo có đủ 3 phần
                        if (parts.length === 3) {
                            const [day, month, year] = parts;
                            return `${day}/${month}/${year}`;
                        }
                        
                        return dateString;
                    }
                                        
                    const startDateFormatted = formatDate(startDate);
                    const endDateFormatted = formatDate(endDate);

                    if (startDate === endDate) {
                        document.getElementById('startDate').textContent = startDateFormatted;
                        document.getElementById('endDate').textContent = '';
                    } else {
                        document.getElementById('startDate').textContent = startDateFormatted;
                        document.getElementById('endDate').textContent = ` - ${endDateFormatted}`;
                    }

                    // Hiển thị cảnh báo nếu các ngày khác nhau
                    if (dateWarning) {
                        document.getElementById('dateWarning').style.display = 'block';
                    } else {
                        document.getElementById('dateWarning').style.display = 'none';
                    }

                    document.getElementById('totalCommission').textContent = totalCommission;
                    document.getElementById('xtraCommission').textContent = xtraCommission;
                    document.getElementById('shopeeCommission').textContent = shopeeCommission;
                    //document.getElementById('totalOrders').textContent = totalOrders;
                    document.getElementById('totalOrders').innerHTML = totalOrders;
                    document.getElementById('canceledOrders').textContent = canceledOrders;
                    document.getElementById('unpaidOrders').textContent = unpaidOrders;
                    document.getElementById('videoOrders').textContent = videoOrders;
                    document.getElementById('liveOrders').textContent = liveOrders;
                    document.getElementById('zeroCommissionOrders').textContent = zeroCommissionOrders;

                    // Kiểm tra nếu unpaidOrders lớn hơn 0 thì hiển thị dòng này
                    if (unpaidOrders > 0) {
                        const unpaidElement = document.getElementById('unpaidOrders');
                        unpaidElement.parentElement.classList.remove('d-none');
                        unpaidElement.innerHTML = `<span class="badge bg-secondary">${unpaidOrders}</span>`;
                    } else {
                        document.getElementById('unpaidOrders').parentElement.classList.add('d-none');
                    }

                    // Kiểm tra nếu liveOrders lớn hơn 0 thì hiển thị dòng này
                    if (liveOrders > 0) {
                        document.getElementById('liveOrders').parentElement.classList.remove('d-none');
                        document.getElementById('liveOrders').textContent = liveOrders;
                    } else {
                        document.getElementById('liveOrders').parentElement.classList.add('d-none');
                    }

                    // Kiểm tra nếu videoOrders lớn hơn 0 thì hiển thị dòng này
                    if (videoOrders > 0) {
                        document.getElementById('videoOrders').parentElement.classList.remove('d-none');
                        document.getElementById('videoOrders').textContent = videoOrders;
                    } else {
                        document.getElementById('videoOrders').parentElement.classList.add('d-none');
                    }

                    // Kiểm tra nếu canceledOrders lớn hơn 0 thì hiển thị dòng này
                    if (canceledOrders > 0) {
                        const canceledElement = document.getElementById('canceledOrders');
                        canceledElement.parentElement.classList.remove('d-none');
                        canceledElement.innerHTML = `<span class="badge bg-danger">${canceledOrders}</span>`;
                    } else {
                        document.getElementById('canceledOrders').parentElement.classList.add('d-none');
                    }

                    // Kiểm tra nếu socialOrders lớn hơn 0 thì hiển thị dòng này
                    if (socialOrders > 0) {
                        document.getElementById('socialOrders').parentElement.classList.remove('d-none');
                        document.getElementById('socialOrders').textContent = socialOrders;
                    } else {
                        document.getElementById('socialOrders').parentElement.classList.add('d-none');
                    }

                    // Kiểm tra nếu zeroCommissionOrders lớn hơn 0 thì hiển thị dòng này
                    if (zeroCommissionOrders > 0) {
                        document.getElementById('zeroCommissionOrders').parentElement.classList.remove('d-none');
                        document.getElementById('zeroCommissionOrders').innerHTML = `<span class="badge bg-warning text-dark">${zeroCommissionOrders}</span>`;
                    } else {
                        document.getElementById('zeroCommissionOrders').parentElement.classList.add('d-none');
                    }

                    showTopShopAndProducts(results[0].result.allOrders);
                }
            });

            // Thêm sự kiện cho nút cuộn xuống cuối trang
            document.getElementById('scrollToBottom').addEventListener('click', function() {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: scrollToBottom
                });
            });
        }
    });

    // Thêm xử lý sự kiện cho nút chụp ảnh
    document.getElementById('captureBtn')?.addEventListener('click', async function() {
        try {
            // Ẩn phần tử trước khi chụp
            const captureBtn = document.getElementById('captureBtn');
            captureBtn.style.visibility = 'hidden';

            const topShopProduct = document.getElementById('top-shop-product');
            topShopProduct.style.display = 'none';

            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Chụp toàn bộ container
            const canvas = await html2canvas(document.documentElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true
            });
            
            // Chuyển canvas thành blob
            canvas.toBlob(async function(blob) {
                try {
                    // Copy ảnh vào clipboard
                    const clipboardItem = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([clipboardItem]);
                    
                    // Hiện thông báo thành công
                    const toast = document.createElement('div');
                    toast.className = 'toast-notification';
                    toast.textContent = 'Đã copy ảnh vào bộ nhớ đệm!';
                    document.body.appendChild(toast);
                    
                    // Xóa toast sau khi animation kết thúc
                    setTimeout(() => {
                        document.body.removeChild(toast);
                    }, 2000);
                } catch (error) {
                    console.error('Error copying to clipboard:', error);
                    alert('Không thể copy ảnh vào bộ nhớ đệm. Vui lòng thử lại.');
                }
                
                // Hiện lại sau khi chụp
                captureBtn.style.visibility = 'visible';
                topShopProduct.style.display = 'block';
            }, 'image/png');
            
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            alert('Có lỗi khi chụp ảnh. Vui lòng thử lại.');
            document.getElementById('captureBtn').style.visibility = 'visible';
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
    const productCommission = {};
    const productInfo = {};

    allOrders.forEach(order => {
        order.orders.forEach(o => {
            const shopName = o.items[0].shop_name || "Không rõ shop";
            shopCount[shopName] = (shopCount[shopName] || 0) + 1;
            shopCommission[shopName] = (shopCommission[shopName] || 0) + parseInt(o.items[0].item_commission || 0);

            o.items.forEach(item => {
                console.log("item_id:", item.item_id, "name:", item.item_name, "commission:", item.item_commission, "ref:", item.referrer);

                const itemKey = `${item.item_id}`;
                productCount[itemKey] = (productCount[itemKey] || 0) + 1;

                if (!productInfo[itemKey]) {
                    productInfo[itemKey] = {
                        name: item.item_name || "Sản phẩm không rõ",
                        ref: item.referrer || "Không rõ",
                        commission: parseInt(item.item_commission || 0)
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
    const shopListHtml = top3Shops.map(shop => {
        const count = shopCount[shop];
        const commission = shopCommission[shop];
        return `${shop} — <strong>${count} đơn, ${commission.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</strong>`;
    }).join('<br>');
    document.getElementById("topShop").innerHTML = shopListHtml;

    // Top 5 sản phẩm theo hoa hồng
    const sortedProducts = Object.keys(productInfo).sort((a, b) => productInfo[b].commission - productInfo[a].commission);
    const topList = document.getElementById("topProducts");
    topList.innerHTML = "";

    sortedProducts.slice(0, 5).forEach(pid => {
        const info = productInfo[pid];
        let type = "MXH";
        if (info.ref.includes("Shopeevideo")) type = "Video";
        else if (info.ref.includes("Shopeelive")) type = "Live";
        else if (info.ref) type = info.ref;

        const formattedCommission = info.commission.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

        const li = document.createElement("li");
        li.innerHTML = `${truncateText(info.name, 50)} — <strong>${productCount[pid]} đơn, ${formattedCommission} (${type})</strong>`;
        topList.appendChild(li);
    });

}

// Hàm tính tổng hoa hồng và xử lý nhiều trang
async function calculateAllPages() {
    let allOrders = [];
    let totalCommission = 0;
    let xtraCommission = 0;
    let shopeeCommission = 0;
    let totalOrders = 0;
    let canceledOrders = 0;
    let unpaidOrders = 0;
    let videoOrders = 0;
    let liveOrders = 0;
    let socialOrders = 0;
    let zeroCommissionOrders = 0; // Thêm biến đếm đơn 0đ

    // Kiểm tra ngày bắt đầu và kết thúc
    const startDateInput = document.querySelector('.ant-calendar-range-picker-input:nth-child(1)');
    const endDateInput = document.querySelector('.ant-calendar-range-picker-input:nth-child(3)');

    // Lấy giá trị trực tiếp từ value của input
    const startDate = startDateInput ? startDateInput.value : '';
    const endDate = endDateInput ? endDateInput.value : '';
    
    let dateWarning = startDate !== endDate;

    // Hàm chọn 100 dòng / trang
    async function select100PerPage() {
        const sizeChanger = document.querySelector('.ant-pagination-options-size-changer');
        if (sizeChanger && sizeChanger.innerText.includes('20 / trang')) {
            sizeChanger.click();
            await new Promise(r => setTimeout(r, 500));
            const dropdownItems = document.querySelectorAll('.ant-select-dropdown-menu-item');
            for (const item of dropdownItems) {
                if (item.innerText.includes('100')) {
                    item.click();
                    await new Promise(r => setTimeout(r, 2000)); // Đợi reload
                    break;
                }
            }
        }
    }

    // Hàm quay về trang 1
    async function goToFirstPage() {
        const prevButton = document.querySelector('.ant-pagination-prev');
        if (prevButton && prevButton.classList.contains('ant-pagination-disabled') === false) {
            const firstPageButton = document.querySelector('.ant-pagination-item-1');
            if (firstPageButton && !firstPageButton.classList.contains('ant-pagination-item-active')) {
                firstPageButton.click();
                await new Promise(r => setTimeout(r, 2000)); // Đợi trang tải xong
            }
        }
    }

    // Hàm tính toán hoa hồng cho một trang
    function calculateCurrentPage() {
        const commissionElements = document.querySelectorAll('li.commission-top-bold span');

        commissionElements.forEach(element => {
            const commissionText = element.textContent.trim();
            const commission = parseFloat(commissionText.replace(/[₫,.]/g, '').replace(/,/g, '.'));

            if (!isNaN(commission)) {
                totalCommission += commission;
                
                // Đếm số đơn có hoa hồng 0đ
                if (commission === 0) {
                    zeroCommissionOrders++;
                }
            }
        });

        // Tính hoa hồng Xtra
        const xtraCommissionElements = document.querySelectorAll('.commission-wrap ul li');
        xtraCommissionElements.forEach(element => {
            const xtraText = element.textContent;
            if (xtraText.includes('Hoa hồng Xtra')) {
                const commissionText = xtraText.split(':')[1].trim();
                const commission = parseFloat(commissionText.replace(/[₫,.]/g, '').replace(/,/g, '.'));

                if (!isNaN(commission)) {
                    xtraCommission += commission;
                }
            }
        });

        // Tính hoa hồng Shopee
        const shopeeCommissionElements = document.querySelectorAll('.commission-wrap ul li');
        shopeeCommissionElements.forEach(element => {
            const shopeeText = element.textContent;
            if (shopeeText.includes('Hoa hồng từ Shopee')) {
                const commissionText = shopeeText.split(':')[1].trim();
                const commission = parseFloat(commissionText.replace(/[₫,.]/g, '').replace(/,/g, '.'));

                if (!isNaN(commission)) {
                    shopeeCommission += commission;
                }
            }
        });

        const orderElements = document.querySelectorAll('span.report-table-label.report-table-label-medium');
        totalOrders += orderElements.length / 4;

        const canceledElements = document.querySelectorAll('span.an-tag[style*="color: rgb(153, 153, 153);"]');
        canceledElements.forEach(element => {
            const statusText = element.textContent.trim();
            if (statusText === 'Đã hủy') {
                canceledOrders++;
            } else if (statusText === 'Chưa thanh toán') {
                unpaidOrders++;
            }
        });

        // canceledOrders /= 2;
        // unpaidOrders /= 2;

        const videoElements = document.querySelectorAll('span.report-table-value-text.report-table-value-text-large');
        videoElements.forEach(element => {
            const statusText = element.textContent.trim();
            if (statusText === 'Shopeevideo-Shopee') {
                videoOrders++;
            } else if (statusText === 'Shopeelive-Shopee') {
                liveOrders++;
            }
        });

        const orderRows = document.querySelectorAll('.ant-table-tbody tr');
        orderRows.forEach(row => {
            const shopNameEl = row.querySelector('.shop-details-wrapper>ul>li>span>a');
            const productNameEl = row.querySelector('.item-details-info-wrap .item-details-info-ceils>ul>li>span>a');
            const commissionEl = row.querySelector('li.commission-top-bold>span');
            const itemIdEl = row.querySelector('.item-details-info-ceils>ul>li:nth-child(2) span');

            let itemId = "0";
            if (itemIdEl) {
                const text = itemIdEl.textContent.trim();
                const match = text.match(/Item id:\s*(\d+)/);
                if (match && match[1]) {
                    itemId = match[1];
                }
            }

            const liList = row.querySelectorAll('ul.report-table-ul-8 li');
            let referrer = "MXH";
            for (const li of liList) {
                const labelEl = li.querySelector('.report-table-label-large');
                const valueEl = li.querySelector('.report-table-value-text-large');
                if (labelEl && valueEl && labelEl.textContent.includes("Kênh:")) {
                    referrer = valueEl.textContent.trim();
                    break;
                }
            }

            // Nếu các selector đúng thì lấy
            if (shopNameEl && productNameEl && commissionEl) {
                const order = {
                    orders: [{
                        items: [{
                            shop_name: shopNameEl.textContent.trim(),
                            item_name: productNameEl.textContent.trim(),
                            item_commission: parseFloat(commissionEl.textContent.replace(/[₫,.]/g, '').replace(/,/g, '.')),
                            item_id: itemId,
                            referrer: referrer
                        }]
                    }]
                };
                allOrders.push(order);
            }
        });
    }

    // Hàm để chuyển qua trang kế và xử lý
    async function processNextPage() {
        const nextPageButton = document.querySelector('.ant-pagination-next');

        if (nextPageButton && !nextPageButton.classList.contains('ant-pagination-disabled')) {
            nextPageButton.click();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Đợi trang tải xong
            calculateCurrentPage(); // Tính toán dữ liệu của trang hiện tại
            return processNextPage(); // Gọi lại để xử lý các trang kế
        } else {
            console.log('Đã đến trang cuối cùng.');
            return {
                totalCommission: totalCommission.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
                xtraCommission: (xtraCommission / 2).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
                shopeeCommission: (shopeeCommission / 2).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
                totalOrders: `${totalOrders - canceledOrders / 2 - unpaidOrders / 2} (${totalOrders} - <span class="badge bg-secondary">${unpaidOrders/2}</span> - <span class="badge bg-danger">${canceledOrders/2}</span>)`,
                canceledOrders: canceledOrders / 2,
                unpaidOrders: unpaidOrders / 2,
                videoOrders: videoOrders,
                liveOrders: liveOrders,
                socialOrders: totalOrders - videoOrders - liveOrders,
                zeroCommissionOrders: zeroCommissionOrders, // Trả về số đơn 0đ
                startDate: startDate,
                endDate: endDate,
                dateWarning: dateWarning,
                allOrders: allOrders
            };
        }
    }

    // Bắt đầu xử lý các trang
    await select100PerPage(); // Chọn 100 sản phẩm / trang
    await goToFirstPage(); // Quay về trang 1
    calculateCurrentPage(); // Tính toán trang đầu tiên
    return processNextPage(); // Bắt đầu quá trình xử lý các trang kế
}