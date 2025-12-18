(()=>{(function(){"use strict";let F="/api/v3/offer/product",k=null,u=null,h=!1;function x(){let i=new URL(window.location.href).pathname.split("/"),t=i.indexOf("product_offer");return t!==-1&&i[t+1]?i[t+1]:null}function g(e){if(!e)return"0 \u20AB";if(typeof e=="string"&&e.includes("\u20AB"))return e;let i=typeof e=="string"?parseInt(e):e;return isNaN(i)?"0 \u20AB":(i>1e6&&(i=i/1e5),new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",minimumFractionDigits:0}).format(i))}function C(e){return e?new Date(parseInt(e)*1e3).toLocaleString("vi-VN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"N/A"}function H(e){let i=document.createElement("textarea");i.value=e,i.style.position="fixed",i.style.opacity="0",document.body.appendChild(i),i.select();try{return document.execCommand("copy"),!0}catch(t){return console.error("Failed to copy:",t),!1}finally{document.body.removeChild(i)}}function f(e){let i=typeof e=="string"?parseFloat(e.replace("%","")):e;return i>=7?"primary":i>=5?"success":"warning"}function A(e){return e?`https://cf.shopee.vn/file/${e}`:""}function j(e){return{1:"Social Media",2:"Shopee Video",3:"Live Streaming"}[e]||`K\xEAnh ${e}`}function K(e){if(!e)return"N/A";let i=Math.floor(e/60),t=e%60;return`${i.toString().padStart(2,"0")}:${t.toString().padStart(2,"0")}`}function q(e){return e?`https://cf.shopee.vn/file/${e}`:""}function D(e){if(!e||!Array.isArray(e)||e.length===0)return'<div style="color: #999; font-size: 13px;">Kh\xF4ng c\xF3 video</div>';let i='<div class="affiliate-video-list">';return e.forEach((t,a)=>{var m,d,l,r;let s=t.thumb_url?q(t.thumb_url):"",n=t.duration?K(t.duration):"N/A",c=((m=t.default_format)==null?void 0:m.defn)||"N/A",o=((d=t.default_format)==null?void 0:d.url)||((r=(l=t.formats)==null?void 0:l[0])==null?void 0:r.url)||"";i+=`
                <div class="affiliate-video-item">
                    ${s?`
                    <div class="affiliate-video-thumbnail-wrapper">
                        <img src="${s}" alt="Video ${a+1}" class="affiliate-video-thumbnail" />
                        <div class="affiliate-video-duration">${n}</div>
                    </div>
                    `:""}
                    <div class="affiliate-video-info">
                        <div class="affiliate-video-title">Video ${a+1}</div>
                        <div class="affiliate-video-meta">
                            <span>\u23F1\uFE0F ${n}</span>
                            <span>\u{1F4F9} ${c}</span>
                        </div>
                        ${o?`
                        <a href="${o}" target="_blank" class="affiliate-video-link">Xem video</a>
                        `:""}
                    </div>
                </div>
            `}),i+="</div>",i}function z(e,i){if(!e||!i)return null;let t=typeof e=="string"?parseInt(e):e;if(isNaN(t))return null;t>1e6&&(t=t/1e5);let a=0;if(typeof i=="string"?a=parseFloat(i.replace("%",""))||0:a=i>100?i/100:i,a===0)return null;let s=t*a/100;return g(s)}function G(e,i){var d;let t=0,a=e.batch_item_for_item_card_full||{},s=e.default_commission_rate||e.seller_commission_rate||"0%",n=typeof s=="string"?parseFloat(s.replace("%","")):s>100?s/100:s;if(n>=7?t+=3:n>=5?t+=2:n>=3&&(t+=1),i&&a.price){let l=typeof a.price=="string"?parseInt(a.price):a.price,r=typeof i=="string"?parseInt(i):i;l>1e6&&(l=l/1e5),r>1e6&&(r=r/1e5),l<r*.9?t+=2:l<r&&(t+=1)}let c=((d=a.item_rating)==null?void 0:d.rating_star)||0;return c>=4.8?t+=2:c>=4.5&&(t+=1),(a.cmt_count||0)>=500&&(t+=1),(a.liked_count||0)>=1e3&&(t+=1),t}function W(e,i){if(!e||!e.list||!Array.isArray(e.list)||e.list.length===0)return'<div style="color: #999; font-size: 13px;">Kh\xF4ng c\xF3 s\u1EA3n ph\u1EA9m t\u01B0\u01A1ng t\u1EF1</div>';let a=((i==null?void 0:i.batch_item_for_item_card_full)||{}).price,s='<div class="affiliate-similar-products-grid">';return e.list.forEach((n,c)=>{var B;let o=n.batch_item_for_item_card_full||{},m=o.image?A(o.image):"",d=o.name||"N/A",l=o.price,r=typeof l=="string"?parseInt(l):l;r>1e6&&(r=r/1e5);let oe=g(o.price),v=n.commission;if(!v||v==="N/A"){let p=n.seller_commission_rate||n.default_commission_rate;v=z(o.price,p)}v||(v="N/A");let O=n.default_commission_rate||n.seller_commission_rate||"N/A",$="";if(a&&o.price){let p=typeof a=="string"?parseInt(a):a;p>1e6&&(p=p/1e5);let S=(r-p)/p*100;S<-5?$=`<span class="affiliate-price-comparison lower">\u2193 R\u1EBB h\u01A1n ${Math.abs(S).toFixed(0)}%</span>`:S>5?$=`<span class="affiliate-price-comparison higher">\u2191 \u0110\u1EAFt h\u01A1n ${S.toFixed(0)}%</span>`:$='<span class="affiliate-price-comparison same">\u2248 T\u01B0\u01A1ng \u0111\u01B0\u01A1ng</span>'}let U=G(n,a)>=6,E=n.long_link||"",ce=n.product_link||"",re=`https://affiliate.shopee.vn/offer/product_offer/${n.item_id}`,T=o.sold_text||"",I=o.historical_sold_text||"",R=o.liked_count||0,M=o.discount||"",V=((B=o.item_rating)==null?void 0:B.rating_star)||0,P=o.cmt_count||0;s+=`
                <div class="affiliate-similar-product-card ${U?"recommended":""}">
                    ${U?'<div class="affiliate-recommended-badge">\u2B50 \u0110\u1EC1 xu\u1EA5t</div>':""}
                    ${m?`
                    <div class="affiliate-similar-product-image-wrapper">
                        <img src="${m}" alt="${d}" class="affiliate-similar-product-image" />
                        ${M?`<div class="affiliate-similar-product-discount">-${M}</div>`:""}
                    </div>
                    `:""}
                    <div class="affiliate-similar-product-info">
                        <div class="affiliate-similar-product-name" title="${d}">${d}</div>
                        <div class="affiliate-similar-product-price-row">
                            <span class="affiliate-similar-product-price">${oe}</span>
                            ${$}
                        </div>
                        <div class="affiliate-similar-product-meta">
                            ${V>0?`
                            <div class="affiliate-similar-product-meta-item">
                                <span>\u2B50</span>
                                <span>${V.toFixed(1)}</span>
                                ${P>0?`<span>(${P})</span>`:""}
                            </div>
                            `:""}
                            ${R>0?`
                            <div class="affiliate-similar-product-meta-item">
                                <span>\u2764\uFE0F</span>
                                <span>${R.toLocaleString("vi-VN")}</span>
                            </div>
                            `:""}
                            ${T?`
                            <div class="affiliate-similar-product-meta-item">
                                <span>\u{1F6D2}</span>
                                <span>${T}</span>
                            </div>
                            `:""}
                            ${I?`
                            <div class="affiliate-similar-product-meta-item">
                                <span>\u{1F4C8}</span>
                                <span>${I}</span>
                            </div>
                            `:""}
                        </div>
                        <div class="affiliate-similar-product-commission">
                            <span class="affiliate-similar-product-commission-label">Hoa h\u1ED3ng:</span>
                            <span class="affiliate-similar-product-commission-value">${v}</span>
                            <span class="affiliate-similar-product-rate">
                                <span class="affiliate-rate-badge ${f(O)}">${O}</span>
                            </span>
                        </div>
                        ${E?`
                        <div class="affiliate-similar-product-actions">
                            <button class="affiliate-link-btn" data-copy="similar-long-link-${c}" style="font-size: 0.7rem; padding: 0.4rem 0.8rem;">Copy Link</button>
                            <input type="hidden" id="similar-long-link-${c}" value="${E}" />
                            <a href="${re}" target="_blank" rel="noopener noreferrer" class="affiliate-product-direct-link-btn" style="font-size: 0.75rem; margin-left: 8px; padding: 0.4rem 0.8rem; text-decoration: none; color: #fff; background: #007aff; border: none; border-radius: 4px; display: inline-block;">Xem</a>
                        </div>
                        `:""}
                    </div>
                </div>
            `}),s+="</div>",s}function L(e){if(h||!e)return;let i=document.querySelector(".product-offer-details");if(i||(i=document.querySelector('[class*="product-offer"]')||document.querySelector('[class*="offer"]')||document.querySelector("main")||document.querySelector(".container")||document.body,console.log("[Affiliate Offer] Kh\xF4ng t\xECm th\u1EA5y .product-offer-details, s\u1EED d\u1EE5ng element kh\xE1c:",i)),!i){console.log("[Affiliate Offer] Kh\xF4ng t\xECm th\u1EA5y element ph\xF9 h\u1EE3p, \u0111\u1EE3i...");let a=0,s=10,n=setInterval(()=>{a++;let c=document.querySelector(".product-offer-details")||document.querySelector("main")||document.querySelector(".container")||document.body;(c||a>=s)&&(clearInterval(n),c?L(e):console.error("[Affiliate Offer] Kh\xF4ng th\u1EC3 t\xECm th\u1EA5y element sau nhi\u1EC1u l\u1EA7n th\u1EED"))},500);return}h=!0,k=e;let t=document.createElement("div");t.className="affiliate-product-offer-wrapper",t.innerHTML=Q(e),i.nextSibling?i.parentNode.insertBefore(t,i.nextSibling):i.parentNode.appendChild(t),J(t,e),console.log("[Affiliate Offer] \u0110\xE3 render UI th\xE0nh c\xF4ng")}function Q(e){let i=e.batch_item_for_item_card_full||{},t=e.commission_rate||{},a=e.commission_rate_detail||{};return`
            <!-- Product Info Card -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u{1F4E6}</span>
                    <span>Th\xF4ng tin S\u1EA3n ph\u1EA9m</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-product-info">
                        ${i.image?`
                        <img src="${A(i.image)}" alt="${i.name||""}" class="affiliate-product-image" />
                        `:""}
                        <div class="affiliate-product-details">
                            <div class="affiliate-product-name">${i.name||"N/A"}</div>
                            <div class="affiliate-product-price-row">
                                <span class="affiliate-product-price">${g(i.price)}</span>
                                ${i.price_before_discount?`
                                <span class="affiliate-product-original-price">${g(i.price_before_discount)}</span>
                                `:""}
                                ${i.discount?`
                                <span class="affiliate-product-discount">-${i.discount}</span>
                                `:""}
                            </div>
                            <div class="affiliate-product-meta">
                                ${i.stock!==void 0?`
                                <div class="affiliate-product-meta-item">
                                    <span>\u{1F4E6}</span>
                                    <span>T\u1ED3n kho: <strong>${i.stock.toLocaleString("vi-VN")}</strong></span>
                                </div>
                                `:""}
                                ${i.sold!==void 0?`
                                <div class="affiliate-product-meta-item">
                                    <span>\u{1F6D2}</span>
                                    <span>\u0110\xE3 b\xE1n 30 ng\xE0y qua: <strong>${i.sold}</strong></span>
                                </div>
                                `:""}
                                ${i.historical_sold_text?`
                                <div class="affiliate-product-meta-item">
                                    <span>\u{1F4C8}</span>
                                    <span>L\u1ECBch s\u1EED: <strong>${i.historical_sold_text}</strong></span>
                                </div>
                                `:""}
                                ${i.cmt_count!==void 0?`
                                <div class="affiliate-product-meta-item">
                                    <span>\u{1F4AC}</span>
                                    <span>\u0110\xE1nh gi\xE1: <strong>${i.cmt_count}</strong></span>
                                </div>
                                `:""}
                                ${i.liked_count!==void 0?`
                                <div class="affiliate-product-meta-item">
                                    <span>\u2764\uFE0F</span>
                                    <span>Y\xEAu th\xEDch: <strong>${i.liked_count.toLocaleString("vi-VN")}</strong></span>
                                </div>
                                `:""}
                            </div>
                            ${e.affiliate_promoted_last_7days?`
                            <div class="affiliate-voucher-badge">
                                <span>\u{1F93C}</span>
                                <span><strong>${e.affiliate_promoted_last_7days||""}</strong> KOL Qu\u1EA3ng B\xE1</span>
                            </div>
                            `:""}
                            ${typeof i.sold=="number"&&i.sold>0?`
                            <div class="affiliate-voucher-badge">
                                <span>\u26A1</span>
                                <span><strong>${(Math.round(i.sold/30*10)/10).toLocaleString("vi-VN")}</strong> \u0111\u01A1n/ng\xE0y</span>
                            </div>
                            `:""}
                            ${i.voucher_info?`
                            <div class="affiliate-voucher-badge">
                                <span>\u{1F3AB}</span>
                                <span><strong>${i.voucher_info.voucher_code||""}</strong> - ${i.voucher_info.label||""}</span>
                            </div>
                            `:""}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Overview Card -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u{1F4B0}</span>
                    <span>Th\xF4ng tin Hoa h\u1ED3ng & S\u1EA3n ph\u1EA9m</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-offer-grid">
                        ${e.most_used_channel!==void 0?`
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">K\xEAnh ra \u0111\u01A1n nhi\u1EC1u nh\u1EA5t</div>
                            <div class="affiliate-offer-stat-value secondary">${j(e.most_used_channel)}</div>
                        </div>
                        `:""}
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Hoa h\u1ED3ng</div>
                            <div class="affiliate-offer-stat-value">${e.commission||"N/A"}</div>
                        </div>
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">T\u1EF7 l\u1EC7 m\u1EB7c \u0111\u1ECBnh</div>
                            <div class="affiliate-offer-stat-value">${t.default_commission_rate||"N/A"}</div>
                        </div>
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Hoa h\u1ED3ng Shopee</div>
                            <div class="affiliate-offer-stat-value secondary">${t.shopee_commission||"N/A"}</div>
                        </div>
                        <div class="affiliate-offer-stat-item">
                            <div class="affiliate-offer-stat-label">Hoa h\u1ED3ng Seller</div>
                            <div class="affiliate-offer-stat-value secondary">${t.seller_commission||"N/A"}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Similar Products -->
            ${e.similar_product_offers&&e.similar_product_offers.list&&e.similar_product_offers.list.length>0?`
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u{1F6CD}\uFE0F</span>
                    <span>S\u1EA3n ph\u1EA9m T\u01B0\u01A1ng t\u1EF1</span>
                </div>
                <div class="affiliate-offer-card-body">
                    ${W(e.similar_product_offers,e)}
                </div>
            </div>
            `:""}
            
            <!-- Video List -->
            ${i.video_info_list&&i.video_info_list.length>0?`
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u{1F3A5}</span>
                    <span>Video S\u1EA3n ph\u1EA9m</span>
                </div>
                <div class="affiliate-offer-card-body">
                    ${D(i.video_info_list)}
                </div>
            </div>
            `:""}

            <!-- Links Section -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u{1F517}</span>
                    <span>Links Ti\u1EBFp th\u1ECB</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-links-section">
                        ${e.long_link?`
                        <div class="affiliate-link-label">Long Link</div>
                        <div class="affiliate-link-item">
                            <input type="text" class="affiliate-link-input" value="${e.long_link}" readonly id="affiliate-long-link" />
                            <button class="affiliate-link-btn" data-copy="affiliate-long-link">Copy</button>
                        </div>
                        `:""}
                        ${e.productLink?`
                        <div class="affiliate-link-label">Product Link</div>
                        <div class="affiliate-link-item">
                            <input type="text" class="affiliate-link-input" value="${e.productLink}" readonly id="affiliate-product-link" />
                            <button class="affiliate-link-btn secondary" onclick="window.open('${e.productLink}', '_blank')">M\u1EDF</button>
                            <button class="affiliate-link-btn" data-copy="affiliate-product-link">Copy</button>
                        </div>
                        `:""}
                    </div>
                </div>
            </div>

            <!-- Commission Rates Table -->
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u{1F4CA}</span>
                    <span>Chi ti\u1EBFt T\u1EF7 l\u1EC7 Hoa h\u1ED3ng</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <table class="affiliate-commission-table">
                        <thead>
                            <tr>
                                <th>Lo\u1EA1i</th>
                                <th>T\u1EF7 l\u1EC7</th>
                                <th>Hoa h\u1ED3ng</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Web - User m\u1EDBi</td>
                                <td><span class="affiliate-rate-badge ${f(t.web_new_commission_rate)}">${t.web_new_commission_rate||"N/A"}</span></td>
                                <td>${t.web_new_commission||"N/A"}</td>
                            </tr>
                            <tr>
                                <td>Web - User c\u0169</td>
                                <td><span class="affiliate-rate-badge ${f(t.web_exist_commission_rate)}">${t.web_exist_commission_rate||"N/A"}</span></td>
                                <td>${t.web_exist_commission||"N/A"}</td>
                            </tr>
                            <tr>
                                <td>App - User m\u1EDBi</td>
                                <td><span class="affiliate-rate-badge ${f(t.app_new_commission_rate)}">${t.app_new_commission_rate||"N/A"}</span></td>
                                <td>${t.app_new_commission||"N/A"}</td>
                            </tr>
                            <tr>
                                <td>App - User c\u0169</td>
                                <td><span class="affiliate-rate-badge ${f(t.app_exist_commission_rate)}">${t.app_exist_commission_rate||"N/A"}</span></td>
                                <td>${t.app_exist_commission||"N/A"}</td>
                            </tr>
                            <tr>
                                <td>Platform - User m\u1EDBi</td>
                                <td><span class="affiliate-rate-badge ${f(t.new_platform_commission_rate)}">${t.new_platform_commission_rate||"N/A"}</span></td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td>Platform - User c\u0169</td>
                                <td><span class="affiliate-rate-badge ${f(t.exist_platform_commission_rate)}">${t.exist_platform_commission_rate||"N/A"}</span></td>
                                <td>-</td>
                            </tr>
                            ${t.commission_cap?`
                            <tr>
                                <td colspan="2"><strong>Gi\u1EDBi h\u1EA1n hoa h\u1ED3ng</strong></td>
                                <td><strong>${t.commission_cap}</strong></td>
                            </tr>
                            `:""}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Commission Details by Channel -->
            ${t.shopee_commission_detail?`
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u{1F4F1}</span>
                    <span>Hoa h\u1ED3ng theo K\xEAnh</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-channel-section">
                        <div class="affiliate-channel-grid">
                            ${X(t.shopee_commission_detail)}
                        </div>
                    </div>
                </div>
            </div>
            `:""}

            <!-- Period Time -->
            ${e.period_start_time&&e.period_end_time?`
            <div class="affiliate-offer-card">
                <div class="affiliate-offer-card-header">
                    <span>\u23F0</span>
                    <span>Th\u1EDDi gian hi\u1EC7u l\u1EF1c</span>
                </div>
                <div class="affiliate-offer-card-body">
                    <div class="affiliate-period-info">
                        <div class="affiliate-period-label">B\u1EAFt \u0111\u1EA7u</div>
                        <div class="affiliate-period-value">${C(e.period_start_time)}</div>
                        <div class="affiliate-period-label" style="margin-top: 8px;">K\u1EBFt th\xFAc</div>
                        <div class="affiliate-period-value">${C(e.period_end_time)}</div>
                    </div>
                </div>
            </div>
            `:""}

        `}function X(e){let i={"Shopee Video - Item Base - User m\u1EDBi":e.shopee_video_item_base_new_commission_rate,"Shopee Video - Item Base - User c\u0169":e.shopee_video_item_base_exist_commission_rate,"Shopee Video - Shop Base - User m\u1EDBi":e.shopee_video_shop_base_new_commission_rate,"Shopee Video - Shop Base - User c\u0169":e.shopee_video_shop_base_exist_commission_rate,"Live Streaming - Item Base - User m\u1EDBi":e.live_streaming_item_base_new_commission_rate,"Live Streaming - Item Base - User c\u0169":e.live_streaming_item_base_exist_commission_rate,"Live Streaming - Shop Base - User m\u1EDBi":e.live_streaming_shop_base_new_commission_rate,"Live Streaming - Shop Base - User c\u0169":e.live_streaming_shop_base_exist_commission_rate,"Social Media - Item Base - User m\u1EDBi":e.social_media_item_base_new_commission_rate,"Social Media - Item Base - User c\u0169":e.social_media_item_base_exist_commission_rate,"Social Media - Shop Base - User m\u1EDBi":e.social_media_shop_base_new_commission_rate,"Social Media - Shop Base - User c\u0169":e.social_media_shop_base_exist_commission_rate,"Social Media - Checkout Base - User m\u1EDBi":e.social_media_check_out_base_new_commission_rate,"Social Media - Checkout Base - User c\u0169":e.social_media_check_out_base_exist_commission_rate},t="";for(let[a,s]of Object.entries(i))s&&s!=="0%"&&s!==0&&(t+=`
                    <div class="affiliate-channel-card">
                        <div class="affiliate-channel-title">
                            ${Y(a)} ${a}
                        </div>
                        <div class="affiliate-channel-rate">${s}</div>
                    </div>
                `);return t||'<div style="color: #999; font-size: 13px;">Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u</div>'}function Y(e){return e.includes("Shopee Video")?"\u{1F3A5}":e.includes("Live Streaming")?"\u{1F4FA}":e.includes("Social Media")?"\u{1F4F1}":"\u{1F4CA}"}function J(e,i){e.querySelectorAll("[data-copy]").forEach(t=>{t.addEventListener("click",function(){let a=this.getAttribute("data-copy"),s=document.getElementById(a);if(s&&H(s.value)){let n=this.textContent;this.textContent="\u2713 \u0110\xE3 copy!",this.style.background="#28a745",setTimeout(()=>{this.textContent=n,this.style.background=""},2e3)}})})}function Z(){let e=document.createElement("script");e.src=chrome.runtime.getURL("js/injected-product-offer.js"),e.onload=function(){console.log("[Affiliate Offer] injected-product-offer.js loaded."),this.remove()},e.onerror=function(){console.error("[Affiliate Offer] Failed to load injected-product-offer.js")},(document.head||document.documentElement).appendChild(e)}function ee(e,i,t,a="affiliate_offer"){if(!SERVER_CONFIG.enabled||!SERVER_CONFIG.serverUrl)return;let s={url:t,api:i,data:e,timestamp:new Date().toISOString(),pageType:a};fetch(SERVER_CONFIG.serverUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)}).then(n=>{n.ok?console.log("[Data Sync] \u0110\xE3 g\u1EEDi d\u1EEF li\u1EC7u l\xEAn server th\xE0nh c\xF4ng"):console.warn(`[Data Sync] Server tr\u1EA3 v\u1EC1 l\u1ED7i: ${n.status}`)}).catch(n=>{console.error("[Data Sync] L\u1ED7i khi g\u1EEDi d\u1EEF li\u1EC7u:",n)})}function ie(e){if(!e)return;console.log("[Affiliate Offer] \u0110\xE3 nh\u1EADn \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u product offer t\u1EEB injected script:",e),window.SHOPEE_PRODUCT_OFFER_DATA=e,k=e;let i=window.location.href;ee(e,F,i,"affiliate_offer");let a=()=>{document.body?L(e):setTimeout(a,100)};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a):setTimeout(a,500)}function te(){window.addEventListener("message",function(e){e.source===window&&e.data.type&&e.data.type==="SHOPEE_PRODUCT_OFFER_DATA"&&(console.log("[Affiliate Offer] Data received from injected script:",e.data.payload),ie(e.data.payload))})}let N=window.location.href,_=!1;function b(){let e=new URL(window.location.href);return e.pathname==="/dashboard"||e.pathname==="/dashboard/"}function y(){let e=window.location.href;if(e!==N)if(N=e,console.log("[Affiliate Offer] URL changed to:",e),_=!1,h=!1,b())w();else{let i=x();i&&i!==u&&(u=i,console.log(`[Affiliate Offer] New item_id detected: ${u}`),k=null,h=!1)}}function ae(){window.addEventListener("popstate",()=>{setTimeout(y,100)});let e=history.pushState,i=history.replaceState;history.pushState=function(...s){e.apply(history,s),setTimeout(y,100)},history.replaceState=function(...s){i.apply(history,s),setTimeout(y,100)},setInterval(y,1e3);let t=new MutationObserver(()=>{b()&&!_&&document.querySelector(".no-style-panel.dashboard-panel")&&(console.log("[Affiliate Offer] Dashboard panel detected via MutationObserver"),w())}),a=()=>{document.body?(t.observe(document.body,{childList:!0,subtree:!0}),console.log("[Affiliate Offer] Route change listener \u0111\xE3 \u0111\u01B0\u1EE3c thi\u1EBFt l\u1EADp")):document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a):setTimeout(a,100)};a()}function se(){let e=()=>{let i=document.querySelector(".no-style-panel.dashboard-panel");if(!i){setTimeout(e,500);return}if(document.getElementById("shopee-order-analysis-btn"))return;let t=document.createElement("div");t.style.cssText=`
                display: flex;
                gap: 10px;
                margin: 10px 0;
            `;let a=document.createElement("button");a.id="shopee-order-analysis-btn",a.textContent="Ph\xE2n t\xEDch \u0111\u01A1n h\xE0ng",a.style.cssText=`
                display: inline-block;
                padding: 10px 20px;
                background-color: #ee4d2d;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            `,a.addEventListener("mouseenter",()=>{a.style.backgroundColor="#d73211"}),a.addEventListener("mouseleave",()=>{a.style.backgroundColor="#ee4d2d"}),a.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_ORDER_HISTORY"})});let s=document.createElement("button");s.id="shopee-click-analysis-btn",s.textContent="Ph\xE2n t\xEDch click",s.style.cssText=`
                display: inline-block;
                padding: 10px 20px;
                background-color: #0d6efd;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            `,s.addEventListener("mouseenter",()=>{s.style.backgroundColor="#0b5ed7"}),s.addEventListener("mouseleave",()=>{s.style.backgroundColor="#0d6efd"}),s.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_CLICK_OVERVIEW"})}),t.appendChild(a),t.appendChild(s),i.appendChild(t),console.log("[Affiliate Offer] \u0110\xE3 th\xEAm n\xFAt 'Ph\xE2n t\xEDch \u0111\u01A1n h\xE0ng' v\xE0 'Ph\xE2n t\xEDch click' v\xE0o dashboard")};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}function w(){if(!b()){_=!1;return}_||(console.log("[Affiliate Offer] \u0110ang \u1EDF trang dashboard, th\xEAm n\xFAt ph\xE2n t\xEDch \u0111\u01A1n h\xE0ng..."),se(),_=!0)}function ne(){if(ae(),b()){w();return}if(u=x(),!u){console.log("[Affiliate Offer] Kh\xF4ng t\xECm th\u1EA5y item_id trong URL. Script s\u1EBD kh\xF4ng ho\u1EA1t \u0111\u1ED9ng.");return}console.log(`[Affiliate Offer] Content script started for item_id: ${u}`),console.log(`[Affiliate Offer] Current URL: ${window.location.href}`),te(),Z(),console.log("[Affiliate Offer] \u0110\xE3 kh\u1EDFi t\u1EA1o content script, \u0111ang \u0111\u1EE3i d\u1EEF li\u1EC7u t\u1EEB injected script...")}ne()})();})();
