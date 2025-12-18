/**
 * Common Header Generator
 * Quản lý header cho tất cả các trang, cho phép tùy chỉnh links theo từng trang
 */

const HEADER_CONFIG = {
    version: 'v2.2.5',
    links: {
        orderHistory: { href: 'order-history.html', text: '📋 Lịch sử đơn hàng' },
        clickOverview: { href: 'click-overview.html', text: '📊 Tổng quan Click' },
        videoOverview: { href: 'video-overview.html', text: '📹 Tổng quan Video' },
        videoOverviewTTLK: { href: 'video-overview.html', text: '📹 Tổng quan Video TTLK' },
        productAnalytics: { href: 'product-analytics.html', text: '📊 Phân tích sản phẩm' },
        favorites: { href: 'favorites.html', text: '⭐ Sản phẩm yêu thích' },
        options: { href: 'options.html', text: '⚙️ Cài đặt' },
        guide: { href: '#docs', text: '📖 Hướng dẫn' }
    },
    pages: {
        'click-overview.html': {
            icon: null,
            layout: 'flex',
            leftLinks: ['orderHistory', 'clickOverview', 'productAnalytics', 'videoOverviewTTLK', 'favorites'],
            rightLinks: ['guide','options']
        },
        'favorites.html': {
            icon: 'fa-solid fa-star',
            layout: 'flex',
            leftLinks: ['orderHistory', 'clickOverview', 'productAnalytics', 'videoOverviewTTLK', 'favorites'],
            rightLinks: ['options']
        },
        'order-history.html': {
            icon: 'fa-solid fa-calendar-days',
            layout: 'flex',
            leftLinks: ['orderHistory', 'clickOverview', 'productAnalytics', 'videoOverviewTTLK', 'favorites'],
            rightLinks: ['options']
        },
        'product-analytics.html': {
            icon: 'fa-solid fa-chart-bar',
            layout: 'flex',
            leftLinks: ['orderHistory', 'clickOverview', 'productAnalytics', 'videoOverviewTTLK', 'favorites'],
            rightLinks: ['options']
        },
        'product-detail.html': {
            icon: 'fa-solid fa-info-circle',
            layout: 'flex',
            leftLinks: ['orderHistory', 'clickOverview', 'productAnalytics', 'videoOverviewTTLK', 'favorites'],
            rightLinks: ['options']
        },
        'video-overview.html': {
            icon: 'fa-solid fa-chart-line',
            layout: 'flex',
            leftLinks: ['orderHistory', 'clickOverview', 'productAnalytics', 'videoOverviewTTLK', 'favorites'],
            rightLinks: ['options']
        }
    }
};

/**
 * Generate header HTML cho trang hiện tại
 * @param {string} currentPage - Tên file HTML hiện tại (ví dụ: 'click-overview.html')
 */
function generateHeader(currentPage) {
    const config = HEADER_CONFIG.pages[currentPage];
    if (!config) {
        console.warn(`No header config found for page: ${currentPage}`);
        return;
    }

    const headerContainer = document.getElementById('common-header');
    if (!headerContainer) {
        console.warn('Header container #common-header not found');
        return;
    }

    let html = '';
    const linkColor = 'style="color: #0d6efd"';

    if (config.layout === 'flex') {
        // Layout d-flex: left links, ms-auto, version, right links
        html = '<div class="d-flex text-right mb-2 small text-muted" style="font-size: 13px">';
        
        // Left links
        if (config.leftLinks && config.leftLinks.length > 0) {
            config.leftLinks.forEach((linkKey, index) => {
                const link = HEADER_CONFIG.links[linkKey];
                if (link) {
                    html += `<a href="${link.href}" ${linkColor}>${link.text}</a>`;
                    if (index < config.leftLinks.length - 1) {
                        html += ' | ';
                    }
                }
            });
        }

        // Version với ms-auto
        html += '<span class="ms-auto">';
        if (config.icon) {
            html += `<i class="${config.icon}"></i> `;
        }
        html += `Phiên bản: ${HEADER_CONFIG.version}`;
        if (config.rightLinks && config.rightLinks.length > 0) {
            html += ' |';
        }
        html += '</span>';

        // Right links
        if (config.rightLinks && config.rightLinks.length > 0) {
            config.rightLinks.forEach((linkKey, index) => {
                const link = HEADER_CONFIG.links[linkKey];
                if (link) {
                    if (index > 0) {
                        html += ' | ';
                    }
                    html += ` <a href="${link.href}" ${linkColor}>${link.text}</a>`;
                }
            });
        }

        html += '</div>';
    } else {
        // Layout simple: text-right với icon, version, links
        html = '<div class="text-right mb-2 small text-muted" style="font-size: 13px">';
        
        if (config.icon) {
            html += `<i class="${config.icon}"></i> `;
        }
        html += `Phiên bản: ${HEADER_CONFIG.version}`;

        // Links
        if (config.rightLinks && config.rightLinks.length > 0) {
            config.rightLinks.forEach((linkKey) => {
                const link = HEADER_CONFIG.links[linkKey];
                if (link) {
                    html += ` | <a href="${link.href}" ${linkColor}>${link.text}</a>`;
                }
            });
        }

        html += '</div>';
    }

    headerContainer.innerHTML = html;
}

// Auto-detect current page and generate header if container exists
(function() {
    if (document.getElementById('common-header')) {
        const currentPage = window.location.pathname.split('/').pop() || window.location.pathname;
        generateHeader(currentPage);
    }
})();

