import{s as V,v as j,n as F,o as Y}from"./theme-CHys-yvq.js";import{E as J}from"./api-lEPXQ6QH.js";import{p as X,r as Q}from"./templateParser-B4WoPzG9.js";const Z=200,ee=64,a=j,w=j.accent,q=`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3z"></path>
    <path d="M18 3l1 2.5L21.5 6l-2.5 1L18 9.5l-1-2.5L14.5 6l2.5-1L18 3z"></path>
  </svg>
`,te=`
  <svg class="pp-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12"></circle>
  </svg>
`;function u(e,t="success"){let n=document.getElementById("pp-toast");n||(n=document.createElement("div"),n.id="pp-toast",n.style.cssText=`
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
    `,document.body.appendChild(n)),n.style.background=t==="error"?"rgba(220, 38, 38, 0.92)":w,n.textContent=e,n.style.opacity="1",n.style.transform="translateY(0)",window.setTimeout(()=>{n.style.opacity="0",n.style.transform="translateY(6px)"},1400)}function L(e){const t=e.getBoundingClientRect(),n=window.getComputedStyle(e);return t.width>10&&t.height>10&&n.display!=="none"&&n.visibility!=="hidden"&&n.opacity!=="0"}function k(){const e=document.querySelector('.chat-input-editor[data-lexical-editor="true"]');if(e&&L(e))return e;const t=Array.from(document.querySelectorAll('[data-lexical-editor="true"][contenteditable="true"]')).filter(L);if(t.length)return t.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),t[0];const n=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(L);return n.length?(n.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),n[0]):null}function P(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}async function K(e,t){if(e instanceof HTMLTextAreaElement){const n=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}));return}e.focus(),e.innerText=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}))}function ne(e){e.style.right=`${Z}px`,e.style.bottom=`${ee}px`,e.style.left="auto",e.style.top="auto"}function oe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }
  `,document.head.appendChild(e)}function re(e,t){const n=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${t}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(n)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function se(){const e=document.getElementById("pp-enhance-wrap");e&&(e.style.background=a.bg,e.style.border=`1px solid ${a.border}`,e.style.boxShadow=a.shadow,e.style.borderRadius="999px",e.style.fontFamily=a.font);const t=document.getElementById("pp-save-btn");t&&(t.style.background="transparent",t.style.border="none",t.style.color=a.text,t.style.fontFamily=a.font,t.style.borderRadius="999px");const n=document.getElementById("pp-enhance-btn");n&&(n.style.background="transparent",n.style.border="none",n.style.color=a.text,n.style.fontFamily=a.font,n.style.borderRadius="999px");const o=document.getElementById("pp-enhance-mode");o&&(o.style.background=a.bg,o.style.border="none",o.style.color=a.text,o.style.fontFamily=a.font,re(o,a.text))}let b=null,H=location.href,$=!1,N=null,W=new Set,S="structured",M=!1,T=!1;function ie(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function ae(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},t=>{if(chrome.runtime.lastError){e(null);return}const n=t?.token;e(typeof n=="string"?n:null)})}):null}function A(e){T=e;const t=document.getElementById("pp-save-btn"),n=document.getElementById("pp-enhance-btn"),o=!e||M;t&&(t.disabled=o,t.style.opacity=o?"0.6":"1",t.style.cursor=o?"not-allowed":"pointer"),n&&(n.disabled=o,n.style.opacity=o?"0.6":"1",n.style.cursor=o?"not-allowed":"pointer")}function z(e){M=e;const t=document.getElementById("pp-enhance-btn"),n=document.getElementById("pp-save-btn"),o=document.getElementById("pp-enhance-status"),r=document.getElementById("pp-enhance-mode");t&&(t.innerHTML=e?te:q,t.setAttribute("aria-busy",e?"true":"false"),t.title=e?"Enhancing...":"Enhance prompt"),n&&(n.disabled=e||!T),o&&(o.textContent=e?"Enhancing...":"",o.style.display=e?"inline-flex":"none"),r&&(r.disabled=e),A(T)}async function D(){if(!b)return;const e=P(b).trim();if(!e)return u("Nothing to save","error");const t=await F({text:e,source:"kimi",url:location.href});if(t.ok)return u(`Saved (${t.count}/${t.max})`,"success");if(t.reason==="limit")return u("Limit reached","error");if(t.reason==="empty")return u("Nothing to save","error")}async function G(){if(M||!b)return;const e=P(b).trim();if(!e)return;if(e.length>6e3){u("Prompt too long to enhance","error");return}const t=await ae();if(!t){u("Sign in to use enhance feature","error");return}z(!0);try{const n=await fetch(J,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({text:e,mode:S})});if(n.status===429){u("Enhance limit reached","error");return}if(!n.ok){u("Enhance failed","error");return}const o=await n.json();o.enhanced&&(await K(b,o.enhanced),u("Prompt enhanced","success"))}catch{u("Enhance failed","error")}finally{z(!1)}}function O(){let e=ie();if(!e){const t=document.getElementById("pp-enhance-wrap");t&&t.remove(),oe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
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
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(c=>{const l=document.createElement("option");l.value=c.value,l.textContent=c.label,n.appendChild(l)}),n.value=S,n.addEventListener("change",()=>{S=n.value});const r=document.createElement("button");r.id="pp-enhance-btn",r.type="button",r.title="Enhance prompt",r.style.cssText=`
      width: 32px;
      height: 32px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,r.innerHTML=q,r.addEventListener("click",()=>{G()});const s=document.createElement("button");s.id="pp-save-btn",s.type="button",s.title="Save prompt",s.textContent="Save",s.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
    `,s.addEventListener("click",()=>{D()});const m=document.createElement("span");m.id="pp-enhance-status",m.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
    `,e.appendChild(n),e.appendChild(r),e.appendChild(s),e.appendChild(m),document.body.appendChild(e)}return se(),A(T),e}function de(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const t=k();t&&(b=t),e.preventDefault(),e.stopPropagation(),D()})}function ce(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const t=k();t&&(b=t),e.preventDefault(),e.stopPropagation(),G()})}function v(){$||($=!0,requestAnimationFrame(()=>{$=!1,I()}))}function I(){if(location.href!==H){H=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),W.clear()}le();const e=k();if(b=e,!e){const o=O();o.style.display="none";return}const t=P(e).trim(),n=O();A(t.length>0),n.style.display="flex",ne(n)}function le(){document.querySelectorAll(".user-content").forEach(t=>{if(!(t instanceof HTMLElement)||t.dataset.ppProcessed==="true")return;const n=t.textContent?.trim();if(!n||n.length<1)return;t.dataset.ppProcessed="true";const o=t.closest(".segment-content-box");if(!o||!(o instanceof HTMLElement))return;window.getComputedStyle(o).position==="static"&&(o.style.position="relative");const s=document.createElement("button");s.className="pp-bubble-save-btn",s.type="button",s.setAttribute("aria-label","Save to PromptPack"),s.title="Save to PromptPack",s.__promptText=n,s.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${w}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>`,s.style.cssText=`
      position: absolute;
      right: -36px;
      top: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s, opacity 0.15s;
      border: none;
      background: transparent;
      opacity: 0;
      z-index: 10;
    `,s.addEventListener("mouseenter",()=>{s.style.background="rgba(139, 92, 246, 0.2)",s.style.opacity="1"}),s.addEventListener("mouseleave",()=>{s.style.background="transparent"}),s.addEventListener("click",async l=>{l.stopPropagation(),l.preventDefault();const x=l.currentTarget.__promptText;if(!x){u("No prompt to save","error");return}const d=await F({text:x,source:"kimi",url:location.href});d.ok?u(`Saved! (${d.count}/${d.max})`,"success"):d.reason==="limit"?u("Limit reached","error"):d.reason==="empty"&&u("Nothing to save","error")}),o.appendChild(s),W.add(t);const c=o.closest(".segment-content")||o;c.addEventListener("mouseenter",()=>{s.style.opacity="1"}),c.addEventListener("mouseleave",()=>{s.style.opacity="0"})})}function _(){V({persistToStorage:!0}),I();let e=0;const t=setInterval(()=>{I(),e++,e>=10&&clearInterval(t)},200);N=new MutationObserver(v),N.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",v),window.addEventListener("scroll",v,{passive:!0}),de(),ce();const n=history.pushState.bind(history),o=history.replaceState.bind(history);history.pushState=function(...r){n(...r),v()},history.replaceState=function(...r){o(...r),v()},window.addEventListener("popstate",v),he()}let p=null;function pe(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
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
  `,document.body.appendChild(e),e}function B(){p&&(p.style.display="none")}async function ue(e,t){p||(p=pe());const n=await Y("kimi"),o=n.reduce((c,l)=>c+l.prompts.length,0),r={border:a.border,text:a.text,hover:"rgba(139, 92, 246, 0.15)"};if(o===0)p.innerHTML=`
      <div style="padding: 12px 16px; color: ${r.text}; text-align: center;">
        No saved Kimi prompts yet
      </div>
    `;else{const c=n.map((d,i)=>({group:d,index:i})).filter(({group:d})=>d.prompts.length>0);p.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${r.border}; display: flex; align-items: center; gap: 8px; color: ${r.text};">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${c.map(({group:d,index:i},f)=>{const g=f===c.length-1?"none":`1px solid ${r.border}`;return`
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
              ${d.prompts.map((y,E)=>{const C=y.header||(y.text.length>50?y.text.substring(0,50)+"...":y.text);return`
                <div class="pp-menu-item" data-group-index="${i}" data-prompt-index="${E}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${E<d.prompts.length-1?`1px solid ${r.border}`:"none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  color: ${r.text};
                " title="${y.text.replace(/"/g,"&quot;")}">
                  ${C}
                </div>
              `}).join("")}
            </div>
          </div>
        `}).join("")}
    `,p.querySelectorAll(".pp-group-header").forEach(d=>{const i=d;i.addEventListener("mouseenter",()=>i.style.background=r.hover),i.addEventListener("mouseleave",()=>i.style.background="transparent"),i.addEventListener("click",()=>{const f=i.dataset.groupIndex,h=p.querySelector(`.pp-group-items[data-group-index="${f}"]`),g=i.querySelector(".pp-arrow");if(h){const y=h.style.display!=="none";h.style.display=y?"none":"block",g&&(g.style.transform=y?"rotate(0deg)":"rotate(90deg)")}})}),p.querySelectorAll(".pp-menu-item").forEach(d=>{const i=d,f=parseInt(i.dataset.groupIndex||"0",10),h=parseInt(i.dataset.promptIndex||"0",10);i.addEventListener("mouseenter",()=>i.style.background=r.hover),i.addEventListener("mouseleave",()=>i.style.background="transparent"),i.addEventListener("click",()=>{const g=n[f];if(g&&g.prompts[h]){const y=g.prompts[h].text;B();const E=X(y);E.length>0?me(E,C=>{const U=Q(y,C);R(U)}):R(y)}})})}let s=e,m=t;s+250>window.innerWidth&&(s=window.innerWidth-260),m+300>window.innerHeight&&(m=window.innerHeight-310),p.style.left=`${s}px`,p.style.top=`${m}px`,p.style.display="block"}async function R(e){const t=k();t&&(await K(t,e),t.focus())}function me(e,t){const n=document.getElementById("pp-template-dialog");n&&n.remove();const o=document.createElement("div");o.id="pp-template-dialog",o.style.cssText=`
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
  `;const s=document.createElement("div");s.textContent="Fill in values",s.style.cssText=`font-size: 14px; font-weight: 600; margin-bottom: 12px; color: ${w};`,r.appendChild(s);const m=[];e.forEach(d=>{const i=document.createElement("div");i.style.cssText="margin-bottom: 10px;";const f=document.createElement("label");f.textContent=d,f.style.cssText=`display: block; font-size: 12px; color: ${a.secondary}; margin-bottom: 4px;`;const h=document.createElement("input");h.type="text",h.placeholder=d,h.style.cssText=`
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${a.border};
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      background: ${a.inputBg};
      color: ${a.text};
    `,i.appendChild(f),i.appendChild(h),r.appendChild(i),m.push(h)});const c=document.createElement("div");c.style.cssText="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;";const l=document.createElement("button");l.textContent="Cancel",l.style.cssText=`
    padding: 8px 16px;
    border: 1px solid ${a.border};
    border-radius: 6px;
    background: transparent;
    color: ${a.text};
    cursor: pointer;
  `,l.addEventListener("click",()=>o.remove());const x=document.createElement("button");x.textContent="Insert",x.style.cssText=`
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: ${w};
    color: white;
    cursor: pointer;
  `,x.addEventListener("click",()=>{const d={};e.forEach((i,f)=>{d[i]=m[f].value||""}),o.remove(),t(d)}),c.appendChild(l),c.appendChild(x),r.appendChild(c),o.appendChild(r),document.body.appendChild(o),o.addEventListener("click",d=>{d.target===o&&o.remove()}),m[0]&&m[0].focus()}function he(){document.addEventListener("contextmenu",e=>{const t=e.target,n=k();n&&(t===n||n.contains(t))&&(e.preventDefault(),ue(e.clientX,e.clientY))}),document.addEventListener("click",e=>{p&&!p.contains(e.target)&&B()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&B()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_):_();
