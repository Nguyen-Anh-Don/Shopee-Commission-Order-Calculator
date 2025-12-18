(()=>{var n=[],c=null;function r(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}document.addEventListener("DOMContentLoaded",function(){m();let e=document.getElementById("editModal");e&&(c=new bootstrap.Modal(e));let t=document.getElementById("saveFavoriteBtn");t&&t.addEventListener("click",g);let i=document.getElementById("favoritesContainer");i&&i.addEventListener("click",function(s){let o=s.target.closest("[data-action]");if(!o)return;let a=o.getAttribute("data-action"),d=parseInt(o.getAttribute("data-index"));a==="edit"&&!isNaN(d)?u(d):a==="delete"&&!isNaN(d)&&y(d)})});async function m(){try{if(n=await idb.getAllFavorites(),document.getElementById("loadingMessage").style.display="none",n.length===0){document.getElementById("mainContent").style.display="none",document.getElementById("noDataMessage").style.display="block";return}document.getElementById("mainContent").style.display="block",document.getElementById("noDataMessage").style.display="none",l()}catch(e){console.error("Error loading favorites:",e),document.getElementById("loadingMessage").style.display="none",document.getElementById("noDataMessage").style.display="block"}}function l(){let e=document.getElementById("favoritesContainer");if(e){if(n.length===0){e.innerHTML="";return}e.innerHTML=n.map((t,i)=>{let s=t.tags&&t.tags.length>0?t.tags.map(d=>`<span class="tag">${r(d)}</span>`).join(""):"",o=t.notes?`<div class="favorite-item-notes">${r(t.notes)}</div>`:"",a=t.item_id?`product-detail.html?item_id=${encodeURIComponent(t.item_id)}&name=${encodeURIComponent(t.item_name||"")}&shop=${encodeURIComponent(t.shop_name||"")}`:`product-detail.html?name=${encodeURIComponent(t.item_name||"")}&shop=${encodeURIComponent(t.shop_name||"")}`;return`
                <div class="favorite-item">
                    <div class="favorite-item-header">
                        <div class="favorite-item-content">
                            <div class="favorite-item-title">${r(t.item_name||"Kh\xF4ng c\xF3 t\xEAn")}</div>
                            <div class="favorite-item-shop">${r(t.shop_name||"Kh\xF4ng r\xF5 shop")}</div>
                            <div class="favorite-item-category">${r(t.category||"")}</div>
                            ${o}
                            ${s?`<div class="favorite-item-tags">${s}</div>`:""}
                        </div>
                        <div class="favorite-item-actions">
                            <a href="${a}" class="btn btn-sm btn-info" title="Xem chi ti\u1EBFt">
                                \u{1F50D}
                            </a>
                            <button
                                class="btn btn-sm btn-warning"
                                data-action="edit"
                                data-index="${i}"
                                title="S\u1EEDa"
                            >
                                \u270F\uFE0F
                            </button>
                            <button
                                class="btn btn-sm btn-danger"
                                data-action="delete"
                                data-index="${i}"
                                title="X\xF3a"
                            >
                                \u{1F5D1}\uFE0F
                            </button>
                        </div>
                    </div>
                    ${t.product_link?`<div class="mt-2"><a href="${t.product_link}" target="_blank" class="btn btn-sm btn-outline-primary">\u{1F517} M\u1EDF s\u1EA3n ph\u1EA9m tr\xEAn Shopee</a></div>`:""}
                </div>
            `}).join("")}}function u(e){let t=n[e];t&&(document.getElementById("editFavoriteId").value=e,document.getElementById("editNotes").value=t.notes||"",document.getElementById("editTags").value=t.tags?t.tags.join(", "):"",c&&c.show())}async function g(){try{let e=parseInt(document.getElementById("editFavoriteId").value),t=n[e];if(!t)return;let i=document.getElementById("editNotes").value.trim(),s=document.getElementById("editTags").value.trim(),o=s?s.split(",").map(a=>a.trim()).filter(a=>a):[];await idb.updateFavorite(t.item_id,t.item_name,t.shop_name,{notes:i,tags:o}),n[e].notes=i,n[e].tags=o,l(),c&&c.hide()}catch(e){console.error("Error saving favorite edit:",e),alert("C\xF3 l\u1ED7i x\u1EA3y ra khi l\u01B0u thay \u0111\u1ED5i")}}async function y(e){let t=n[e];if(t&&confirm(`B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n x\xF3a "${t.item_name||"s\u1EA3n ph\u1EA9m n\xE0y"}" kh\u1ECFi danh s\xE1ch y\xEAu th\xEDch?`))try{await idb.deleteFavorite(t.item_id,t.item_name,t.shop_name),n.splice(e,1),n.length===0?(document.getElementById("mainContent").style.display="none",document.getElementById("noDataMessage").style.display="block"):l()}catch(i){console.error("Error deleting favorite:",i),alert("C\xF3 l\u1ED7i x\u1EA3y ra khi x\xF3a s\u1EA3n ph\u1EA9m y\xEAu th\xEDch")}}})();
