import{s as Y,n as j,o as V,v as q}from"./theme-CHys-yvq.js";import{E as J}from"./api-lEPXQ6QH.js";import{p as X,r as Q}from"./templateParser-B4WoPzG9.js";const Z=200,ee=64,i=q,k=q.accent,F=`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3z"></path>
    <path d="M18 3l1 2.5L21.5 6l-2.5 1L18 9.5l-1-2.5L14.5 6l2.5-1L18 3z"></path>
  </svg>
`,te=`
  <svg class="pp-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12"></circle>
  </svg>
`;function m(e,t="success"){let n=document.getElementById("pp-toast");n||(n=document.createElement("div"),n.id="pp-toast",n.style.cssText=`
      position: fixed;
      z-index: 1000001;
      padding: 10px 12px;
      border-radius: 12px;
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: ${i.font};
      pointer-events: none;
      right: 16px;
      bottom: 140px;
    `,document.body.appendChild(n)),n.style.background=t==="error"?"rgba(220, 38, 38, 0.92)":k,n.textContent=e,n.style.opacity="1",n.style.transform="translateY(0)",window.setTimeout(()=>{n.style.opacity="0",n.style.transform="translateY(6px)"},1400)}function M(e){const t=e.getBoundingClientRect(),n=window.getComputedStyle(e);return t.width>10&&t.height>10&&n.display!=="none"&&n.visibility!=="hidden"&&n.opacity!=="0"}function w(){const e=Array.from(document.querySelectorAll("textarea")).filter(M).filter(n=>{const o=n.placeholder?.toLowerCase()||"";return!(o.includes("setting")||o.includes("preference"))});if(e.length)return e.sort((n,o)=>o.clientWidth*o.clientHeight-n.clientWidth*n.clientHeight),e[0];const t=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(M);return t.length?(t.sort((n,o)=>o.clientWidth*o.clientHeight-n.clientWidth*n.clientHeight),t[0]):null}function B(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}async function K(e,t){if(e instanceof HTMLTextAreaElement){const n=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}));return}e.focus(),e.innerText=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}))}function ne(e){e.style.right=`${Z}px`,e.style.bottom=`${ee}px`,e.style.left="auto",e.style.top="auto"}function oe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }
  `,document.head.appendChild(e)}function re(e,t){const n=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${t}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(n)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function se(){const e=document.getElementById("pp-enhance-wrap");e&&(e.style.background=i.bg,e.style.border=`1px solid ${i.border}`,e.style.boxShadow=i.shadow,e.style.borderRadius="999px",e.style.fontFamily=i.font);const t=document.getElementById("pp-save-btn");t&&(t.style.background="transparent",t.style.border="none",t.style.color=i.text,t.style.fontFamily=i.font,t.style.borderRadius="999px");const n=document.getElementById("pp-enhance-btn");n&&(n.style.background="transparent",n.style.border="none",n.style.color=i.text,n.style.fontFamily=i.font,n.style.borderRadius="999px");const o=document.getElementById("pp-enhance-mode");o&&(o.style.background=i.bg,o.style.border="none",o.style.color=i.text,o.style.fontFamily=i.font,re(o,i.text))}let g=null,N=location.href,L=!1,H=null,W=new Set,$="structured",P=!1,C=!1;function ie(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function ae(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},t=>{if(chrome.runtime.lastError){e(null);return}const n=t?.token;e(typeof n=="string"?n:null)})}):null}function A(e){C=e;const t=document.getElementById("pp-save-btn"),n=document.getElementById("pp-enhance-btn"),o=!e||P;t&&(t.disabled=o,t.style.opacity=o?"0.6":"1",t.style.cursor=o?"not-allowed":"pointer"),n&&(n.disabled=o,n.style.opacity=o?"0.6":"1",n.style.cursor=o?"not-allowed":"pointer")}function z(e){P=e;const t=document.getElementById("pp-enhance-btn"),n=document.getElementById("pp-save-btn"),o=document.getElementById("pp-enhance-status"),r=document.getElementById("pp-enhance-mode");t&&(t.innerHTML=e?te:F,t.setAttribute("aria-busy",e?"true":"false"),t.title=e?"Enhancing...":"Enhance prompt"),n&&(n.disabled=e||!C),o&&(o.textContent=e?"Enhancing...":"",o.style.display=e?"inline-flex":"none"),r&&(r.disabled=e),A(C)}async function D(){if(!g)return;const e=B(g).trim();if(!e)return m("Nothing to save","error");const t=await j({text:e,source:"grok",url:location.href});if(t.ok)return m(`Saved (${t.count}/${t.max})`,"success");if(t.reason==="limit")return m("Limit reached","error");if(t.reason==="empty")return m("Nothing to save","error")}async function G(){if(P||!g)return;const e=B(g).trim();if(!e)return;if(e.length>6e3){m("Prompt too long to enhance","error");return}const t=await ae();if(!t){m("Sign in to use enhance feature","error");return}z(!0);try{const n=await fetch(J,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({text:e,mode:$})});if(n.status===429){m("Enhance limit reached","error");return}if(!n.ok){m("Enhance failed","error");return}const o=await n.json();o.enhanced&&(await K(g,o.enhanced),m("Prompt enhanced","success"))}catch{m("Enhance failed","error")}finally{z(!1)}}function O(){let e=ie();if(!e){const t=document.getElementById("pp-enhance-wrap");t&&t.remove(),oe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
      position: fixed;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 999px;
      user-select: none;
    `;const n=document.createElement("select");n.id="pp-enhance-mode",n.title="Enhance mode",n.style.cssText=`
      height: 32px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      max-width: 130px;
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(d=>{const p=document.createElement("option");p.value=d.value,p.textContent=d.label,n.appendChild(p)}),n.value=$,n.addEventListener("change",()=>{$=n.value});const r=document.createElement("button");r.id="pp-enhance-btn",r.type="button",r.title="Enhance prompt",r.style.cssText=`
      width: 32px;
      height: 32px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,r.innerHTML=F,r.addEventListener("click",()=>{G()});const a=document.createElement("button");a.id="pp-save-btn",a.type="button",a.title="Save prompt",a.textContent="Save",a.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
    `,a.addEventListener("click",()=>{D()});const c=document.createElement("span");c.id="pp-enhance-status",c.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
    `,e.appendChild(n),e.appendChild(r),e.appendChild(a),e.appendChild(c),document.body.appendChild(e)}return se(),A(C),e}function ce(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const t=w();t&&(g=t),e.preventDefault(),e.stopPropagation(),D()})}function le(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const t=w();t&&(g=t),e.preventDefault(),e.stopPropagation(),G()})}function b(){L||(L=!0,requestAnimationFrame(()=>{L=!1,S()}))}function S(){if(location.href!==N){N=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),W.clear()}pe();const e=w();if(g=e,!e){const o=O();o.style.display="none";return}const t=B(e).trim(),n=O();A(t.length>0),n.style.display="flex",ne(n)}function de(e){const t=document.createElement("button");t.className="pp-bubble-save-icon inline-flex items-center justify-center",t.type="button",t.setAttribute("aria-label","Save prompt to PromptPack"),t.title="Save to PromptPack",t.__promptText=e,t.style.cssText=`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 9999px;
    cursor: pointer;
    transition: background-color 0.1s, opacity 0.15s;
    border: none;
    background: transparent;
    opacity: 0;
  `,t.addEventListener("mouseenter",()=>{t.style.background="rgba(139, 92, 246, 0.2)",t.style.opacity="1"}),t.addEventListener("mouseleave",()=>{t.style.background="transparent"});const n=chrome.runtime.getURL("img/icon-16.png");return t.innerHTML=`<img src="${n}" width="16" height="16" alt="Save" style="opacity: 0.8;">`,t.addEventListener("click",async o=>{o.stopPropagation(),o.preventDefault();const r=o.currentTarget.__promptText;if(!r){m("No prompt to save","error");return}const a=await j({text:r,source:"grok",url:location.href});a.ok?m(`Saved! (${a.count}/${a.max})`,"success"):a.reason==="limit"?m("Limit reached","error"):a.reason==="empty"&&m("Nothing to save","error")}),t}function pe(){document.querySelectorAll('button[aria-label="Edit"]').forEach(t=>{const n=t.parentElement;if(!n||n.querySelector(".pp-bubble-save-icon"))return;let o=t,r="";for(let d=0;d<15&&o;d++){const p=o.querySelector('[class*="whitespace-pre-wrap"]')||o.querySelector('[class*="break-word"]');if(p&&p.textContent){r=p.textContent.trim();break}o=o.parentElement}if(!r)return;W.add(n);const a=de(r);n.insertBefore(a,t);let c=t;for(let d=0;d<10&&c&&!(c.classList.contains("group")||c.getAttribute("class")?.includes("group"));d++)c=c.parentElement;c&&(c.addEventListener("mouseenter",()=>{a.style.opacity="1"}),c.addEventListener("mouseleave",()=>{a.style.opacity="0"}))})}function _(){Y({persistToStorage:!0}),S();let e=0;const t=setInterval(()=>{S(),e++,e>=10&&clearInterval(t)},200);H=new MutationObserver(b),H.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",b),window.addEventListener("scroll",b,{passive:!0}),ce(),le();const n=history.pushState.bind(history),o=history.replaceState.bind(history);history.pushState=function(...r){n(...r),b()},history.replaceState=function(...r){o(...r),b()},window.addEventListener("popstate",b),ye()}let u=null;function ue(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
    position: fixed;
    z-index: 999999;
    background: ${i.bg};
    border: 1px solid ${i.border};
    border-radius: 8px;
    box-shadow: ${i.shadow};
    min-width: 200px;
    max-width: 300px;
    max-height: 400px;
    overflow: hidden;
    overflow-y: auto;
    padding: 0;
    font-family: ${i.font};
    font-size: 13px;
    display: none;
  `,document.body.appendChild(e),e}function I(){u&&(u.style.display="none")}async function me(e,t){u||(u=ue());const n=await V("grok"),o=n.reduce((d,p)=>d+p.prompts.length,0),r={border:i.border,text:i.text,hover:"rgba(139, 92, 246, 0.15)"};if(o===0)u.innerHTML=`
      <div style="padding: 12px 16px; color: ${r.text}; text-align: center;">
        No saved Grok prompts yet
      </div>
    `;else{const d=n.map((l,s)=>({group:l,index:s})).filter(({group:l})=>l.prompts.length>0);u.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${r.border}; display: flex; align-items: center; gap: 8px; color: ${r.text};">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${d.map(({group:l,index:s},h)=>{const x=h===d.length-1?"none":`1px solid ${r.border}`;return`
          <div class="pp-group" data-group-index="${s}">
            <div class="pp-group-header" data-group-index="${s}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${x};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
              color: ${r.text};
            ">
              <span class="pp-arrow" style="transition: transform 0.2s; color: ${k};">▶</span>
              ${l.displayName} (${l.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${s}" style="display: none;">
              ${l.prompts.map((y,E)=>{const T=y.header||(y.text.length>50?y.text.substring(0,50)+"...":y.text);return`
                <div class="pp-menu-item" data-group-index="${s}" data-prompt-index="${E}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${E<l.prompts.length-1?`1px solid ${r.border}`:"none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  color: ${r.text};
                " title="${y.text.replace(/"/g,"&quot;")}">
                  ${T}
                </div>
              `}).join("")}
            </div>
          </div>
        `}).join("")}
    `,u.querySelectorAll(".pp-group-header").forEach(l=>{const s=l;s.addEventListener("mouseenter",()=>s.style.background=r.hover),s.addEventListener("mouseleave",()=>s.style.background="transparent"),s.addEventListener("click",()=>{const h=s.dataset.groupIndex,f=u.querySelector(`.pp-group-items[data-group-index="${h}"]`),x=s.querySelector(".pp-arrow");if(f){const y=f.style.display!=="none";f.style.display=y?"none":"block",x&&(x.style.transform=y?"rotate(0deg)":"rotate(90deg)")}})}),u.querySelectorAll(".pp-menu-item").forEach(l=>{const s=l,h=parseInt(s.dataset.groupIndex||"0",10),f=parseInt(s.dataset.promptIndex||"0",10);s.addEventListener("mouseenter",()=>s.style.background=r.hover),s.addEventListener("mouseleave",()=>s.style.background="transparent"),s.addEventListener("click",()=>{const x=n[h];if(x&&x.prompts[f]){const y=x.prompts[f].text;I();const E=X(y);E.length>0?fe(E,T=>{const U=Q(y,T);R(U)}):R(y)}})})}let a=e,c=t;a+250>window.innerWidth&&(a=window.innerWidth-260),c+300>window.innerHeight&&(c=window.innerHeight-310),u.style.left=`${a}px`,u.style.top=`${c}px`,u.style.display="block"}async function R(e){const t=w();t&&(await K(t,e),t.focus())}function fe(e,t){const n=document.getElementById("pp-template-dialog");n&&n.remove();const o=document.createElement("div");o.id="pp-template-dialog",o.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;const r=document.createElement("div");r.style.cssText=`
    background: ${i.bg};
    border: 1px solid ${i.border};
    border-radius: 8px;
    padding: 16px 20px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: ${i.shadow};
    font-family: ${i.font};
  `;const a=document.createElement("div");a.textContent="Fill in values",a.style.cssText=`font-size: 14px; font-weight: 600; margin-bottom: 12px; color: ${k};`,r.appendChild(a);const c=[];e.forEach(l=>{const s=document.createElement("div");s.style.cssText="margin-bottom: 10px;";const h=document.createElement("label");h.textContent=l,h.style.cssText=`display: block; font-size: 12px; color: ${i.secondary}; margin-bottom: 4px;`;const f=document.createElement("input");f.type="text",f.placeholder=l,f.style.cssText=`
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${i.border};
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      background: ${i.inputBg};
      color: ${i.text};
    `,s.appendChild(h),s.appendChild(f),r.appendChild(s),c.push(f)});const d=document.createElement("div");d.style.cssText="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;";const p=document.createElement("button");p.textContent="Cancel",p.style.cssText=`
    padding: 8px 16px;
    border: 1px solid ${i.border};
    border-radius: 6px;
    background: transparent;
    color: ${i.text};
    cursor: pointer;
  `,p.addEventListener("click",()=>o.remove());const v=document.createElement("button");v.textContent="Insert",v.style.cssText=`
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: ${k};
    color: white;
    cursor: pointer;
  `,v.addEventListener("click",()=>{const l={};e.forEach((s,h)=>{l[s]=c[h].value||""}),o.remove(),t(l)}),d.appendChild(p),d.appendChild(v),r.appendChild(d),o.appendChild(r),document.body.appendChild(o),o.addEventListener("click",l=>{l.target===o&&o.remove()}),c[0]&&c[0].focus()}function ye(){document.addEventListener("contextmenu",e=>{const t=e.target,n=w();n&&(t===n||n.contains(t))&&(e.preventDefault(),me(e.clientX,e.clientY))}),document.addEventListener("click",e=>{u&&!u.contains(e.target)&&I()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&I()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_):_();
