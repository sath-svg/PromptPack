import{m as ee,s as te,t as k,n as _,o as ne}from"./theme-CHys-yvq.js";import{E as oe}from"./api-lEPXQ6QH.js";import{p as re,r as ie}from"./templateParser-B4WoPzG9.js";const se=150,ae=90,X=`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3z"></path>
    <path d="M18 3l1 2.5L21.5 6l-2.5 1L18 9.5l-1-2.5L14.5 6l2.5-1L18 3z"></path>
  </svg>
`,le=`
  <svg class="pp-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12"></circle>
  </svg>
`;function f(e,t="success"){let n=document.getElementById("pp-toast");n||(n=document.createElement("div"),n.id="pp-toast",n.style.cssText=`
      position: absolute;
      z-index: 1000001;
      padding: 10px 12px;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: Google Sans, Roboto, ui-sans-serif, system-ui, -apple-system, Arial;
      pointer-events: none;
    `,document.body.appendChild(n)),n.style.background=t==="error"?"rgba(220, 38, 38, 0.92)":"rgba(59, 130, 246, 0.92)";const i=T();if(i){const o=i.getBoundingClientRect(),r=200,s=80;n.style.position="fixed",n.style.left=`${o.right+s}px`,n.style.top=`${o.top}px`,o.right+s+r>window.innerWidth&&(n.style.left=`${o.left-r-s}px`)}else n.style.position="fixed",n.style.right="16px",n.style.bottom="140px";n.textContent=e,n.style.opacity="1",n.style.transform="translateY(0)",window.setTimeout(()=>{n.style.opacity="0",n.style.transform="translateY(6px)"},1400)}function P(e){const t=e.getBoundingClientRect(),n=window.getComputedStyle(e);return t.width>10&&t.height>10&&n.display!=="none"&&n.visibility!=="hidden"&&n.opacity!=="0"}function T(){const e=document.querySelector('div[contenteditable="true"][role="textbox"], div[contenteditable="true"][aria-label*="prompt"], div[contenteditable="true"][aria-label*="message"]');if(e&&P(e))return e;const t=o=>{let r=o.parentElement,s=0;for(;r&&s<20;){const d=r.getAttribute("role"),u=r.getAttribute("aria-modal");if(d==="dialog"||u==="true"||r.classList.contains("modal")||r.classList.contains("settings"))return!1;if(r.tagName==="FORM"){const h=r.className.toLowerCase();if(h.includes("setting")||h.includes("preference"))return!1}r=r.parentElement,s++}if(o instanceof HTMLTextAreaElement){const d=o.placeholder.toLowerCase();if(d.includes("additional behavior")||d.includes("preference")||d.includes("custom instruction"))return!1}return!0},n=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(P).filter(t);if(n.length)return n.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),n[0];const i=Array.from(document.querySelectorAll("textarea")).filter(P).filter(t);return i.length?(i.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),i[0]):null}function j(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}function ce(e,t){if(e instanceof HTMLTextAreaElement){const n=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}));return}e.textContent=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}))}function de(e){e.style.right=`${se}px`,e.style.bottom=`${ae}px`,e.style.left="auto",e.style.top="auto"}function pe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }

    /* Gemini dropdown styling - light theme */
    #pp-enhance-mode option {
      background: rgb(245, 245, 245);
      color: rgba(0, 0, 0, 0.87);
    }
    #pp-enhance-mode:focus {
      outline: 2px solid rgba(0, 0, 0, 0.12);
      outline-offset: 2px;
    }

    /* Gemini dropdown styling - dark theme */
    @media (prefers-color-scheme: dark) {
      #pp-enhance-mode option {
        background: rgb(32, 33, 36);
        color: rgba(255, 255, 255, 0.87);
      }
      #pp-enhance-mode:focus {
        outline: 2px solid rgba(255, 255, 255, 0.12);
        outline-offset: 2px;
      }
    }
  `,document.head.appendChild(e)}function ue(e,t){const n=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${t}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(n)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function V(e){const t=e==="dark"?k.dark:k.light,n=document.getElementById("pp-enhance-wrap");n&&(n.style.background=t.buttonBg,n.style.border=`1px solid ${t.border}`,n.style.boxShadow=t.shadow,n.style.borderRadius="8px",n.style.fontFamily=t.font,n.style.backdropFilter="none",n.style.webkitBackdropFilter="none");const i=document.getElementById("pp-save-btn");i&&(i.style.background="transparent",i.style.border="none",i.style.color=t.text,i.style.fontFamily=t.font,i.style.borderRadius="8px");const o=document.getElementById("pp-enhance-btn");o&&(o.style.background="transparent",o.style.border="none",o.style.color=t.text,o.style.fontFamily=t.font,o.style.borderRadius="8px");const r=document.getElementById("pp-enhance-mode");r&&(r.style.background=t.buttonBg,r.style.border="none",r.style.color=t.text,r.style.fontFamily=t.font,ue(r,t.text));const s=document.getElementById("pp-enhance-status");s&&(s.style.color=t.text)}let C=null,w=ee(),U=location.href,K=!1,O=null,H=new Set,M="structured",q=!1,N=!1;function me(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function fe(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},t=>{if(chrome.runtime.lastError){e(null);return}const n=t?.token;e(typeof n=="string"?n:null)})}):null}function D(e){N=e;const t=document.getElementById("pp-save-btn"),n=document.getElementById("pp-enhance-btn"),i=!e||q;t&&(t.disabled=i,t.style.opacity=i?"0.6":"1",t.style.cursor=i?"not-allowed":"pointer"),n&&(n.disabled=i,n.style.opacity=i?"0.6":"1",n.style.cursor=i?"not-allowed":"pointer")}function G(e){q=e;const t=document.getElementById("pp-enhance-btn"),n=document.getElementById("pp-save-btn"),i=document.getElementById("pp-enhance-status"),o=document.getElementById("pp-enhance-mode");t&&(t.innerHTML=e?le:X,t.setAttribute("aria-busy",e?"true":"false"),t.title=e?"Enhancing...":"Enhance prompt"),n&&(n.disabled=e||!N),i&&(i.textContent=e?"Enhancing...":"",i.style.display=e?"inline-flex":"none"),o&&(o.disabled=e),D(N)}async function J(){if(!C)return;const e=j(C).trim();if(!e)return f("Nothing to save","error");const t=await _({text:e,source:"gemini",url:location.href});if(t.ok)return f(`Saved (${t.count}/${t.max})`,"success");if(t.reason==="limit")return f("Limit reached","error");if(t.reason==="empty")return f("Nothing to save","error")}function ye(e,t){const n=document.getElementById("pp-enhance-preview");n&&n.remove();const i=document.createElement("div");i.id="pp-enhance-preview",i.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;const o=w==="dark"?"rgba(15, 15, 15, 0.98)":"#ffffff",r=w==="dark"?"#f9fafb":"#111827",s=w==="dark"?"rgba(255, 255, 255, 0.12)":"rgba(0, 0, 0, 0.12)",d=w==="dark"?"rgba(20, 20, 20, 0.95)":"rgba(245, 245, 245, 0.98)",u=document.createElement("div");u.style.cssText=`
    background: ${o};
    color: ${r};
    border: 1px solid ${s};
    border-radius: 12px;
    width: min(900px, 100%);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
  `;const h=document.createElement("div");h.textContent="Enhance preview",h.style.cssText=`
    font-size: 14px;
    font-weight: 600;
    font-family: ${k.light.font};
  `;const x=document.createElement("div");x.style.cssText=`
    display: flex;
    gap: 12px;
    flex: 1;
    overflow: auto;
  `,window.innerWidth<720&&(x.style.flexDirection="column");const p=(l,L)=>{const B=document.createElement("div");B.style.cssText=`
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    `;const R=document.createElement("div");R.textContent=l,R.style.cssText="font-size: 12px; opacity: 0.75;";const I=document.createElement("textarea");return I.readOnly=!0,I.value=L,I.style.cssText=`
      flex: 1;
      min-height: 180px;
      resize: vertical;
      background: ${d};
      color: ${r};
      border: 1px solid ${s};
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
      line-height: 1.4;
      font-family: ${k.light.font};
    `,B.appendChild(R),B.appendChild(I),B};x.appendChild(p("Before",e)),x.appendChild(p("After",t));const a=document.createElement("div");a.style.cssText=`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;const E=l=>{const L=document.createElement("button");return L.type="button",L.textContent=l,L.style.cssText=`
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid ${s};
      background: ${d};
      color: ${r};
      font-size: 12px;
      cursor: pointer;
      font-family: ${k.light.font};
    `,L},y=E("Replace"),c=E("Save"),m=E("Cancel"),b=()=>{i.remove(),document.removeEventListener("keydown",S)},v=async()=>{try{await navigator.clipboard.writeText(t),f("Copied to clipboard","success")}catch{f("Failed to copy","error")}},S=l=>{if(l.key==="Escape"){l.preventDefault(),b();return}if((l.ctrlKey||l.metaKey)&&l.key.toLowerCase()==="c"){l.preventDefault(),l.stopPropagation(),v();return}if(l.altKey&&l.shiftKey&&l.key.toLowerCase()==="s"){l.preventDefault(),l.stopPropagation(),c.click();return}if(l.key==="Enter"&&!l.shiftKey&&!l.ctrlKey&&!l.altKey&&!l.metaKey){l.preventDefault(),l.stopPropagation(),y.click();return}},z=w==="dark"?k.dark:k.light;y.style.background=z.buttonBg,y.style.color=z.text,y.style.border=`1px solid ${z.border}`,y.addEventListener("click",()=>{const l=T();l&&(C=l,ce(l,t),l.focus(),b(),f("Prompt replaced","success"))});const Z=chrome.runtime.getURL("img/icon-16.png");c.title="Save to PromptPack",c.setAttribute("aria-label","Save to PromptPack"),c.innerHTML=`<img src="${Z}" width="16" height="16" alt="">`,c.style.padding="6px",c.style.width="32px",c.style.height="32px",c.style.display="inline-flex",c.style.alignItems="center",c.style.justifyContent="center",c.addEventListener("click",async()=>{const l=await _({text:t,source:"gemini",url:location.href});if(l.ok){f(`Saved (${l.count}/${l.max})`,"success");return}if(l.reason==="limit")return f("Limit reached","error");if(l.reason==="empty")return f("Nothing to save","error");f("Failed to save","error")}),m.addEventListener("click",b),i.addEventListener("click",l=>{l.target===i&&b()}),document.addEventListener("keydown",S),a.appendChild(y),a.appendChild(c),a.appendChild(m),u.appendChild(h),u.appendChild(x),u.appendChild(a),i.appendChild(u),document.body.appendChild(i)}async function Q(){if(q||!C)return;const e=j(C).trim();if(!e)return;if(e.length>6e3){f("Prompt too long to enhance. Try shortening it.","error");return}const t=await fe();if(!t){f("Sign in to use enhance feature","error");return}G(!0);try{const n={"Content-Type":"application/json",Authorization:`Bearer ${t}`},i=await fetch(oe,{method:"POST",headers:n,body:JSON.stringify({text:e,mode:M})});if(i.status===429){const r=await i.json().catch(()=>({error:""})),s=typeof r.error=="string"&&r.error.trim()?r.error:"You've hit the enhance limit. Try again later.";f(s,"error");return}if(i.status===400&&(await i.json().catch(()=>({error:""}))).error?.toLowerCase().includes("too long")){f("Prompt too long to enhance. Try shortening it.","error");return}if(!i.ok){f("Enhance failed. Try again.","error");return}const o=await i.json();if(!o.enhanced){f("Enhance failed. Try again.","error");return}ye(e,o.enhanced)}catch{f("Enhance failed. Check your connection.","error")}finally{G(!1)}}function W(){let e=me();if(!e){const t=document.getElementById("pp-enhance-wrap");t&&t.remove(),pe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
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
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(d=>{const u=document.createElement("option");u.value=d.value,u.textContent=d.label,n.appendChild(u)}),n.value=M,n.addEventListener("change",()=>{M=n.value});const o=document.createElement("button");o.id="pp-enhance-btn",o.type="button",o.title="Enhance prompt",o.setAttribute("aria-label","Enhance prompt"),o.style.cssText=`
      width: 36px;
      height: 36px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,o.innerHTML=X,o.addEventListener("click",d=>{d.stopPropagation(),Q()});const r=document.createElement("button");r.id="pp-save-btn",r.type="button",r.title="Save prompt",r.setAttribute("aria-label","Save prompt"),r.textContent="Save",r.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      font-family: ${k.light.font};
    `,r.addEventListener("click",d=>{d.stopPropagation(),J()});const s=document.createElement("span");s.id="pp-enhance-status",s.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
      color: ${k.light.text};
      font-family: ${k.light.font};
    `,e.appendChild(n),e.appendChild(o),e.appendChild(r),e.appendChild(s),document.body.appendChild(e)}return V(w),D(N),e}function he(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const t=T();t&&(C=t);const n=e.target;n&&(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.isContentEditable)&&(!t||n!==t&&!t.contains(n))||(e.preventDefault(),e.stopPropagation(),J())})}function ge(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const t=T();t&&(C=t);const n=e.target;n&&(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.isContentEditable)&&(!t||n!==t&&!t.contains(n))||(e.preventDefault(),e.stopPropagation(),Q())})}function xe(){const e=["structured","clarity","concise","strict"];document.addEventListener("keydown",t=>{if(!t.altKey||t.shiftKey||t.ctrlKey||t.metaKey||t.repeat)return;const n=parseInt(t.key,10);if(n<1||n>4)return;const i=T();if(!i)return;const o=t.target;if(o&&(o.tagName==="INPUT"||o.tagName==="TEXTAREA"||o.isContentEditable)&&o!==i&&!i.contains(o))return;t.preventDefault(),t.stopPropagation();const r=e[n-1];M=r;const s=document.getElementById("pp-enhance-mode");s&&(s.value=r),f(`Mode: ${r.charAt(0).toUpperCase()+r.slice(1)}`,"success")})}function be(){const e=['button[aria-label*="Stop"]','button[aria-label*="stop"]','button[title*="Stop"]','button[title*="stop"]'];for(const t of e){const n=document.querySelector(t);if(n&&P(n))return!0}return!1}function ve(e){const t=document.createElement("button");t.className="pp-bubble-save-icon",t.type="button",t.setAttribute("aria-label","Save prompt to PromptPack"),t.title="Save to PromptPack",t.__promptText=e,t.style.cssText=`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 4px;
    margin: 0;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease, opacity 0.15s ease;
    border: none;
    background: transparent;
    opacity: 0;
    flex-shrink: 0;
  `,t.addEventListener("mouseenter",()=>{t.style.background=w==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.05)",t.style.opacity="1"}),t.addEventListener("mouseleave",()=>{t.style.background="transparent",t.style.opacity="0.5"});const n=chrome.runtime.getURL("img/icon-16.png");return t.innerHTML=`<img src="${n}" width="16" height="16" alt="Save">`,t.addEventListener("click",async i=>{i.stopPropagation(),i.preventDefault();const o=i.currentTarget.__promptText;if(!o){f("No prompt to save","error");return}const r=await _({text:o,source:"gemini",url:location.href});r.ok?(t.style.opacity="1",f(`Saved! (${r.count}/${r.max})`,"success")):r.reason==="limit"?f("Limit reached","error"):r.reason==="empty"&&f("Nothing to save","error")}),t}function Ee(){document.querySelectorAll('mat-icon[fonticon="content_copy"], mat-icon[data-mat-icon-name="content_copy"]').forEach(t=>{const n=t.closest("button");if(!n)return;const i=n.parentElement;if(!i||i.querySelector(".pp-bubble-save-icon"))return;let o=n.parentElement,r="",s=null,d=!1,u=0;for(;o&&u<15;){const a=o.querySelectorAll("p.query-text-line");if(a.length>0){r=Array.from(a).map(y=>y.textContent?.trim()||"").filter(y=>y.length>0).join(`
`).trim(),s=o,d=!0;break}if(o.querySelector(".model-response-text, message-content, .response-container"))return;o=o.parentElement,u++}if(!d||!r||r.length<2||H.has(n))return;H.add(n);const h=ve(r);i.insertBefore(h,n);const x=()=>{h.style.opacity="1"},p=()=>{h.style.opacity="0"};i.addEventListener("mouseenter",x),i.addEventListener("mouseleave",p),s&&(s.addEventListener("mouseenter",x),s.addEventListener("mouseleave",p)),h.__cleanup=()=>{i.removeEventListener("mouseenter",x),i.removeEventListener("mouseleave",p),s&&(s.removeEventListener("mouseenter",x),s.removeEventListener("mouseleave",p))}})}function $(){K||(K=!0,requestAnimationFrame(()=>{K=!1,F()}))}function F(){if(location.href!==U){U=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),H.clear()}Ee();const e=T();if(C=e,!e){const o=W();o.style.display="none";return}const t=j(e).trim(),n=W();if(D(t.length>0),be()){n.style.display="none";return}n.style.display="flex",de(n)}function we(){te({onChange:o=>{w=o,V(w)},persistToStorage:!0}),F();let e=0;const t=setInterval(()=>{F(),e++,e>=10&&clearInterval(t)},200);O=new MutationObserver($),O.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",$),window.addEventListener("scroll",$,{passive:!0}),he(),ge(),xe();const n=history.pushState.bind(history),i=history.replaceState.bind(history);history.pushState=function(...o){n(...o),$()},history.replaceState=function(...o){i(...o),$()},window.addEventListener("popstate",$),Le()}let g=null;function ke(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
    position: fixed;
    z-index: 999999;
    background: ${w==="dark"?"#2d2d2d":"#ffffff"};
    border: 1px solid ${w==="dark"?"#444":"#ddd"};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 200px;
    max-width: 300px;
    max-height: 400px;
    overflow: hidden;
    overflow-y: auto;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 13px;
    display: none;
  `,document.body.appendChild(e),e}function A(){g&&(g.style.display="none")}async function Ce(e,t){g||(g=ke());const n=await ne("gemini"),i=n.reduce((u,h)=>u+h.prompts.length,0),o=w==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",hover:"#3d3d3d",secondary:"#999"}:{bg:"#ffffff",border:"#ddd",text:"#333",hover:"#f5f5f5",secondary:"#666"};if(g.style.background=o.bg,g.style.borderColor=o.border,g.style.color=o.text,i===0)g.innerHTML=`
      <div style="padding: 12px 16px; color: ${o.secondary}; text-align: center;">
        No saved Gemini prompts yet
      </div>
    `;else{const u=n.map((p,a)=>({group:p,index:a})).filter(({group:p})=>p.prompts.length>0);g.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${o.border}; display: flex; align-items: center; gap: 8px;">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${u.map(({group:p,index:a},E)=>{const c=E===u.length-1?"none":`1px solid ${o.border}`;return`
          <div class="pp-group" data-group-index="${a}">
            <div class="pp-group-header" data-group-index="${a}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${c};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span class="pp-arrow" style="transition: transform 0.2s;">▶</span>
              ${p.displayName} (${p.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${a}" style="display: none;">
              ${p.prompts.map((m,b)=>{const v=m.header?m.header:m.text.length>50?m.text.substring(0,50)+"...":m.text;return`
                <div class="pp-menu-item" data-group-index="${a}" data-prompt-index="${b}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${b<p.prompts.length-1?`1px solid ${o.border}`:"none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                " title="${m.text.replace(/"/g,"&quot;")}">
                  ${v}
                </div>
              `}).join("")}
            </div>
          </div>
        `}).join("")}
    `,g.querySelectorAll(".pp-group-header").forEach(p=>{const a=p;a.addEventListener("mouseenter",()=>{a.style.background=o.hover}),a.addEventListener("mouseleave",()=>{a.style.background="transparent"}),a.addEventListener("click",()=>{const E=a.dataset.groupIndex,y=g.querySelector(`.pp-group-items[data-group-index="${E}"]`),c=a.querySelector(".pp-arrow");if(y){const m=y.style.display!=="none";y.style.display=m?"none":"block",c&&(c.style.transform=m?"rotate(0deg)":"rotate(90deg)")}})}),g.querySelectorAll(".pp-menu-item").forEach(p=>{const a=p,E=parseInt(a.dataset.groupIndex||"0",10),y=parseInt(a.dataset.promptIndex||"0",10);a.addEventListener("mouseenter",()=>{a.style.background=o.hover}),a.addEventListener("mouseleave",()=>{a.style.background="transparent"}),a.addEventListener("click",()=>{const c=n[E];if(c&&c.prompts[y]){const m=c.prompts[y].text;A();const b=re(m);b.length>0?Te(b,v=>{const S=ie(m,v);Y(S)}):Y(m)}})})}const r={width:250,height:300};let s=e,d=t;s+r.width>window.innerWidth&&(s=window.innerWidth-r.width-10),d+r.height>window.innerHeight&&(d=window.innerHeight-r.height-10),g.style.left=`${s}px`,g.style.top=`${d}px`,g.style.display="block"}function Y(e){const t=T();t&&(t instanceof HTMLTextAreaElement?(t.value=e,t.dispatchEvent(new Event("input",{bubbles:!0}))):t.isContentEditable&&(t.innerText=e,t.dispatchEvent(new Event("input",{bubbles:!0}))),t.focus())}function Te(e,t,n){const i=document.getElementById("pp-template-dialog");i&&i.remove();const o=w==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",secondary:"#999",inputBg:"#1e1e1e"}:{bg:"#ffffff",border:"#ddd",text:"#333",secondary:"#666",inputBg:"#fff"},r=document.createElement("div");r.id="pp-template-dialog",r.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;const s=document.createElement("div");s.style.cssText=`
    background: ${o.bg};
    border: 1px solid ${o.border};
    border-radius: 8px;
    padding: 16px 20px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;const d=document.createElement("div");d.textContent="Fill in values",d.style.cssText=`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${o.text};
  `,s.appendChild(d);const u=[];e.forEach(c=>{const m=document.createElement("div");m.style.cssText="margin-bottom: 10px;";const b=document.createElement("label");b.textContent=c,b.style.cssText=`
      display: block;
      font-size: 12px;
      color: ${o.secondary};
      margin-bottom: 4px;
    `;const v=document.createElement("input");v.type="text",v.placeholder=c,v.style.cssText=`
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${o.border};
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      background: ${o.inputBg};
      color: ${o.text};
    `,v.addEventListener("focus",()=>{v.style.borderColor="#007bff"}),v.addEventListener("blur",()=>{v.style.borderColor=o.border}),m.appendChild(b),m.appendChild(v),s.appendChild(m),u.push(v)});const h=document.createElement("div");h.style.cssText=`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  `;const x=document.createElement("button");x.textContent="Cancel",x.style.cssText=`
    padding: 8px 14px;
    border: 1px solid ${o.border};
    border-radius: 6px;
    background: ${o.bg};
    color: ${o.text};
    font-size: 13px;
    cursor: pointer;
  `;const p=document.createElement("button");p.textContent="Insert",p.style.cssText=`
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background: #007bff;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  `;const a=()=>r.remove(),E=()=>{const c={};e.forEach((m,b)=>{c[m]=u[b].value}),a(),t(c)};x.addEventListener("click",()=>{a()}),p.addEventListener("click",E);const y=c=>{c.key==="Enter"?(c.preventDefault(),E()):c.key==="Escape"&&(c.preventDefault(),a())};r.addEventListener("keydown",y),r.addEventListener("click",c=>{c.target===r&&a()}),h.appendChild(x),h.appendChild(p),s.appendChild(h),r.appendChild(s),document.body.appendChild(r),u[0]&&u[0].focus()}function Le(){document.addEventListener("contextmenu",e=>{const t=e.target,n=T();n&&(t===n||n.contains(t))&&(e.preventDefault(),Ce(e.clientX,e.clientY))}),document.addEventListener("click",e=>{g&&!g.contains(e.target)&&A()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&A()}),document.addEventListener("scroll",A,{passive:!0})}we();
