import{m as te,s as ne,n as K,o as oe,p as $}from"./theme-CHys-yvq.js";import{E as re}from"./api-lEPXQ6QH.js";import{p as se,r as ae}from"./templateParser-B4WoPzG9.js";const ie=200,ce=64,Y=`
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5L9 3z"></path>
    <path d="M18 3l1 2.5L21.5 6l-2.5 1L18 9.5l-1-2.5L14.5 6l2.5-1L18 3z"></path>
  </svg>
`,le=`
  <svg class="pp-spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12"></circle>
  </svg>
`;function m(e,n="success"){let t=document.getElementById("pp-toast");t||(t=document.createElement("div"),t.id="pp-toast",t.style.cssText=`
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
    `,document.body.appendChild(t)),t.style.background=n==="error"?"rgba(220, 38, 38, 0.92)":"rgba(59, 130, 246, 0.92)";const s=C();if(s){const o=s.getBoundingClientRect(),r=200,a=80;t.style.position="fixed",t.style.left=`${o.right+a}px`,t.style.top=`${o.top}px`,o.right+a+r>window.innerWidth&&(t.style.left=`${o.left-r-a}px`)}else t.style.position="fixed",t.style.right="16px",t.style.bottom="140px";t.textContent=e,t.style.opacity="1",t.style.transform="translateY(0)",window.setTimeout(()=>{t.style.opacity="0",t.style.transform="translateY(6px)"},1400)}function M(e){const n=e.getBoundingClientRect(),t=window.getComputedStyle(e);return n.width>10&&n.height>10&&t.display!=="none"&&t.visibility!=="hidden"&&t.opacity!=="0"}function C(){const e=document.querySelector("textarea#prompt-textarea");if(e&&M(e))return e;const n=o=>{let r=o.parentElement,a=0;for(;r&&a<20;){const i=r.getAttribute("role"),p=r.getAttribute("aria-modal");if(i==="dialog"||p==="true"||r.classList.contains("modal")||r.classList.contains("settings")||r.id==="pp-enhance-preview")return!1;const g=r.getAttribute("data-message-author-role");if(g==="assistant"||g==="user"||r.tagName==="ARTICLE")return!1;if(r.tagName==="FORM"){const h=r.className.toLowerCase();if(h.includes("setting")||h.includes("preference"))return!1}r=r.parentElement,a++}if(o instanceof HTMLTextAreaElement){const i=o.placeholder.toLowerCase();if(i.includes("additional behavior")||i.includes("preference")||i.includes("custom instruction"))return!1}return!(o instanceof HTMLTextAreaElement&&o.readOnly)},t=Array.from(document.querySelectorAll("textarea")).filter(M).filter(n);if(t.length)return t.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),t[0];const s=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(M).filter(n);return s.length?(s.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),s[0]):null}function F(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}async function X(e,n){if(console.log("[PromptPack] setComposerText called",{el:e,text:n.substring(0,50)}),e instanceof HTMLTextAreaElement){console.log("[PromptPack] Using textarea approach");const t=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;t?t.call(e,n):e.value=n,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:n}));return}console.log("[PromptPack] Element classes:",e.className),console.log("[PromptPack] Element id:",e.id),console.log("[PromptPack] Element tagName:",e.tagName);try{console.log("[PromptPack] Method 0: Looking for ProseMirror view...");const t=e,s=t.pmViewDesc,o=s?.view||t.view||t.editor?.view;if(console.log("[PromptPack] pmViewDesc:",s),console.log("[PromptPack] view:",o),o&&o.state&&o.dispatch){console.log("[PromptPack] Found ProseMirror view! Using transaction.");const{state:r}=o,a=r.tr;a.delete(0,r.doc.content.size),a.insertText(n,0),o.dispatch(a),console.log("[PromptPack] ProseMirror transaction dispatched!");return}}catch(t){console.log("[PromptPack] Method 0 failed:",t)}e.focus(),await new Promise(t=>setTimeout(t,50));try{console.log("[PromptPack] Method 1: Trying beforeinput with deleteContentBackward + insertText");const t=window.getSelection();if(t){const i=document.createRange();i.selectNodeContents(e),t.removeAllRanges(),t.addRange(i)}const s=new InputEvent("beforeinput",{bubbles:!0,cancelable:!0,inputType:"deleteContentBackward"});if(e.dispatchEvent(s),t){const i=document.createRange();i.setStart(e,0),i.collapse(!0),t.removeAllRanges(),t.addRange(i)}const o=new InputEvent("beforeinput",{bubbles:!0,cancelable:!0,inputType:"insertText",data:n}),r=!e.dispatchEvent(o);if(console.log("[PromptPack] beforeinput insertText dispatched, default prevented:",r),await new Promise(i=>setTimeout(i,100)),(e.textContent||"").includes(n.substring(0,Math.min(20,n.length)))){console.log("[PromptPack] Method 1 succeeded!");return}}catch(t){console.log("[PromptPack] Method 1 failed:",t)}try{console.log("[PromptPack] Method 2: Trying execCommand selectAll + insertText"),e.focus(),document.execCommand("selectAll",!1);const t=document.execCommand("insertText",!1,n);if(console.log("[PromptPack] insertText result:",t),t&&(await new Promise(o=>setTimeout(o,50)),(e.textContent||"").includes(n.substring(0,Math.min(20,n.length))))){console.log("[PromptPack] Method 2 succeeded!");return}}catch(t){console.log("[PromptPack] Method 2 failed:",t)}try{for(console.log("[PromptPack] Method 3: Direct DOM + input event");e.firstChild;)e.removeChild(e.firstChild);const t=document.createElement("p");if(t.textContent=n,e.appendChild(t),e.dispatchEvent(new InputEvent("input",{bubbles:!0,cancelable:!0,inputType:"insertText",data:n})),t.dispatchEvent(new InputEvent("input",{bubbles:!0,cancelable:!0,inputType:"insertText",data:n})),await new Promise(s=>setTimeout(s,100)),e.textContent?.includes(n.substring(0,Math.min(20,n.length)))){console.log("[PromptPack] Method 3 succeeded!");return}}catch(t){console.log("[PromptPack] Method 3 failed:",t)}try{console.log("[PromptPack] Method 4: DataTransfer paste simulation"),e.focus();const t=window.getSelection();if(t){const r=document.createRange();r.selectNodeContents(e),t.removeAllRanges(),t.addRange(r)}const s=new DataTransfer;s.setData("text/plain",n);const o=new ClipboardEvent("paste",{clipboardData:s,bubbles:!0,cancelable:!0});if(e.dispatchEvent(o),await new Promise(r=>setTimeout(r,100)),e.textContent?.includes(n.substring(0,Math.min(20,n.length)))){console.log("[PromptPack] Method 4 succeeded!");return}}catch(t){console.log("[PromptPack] Method 4 failed:",t)}try{console.log("[PromptPack] Method 5: innerHTML + compositionend"),e.innerHTML=`<p>${n}</p>`,e.dispatchEvent(new CompositionEvent("compositionstart",{bubbles:!0})),e.dispatchEvent(new CompositionEvent("compositionend",{bubbles:!0,data:n})),e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertCompositionText",data:n})),console.log("[PromptPack] Method 5 applied, innerHTML:",e.innerHTML.substring(0,100))}catch(t){console.log("[PromptPack] Method 5 failed:",t)}console.log("[PromptPack] All methods attempted. Final textContent:",e.textContent?.substring(0,50))}function de(e){e.style.right=`${ie}px`,e.style.bottom=`${ce}px`,e.style.left="auto",e.style.top="auto"}function pe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
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
  `,document.head.appendChild(e)}function ue(e,n){const t=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${n}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(t)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function J(e){const n=e==="dark"?$.dark:$.light,t=document.getElementById("pp-enhance-wrap");t&&(t.style.background=n.buttonBg,t.style.border=`1px solid ${n.border}`,t.style.boxShadow=n.shadow,t.style.borderRadius="999px",t.style.fontFamily=n.font,t.style.backdropFilter="blur(10px)",t.style.webkitBackdropFilter="blur(10px)");const s=document.getElementById("pp-save-btn");s&&(s.style.background="transparent",s.style.border="none",s.style.color=n.text,s.style.fontFamily=n.font,s.style.borderRadius="999px");const o=document.getElementById("pp-enhance-btn");o&&(o.style.background="transparent",o.style.border="none",o.style.color=n.text,o.style.fontFamily=n.font,o.style.borderRadius="999px");const r=document.getElementById("pp-enhance-mode");r&&(r.style.background=n.buttonBg,r.style.border="none",r.style.color=n.text,r.style.fontFamily=n.font,ue(r,n.text));const a=document.getElementById("pp-enhance-status");a&&(a.style.color=e==="dark"?"rgba(255, 255, 255, 0.9)":"rgba(17, 24, 39, 0.9)")}let T=null,E=te(),_=location.href,z=!1,q=null,H=new Set,A="structured",U=!1,N=!1;function me(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function fe(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},n=>{if(chrome.runtime.lastError){e(null);return}const t=n?.token;e(typeof t=="string"?t:null)})}):null}function O(e){N=e;const n=document.getElementById("pp-save-btn"),t=document.getElementById("pp-enhance-btn"),s=!e||U;n&&(n.disabled=s,n.style.opacity=s?"0.6":"1",n.style.cursor=s?"not-allowed":"pointer"),t&&(t.disabled=s,t.style.opacity=s?"0.6":"1",t.style.cursor=s?"not-allowed":"pointer")}function W(e){U=e;const n=document.getElementById("pp-enhance-btn"),t=document.getElementById("pp-save-btn"),s=document.getElementById("pp-enhance-status"),o=document.getElementById("pp-enhance-mode");n&&(n.innerHTML=e?le:Y,n.setAttribute("aria-busy",e?"true":"false"),n.title=e?"Enhancing...":"Enhance prompt"),t&&(t.disabled=e||!N),s&&(s.textContent=e?"Enhancing...":"",s.style.display=e?"inline-flex":"none"),o&&(o.disabled=e),O(N)}async function Q(){if(!T)return;const e=F(T).trim();if(!e)return m("Nothing to save","error");const n=await K({text:e,source:"chatgpt",url:location.href});if(n.ok)return m(`Saved (${n.count}/${n.max})`,"success");if(n.reason==="limit")return m("Limit reached","error");if(n.reason==="empty")return m("Nothing to save","error")}function ge(e,n){const t=document.getElementById("pp-enhance-preview");t&&t.remove();const s=document.createElement("div");s.id="pp-enhance-preview",s.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;const o=E==="dark"?"rgba(17, 24, 39, 0.98)":"#ffffff",r=E==="dark"?"#f9fafb":"#111827",a=E==="dark"?"rgba(255, 255, 255, 0.12)":"rgba(0, 0, 0, 0.12)",i=E==="dark"?"rgba(15, 23, 42, 0.95)":"rgba(249, 250, 251, 0.98)",p=document.createElement("div");p.style.cssText=`
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
  `;const g=document.createElement("div");g.textContent="Enhance preview",g.style.cssText=`
    font-size: 14px;
    font-weight: 600;
  `;const h=document.createElement("div");h.style.cssText=`
    display: flex;
    gap: 12px;
    flex: 1;
    overflow: auto;
  `,window.innerWidth<720&&(h.style.flexDirection="column");const u=(c,k)=>{const S=document.createElement("div");S.style.cssText=`
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    `;const R=document.createElement("div");R.textContent=c,R.style.cssText="font-size: 12px; opacity: 0.75;";const I=document.createElement("textarea");return I.readOnly=!0,I.value=k,I.style.cssText=`
      flex: 1;
      min-height: 180px;
      resize: vertical;
      background: ${i};
      color: ${r};
      border: 1px solid ${a};
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
      line-height: 1.4;
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    `,S.appendChild(R),S.appendChild(I),S};h.appendChild(u("Before",e)),h.appendChild(u("After",n));const d=document.createElement("div");d.style.cssText=`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;const w=c=>{const k=document.createElement("button");return k.type="button",k.textContent=c,k.style.cssText=`
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid ${a};
      background: ${i};
      color: ${r};
      font-size: 12px;
      cursor: pointer;
    `,k},b=w("Replace"),l=w("Save"),f=w("Cancel"),x=()=>{s.remove(),document.removeEventListener("keydown",L)},v=async()=>{try{await navigator.clipboard.writeText(n),m("Copied to clipboard","success")}catch{m("Failed to copy","error")}},L=c=>{if(c.key==="Escape"){c.preventDefault(),x();return}if((c.ctrlKey||c.metaKey)&&c.key.toLowerCase()==="c"){c.preventDefault(),c.stopPropagation(),v();return}if(c.altKey&&c.shiftKey&&c.key.toLowerCase()==="s"){c.preventDefault(),c.stopPropagation(),l.click();return}if(c.key==="Enter"&&!c.shiftKey&&!c.ctrlKey&&!c.altKey&&!c.metaKey){c.preventDefault(),c.stopPropagation(),b.click();return}},j=E==="dark"?$.dark:$.light;b.style.background=j.buttonBg,b.style.color=j.text,b.style.border="none",b.addEventListener("click",async()=>{x(),await new Promise(k=>setTimeout(k,50));const c=C();if(console.log("[PromptPack] Replace clicked, composer:",c),!c){console.log("[PromptPack] No composer found!"),m("Could not find input","error");return}T=c,await X(c,n),c.focus(),m("Prompt replaced","success")});const ee=chrome.runtime.getURL("img/icon-16.png");l.title="Save to PromptPack",l.setAttribute("aria-label","Save to PromptPack"),l.innerHTML=`<img src="${ee}" width="16" height="16" alt="">`,l.style.padding="6px",l.style.width="32px",l.style.height="32px",l.style.display="inline-flex",l.style.alignItems="center",l.style.justifyContent="center",l.addEventListener("click",async()=>{const c=await K({text:n,source:"chatgpt",url:location.href});if(c.ok){m(`Saved (${c.count}/${c.max})`,"success");return}if(c.reason==="limit")return m("Limit reached","error");if(c.reason==="empty")return m("Nothing to save","error");m("Failed to save","error")}),f.addEventListener("click",x),s.addEventListener("click",c=>{c.target===s&&x()}),document.addEventListener("keydown",L),d.appendChild(b),d.appendChild(l),d.appendChild(f),p.appendChild(g),p.appendChild(h),p.appendChild(d),s.appendChild(p),document.body.appendChild(s)}async function Z(){if(U||!T)return;const e=F(T).trim();if(!e)return;if(e.length>6e3){m("Prompt too long to enhance. Try shortening it.","error");return}const n=await fe();if(!n){m("Sign in to use enhance feature","error");return}W(!0);try{const t={"Content-Type":"application/json",Authorization:`Bearer ${n}`},s=await fetch(re,{method:"POST",headers:t,body:JSON.stringify({text:e,mode:A})});if(s.status===429){const r=await s.json().catch(()=>({error:""})),a=typeof r.error=="string"&&r.error.trim()?r.error:"You've hit the enhance limit. Try again later.";m(a,"error");return}if(s.status===400&&(await s.json().catch(()=>({error:""}))).error?.toLowerCase().includes("too long")){m("Prompt too long to enhance. Try shortening it.","error");return}if(!s.ok){m("Enhance failed. Try again.","error");return}const o=await s.json();if(!o.enhanced){m("Enhance failed. Try again.","error");return}ge(e,o.enhanced)}catch{m("Enhance failed. Check your connection.","error")}finally{W(!1)}}function G(){let e=me();if(!e){const n=document.getElementById("pp-enhance-wrap");n&&n.remove(),pe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
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
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(i=>{const p=document.createElement("option");p.value=i.value,p.textContent=i.label,t.appendChild(p)}),t.value=A,t.addEventListener("change",()=>{A=t.value});const o=document.createElement("button");o.id="pp-enhance-btn",o.type="button",o.title="Enhance prompt",o.setAttribute("aria-label","Enhance prompt"),o.style.cssText=`
      width: 32px;
      height: 32px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,o.innerHTML=Y,o.addEventListener("click",i=>{i.stopPropagation(),Z()});const r=document.createElement("button");r.id="pp-save-btn",r.type="button",r.title="Save prompt",r.setAttribute("aria-label","Save prompt"),r.textContent="Save",r.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
    `,r.addEventListener("click",i=>{i.stopPropagation(),Q()});const a=document.createElement("span");a.id="pp-enhance-status",a.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
      color: rgba(17, 24, 39, 0.9);
      font-family: "Open Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    `,e.appendChild(t),e.appendChild(o),e.appendChild(r),e.appendChild(a),document.body.appendChild(e)}return J(E),O(N),e}function he(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const n=C();n&&(T=n);const t=e.target;t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)&&(!n||t!==n&&!n.contains(t))||(e.preventDefault(),e.stopPropagation(),Q())})}function ye(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const n=C();n&&(T=n);const t=e.target;t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)&&(!n||t!==n&&!n.contains(t))||(e.preventDefault(),e.stopPropagation(),Z())})}function be(){const e=["structured","clarity","concise","strict"];document.addEventListener("keydown",n=>{if(!n.altKey||n.shiftKey||n.ctrlKey||n.metaKey||n.repeat)return;const t=parseInt(n.key,10);if(t<1||t>4)return;const s=C();if(!s)return;const o=n.target;if(o&&(o.tagName==="INPUT"||o.tagName==="TEXTAREA"||o.isContentEditable)&&o!==s&&!s.contains(o))return;n.preventDefault(),n.stopPropagation();const r=e[t-1];A=r;const a=document.getElementById("pp-enhance-mode");a&&(a.value=r),m(`Mode: ${r.charAt(0).toUpperCase()+r.slice(1)}`,"success")})}function xe(){const e=['button[data-testid="stop-button"]','button[aria-label*="Stop"]','button[aria-label*="stop"]','button[title*="Stop"]','button[title*="stop"]'];for(const n of e){const t=document.querySelector(n);if(t&&M(t))return!0}return!1}function ve(e){const n=document.createElement("button");n.className="pp-bubble-save-icon",n.type="button",n.setAttribute("aria-label","Save prompt to PromptPack"),n.title="Save to PromptPack",n.__promptText=e,n.style.cssText=`
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
  `,n.addEventListener("mouseenter",()=>{n.style.background=E==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.05)",n.style.opacity="1"}),n.addEventListener("mouseleave",()=>{n.style.background="transparent"});const t=chrome.runtime.getURL("img/icon-16.png");return n.innerHTML=`<img src="${t}" width="16" height="16" alt="Save">`,n.addEventListener("click",async s=>{s.stopPropagation(),s.preventDefault();const o=s.currentTarget.__promptText;if(!o){m("No prompt to save","error");return}const r=await K({text:o,source:"chatgpt",url:location.href});r.ok?(n.style.opacity="1",m(`Saved! (${r.count}/${r.max})`,"success")):r.reason==="limit"?m("Limit reached","error"):r.reason==="empty"&&m("Nothing to save","error")}),n}function Ee(){document.querySelectorAll('[data-message-author-role="user"]').forEach(n=>{if(H.has(n))return;const s=(n.querySelector("[data-message-id]")||n).textContent?.trim()||"";if(!s)return;let o=n,r=null,a=null;for(let g=0;g<10&&o;g++){const h=o.querySelector('svg use[href*="sprites-core"]');if(h){const u=h.closest("svg");if(u&&(r=u.closest("button"),r||(r=u.parentElement),r)){a=r.parentElement;break}}o=o.parentElement}if(!r||!a||a.querySelector(".pp-bubble-save-icon"))return;H.add(n);const i=ve(s);a.insertBefore(i,r);let p=n;for(let g=0;g<10&&p&&!(p.tagName==="ARTICLE"||p.getAttribute("data-message-author-role"));g++)p=p.parentElement;p&&(p.addEventListener("mouseenter",()=>{i.style.opacity="1"}),p.addEventListener("mouseleave",()=>{i.style.opacity="0"})),a.addEventListener("mouseenter",()=>{i.style.opacity="1"}),a.addEventListener("mouseleave",()=>{i.style.opacity="0"})})}function P(){z||(z=!0,requestAnimationFrame(()=>{z=!1,D()}))}function D(){if(location.href!==_){_=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),H.clear()}Ee();const e=C();if(T=e,!e){const o=G();o.style.display="none";return}const n=F(e).trim(),t=G();if(O(n.length>0),xe()){t.style.display="none";return}t.style.display="flex",de(t)}function we(){ne({onChange:o=>{E=o,J(E)},persistToStorage:!0}),D();let e=0;const n=setInterval(()=>{D(),e++,e>=10&&clearInterval(n)},200);q=new MutationObserver(P),q.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",P),window.addEventListener("scroll",P,{passive:!0}),he(),ye(),be();const t=history.pushState.bind(history),s=history.replaceState.bind(history);history.pushState=function(...o){t(...o),P()},history.replaceState=function(...o){s(...o),P()},window.addEventListener("popstate",P),Pe()}let y=null;function ke(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
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
  `,document.body.appendChild(e),e}function B(){y&&(y.style.display="none")}async function Te(e,n){y||(y=ke());const t=await oe("chatgpt"),s=t.reduce((p,g)=>p+g.prompts.length,0),o=E==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",hover:"#3d3d3d",secondary:"#999"}:{bg:"#ffffff",border:"#ddd",text:"#333",hover:"#f5f5f5",secondary:"#666"};if(y.style.background=o.bg,y.style.borderColor=o.border,y.style.color=o.text,s===0)y.innerHTML=`
      <div style="padding: 12px 16px; color: ${o.secondary}; text-align: center;">
        No saved ChatGPT prompts yet
      </div>
    `;else{const p=t.map((u,d)=>({group:u,index:d})).filter(({group:u})=>u.prompts.length>0);y.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${o.border}; display: flex; align-items: center; gap: 8px;">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${p.map(({group:u,index:d},w)=>{const l=w===p.length-1?"none":`1px solid ${o.border}`;return`
          <div class="pp-group" data-group-index="${d}">
            <div class="pp-group-header" data-group-index="${d}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${l};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span class="pp-arrow" style="transition: transform 0.2s;">▶</span>
              ${u.displayName} (${u.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${d}" style="display: none;">
              ${u.prompts.map((f,x)=>{const v=f.header?f.header:f.text.length>50?f.text.substring(0,50)+"...":f.text;return`
                <div class="pp-menu-item" data-group-index="${d}" data-prompt-index="${x}" style="
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
    `,y.querySelectorAll(".pp-group-header").forEach(u=>{const d=u;d.addEventListener("mouseenter",()=>{d.style.background=o.hover}),d.addEventListener("mouseleave",()=>{d.style.background="transparent"}),d.addEventListener("click",()=>{const w=d.dataset.groupIndex,b=y.querySelector(`.pp-group-items[data-group-index="${w}"]`),l=d.querySelector(".pp-arrow");if(b){const f=b.style.display!=="none";b.style.display=f?"none":"block",l&&(l.style.transform=f?"rotate(0deg)":"rotate(90deg)")}})}),y.querySelectorAll(".pp-menu-item").forEach(u=>{const d=u,w=parseInt(d.dataset.groupIndex||"0",10),b=parseInt(d.dataset.promptIndex||"0",10);d.addEventListener("mouseenter",()=>{d.style.background=o.hover}),d.addEventListener("mouseleave",()=>{d.style.background="transparent"}),d.addEventListener("click",()=>{const l=t[w];if(l&&l.prompts[b]){const f=l.prompts[b].text;B();const x=se(f);x.length>0?Ce(x,v=>{const L=ae(f,v);V(L)}):V(f)}})})}const r={width:250,height:300};let a=e,i=n;a+r.width>window.innerWidth&&(a=window.innerWidth-r.width-10),i+r.height>window.innerHeight&&(i=window.innerHeight-r.height-10),y.style.left=`${a}px`,y.style.top=`${i}px`,y.style.display="block"}async function V(e){const n=C();n&&(await X(n,e),n.focus())}function Ce(e,n,t){const s=document.getElementById("pp-template-dialog");s&&s.remove();const o=E==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",secondary:"#999",inputBg:"#1e1e1e"}:{bg:"#ffffff",border:"#ddd",text:"#333",secondary:"#666",inputBg:"#fff"},r=document.createElement("div");r.id="pp-template-dialog",r.style.cssText=`
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
  `;const i=document.createElement("div");i.textContent="Fill in values",i.style.cssText=`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${o.text};
  `,a.appendChild(i);const p=[];e.forEach(l=>{const f=document.createElement("div");f.style.cssText="margin-bottom: 10px;";const x=document.createElement("label");x.textContent=l,x.style.cssText=`
      display: block;
      font-size: 12px;
      color: ${o.secondary};
      margin-bottom: 4px;
    `;const v=document.createElement("input");v.type="text",v.placeholder=l,v.style.cssText=`
      width: 100%;
      padding: 8px 10px;
      border: 1px solid ${o.border};
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      background: ${o.inputBg};
      color: ${o.text};
    `,v.addEventListener("focus",()=>{v.style.borderColor="#007bff"}),v.addEventListener("blur",()=>{v.style.borderColor=o.border}),f.appendChild(x),f.appendChild(v),a.appendChild(f),p.push(v)});const g=document.createElement("div");g.style.cssText=`
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
  `;const d=()=>r.remove(),w=()=>{const l={};e.forEach((f,x)=>{l[f]=p[x].value}),d(),n(l)};h.addEventListener("click",()=>{d()}),u.addEventListener("click",w);const b=l=>{l.key==="Enter"?(l.preventDefault(),w()):l.key==="Escape"&&(l.preventDefault(),d())};r.addEventListener("keydown",b),r.addEventListener("click",l=>{l.target===r&&d()}),g.appendChild(h),g.appendChild(u),a.appendChild(g),r.appendChild(a),document.body.appendChild(r),p[0]&&p[0].focus()}function Pe(){document.addEventListener("contextmenu",e=>{const n=e.target,t=C();t&&(n===t||t.contains(n))&&(e.preventDefault(),Te(e.clientX,e.clientY))}),document.addEventListener("click",e=>{y&&!y.contains(e.target)&&B()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&B()}),document.addEventListener("scroll",B,{passive:!0})}we();
