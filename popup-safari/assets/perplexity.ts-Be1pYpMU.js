import{s as V,v as j,n as q,o as Y}from"./theme-CHys-yvq.js";import{E as J}from"./api-lEPXQ6QH.js";import{p as X,r as Q}from"./templateParser-B4WoPzG9.js";const Z=200,ee=64,a=j,w=j.accent,F=`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3z"></path>
    <path d="M18 3l1 2.5L21.5 6l-2.5 1L18 9.5l-1-2.5L14.5 6l2.5-1L18 3z"></path>
  </svg>
`,te=`
  <svg class="pp-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12"></circle>
  </svg>
`;function m(e,n="success"){let t=document.getElementById("pp-toast");t||(t=document.createElement("div"),t.id="pp-toast",t.style.cssText=`
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
      font-family: ${a.font};
      pointer-events: none;
      right: 16px;
      bottom: 140px;
    `,document.body.appendChild(t)),t.style.background=n==="error"?"rgba(220, 38, 38, 0.92)":w,t.textContent=e,t.style.opacity="1",t.style.transform="translateY(0)",window.setTimeout(()=>{t.style.opacity="0",t.style.transform="translateY(6px)"},1400)}function M(e){const n=e.getBoundingClientRect(),t=window.getComputedStyle(e);return n.width>10&&n.height>10&&t.display!=="none"&&t.visibility!=="hidden"&&t.opacity!=="0"}function k(){const e=Array.from(document.querySelectorAll("textarea")).filter(M).filter(t=>{const o=t.placeholder?.toLowerCase()||"";return!(o.includes("setting")||o.includes("preference"))});if(e.length)return e.sort((t,o)=>o.clientWidth*o.clientHeight-t.clientWidth*t.clientHeight),e[0];const n=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(M);return n.length?(n.sort((t,o)=>o.clientWidth*o.clientHeight-t.clientWidth*t.clientHeight),n[0]):null}function B(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}async function D(e,n){if(e instanceof HTMLTextAreaElement){const t=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;t?t.call(e,n):e.value=n,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:n}));return}e.focus(),e.innerText=n,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:n}))}function ne(e){e.style.right=`${Z}px`,e.style.bottom=`${ee}px`,e.style.left="auto",e.style.top="auto"}function oe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }
  `,document.head.appendChild(e)}function re(e,n){const t=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${n}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(t)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function se(){const e=document.getElementById("pp-enhance-wrap");e&&(e.style.background=a.bg,e.style.border=`1px solid ${a.border}`,e.style.boxShadow=a.shadow,e.style.borderRadius="999px",e.style.fontFamily=a.font);const n=document.getElementById("pp-save-btn");n&&(n.style.background="transparent",n.style.border="none",n.style.color=a.text,n.style.fontFamily=a.font,n.style.borderRadius="999px");const t=document.getElementById("pp-enhance-btn");t&&(t.style.background="transparent",t.style.border="none",t.style.color=a.text,t.style.fontFamily=a.font,t.style.borderRadius="999px");const o=document.getElementById("pp-enhance-mode");o&&(o.style.background=a.bg,o.style.border="none",o.style.color=a.text,o.style.fontFamily=a.font,re(o,a.text))}let b=null,N=location.href,L=!1,H=null,K=new Set,$="structured",P=!1,T=!1;function ie(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function ae(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},n=>{if(chrome.runtime.lastError){e(null);return}const t=n?.token;e(typeof t=="string"?t:null)})}):null}function A(e){T=e;const n=document.getElementById("pp-save-btn"),t=document.getElementById("pp-enhance-btn"),o=!e||P;n&&(n.disabled=o,n.style.opacity=o?"0.6":"1",n.style.cursor=o?"not-allowed":"pointer"),t&&(t.disabled=o,t.style.opacity=o?"0.6":"1",t.style.cursor=o?"not-allowed":"pointer")}function z(e){P=e;const n=document.getElementById("pp-enhance-btn"),t=document.getElementById("pp-save-btn"),o=document.getElementById("pp-enhance-status"),r=document.getElementById("pp-enhance-mode");n&&(n.innerHTML=e?te:F,n.setAttribute("aria-busy",e?"true":"false"),n.title=e?"Enhancing...":"Enhance prompt"),t&&(t.disabled=e||!T),o&&(o.textContent=e?"Enhancing...":"",o.style.display=e?"inline-flex":"none"),r&&(r.disabled=e),A(T)}async function W(){if(!b)return;const e=B(b).trim();if(!e)return m("Nothing to save","error");const n=await q({text:e,source:"perplexity",url:location.href});if(n.ok)return m(`Saved (${n.count}/${n.max})`,"success");if(n.reason==="limit")return m("Limit reached","error");if(n.reason==="empty")return m("Nothing to save","error")}async function G(){if(P||!b)return;const e=B(b).trim();if(!e)return;if(e.length>6e3){m("Prompt too long to enhance","error");return}const n=await ae();if(!n){m("Sign in to use enhance feature","error");return}z(!0);try{const t=await fetch(J,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({text:e,mode:$})});if(t.status===429){m("Enhance limit reached","error");return}if(!t.ok){m("Enhance failed","error");return}const o=await t.json();o.enhanced&&(await D(b,o.enhanced),m("Prompt enhanced","success"))}catch{m("Enhance failed","error")}finally{z(!1)}}function O(){let e=ie();if(!e){const n=document.getElementById("pp-enhance-wrap");n&&n.remove(),oe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
      position: fixed;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 999px;
      user-select: none;
    `;const t=document.createElement("select");t.id="pp-enhance-mode",t.title="Enhance mode",t.style.cssText=`
      height: 32px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      max-width: 130px;
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(c=>{const p=document.createElement("option");p.value=c.value,p.textContent=c.label,t.appendChild(p)}),t.value=$,t.addEventListener("change",()=>{$=t.value});const r=document.createElement("button");r.id="pp-enhance-btn",r.type="button",r.title="Enhance prompt",r.style.cssText=`
      width: 32px;
      height: 32px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,r.innerHTML=F,r.addEventListener("click",()=>{G()});const l=document.createElement("button");l.id="pp-save-btn",l.type="button",l.title="Save prompt",l.textContent="Save",l.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
    `,l.addEventListener("click",()=>{W()});const s=document.createElement("span");s.id="pp-enhance-status",s.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
    `,e.appendChild(t),e.appendChild(r),e.appendChild(l),e.appendChild(s),document.body.appendChild(e)}return se(),A(T),e}function le(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const n=k();n&&(b=n),e.preventDefault(),e.stopPropagation(),W()})}function de(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const n=k();n&&(b=n),e.preventDefault(),e.stopPropagation(),G()})}function v(){L||(L=!0,requestAnimationFrame(()=>{L=!1,S()}))}function S(){if(location.href!==N){N=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),K.clear()}ce();const e=k();if(b=e,!e){const o=O();o.style.display="none";return}const n=B(e).trim(),t=O();A(n.length>0),t.style.display="flex",ne(t)}function ce(){document.querySelectorAll('[class*="group/query"]').forEach(n=>{if(!(n instanceof HTMLElement)||n.querySelector(".pp-bubble-save-btn"))return;const t=n.querySelector("div.bg-offset");if(!t)return;const r=t.querySelector("span.select-text")?.textContent?.trim();if(!r||r.length<1)return;const l=document.createElement("div");l.className="pp-bubble-wrapper",l.style.cssText=`
      display: inline-flex;
      align-items: center;
      gap: 8px;
    `;const s=document.createElement("button");s.className="pp-bubble-save-btn",s.type="button",s.setAttribute("aria-label","Save to PromptPack"),s.title="Save to PromptPack",s.__promptText=r,s.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${w}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>`,s.style.cssText=`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border-radius: 9999px;
      cursor: pointer;
      transition: background-color 0.15s, opacity 0.15s;
      border: none;
      background: transparent;
      opacity: 0;
      flex-shrink: 0;
    `,s.addEventListener("mouseenter",()=>{s.style.background="rgba(139, 92, 246, 0.2)",s.style.opacity="1"}),s.addEventListener("mouseleave",()=>{s.style.background="transparent"}),s.addEventListener("click",async c=>{c.stopPropagation(),c.preventDefault();const p=c.currentTarget.__promptText;if(!p){m("No prompt to save","error");return}const f=await q({text:p,source:"perplexity",url:location.href});f.ok?m(`Saved! (${f.count}/${f.max})`,"success"):f.reason==="limit"?m("Limit reached","error"):f.reason==="empty"&&m("Nothing to save","error")}),t.parentNode?.insertBefore(l,t),l.appendChild(t),l.appendChild(s),K.add(n),l.addEventListener("mouseenter",()=>{s.style.opacity="1"}),l.addEventListener("mouseleave",()=>{s.style.opacity="0"})})}function _(){V({persistToStorage:!0}),S();let e=0;const n=setInterval(()=>{S(),e++,e>=10&&clearInterval(n)},200);H=new MutationObserver(v),H.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",v),window.addEventListener("scroll",v,{passive:!0}),le(),de();const t=history.pushState.bind(history),o=history.replaceState.bind(history);history.pushState=function(...r){t(...r),v()},history.replaceState=function(...r){o(...r),v()},window.addEventListener("popstate",v),ye()}let u=null;function pe(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
    position: fixed;
    z-index: 999999;
    background: ${a.bg};
    border: 1px solid ${a.border};
    border-radius: 8px;
    box-shadow: ${a.shadow};
    min-width: 200px;
    max-width: 300px;
    max-height: 400px;
    overflow: hidden;
    overflow-y: auto;
    padding: 0;
    font-family: ${a.font};
    font-size: 13px;
    display: none;
  `,document.body.appendChild(e),e}function I(){u&&(u.style.display="none")}async function ue(e,n){u||(u=pe());const t=await Y("perplexity"),o=t.reduce((c,p)=>c+p.prompts.length,0),r={border:a.border,text:a.text,hover:"rgba(139, 92, 246, 0.15)"};if(o===0)u.innerHTML=`
      <div style="padding: 12px 16px; color: ${r.text}; text-align: center;">
        No saved Perplexity prompts yet
      </div>
    `;else{const c=t.map((d,i)=>({group:d,index:i})).filter(({group:d})=>d.prompts.length>0);u.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${r.border}; display: flex; align-items: center; gap: 8px; color: ${r.text};">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${c.map(({group:d,index:i},x)=>{const g=x===c.length-1?"none":`1px solid ${r.border}`;return`
          <div class="pp-group" data-group-index="${i}">
            <div class="pp-group-header" data-group-index="${i}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${g};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
              color: ${r.text};
            ">
              <span class="pp-arrow" style="transition: transform 0.2s; color: ${w};">▶</span>
              ${d.displayName} (${d.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${i}" style="display: none;">
              ${d.prompts.map((h,E)=>{const C=h.header||(h.text.length>50?h.text.substring(0,50)+"...":h.text);return`
                <div class="pp-menu-item" data-group-index="${i}" data-prompt-index="${E}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${E<d.prompts.length-1?`1px solid ${r.border}`:"none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  color: ${r.text};
                " title="${h.text.replace(/"/g,"&quot;")}">
                  ${C}
                </div>
              `}).join("")}
            </div>
          </div>
        `}).join("")}
    `,u.querySelectorAll(".pp-group-header").forEach(d=>{const i=d;i.addEventListener("mouseenter",()=>i.style.background=r.hover),i.addEventListener("mouseleave",()=>i.style.background="transparent"),i.addEventListener("click",()=>{const x=i.dataset.groupIndex,y=u.querySelector(`.pp-group-items[data-group-index="${x}"]`),g=i.querySelector(".pp-arrow");if(y){const h=y.style.display!=="none";y.style.display=h?"none":"block",g&&(g.style.transform=h?"rotate(0deg)":"rotate(90deg)")}})}),u.querySelectorAll(".pp-menu-item").forEach(d=>{const i=d,x=parseInt(i.dataset.groupIndex||"0",10),y=parseInt(i.dataset.promptIndex||"0",10);i.addEventListener("mouseenter",()=>i.style.background=r.hover),i.addEventListener("mouseleave",()=>i.style.background="transparent"),i.addEventListener("click",()=>{const g=t[x];if(g&&g.prompts[y]){const h=g.prompts[y].text;I();const E=X(h);E.length>0?me(E,C=>{const U=Q(h,C);R(U)}):R(h)}})})}let l=e,s=n;l+250>window.innerWidth&&(l=window.innerWidth-260),s+300>window.innerHeight&&(s=window.innerHeight-310),u.style.left=`${l}px`,u.style.top=`${s}px`,u.style.display="block"}async function R(e){const n=k();n&&(await D(n,e),n.focus())}function me(e,n){const t=document.getElementById("pp-template-dialog");t&&t.remove();const o=document.createElement("div");o.id="pp-template-dialog",o.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;const r=document.createElement("div");r.style.cssText=`
    background: ${a.bg};
    border: 1px solid ${a.border};
    border-radius: 8px;
    padding: 16px 20px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: ${a.shadow};
    font-family: ${a.font};
  `;const l=document.createElement("div");l.textContent="Fill in values",l.style.cssText=`font-size: 14px; font-weight: 600; margin-bottom: 12px; color: ${w};`,r.appendChild(l);const s=[];e.forEach(d=>{const i=document.createElement("div");i.style.cssText="margin-bottom: 10px;";const x=document.createElement("label");x.textContent=d,x.style.cssText=`display: block; font-size: 12px; color: ${a.secondary}; margin-bottom: 4px;`;const y=document.createElement("input");y.type="text",y.placeholder=d,y.style.cssText=`
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${a.border};
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      background: ${a.inputBg};
      color: ${a.text};
    `,i.appendChild(x),i.appendChild(y),r.appendChild(i),s.push(y)});const c=document.createElement("div");c.style.cssText="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;";const p=document.createElement("button");p.textContent="Cancel",p.style.cssText=`
    padding: 8px 16px;
    border: 1px solid ${a.border};
    border-radius: 6px;
    background: transparent;
    color: ${a.text};
    cursor: pointer;
  `,p.addEventListener("click",()=>o.remove());const f=document.createElement("button");f.textContent="Insert",f.style.cssText=`
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: ${w};
    color: white;
    cursor: pointer;
  `,f.addEventListener("click",()=>{const d={};e.forEach((i,x)=>{d[i]=s[x].value||""}),o.remove(),n(d)}),c.appendChild(p),c.appendChild(f),r.appendChild(c),o.appendChild(r),document.body.appendChild(o),o.addEventListener("click",d=>{d.target===o&&o.remove()}),s[0]&&s[0].focus()}function ye(){document.addEventListener("contextmenu",e=>{const n=e.target,t=k();t&&(n===t||t.contains(n))&&(e.preventDefault(),ue(e.clientX,e.clientY))}),document.addEventListener("click",e=>{u&&!u.contains(e.target)&&I()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&I()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_):_();
