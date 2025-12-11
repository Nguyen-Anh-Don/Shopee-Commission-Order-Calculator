(()=>{var c=!1,g=null,u=!1;function m(){let e=new URL(window.location.href),t=e.pathname.match(/\/product\/(\d+)\/(\d+)/);if(t&&t.length>2){let i=t[1];return t[2]}let n=e.search.match(/-i\.(\d+)\.(\d+)/);if(n&&n.length>2){let i=n[1];return n[2]}return null}function E(){if(document.getElementById("shopee-commission-widget-icon"))return;let e=document.createElement("div");e.id="shopee-commission-widget-icon",e.innerHTML="\u{1F4B0}",e.style.cssText=`
        position: fixed;
        bottom: 60px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #ee4d2d;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        opacity: 0.5;
        transition: transform 0.2s, opacity 0.2s;
    `,e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.1)",e.style.opacity="1"}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)",e.style.opacity="0.5"}),e.addEventListener("click",()=>{y()}),document.body.appendChild(e)}function L(){if(document.getElementById("shopee-commission-widget-panel"))return;let e=document.createElement("div");e.id="shopee-commission-widget-panel",e.style.cssText=`
        position: fixed;
        bottom: 60px;
        right: 80px;
        width: 350px;
        max-height: 500px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 999998;
        display: none;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `,e.innerHTML=`
        <div style="padding: 0.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px; color: #ee4d2d;">L\u1ECBch s\u1EED b\xE1n h\xE0ng</h3>
            <button id="widget-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">\xD7</button>
        </div>
        <div id="widget-content" style="padding: 0.5rem;">
            <div style="text-align: center; padding: 20px; color: #999;">\u0110ang t\u1EA3i...</div>
        </div>
    `,document.body.appendChild(e),document.getElementById("widget-close-btn").addEventListener("click",()=>{y()})}function y(){let e=document.getElementById("shopee-commission-widget-panel");e&&(c=!c,e.style.display=c?"block":"none",c&&x())}async function x(){let e=m();if(!e){document.getElementById("widget-content").innerHTML=`
            <div style="text-align: center; padding: 20px; color: #999;">
                Kh\xF4ng t\xECm th\u1EA5y ID s\u1EA3n ph\u1EA9m
            </div>
        `;return}g=e,chrome.runtime.sendMessage({type:"CALCULATE_PRODUCT_STATS",productId:e},t=>{if(chrome.runtime.lastError){document.getElementById("widget-content").innerHTML=`
                <div style="text-align: center; padding: 20px; color: #f00;">
                    L\u1ED7i: ${chrome.runtime.lastError.message}
                </div>
            `;return}t&&t.success?(console.log("Response:",t),T(t.stats)):document.getElementById("widget-content").innerHTML=`
                <div style="text-align: center; padding: 20px; color: #999;">
                    ${(t==null?void 0:t.error)||"Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u"}
                </div>
            `})}function T(e){var n,i,o,d,a,r;if(!e||e.totalOrders===0){document.getElementById("widget-content").innerHTML=`
            <div style="text-align: center; padding: 20px; color: #999;">
                Ch\u01B0a c\xF3 d\u1EEF li\u1EC7u b\xE1n h\xE0ng cho s\u1EA3n ph\u1EA9m n\xE0y
            </div>
        `;return}let t=`
        <div style="padding: 10px; font-family: Arial, sans-serif;">
            <div style="margin-bottom: 10px;">
                <span style="font-size: 14px; color: #555;">T\u1ED5ng s\u1ED1 \u0111\u01A1n:</span>
                <span style="font-size: 18px; font-weight: bold; color: #ee4d2d;">${e.totalOrders}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
                <span style="font-size: 14px; color: #555;">Doanh s\u1ED1:</span>
                <span style="font-size: 16px; font-weight: bold; color: #333;">${((n=e.formatted)==null?void 0:n.totalGMV)||"0 \u20AB"}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
                <span style="font-size: 14px; color: #555;">Hoa h\u1ED3ng:</span>
                <span style="font-size: 16px; font-weight: bold; color: #333;">${((i=e.formatted)==null?void 0:i.totalCommission)||"0 \u20AB"}</span>
            </div>
            
            ${e.lastOrderDate?`<div style="font-size: 14px; color: #555;">\u0110\u01A1n g\u1EA7n nh\u1EA5t: ${e.lastOrderDate}, Gi\xE1 tr\u1ECB \u0111\u01A1n: <span style="font-weight: bold; color: #ee4d2d;">${((o=e.formatted)==null?void 0:o.lastOrderAmount)||"0 \u20AB"}</span></div>`:""}
            
            <div style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <span style="font-size: 14px; color: #555;">K\xEAnh b\xE1n h\xE0ng:</span>
                <div style="display: flex; gap: 8px; margin-top: 5px;">
                    <span style="padding: 4px 6px; background: #e3f2fd; border-radius: 3px; color: #1976d2; font-size: 12px;">
                        Video: ${((d=e.channels)==null?void 0:d.video)||0}
                    </span>
                    <span style="padding: 4px 6px; background: #fff3e0; border-radius: 3px; color: #f57c00; font-size: 12px;">
                        Live: ${((a=e.channels)==null?void 0:a.live)||0}
                    </span>
                    <span style="padding: 4px 6px; background: #f3e5f5; border-radius: 3px; color: #7b1fa2; font-size: 12px;">
                        MXH: ${((r=e.channels)==null?void 0:r.social)||0}
                    </span>
                </div>
            </div>
        </div>
    `;document.getElementById("widget-content").innerHTML=t}function B(){if(document.getElementById("shopee-link-widget-icon"))return;let e=document.createElement("div");e.id="shopee-link-widget-icon",e.innerHTML="\u{1F517}",e.style.cssText=`
        position: fixed;
        bottom: 120px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #ee4d2d;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        opacity: 0.5;
        transition: transform 0.2s, opacity 0.2s;
    `,e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.1)",e.style.opacity="1"}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)",e.style.opacity="0.5"}),e.addEventListener("click",()=>{z()}),document.body.appendChild(e)}function C(){if(document.getElementById("shopee-link-widget-panel"))return;let e=document.createElement("div");e.id="shopee-link-widget-panel",e.style.cssText=`
        position: fixed;
        bottom: 60px;
        right: 80px;
        width: 400px;
        max-height: 600px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 999998;
        display: none;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `,e.innerHTML=`
        <div style="padding: 0.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px; color: #ee4d2d;">T\u1EA1o link ti\u1EBFp th\u1ECB li\xEAn k\u1EBFt</h3>
            <button id="affiliate-link-widget-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">\xD7</button>
        </div>
        <div id="affiliate-link-widget-content" style="padding: 0.5rem;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">URL:</label>
                <input type="text" id="affiliate-link-url-input" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;" />
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">Sub_id (t\xF9y ch\u1ECDn):</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <input type="text" id="affiliate-link-sub1" placeholder="Sub_id1" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                    <input type="text" id="affiliate-link-sub2" placeholder="Sub_id2" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <input type="text" id="affiliate-link-sub3" placeholder="Sub_id3" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                    <input type="text" id="affiliate-link-sub4" placeholder="Sub_id4" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" />
                </div>
                <input type="text" id="affiliate-link-sub5" placeholder="Sub_id5" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box;" />
            </div>
            <button id="affiliate-link-create-btn" style="width: 100%; padding: 10px; background: #ee4d2d; color: white; border: none; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer; margin-bottom: 15px;">T\u1EA1o link</button>
            <div id="affiliate-link-result" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">Short Link:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="affiliate-link-short-result" readonly style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: #f5f5f5;" />
                        <button id="affiliate-link-short-copy-btn" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;">Copy</button>
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #555; font-weight: 500;">Long Link:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="affiliate-link-long-result" readonly style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: #f5f5f5;" />
                        <button id="affiliate-link-long-copy-btn" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;">Copy</button>
                    </div>
                </div>
            </div>
            <div id="affiliate-link-error" style="display: none; margin-top: 10px; padding: 10px; background: #ffebee; color: #c62828; border-radius: 4px; font-size: 13px;"></div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                <button id="affiliate-link-history-btn" style="width: 100%; padding: 8px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; cursor: pointer; margin-bottom: 10px;">L\u1ECBch s\u1EED</button>
                <div id="affiliate-link-history-list" style="display: none; max-height: 200px; overflow-y: auto;"></div>
            </div>
        </div>
    `,document.body.appendChild(e),document.getElementById("affiliate-link-widget-close-btn").addEventListener("click",()=>{z()});let t=document.getElementById("affiliate-link-url-input");t&&(t.value=window.location.href),S()}function S(){let e=document.getElementById("affiliate-link-create-btn");e&&e.addEventListener("click",M);let t=document.getElementById("affiliate-link-short-copy-btn");t&&t.addEventListener("click",()=>{let o=document.getElementById("affiliate-link-short-result");o&&w(o)});let n=document.getElementById("affiliate-link-long-copy-btn");n&&n.addEventListener("click",()=>{let o=document.getElementById("affiliate-link-long-result");o&&w(o)});let i=document.getElementById("affiliate-link-history-btn");i&&i.addEventListener("click",U)}function A(e,t=3e4){return new Promise((n,i)=>{let o=setTimeout(()=>{i(new Error("Request timeout. Vui l\xF2ng th\u1EED l\u1EA1i."))},t);chrome.runtime.sendMessage(e,d=>{if(clearTimeout(o),chrome.runtime.lastError){i(new Error(chrome.runtime.lastError.message));return}if(!d){i(new Error("Kh\xF4ng nh\u1EADn \u0111\u01B0\u1EE3c ph\u1EA3n h\u1ED3i t\u1EEB background script"));return}n(d)})})}async function M(){var a,r,b,h,k;let e=document.getElementById("affiliate-link-url-input"),t=document.getElementById("affiliate-link-result"),n=document.getElementById("affiliate-link-error"),i=document.getElementById("affiliate-link-create-btn");if(!e||!t||!n||!i)return;n.style.display="none",t.style.display="none";let o=e.value.trim();if(!o){p("Vui l\xF2ng nh\u1EADp URL");return}if(!o.includes("shopee.vn")){p("URL ph\u1EA3i l\xE0 trang Shopee (shopee.vn)");return}let d={subId1:((a=document.getElementById("affiliate-link-sub1"))==null?void 0:a.value.trim())||"",subId2:((r=document.getElementById("affiliate-link-sub2"))==null?void 0:r.value.trim())||"",subId3:((b=document.getElementById("affiliate-link-sub3"))==null?void 0:b.value.trim())||"",subId4:((h=document.getElementById("affiliate-link-sub4"))==null?void 0:h.value.trim())||"",subId5:((k=document.getElementById("affiliate-link-sub5"))==null?void 0:k.value.trim())||""};i.disabled=!0,i.textContent="\u0110ang t\u1EA1o...";try{console.log("[Content] G\u1EEDi request CREATE_AFFILIATE_LINK:",o);let s=await A({type:"CREATE_AFFILIATE_LINK",originalLink:o,subIds:d},6e3);if(console.log("[Content] Nh\u1EADn \u0111\u01B0\u1EE3c response:",s),s.success){let l=document.getElementById("affiliate-link-short-result"),v=document.getElementById("affiliate-link-long-result");l&&(l.value=s.shortLink||""),v&&(v.value=s.longLink||""),t.style.display="block",H({originalLink:o,subIds:d,shortLink:s.shortLink||"",longLink:s.longLink||""})}else{let l=s.error||"Kh\xF4ng th\u1EC3 t\u1EA1o link";l==="UNAUTHORIZED"&&(l="Vui l\xF2ng \u0111\u0103ng nh\u1EADp v\xE0o https://affiliate.shopee.vn tr\u01B0\u1EDBc"),p(l)}}catch(s){console.error("[Content] Error in handleCreateAffiliateLink:",s);let l=s.message||"\u0110\xE3 x\u1EA3y ra l\u1ED7i";l.includes("port closed")||l.includes("message port closed")?p("K\u1EBFt n\u1ED1i b\u1ECB \u0111\xF3ng. Vui l\xF2ng th\u1EED l\u1EA1i ho\u1EB7c ki\u1EC3m tra k\u1EBFt n\u1ED1i."):l.includes("timeout")?p("Y\xEAu c\u1EA7u m\u1EA5t qu\xE1 nhi\u1EC1u th\u1EDDi gian. Vui l\xF2ng th\u1EED l\u1EA1i."):p("L\u1ED7i: "+l)}finally{i.disabled=!1,i.textContent="T\u1EA1o link"}}function p(e){let t=document.getElementById("affiliate-link-error");t&&(t.textContent=e,t.style.display="block")}function w(e){var t;e.select(),e.setSelectionRange(0,99999);try{document.execCommand("copy");let n=((t=e.nextElementSibling)==null?void 0:t.textContent)||"";e.nextElementSibling&&(e.nextElementSibling.textContent="\u0110\xE3 copy!",setTimeout(()=>{e.nextElementSibling&&(e.nextElementSibling.textContent=n)},2e3))}catch(n){console.error("Copy failed:",n)}}async function H(e){try{let t={...e,createdAt:new Date().toLocaleString("vi-VN"),timestamp:Date.now()};await idb.saveAffiliateLink(t),(await idb.getAllAffiliateLinks()).length>100}catch(t){console.error("Error saving affiliate link:",t)}}async function R(){try{return await idb.getAllAffiliateLinks()||[]}catch(e){return console.error("Error loading affiliate link history:",e),[]}}async function U(){let e=document.getElementById("affiliate-link-history-list"),t=document.getElementById("affiliate-link-history-btn");if(!(!e||!t))if(e.style.display==="none"||!e.style.display){let n=await R();if(n.length===0)e.innerHTML='<div style="padding: 10px; text-align: center; color: #999; font-size: 13px;">Ch\u01B0a c\xF3 l\u1ECBch s\u1EED</div>';else{let i='<div style="max-height: 300px; overflow-y: auto;">';n.forEach((o,d)=>{i+=`
                    <div style="padding: 10px; border-bottom: 1px solid #eee; ${d===n.length-1?"border-bottom: none;":""}">
                        <div style="font-size: 12px; color: #999; margin-bottom: 5px;">${o.createdAt}</div>
                        <div style="font-size: 12px; color: #555; margin-bottom: 5px; word-break: break-all;">${o.originalLink}</div>
                        <div style="display: flex; gap: 5px; margin-top: 5px;">
                            <input type="text" value="${o.shortLink||""}" readonly style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; background: #f5f5f5;" />
                            <button class="history-copy-btn" data-link="${o.shortLink||""}" style="padding: 4px 8px; background: #4CAF50; color: white; border: none; border-radius: 3px; font-size: 11px; cursor: pointer;">Copy</button>
                        </div>
                    </div>
                `}),i+="</div>",e.innerHTML=i,e.querySelectorAll(".history-copy-btn").forEach(o=>{o.addEventListener("click",d=>{let a=d.target.getAttribute("data-link");if(a){let r=document.createElement("input");r.value=a,document.body.appendChild(r),r.select(),document.execCommand("copy"),document.body.removeChild(r),d.target.textContent="\u0110\xE3 copy!",setTimeout(()=>{d.target.textContent="Copy"},2e3)}})})}e.style.display="block",t.textContent="\u1EA8n l\u1ECBch s\u1EED"}else e.style.display="none",t.textContent="L\u1ECBch s\u1EED"}function z(){let e=document.getElementById("shopee-link-widget-panel");if(e&&(u=!u,e.style.display=u?"block":"none",u)){let t=document.getElementById("affiliate-link-url-input");t&&(t.value=window.location.href),document.getElementById("affiliate-link-result").style.display="none",document.getElementById("affiliate-link-history-list").style.display="none",document.getElementById("affiliate-link-error").style.display="none"}}chrome.runtime.onMessage.addListener((e,t,n)=>{if(e.type==="SHOW_PRODUCT_STATS"){let i=e.productId||m();i&&(g=i,c?x():y()),n({success:!0})}return!0});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",I):I();function I(){m()&&(E(),L());let t=new URL(window.location.href);t.hostname==="shopee.vn"&&t.pathname!=="/"&&t.pathname.length>1&&(B(),C()),$()}function $(){let e=window.location.href;window.addEventListener("popstate",f);let t=history.pushState,n=history.replaceState;history.pushState=function(...o){t.apply(history,o),setTimeout(f,100)},history.replaceState=function(...o){n.apply(history,o),setTimeout(f,100)},new MutationObserver(()=>{window.location.href!==e&&(e=window.location.href,f())}).observe(document,{childList:!0,subtree:!0}),setInterval(()=>{window.location.href!==e&&(e=window.location.href,f())},1e3)}function f(){let e=new URL(window.location.href);if(e.hostname==="shopee.vn"&&e.pathname!=="/"&&e.pathname.length>1){if(document.getElementById("shopee-link-widget-icon")||B(),!document.getElementById("shopee-link-widget-panel"))C();else if(u){let n=document.getElementById("affiliate-link-url-input");n&&(n.value=window.location.href)}}else{let n=document.getElementById("shopee-link-widget-icon"),i=document.getElementById("shopee-link-widget-panel");n&&n.remove(),i&&i.remove()}let t=m();if(t)document.getElementById("shopee-commission-widget-icon")||E(),document.getElementById("shopee-commission-widget-panel")||L(),g!==t&&(g=t,c&&x());else{let n=document.getElementById("shopee-commission-widget-icon"),i=document.getElementById("shopee-commission-widget-panel");n&&n.remove(),i&&i.remove()}}})();
