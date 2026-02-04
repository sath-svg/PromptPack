import{m as te,s as ne,n as D,o as oe,p as A}from"./theme-CHys-yvq.js";import{E as re}from"./api-lEPXQ6QH.js";import{p as se,r as ae}from"./templateParser-B4WoPzG9.js";const ie=200,ce=64,Y=`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3z"></path>
    <path d="M18 3l1 2.5L21.5 6l-2.5 1L18 9.5l-1-2.5L14.5 6l2.5-1L18 3z"></path>
  </svg>
`,le=`
  <svg class="pp-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12"></circle>
  </svg>
`;function m(e,t="success"){let n=document.getElementById("pp-toast");n||(n=document.createElement("div"),n.id="pp-toast",n.style.cssText=`
      position: absolute;
      z-index: 1000001;
      padding: 10px 12px;
      border-radius: 12px;
      color: white;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
      pointer-events: none;
    `,document.body.appendChild(n)),n.style.background=t==="error"?"rgba(220, 38, 38, 0.92)":"rgba(59, 130, 246, 0.92)";const s=T();if(s){const o=s.getBoundingClientRect(),r=200,a=80;n.style.position="fixed",n.style.left=`${o.right+a}px`,n.style.top=`${o.top}px`,o.right+a+r>window.innerWidth&&(n.style.left=`${o.left-r-a}px`)}else n.style.position="fixed",n.style.right="16px",n.style.bottom="140px";n.textContent=e,n.style.opacity="1",n.style.transform="translateY(0)",window.setTimeout(()=>{n.style.opacity="0",n.style.transform="translateY(6px)"},1400)}function $(e){const t=e.getBoundingClientRect(),n=window.getComputedStyle(e);return t.width>10&&t.height>10&&n.display!=="none"&&n.visibility!=="hidden"&&n.opacity!=="0"}function T(){const e=document.querySelector("textarea#prompt-textarea");if(e&&$(e))return e;const t=o=>{let r=o.parentElement,a=0;for(;r&&a<20;){const p=r.getAttribute("role"),d=r.getAttribute("aria-modal");if(p==="dialog"||d==="true"||r.classList.contains("modal")||r.classList.contains("settings")||r.id==="pp-enhance-preview")return!1;const y=r.getAttribute("data-message-author-role");if(y==="assistant"||y==="user"||r.tagName==="ARTICLE")return!1;if(r.tagName==="FORM"){const h=r.className.toLowerCase();if(h.includes("setting")||h.includes("preference"))return!1}r=r.parentElement,a++}if(o instanceof HTMLTextAreaElement){const p=o.placeholder.toLowerCase();if(p.includes("additional behavior")||p.includes("preference")||p.includes("custom instruction"))return!1}return!(o instanceof HTMLTextAreaElement&&o.readOnly)},n=Array.from(document.querySelectorAll("textarea")).filter($).filter(t);if(n.length)return n.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),n[0];const s=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter($).filter(t);return s.length?(s.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),s[0]):null}function F(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}async function X(e,t){if(e instanceof HTMLTextAreaElement){const n=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}));return}try{const n=e,o=n.pmViewDesc?.view||n.view||n.editor?.view;if(o&&o.state&&o.dispatch){const{state:r}=o,a=r.tr;a.delete(0,r.doc.content.size),a.insertText(t,0),o.dispatch(a);return}}catch{}e.focus(),await new Promise(n=>setTimeout(n,50));try{const n=window.getSelection();if(n){const a=document.createRange();a.selectNodeContents(e),n.removeAllRanges(),n.addRange(a)}const s=new InputEvent("beforeinput",{bubbles:!0,cancelable:!0,inputType:"deleteContentBackward"});if(e.dispatchEvent(s),n){const a=document.createRange();a.setStart(e,0),a.collapse(!0),n.removeAllRanges(),n.addRange(a)}const o=new InputEvent("beforeinput",{bubbles:!0,cancelable:!0,inputType:"insertText",data:t});if(e.dispatchEvent(o),await new Promise(a=>setTimeout(a,100)),(e.textContent||"").includes(t.substring(0,Math.min(20,t.length))))return}catch{}try{if(e.focus(),document.execCommand("selectAll",!1),document.execCommand("insertText",!1,t)&&(await new Promise(o=>setTimeout(o,50)),(e.textContent||"").includes(t.substring(0,Math.min(20,t.length)))))return}catch{}try{for(;e.firstChild;)e.removeChild(e.firstChild);const n=document.createElement("p");if(n.textContent=t,e.appendChild(n),e.dispatchEvent(new InputEvent("input",{bubbles:!0,cancelable:!0,inputType:"insertText",data:t})),n.dispatchEvent(new InputEvent("input",{bubbles:!0,cancelable:!0,inputType:"insertText",data:t})),await new Promise(s=>setTimeout(s,100)),e.textContent?.includes(t.substring(0,Math.min(20,t.length))))return}catch{}try{e.focus();const n=window.getSelection();if(n){const r=document.createRange();r.selectNodeContents(e),n.removeAllRanges(),n.addRange(r)}const s=new DataTransfer;s.setData("text/plain",t);const o=new ClipboardEvent("paste",{clipboardData:s,bubbles:!0,cancelable:!0});if(e.dispatchEvent(o),await new Promise(r=>setTimeout(r,100)),e.textContent?.includes(t.substring(0,Math.min(20,t.length))))return}catch{}try{e.innerHTML=`<p>${t}</p>`,e.dispatchEvent(new CompositionEvent("compositionstart",{bubbles:!0})),e.dispatchEvent(new CompositionEvent("compositionend",{bubbles:!0,data:t})),e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertCompositionText",data:t}))}catch{}}function de(e){e.style.right=`${ie}px`,e.style.bottom=`${ce}px`,e.style.left="auto",e.style.top="auto"}function pe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }

    /* ChatGPT dropdown styling - light theme (dark bubble) */
    #pp-enhance-mode option {
      background: #2f2f2f !important;
      color: #ececec !important;
    }
    #pp-enhance-mode option:checked {
      background: #1a1a1a !important;
      color: #ffffff !important;
    }
    #pp-enhance-mode:focus {
      outline: 2px solid rgba(0, 0, 0, 0.14);
      outline-offset: 2px;
    }

    /* ChatGPT dropdown styling - dark theme (light bubble) */
    @media (prefers-color-scheme: dark) {
      #pp-enhance-mode option {
        background: #f7f7f8 !important;
        color: #0d0d0d !important;
      }
      #pp-enhance-mode option:checked {
        background: #ececec !important;
        color: #000000 !important;
      }
      #pp-enhance-mode:focus {
        outline: 2px solid rgba(0, 0, 0, 0.12);
        outline-offset: 2px;
      }
    }
  `,document.head.appendChild(e)}function ue(e,t){const n=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${t}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(n)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function J(e){const t=e==="dark"?A.dark:A.light,n=document.getElementById("pp-enhance-wrap");n&&(n.style.background=t.buttonBg,n.style.border=`1px solid ${t.border}`,n.style.boxShadow=t.shadow,n.style.borderRadius="999px",n.style.fontFamily=t.font,n.style.backdropFilter="blur(10px)",n.style.webkitBackdropFilter="blur(10px)");const s=document.getElementById("pp-save-btn");s&&(s.style.background="transparent",s.style.border="none",s.style.color=t.text,s.style.fontFamily=t.font,s.style.borderRadius="999px");const o=document.getElementById("pp-enhance-btn");o&&(o.style.background="transparent",o.style.border="none",o.style.color=t.text,o.style.fontFamily=t.font,o.style.borderRadius="999px");const r=document.getElementById("pp-enhance-mode");r&&(r.style.background=t.buttonBg,r.style.border="none",r.style.color=t.text,r.style.fontFamily=t.font,ue(r,t.text));const a=document.getElementById("pp-enhance-status");a&&(a.style.color=e==="dark"?"rgba(255, 255, 255, 0.9)":"rgba(17, 24, 39, 0.9)")}let C=null,E=te(),_=location.href,z=!1,q=null,H=new Set,M="structured",O=!1,R=!1;function me(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function fe(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},t=>{if(chrome.runtime.lastError){e(null);return}const n=t?.token;e(typeof n=="string"?n:null)})}):null}function U(e){R=e;const t=document.getElementById("pp-save-btn"),n=document.getElementById("pp-enhance-btn"),s=!e||O;t&&(t.disabled=s,t.style.opacity=s?"0.6":"1",t.style.cursor=s?"not-allowed":"pointer"),n&&(n.disabled=s,n.style.opacity=s?"0.6":"1",n.style.cursor=s?"not-allowed":"pointer")}function W(e){O=e;const t=document.getElementById("pp-enhance-btn"),n=document.getElementById("pp-save-btn"),s=document.getElementById("pp-enhance-status"),o=document.getElementById("pp-enhance-mode");t&&(t.innerHTML=e?le:Y,t.setAttribute("aria-busy",e?"true":"false"),t.title=e?"Enhancing...":"Enhance prompt"),n&&(n.disabled=e||!R),s&&(s.textContent=e?"Enhancing...":"",s.style.display=e?"inline-flex":"none"),o&&(o.disabled=e),U(R)}async function Q(){if(!C)return;const e=F(C).trim();if(!e)return m("Nothing to save","error");const t=await D({text:e,source:"chatgpt",url:location.href});if(t.ok)return m(`Saved (${t.count}/${t.max})`,"success");if(t.reason==="limit")return m("Limit reached","error");if(t.reason==="empty")return m("Nothing to save","error")}function ye(e,t){const n=document.getElementById("pp-enhance-preview");n&&n.remove();const s=document.createElement("div");s.id="pp-enhance-preview",s.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;const o=E==="dark"?"rgba(17, 24, 39, 0.98)":"#ffffff",r=E==="dark"?"#f9fafb":"#111827",a=E==="dark"?"rgba(255, 255, 255, 0.12)":"rgba(0, 0, 0, 0.12)",p=E==="dark"?"rgba(15, 23, 42, 0.95)":"rgba(249, 250, 251, 0.98)",d=document.createElement("div");d.style.cssText=`
    background: ${o};
    color: ${r};
    border: 1px solid ${a};
    border-radius: 12px;
    width: min(900px, 100%);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
  `;const y=document.createElement("div");y.textContent="Enhance preview",y.style.cssText=`
    font-size: 14px;
    font-weight: 600;
  `;const h=document.createElement("div");h.style.cssText=`
    display: flex;
    gap: 12px;
    flex: 1;
    overflow: auto;
  `,window.innerWidth<720&&(h.style.flexDirection="column");const u=(i,k)=>{const I=document.createElement("div");I.style.cssText=`
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    `;const N=document.createElement("div");N.textContent=i,N.style.cssText="font-size: 12px; opacity: 0.75;";const B=document.createElement("textarea");return B.readOnly=!0,B.value=k,B.style.cssText=`
      flex: 1;
      min-height: 180px;
      resize: vertical;
      background: ${p};
      color: ${r};
      border: 1px solid ${a};
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
      line-height: 1.4;
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    `,I.appendChild(N),I.appendChild(B),I};h.appendChild(u("Before",e)),h.appendChild(u("After",t));const l=document.createElement("div");l.style.cssText=`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;const w=i=>{const k=document.createElement("button");return k.type="button",k.textContent=i,k.style.cssText=`
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid ${a};
      background: ${p};
      color: ${r};
      font-size: 12px;
      cursor: pointer;
    `,k},b=w("Replace"),c=w("Save"),f=w("Cancel"),x=()=>{s.remove(),document.removeEventListener("keydown",S)},v=async()=>{try{await navigator.clipboard.writeText(t),m("Copied to clipboard","success")}catch{m("Failed to copy","error")}},S=i=>{if(i.key==="Escape"){i.preventDefault(),x();return}if((i.ctrlKey||i.metaKey)&&i.key.toLowerCase()==="c"){i.preventDefault(),i.stopPropagation(),v();return}if(i.altKey&&i.shiftKey&&i.key.toLowerCase()==="s"){i.preventDefault(),i.stopPropagation(),c.click();return}if(i.key==="Enter"&&!i.shiftKey&&!i.ctrlKey&&!i.altKey&&!i.metaKey){i.preventDefault(),i.stopPropagation(),b.click();return}},j=E==="dark"?A.dark:A.light;b.style.background=j.buttonBg,b.style.color=j.text,b.style.border="none",b.addEventListener("click",async()=>{x(),await new Promise(k=>setTimeout(k,50));const i=T();if(!i){m("Could not find input","error");return}C=i,await X(i,t),i.focus(),m("Prompt replaced","success")});const ee=chrome.runtime.getURL("img/icon-16.png");c.title="Save to PromptPack",c.setAttribute("aria-label","Save to PromptPack"),c.innerHTML=`<img src="${ee}" width="16" height="16" alt="">`,c.style.padding="6px",c.style.width="32px",c.style.height="32px",c.style.display="inline-flex",c.style.alignItems="center",c.style.justifyContent="center",c.addEventListener("click",async()=>{const i=await D({text:t,source:"chatgpt",url:location.href});if(i.ok){m(`Saved (${i.count}/${i.max})`,"success");return}if(i.reason==="limit")return m("Limit reached","error");if(i.reason==="empty")return m("Nothing to save","error");m("Failed to save","error")}),f.addEventListener("click",x),s.addEventListener("click",i=>{i.target===s&&x()}),document.addEventListener("keydown",S),l.appendChild(b),l.appendChild(c),l.appendChild(f),d.appendChild(y),d.appendChild(h),d.appendChild(l),s.appendChild(d),document.body.appendChild(s)}async function Z(){if(O||!C)return;const e=F(C).trim();if(!e)return;if(e.length>6e3){m("Prompt too long to enhance. Try shortening it.","error");return}const t=await fe();if(!t){m("Sign in to use enhance feature","error");return}W(!0);try{const n={"Content-Type":"application/json",Authorization:`Bearer ${t}`},s=await fetch(re,{method:"POST",headers:n,body:JSON.stringify({text:e,mode:M})});if(s.status===429){const r=await s.json().catch(()=>({error:""})),a=typeof r.error=="string"&&r.error.trim()?r.error:"You've hit the enhance limit. Try again later.";m(a,"error");return}if(s.status===400&&(await s.json().catch(()=>({error:""}))).error?.toLowerCase().includes("too long")){m("Prompt too long to enhance. Try shortening it.","error");return}if(!s.ok){m("Enhance failed. Try again.","error");return}const o=await s.json();if(!o.enhanced){m("Enhance failed. Try again.","error");return}ye(e,o.enhanced)}catch{m("Enhance failed. Check your connection.","error")}finally{W(!1)}}function G(){let e=me();if(!e){const t=document.getElementById("pp-enhance-wrap");t&&t.remove(),pe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
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
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(p=>{const d=document.createElement("option");d.value=p.value,d.textContent=p.label,n.appendChild(d)}),n.value=M,n.addEventListener("change",()=>{M=n.value});const o=document.createElement("button");o.id="pp-enhance-btn",o.type="button",o.title="Enhance prompt",o.setAttribute("aria-label","Enhance prompt"),o.style.cssText=`
      width: 32px;
      height: 32px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,o.innerHTML=Y,o.addEventListener("click",p=>{p.stopPropagation(),Z()});const r=document.createElement("button");r.id="pp-save-btn",r.type="button",r.title="Save prompt",r.setAttribute("aria-label","Save prompt"),r.textContent="Save",r.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
    `,r.addEventListener("click",p=>{p.stopPropagation(),Q()});const a=document.createElement("span");a.id="pp-enhance-status",a.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
      color: rgba(17, 24, 39, 0.9);
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    `,e.appendChild(n),e.appendChild(o),e.appendChild(r),e.appendChild(a),document.body.appendChild(e)}return J(E),U(R),e}function he(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const t=T();t&&(C=t);const n=e.target;n&&(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.isContentEditable)&&(!t||n!==t&&!t.contains(n))||(e.preventDefault(),e.stopPropagation(),Q())})}function ge(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const t=T();t&&(C=t);const n=e.target;n&&(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.isContentEditable)&&(!t||n!==t&&!t.contains(n))||(e.preventDefault(),e.stopPropagation(),Z())})}function be(){const e=["structured","clarity","concise","strict"];document.addEventListener("keydown",t=>{if(!t.altKey||t.shiftKey||t.ctrlKey||t.metaKey||t.repeat)return;const n=parseInt(t.key,10);if(n<1||n>4)return;const s=T();if(!s)return;const o=t.target;if(o&&(o.tagName==="INPUT"||o.tagName==="TEXTAREA"||o.isContentEditable)&&o!==s&&!s.contains(o))return;t.preventDefault(),t.stopPropagation();const r=e[n-1];M=r;const a=document.getElementById("pp-enhance-mode");a&&(a.value=r),m(`Mode: ${r.charAt(0).toUpperCase()+r.slice(1)}`,"success")})}function xe(){const e=['button[data-testid="stop-button"]','button[aria-label*="Stop"]','button[aria-label*="stop"]','button[title*="Stop"]','button[title*="stop"]'];for(const t of e){const n=document.querySelector(t);if(n&&$(n))return!0}return!1}function ve(e){const t=document.createElement("button");t.className="pp-bubble-save-icon",t.type="button",t.setAttribute("aria-label","Save prompt to PromptPack"),t.title="Save to PromptPack",t.__promptText=e,t.style.cssText=`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease, opacity 0.15s ease;
    border: none;
    background: transparent;
    opacity: 0;
  `,t.addEventListener("mouseenter",()=>{t.style.background=E==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.05)",t.style.opacity="1"}),t.addEventListener("mouseleave",()=>{t.style.background="transparent"});const n=chrome.runtime.getURL("img/icon-16.png");return t.innerHTML=`<img src="${n}" width="16" height="16" alt="Save">`,t.addEventListener("click",async s=>{s.stopPropagation(),s.preventDefault();const o=s.currentTarget.__promptText;if(!o){m("No prompt to save","error");return}const r=await D({text:o,source:"chatgpt",url:location.href});r.ok?(t.style.opacity="1",m(`Saved! (${r.count}/${r.max})`,"success")):r.reason==="limit"?m("Limit reached","error"):r.reason==="empty"&&m("Nothing to save","error")}),t}function Ee(){document.querySelectorAll('[data-message-author-role="user"]').forEach(t=>{if(H.has(t))return;const s=(t.querySelector("[data-message-id]")||t).textContent?.trim()||"";if(!s)return;let o=t,r=null,a=null;for(let y=0;y<10&&o;y++){const h=o.querySelector('svg use[href*="sprites-core"]');if(h){const u=h.closest("svg");if(u&&(r=u.closest("button"),r||(r=u.parentElement),r)){a=r.parentElement;break}}o=o.parentElement}if(!r||!a||a.querySelector(".pp-bubble-save-icon"))return;H.add(t);const p=ve(s);a.insertBefore(p,r);let d=t;for(let y=0;y<10&&d&&!(d.tagName==="ARTICLE"||d.getAttribute("data-message-author-role"));y++)d=d.parentElement;d&&(d.addEventListener("mouseenter",()=>{p.style.opacity="1"}),d.addEventListener("mouseleave",()=>{p.style.opacity="0"})),a.addEventListener("mouseenter",()=>{p.style.opacity="1"}),a.addEventListener("mouseleave",()=>{p.style.opacity="0"})})}function L(){z||(z=!0,requestAnimationFrame(()=>{z=!1,K()}))}function K(){if(location.href!==_){_=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),H.clear()}Ee();const e=T();if(C=e,!e){const o=G();o.style.display="none";return}const t=F(e).trim(),n=G();if(U(t.length>0),xe()){n.style.display="none";return}n.style.display="flex",de(n)}function we(){ne({onChange:o=>{E=o,J(E)},persistToStorage:!0}),K();let e=0;const t=setInterval(()=>{K(),e++,e>=10&&clearInterval(t)},200);q=new MutationObserver(L),q.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",L),window.addEventListener("scroll",L,{passive:!0}),he(),ge(),be();const n=history.pushState.bind(history),s=history.replaceState.bind(history);history.pushState=function(...o){n(...o),L()},history.replaceState=function(...o){s(...o),L()},window.addEventListener("popstate",L),Le()}let g=null;function ke(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
    position: fixed;
    z-index: 999999;
    background: ${E==="dark"?"#2d2d2d":"#ffffff"};
    border: 1px solid ${E==="dark"?"#444":"#ddd"};
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
  `,document.body.appendChild(e),e}function P(){g&&(g.style.display="none")}async function Ce(e,t){g||(g=ke());const n=await oe("chatgpt"),s=n.reduce((d,y)=>d+y.prompts.length,0),o=E==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",hover:"#3d3d3d",secondary:"#999"}:{bg:"#ffffff",border:"#ddd",text:"#333",hover:"#f5f5f5",secondary:"#666"};if(g.style.background=o.bg,g.style.borderColor=o.border,g.style.color=o.text,s===0)g.innerHTML=`
      <div style="padding: 12px 16px; color: ${o.secondary}; text-align: center;">
        No saved ChatGPT prompts yet
      </div>
    `;else{const d=n.map((u,l)=>({group:u,index:l})).filter(({group:u})=>u.prompts.length>0);g.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${o.border}; display: flex; align-items: center; gap: 8px;">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${d.map(({group:u,index:l},w)=>{const c=w===d.length-1?"none":`1px solid ${o.border}`;return`
          <div class="pp-group" data-group-index="${l}">
            <div class="pp-group-header" data-group-index="${l}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${c};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span class="pp-arrow" style="transition: transform 0.2s;">▶</span>
              ${u.displayName} (${u.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${l}" style="display: none;">
              ${u.prompts.map((f,x)=>{const v=f.header?f.header:f.text.length>50?f.text.substring(0,50)+"...":f.text;return`
                <div class="pp-menu-item" data-group-index="${l}" data-prompt-index="${x}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${x<u.prompts.length-1?`1px solid ${o.border}`:"none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                " title="${f.text.replace(/"/g,"&quot;")}">
                  ${v}
                </div>
              `}).join("")}
            </div>
          </div>
        `}).join("")}
    `,g.querySelectorAll(".pp-group-header").forEach(u=>{const l=u;l.addEventListener("mouseenter",()=>{l.style.background=o.hover}),l.addEventListener("mouseleave",()=>{l.style.background="transparent"}),l.addEventListener("click",()=>{const w=l.dataset.groupIndex,b=g.querySelector(`.pp-group-items[data-group-index="${w}"]`),c=l.querySelector(".pp-arrow");if(b){const f=b.style.display!=="none";b.style.display=f?"none":"block",c&&(c.style.transform=f?"rotate(0deg)":"rotate(90deg)")}})}),g.querySelectorAll(".pp-menu-item").forEach(u=>{const l=u,w=parseInt(l.dataset.groupIndex||"0",10),b=parseInt(l.dataset.promptIndex||"0",10);l.addEventListener("mouseenter",()=>{l.style.background=o.hover}),l.addEventListener("mouseleave",()=>{l.style.background="transparent"}),l.addEventListener("click",()=>{const c=n[w];if(c&&c.prompts[b]){const f=c.prompts[b].text;P();const x=se(f);x.length>0?Te(x,v=>{const S=ae(f,v);V(S)}):V(f)}})})}const r={width:250,height:300};let a=e,p=t;a+r.width>window.innerWidth&&(a=window.innerWidth-r.width-10),p+r.height>window.innerHeight&&(p=window.innerHeight-r.height-10),g.style.left=`${a}px`,g.style.top=`${p}px`,g.style.display="block"}async function V(e){const t=T();t&&(await X(t,e),t.focus())}function Te(e,t,n){const s=document.getElementById("pp-template-dialog");s&&s.remove();const o=E==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",secondary:"#999",inputBg:"#1e1e1e"}:{bg:"#ffffff",border:"#ddd",text:"#333",secondary:"#666",inputBg:"#fff"},r=document.createElement("div");r.id="pp-template-dialog",r.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;const a=document.createElement("div");a.style.cssText=`
    background: ${o.bg};
    border: 1px solid ${o.border};
    border-radius: 8px;
    padding: 16px 20px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;const p=document.createElement("div");p.textContent="Fill in values",p.style.cssText=`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${o.text};
  `,a.appendChild(p);const d=[];e.forEach(c=>{const f=document.createElement("div");f.style.cssText="margin-bottom: 10px;";const x=document.createElement("label");x.textContent=c,x.style.cssText=`
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
    `,v.addEventListener("focus",()=>{v.style.borderColor="#007bff"}),v.addEventListener("blur",()=>{v.style.borderColor=o.border}),f.appendChild(x),f.appendChild(v),a.appendChild(f),d.push(v)});const y=document.createElement("div");y.style.cssText=`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  `;const h=document.createElement("button");h.textContent="Cancel",h.style.cssText=`
    padding: 8px 14px;
    border: 1px solid ${o.border};
    border-radius: 6px;
    background: ${o.bg};
    color: ${o.text};
    font-size: 13px;
    cursor: pointer;
  `;const u=document.createElement("button");u.textContent="Insert",u.style.cssText=`
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background: #007bff;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  `;const l=()=>r.remove(),w=()=>{const c={};e.forEach((f,x)=>{c[f]=d[x].value}),l(),t(c)};h.addEventListener("click",()=>{l()}),u.addEventListener("click",w);const b=c=>{c.key==="Enter"?(c.preventDefault(),w()):c.key==="Escape"&&(c.preventDefault(),l())};r.addEventListener("keydown",b),r.addEventListener("click",c=>{c.target===r&&l()}),y.appendChild(h),y.appendChild(u),a.appendChild(y),r.appendChild(a),document.body.appendChild(r),d[0]&&d[0].focus()}function Le(){document.addEventListener("contextmenu",e=>{const t=e.target,n=T();n&&(t===n||n.contains(t))&&(e.preventDefault(),Ce(e.clientX,e.clientY))}),document.addEventListener("click",e=>{g&&!g.contains(e.target)&&P()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&P()}),document.addEventListener("scroll",P,{passive:!0})}we();
