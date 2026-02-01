import{s as Y,v as j,n as F,o as V}from"./theme-CHys-yvq.js";import{E as J}from"./api-lEPXQ6QH.js";import{p as X,r as Q}from"./templateParser-B4WoPzG9.js";const Z=200,ee=64,a=j,E=j.accent,q=`
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
      font-family: ${a.font};
      pointer-events: none;
      right: 16px;
      bottom: 140px;
    `,document.body.appendChild(n)),n.style.background=t==="error"?"rgba(220, 38, 38, 0.92)":E,n.textContent=e,n.style.opacity="1",n.style.transform="translateY(0)",window.setTimeout(()=>{n.style.opacity="0",n.style.transform="translateY(6px)"},1400)}function A(e){const t=e.getBoundingClientRect(),n=window.getComputedStyle(e);return t.width>10&&t.height>10&&n.display!=="none"&&n.visibility!=="hidden"&&n.opacity!=="0"}function k(){const e=Array.from(document.querySelectorAll("textarea")).filter(A).filter(n=>{const o=n.placeholder?.toLowerCase()||"";return!(o.includes("setting")||o.includes("preference"))});if(e.length)return e.sort((n,o)=>o.clientWidth*o.clientHeight-n.clientWidth*n.clientHeight),e[0];const t=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(A);return t.length?(t.sort((n,o)=>o.clientWidth*o.clientHeight-n.clientWidth*n.clientHeight),t[0]):null}function B(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}async function D(e,t){if(e instanceof HTMLTextAreaElement){const n=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}));return}e.focus(),e.innerText=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}))}function ne(e){e.style.right=`${Z}px`,e.style.bottom=`${ee}px`,e.style.left="auto",e.style.top="auto"}function oe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }
  `,document.head.appendChild(e)}function re(e,t){const n=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${t}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(n)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function se(){const e=document.getElementById("pp-enhance-wrap");e&&(e.style.background=a.bg,e.style.border=`1px solid ${a.border}`,e.style.boxShadow=a.shadow,e.style.borderRadius="999px",e.style.fontFamily=a.font);const t=document.getElementById("pp-save-btn");t&&(t.style.background="transparent",t.style.border="none",t.style.color=a.text,t.style.fontFamily=a.font,t.style.borderRadius="999px");const n=document.getElementById("pp-enhance-btn");n&&(n.style.background="transparent",n.style.border="none",n.style.color=a.text,n.style.fontFamily=a.font,n.style.borderRadius="999px");const o=document.getElementById("pp-enhance-mode");o&&(o.style.background=a.bg,o.style.border="none",o.style.color=a.text,o.style.fontFamily=a.font,re(o,a.text))}let g=null,N=location.href,L=!1,z=null,K=new Set,$="structured",P=!1,C=!1;function ie(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function ae(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},t=>{if(chrome.runtime.lastError){e(null);return}const n=t?.token;e(typeof n=="string"?n:null)})}):null}function M(e){C=e;const t=document.getElementById("pp-save-btn"),n=document.getElementById("pp-enhance-btn"),o=!e||P;t&&(t.disabled=o,t.style.opacity=o?"0.6":"1",t.style.cursor=o?"not-allowed":"pointer"),n&&(n.disabled=o,n.style.opacity=o?"0.6":"1",n.style.cursor=o?"not-allowed":"pointer")}function H(e){P=e;const t=document.getElementById("pp-enhance-btn"),n=document.getElementById("pp-save-btn"),o=document.getElementById("pp-enhance-status"),s=document.getElementById("pp-enhance-mode");t&&(t.innerHTML=e?te:q,t.setAttribute("aria-busy",e?"true":"false"),t.title=e?"Enhancing...":"Enhance prompt"),n&&(n.disabled=e||!C),o&&(o.textContent=e?"Enhancing...":"",o.style.display=e?"inline-flex":"none"),s&&(s.disabled=e),M(C)}async function W(){if(!g)return;const e=B(g).trim();if(!e)return m("Nothing to save","error");const t=await F({text:e,source:"deepseek",url:location.href});if(t.ok)return m(`Saved (${t.count}/${t.max})`,"success");if(t.reason==="limit")return m("Limit reached","error");if(t.reason==="empty")return m("Nothing to save","error")}async function G(){if(P||!g)return;const e=B(g).trim();if(!e)return;if(e.length>6e3){m("Prompt too long to enhance","error");return}const t=await ae();if(!t){m("Sign in to use enhance feature","error");return}H(!0);try{const n=await fetch(J,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({text:e,mode:$})});if(n.status===429){m("Enhance limit reached","error");return}if(!n.ok){m("Enhance failed","error");return}const o=await n.json();o.enhanced&&(await D(g,o.enhanced),m("Prompt enhanced","success"))}catch{m("Enhance failed","error")}finally{H(!1)}}function O(){let e=ie();if(!e){const t=document.getElementById("pp-enhance-wrap");t&&t.remove(),oe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
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
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(p=>{const c=document.createElement("option");c.value=p.value,c.textContent=p.label,n.appendChild(c)}),n.value=$,n.addEventListener("change",()=>{$=n.value});const s=document.createElement("button");s.id="pp-enhance-btn",s.type="button",s.title="Enhance prompt",s.style.cssText=`
      width: 32px;
      height: 32px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,s.innerHTML=q,s.addEventListener("click",()=>{G()});const r=document.createElement("button");r.id="pp-save-btn",r.type="button",r.title="Save prompt",r.textContent="Save",r.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      cursor: pointer;
    `,r.addEventListener("click",()=>{W()});const l=document.createElement("span");l.id="pp-enhance-status",l.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
    `,e.appendChild(n),e.appendChild(s),e.appendChild(r),e.appendChild(l),document.body.appendChild(e)}return se(),M(C),e}function de(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const t=k();t&&(g=t),e.preventDefault(),e.stopPropagation(),W()})}function ce(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const t=k();t&&(g=t),e.preventDefault(),e.stopPropagation(),G()})}function b(){L||(L=!0,requestAnimationFrame(()=>{L=!1,S()}))}function S(){if(location.href!==N){N=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),K.clear()}le();const e=k();if(g=e,!e){const o=O();o.style.display="none";return}const t=B(e).trim(),n=O();M(t.length>0),n.style.display="flex",ne(n)}function le(){document.querySelectorAll(".ds-message").forEach(t=>{if(!(t instanceof HTMLElement)||t.dataset.ppProcessed==="true"||t.querySelector(".ds-markdown"))return;const n=t.querySelector('div[class*="fbb737a4"]');if(!n)return;const o=n.textContent?.trim();if(!o||o.length<1)return;t.dataset.ppProcessed="true",window.getComputedStyle(t).position==="static"&&(t.style.position="relative");const r=document.createElement("button");r.className="pp-bubble-save-btn",r.type="button",r.setAttribute("aria-label","Save to PromptPack"),r.title="Save to PromptPack",r.__promptText=o,r.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${E}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>`,r.style.cssText=`
      position: absolute;
      right: -36px;
      top: 50%;
      transform: translateY(-50%);
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
    `,r.addEventListener("mouseenter",()=>{r.style.background="rgba(139, 92, 246, 0.2)",r.style.opacity="1"}),r.addEventListener("mouseleave",()=>{r.style.background="transparent"}),r.addEventListener("click",async l=>{l.stopPropagation(),l.preventDefault();const p=l.currentTarget.__promptText;if(!p){m("No prompt to save","error");return}const c=await F({text:p,source:"deepseek",url:location.href});c.ok?m(`Saved! (${c.count}/${c.max})`,"success"):c.reason==="limit"?m("Limit reached","error"):c.reason==="empty"&&m("Nothing to save","error")}),t.appendChild(r),K.add(t),t.addEventListener("mouseenter",()=>{r.style.opacity="1"}),t.addEventListener("mouseleave",()=>{r.style.opacity="0"})})}function _(){Y({persistToStorage:!0}),S();let e=0;const t=setInterval(()=>{S(),e++,e>=10&&clearInterval(t)},200);z=new MutationObserver(b),z.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",b),window.addEventListener("scroll",b,{passive:!0}),de(),ce();const n=history.pushState.bind(history),o=history.replaceState.bind(history);history.pushState=function(...s){n(...s),b()},history.replaceState=function(...s){o(...s),b()},window.addEventListener("popstate",b),he()}let u=null;function pe(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
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
  `,document.body.appendChild(e),e}function I(){u&&(u.style.display="none")}async function ue(e,t){u||(u=pe());const n=await V("deepseek"),o=n.reduce((p,c)=>p+c.prompts.length,0),s={border:a.border,text:a.text,hover:"rgba(139, 92, 246, 0.15)"};if(o===0)u.innerHTML=`
      <div style="padding: 12px 16px; color: ${s.text}; text-align: center;">
        No saved DeepSeek prompts yet
      </div>
    `;else{const p=n.map((d,i)=>({group:d,index:i})).filter(({group:d})=>d.prompts.length>0);u.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${s.border}; display: flex; align-items: center; gap: 8px; color: ${s.text};">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${p.map(({group:d,index:i},f)=>{const x=f===p.length-1?"none":`1px solid ${s.border}`;return`
          <div class="pp-group" data-group-index="${i}">
            <div class="pp-group-header" data-group-index="${i}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${x};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
              color: ${s.text};
            ">
              <span class="pp-arrow" style="transition: transform 0.2s; color: ${E};">▶</span>
              ${d.displayName} (${d.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${i}" style="display: none;">
              ${d.prompts.map((y,w)=>{const T=y.header||(y.text.length>50?y.text.substring(0,50)+"...":y.text);return`
                <div class="pp-menu-item" data-group-index="${i}" data-prompt-index="${w}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${w<d.prompts.length-1?`1px solid ${s.border}`:"none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  color: ${s.text};
                " title="${y.text.replace(/"/g,"&quot;")}">
                  ${T}
                </div>
              `}).join("")}
            </div>
          </div>
        `}).join("")}
    `,u.querySelectorAll(".pp-group-header").forEach(d=>{const i=d;i.addEventListener("mouseenter",()=>i.style.background=s.hover),i.addEventListener("mouseleave",()=>i.style.background="transparent"),i.addEventListener("click",()=>{const f=i.dataset.groupIndex,h=u.querySelector(`.pp-group-items[data-group-index="${f}"]`),x=i.querySelector(".pp-arrow");if(h){const y=h.style.display!=="none";h.style.display=y?"none":"block",x&&(x.style.transform=y?"rotate(0deg)":"rotate(90deg)")}})}),u.querySelectorAll(".pp-menu-item").forEach(d=>{const i=d,f=parseInt(i.dataset.groupIndex||"0",10),h=parseInt(i.dataset.promptIndex||"0",10);i.addEventListener("mouseenter",()=>i.style.background=s.hover),i.addEventListener("mouseleave",()=>i.style.background="transparent"),i.addEventListener("click",()=>{const x=n[f];if(x&&x.prompts[h]){const y=x.prompts[h].text;I();const w=X(y);w.length>0?me(w,T=>{const U=Q(y,T);R(U)}):R(y)}})})}let r=e,l=t;r+250>window.innerWidth&&(r=window.innerWidth-260),l+300>window.innerHeight&&(l=window.innerHeight-310),u.style.left=`${r}px`,u.style.top=`${l}px`,u.style.display="block"}async function R(e){const t=k();t&&(await D(t,e),t.focus())}function me(e,t){const n=document.getElementById("pp-template-dialog");n&&n.remove();const o=document.createElement("div");o.id="pp-template-dialog",o.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;const s=document.createElement("div");s.style.cssText=`
    background: ${a.bg};
    border: 1px solid ${a.border};
    border-radius: 8px;
    padding: 16px 20px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: ${a.shadow};
    font-family: ${a.font};
  `;const r=document.createElement("div");r.textContent="Fill in values",r.style.cssText=`font-size: 14px; font-weight: 600; margin-bottom: 12px; color: ${E};`,s.appendChild(r);const l=[];e.forEach(d=>{const i=document.createElement("div");i.style.cssText="margin-bottom: 10px;";const f=document.createElement("label");f.textContent=d,f.style.cssText=`display: block; font-size: 12px; color: ${a.secondary}; margin-bottom: 4px;`;const h=document.createElement("input");h.type="text",h.placeholder=d,h.style.cssText=`
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${a.border};
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      background: ${a.inputBg};
      color: ${a.text};
    `,i.appendChild(f),i.appendChild(h),s.appendChild(i),l.push(h)});const p=document.createElement("div");p.style.cssText="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;";const c=document.createElement("button");c.textContent="Cancel",c.style.cssText=`
    padding: 8px 16px;
    border: 1px solid ${a.border};
    border-radius: 6px;
    background: transparent;
    color: ${a.text};
    cursor: pointer;
  `,c.addEventListener("click",()=>o.remove());const v=document.createElement("button");v.textContent="Insert",v.style.cssText=`
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: ${E};
    color: white;
    cursor: pointer;
  `,v.addEventListener("click",()=>{const d={};e.forEach((i,f)=>{d[i]=l[f].value||""}),o.remove(),t(d)}),p.appendChild(c),p.appendChild(v),s.appendChild(p),o.appendChild(s),document.body.appendChild(o),o.addEventListener("click",d=>{d.target===o&&o.remove()}),l[0]&&l[0].focus()}function he(){document.addEventListener("contextmenu",e=>{const t=e.target,n=k();n&&(t===n||n.contains(t))&&(e.preventDefault(),ue(e.clientX,e.clientY))}),document.addEventListener("click",e=>{u&&!u.contains(e.target)&&I()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&I()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_):_();
