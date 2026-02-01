import{m as ee,s as te,q as k,n as F,o as ne}from"./theme-CHys-yvq.js";import{E as oe}from"./api-lEPXQ6QH.js";import{p as re,r as se}from"./templateParser-B4WoPzG9.js";const ie=200,ae=64,Y=`
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
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
      pointer-events: none;
    `,document.body.appendChild(n)),n.style.background=t==="error"?"rgba(220, 38, 38, 0.92)":"rgba(59, 130, 246, 0.92)";const s=T();if(s){const o=s.getBoundingClientRect(),r=200,l=80;n.style.position="fixed",n.style.left=`${o.right+l}px`,n.style.top=`${o.top}px`,o.right+l+r>window.innerWidth&&(n.style.left=`${o.left-r-l}px`)}else n.style.position="fixed",n.style.right="16px",n.style.bottom="140px";n.textContent=e,n.style.opacity="1",n.style.transform="translateY(0)",window.setTimeout(()=>{n.style.opacity="0",n.style.transform="translateY(6px)"},1400)}function P(e){const t=e.getBoundingClientRect(),n=window.getComputedStyle(e);return t.width>10&&t.height>10&&n.display!=="none"&&n.visibility!=="hidden"&&n.opacity!=="0"}function T(){const e=document.querySelector('[contenteditable="true"][data-placeholder], div[contenteditable="true"].ProseMirror');if(e&&P(e))return e;const t=o=>{let r=o.parentElement,l=0;for(;r&&l<20;){const d=r.getAttribute("role"),p=r.getAttribute("aria-modal");if(d==="dialog"||p==="true"||r.classList.contains("modal")||r.classList.contains("settings"))return!1;if(r.tagName==="FORM"){const y=r.className.toLowerCase();if(y.includes("setting")||y.includes("preference"))return!1}r=r.parentElement,l++}if(o instanceof HTMLTextAreaElement){const d=o.placeholder.toLowerCase();if(d.includes("additional behavior")||d.includes("preference")||d.includes("custom instruction"))return!1}return!0},n=Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(P).filter(t);if(n.length)return n.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),n[0];const s=Array.from(document.querySelectorAll("textarea")).filter(P).filter(t);return s.length?(s.sort((o,r)=>r.clientWidth*r.clientHeight-o.clientWidth*o.clientHeight),s[0]):null}function j(e){return e instanceof HTMLTextAreaElement?e.value??"":e.innerText??""}function ce(e,t){if(e instanceof HTMLTextAreaElement){const n=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;n?n.call(e,t):e.value=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}));return}e.textContent=t,e.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}))}function de(e){e.style.right=`${ie}px`,e.style.bottom=`${ae}px`,e.style.left="auto",e.style.top="auto"}function pe(){if(document.getElementById("pp-enhance-styles"))return;const e=document.createElement("style");e.id="pp-enhance-styles",e.textContent=`
    @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .pp-spin { animation: pp-spin 0.9s linear infinite; }

    /* Claude dropdown styling with orange theme */
    #pp-enhance-mode option {
      background: #C15F3C;
      color: #ffffff;
    }
    #pp-enhance-mode:focus {
      outline: 2px solid rgba(193, 95, 60, 0.5);
      outline-offset: 2px;
    }
  `,document.head.appendChild(e)}function ue(e,t){const n=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="${t}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>`;e.style.setProperty("appearance","none"),e.style.setProperty("-webkit-appearance","none"),e.style.backgroundImage=`url("data:image/svg+xml;utf8,${encodeURIComponent(n)}")`,e.style.backgroundRepeat="no-repeat",e.style.backgroundPosition="right 6px center",e.style.backgroundSize="10px 10px",e.style.paddingRight="22px"}function X(e){const t=e==="dark"?k.dark:k.light,n=document.getElementById("pp-enhance-wrap");n&&(n.style.background=t.accent,n.style.border="none",n.style.boxShadow=t.shadow,n.style.borderRadius="6px",n.style.fontFamily=t.font,n.style.backdropFilter="none",n.style.webkitBackdropFilter="none");const s=document.getElementById("pp-save-btn");s&&(s.style.background="transparent",s.style.border="none",s.style.color="#ffffff",s.style.fontFamily=t.font,s.style.borderRadius="6px");const o=document.getElementById("pp-enhance-btn");o&&(o.style.background="transparent",o.style.border="none",o.style.color="#ffffff",o.style.fontFamily=t.font,o.style.borderRadius="6px");const r=document.getElementById("pp-enhance-mode");r&&(r.style.background="transparent",r.style.border="none",r.style.color="#ffffff",r.style.fontFamily=t.font,ue(r,"#ffffff"));const l=document.getElementById("pp-enhance-status");l&&(l.style.color=t.text)}let C=null,w=ee(),D=location.href,R=!1,U=null,K=new Set,N="structured",q=!1,M=!1;function fe(){const e=document.getElementById("pp-enhance-wrap");return e&&document.body.contains(e)?e:null}async function me(){return chrome?.runtime?.sendMessage?new Promise(e=>{chrome.runtime.sendMessage({type:"PP_GET_ENHANCE_TOKEN"},t=>{if(chrome.runtime.lastError){e(null);return}const n=t?.token;e(typeof n=="string"?n:null)})}):null}function _(e){M=e;const t=document.getElementById("pp-save-btn"),n=document.getElementById("pp-enhance-btn"),s=!e||q;t&&(t.disabled=s,t.style.opacity=s?"0.6":"1",t.style.cursor=s?"not-allowed":"pointer"),n&&(n.disabled=s,n.style.opacity=s?"0.6":"1",n.style.cursor=s?"not-allowed":"pointer")}function O(e){q=e;const t=document.getElementById("pp-enhance-btn"),n=document.getElementById("pp-save-btn"),s=document.getElementById("pp-enhance-status"),o=document.getElementById("pp-enhance-mode");t&&(t.innerHTML=e?le:Y,t.setAttribute("aria-busy",e?"true":"false"),t.title=e?"Enhancing...":"Enhance prompt"),n&&(n.disabled=e||!M),s&&(s.textContent=e?"Enhancing...":"",s.style.display=e?"inline-flex":"none"),o&&(o.disabled=e),_(M)}async function V(){if(!C)return;const e=j(C).trim();if(!e)return f("Nothing to save","error");const t=await F({text:e,source:"claude",url:location.href});if(t.ok)return f(`Saved (${t.count}/${t.max})`,"success");if(t.reason==="limit")return f("Limit reached","error");if(t.reason==="empty")return f("Nothing to save","error")}function ye(e,t){const n=document.getElementById("pp-enhance-preview");n&&n.remove();const s=document.createElement("div");s.id="pp-enhance-preview",s.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;const o=w==="dark"?"rgba(25, 25, 28, 0.98)":"#ffffff",r=w==="dark"?"#f9fafb":"#111827",l=w==="dark"?"rgba(255, 255, 255, 0.12)":"rgba(0, 0, 0, 0.12)",d=w==="dark"?"rgba(15, 15, 18, 0.95)":"rgba(248, 248, 248, 0.98)",p=document.createElement("div");p.style.cssText=`
    background: ${o};
    color: ${r};
    border: 1px solid ${l};
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
    font-family: ${k.light.font};
  `;const x=document.createElement("div");x.style.cssText=`
    display: flex;
    gap: 12px;
    flex: 1;
    overflow: auto;
  `,window.innerWidth<720&&(x.style.flexDirection="column");const m=(a,L)=>{const B=document.createElement("div");B.style.cssText=`
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    `;const z=document.createElement("div");z.textContent=a,z.style.cssText="font-size: 12px; opacity: 0.75;";const I=document.createElement("textarea");return I.readOnly=!0,I.value=L,I.style.cssText=`
      flex: 1;
      min-height: 180px;
      resize: vertical;
      background: ${d};
      color: ${r};
      border: 1px solid ${l};
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
      line-height: 1.4;
      font-family: ${k.light.font};
    `,B.appendChild(z),B.appendChild(I),B};x.appendChild(m("Before",e)),x.appendChild(m("After",t));const i=document.createElement("div");i.style.cssText=`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;const E=a=>{const L=document.createElement("button");return L.type="button",L.textContent=a,L.style.cssText=`
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid ${l};
      background: ${d};
      color: ${r};
      font-size: 12px;
      cursor: pointer;
      font-family: ${k.light.font};
    `,L},h=E("Replace"),c=E("Save"),u=E("Cancel"),b=()=>{s.remove(),document.removeEventListener("keydown",$)},v=async()=>{try{await navigator.clipboard.writeText(t),f("Copied to clipboard","success")}catch{f("Failed to copy","error")}},$=a=>{if(a.key==="Escape"){a.preventDefault(),b();return}if((a.ctrlKey||a.metaKey)&&a.key.toLowerCase()==="c"){a.preventDefault(),a.stopPropagation(),v();return}if(a.altKey&&a.shiftKey&&a.key.toLowerCase()==="s"){a.preventDefault(),a.stopPropagation(),c.click();return}if(a.key==="Enter"&&!a.shiftKey&&!a.ctrlKey&&!a.altKey&&!a.metaKey){a.preventDefault(),a.stopPropagation(),h.click();return}},Q=w==="dark"?k.dark:k.light;h.style.background=Q.accent,h.style.color="#ffffff",h.style.border="none",h.addEventListener("click",()=>{const a=T();a&&(C=a,ce(a,t),a.focus(),b(),f("Prompt replaced","success"))});const Z=chrome.runtime.getURL("img/icon-16.png");c.title="Save to PromptPack",c.setAttribute("aria-label","Save to PromptPack"),c.innerHTML=`<img src="${Z}" width="16" height="16" alt="">`,c.style.padding="6px",c.style.width="32px",c.style.height="32px",c.style.display="inline-flex",c.style.alignItems="center",c.style.justifyContent="center",c.addEventListener("click",async()=>{const a=await F({text:t,source:"claude",url:location.href});if(a.ok){f(`Saved (${a.count}/${a.max})`,"success");return}if(a.reason==="limit")return f("Limit reached","error");if(a.reason==="empty")return f("Nothing to save","error");f("Failed to save","error")}),u.addEventListener("click",b),s.addEventListener("click",a=>{a.target===s&&b()}),document.addEventListener("keydown",$),i.appendChild(h),i.appendChild(c),i.appendChild(u),p.appendChild(y),p.appendChild(x),p.appendChild(i),s.appendChild(p),document.body.appendChild(s)}async function J(){if(q||!C)return;const e=j(C).trim();if(!e)return;if(e.length>6e3){f("Prompt too long to enhance. Try shortening it.","error");return}const t=await me();if(!t){f("Sign in to use enhance feature","error");return}O(!0);try{const n={"Content-Type":"application/json",Authorization:`Bearer ${t}`},s=await fetch(oe,{method:"POST",headers:n,body:JSON.stringify({text:e,mode:N})});if(s.status===429){const r=await s.json().catch(()=>({error:""})),l=typeof r.error=="string"&&r.error.trim()?r.error:"You've hit the enhance limit. Try again later.";f(l,"error");return}if(s.status===400&&(await s.json().catch(()=>({error:""}))).error?.toLowerCase().includes("too long")){f("Prompt too long to enhance. Try shortening it.","error");return}if(!s.ok){f("Enhance failed. Try again.","error");return}const o=await s.json();if(!o.enhanced){f("Enhance failed. Try again.","error");return}ye(e,o.enhanced)}catch{f("Enhance failed. Check your connection.","error")}finally{O(!1)}}function G(){let e=fe();if(!e){const t=document.getElementById("pp-enhance-wrap");t&&t.remove(),pe(),e=document.createElement("div"),e.id="pp-enhance-wrap",e.style.cssText=`
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
    `,[{value:"structured",label:"Structured"},{value:"clarity",label:"Clarity"},{value:"concise",label:"Concise"},{value:"strict",label:"Strict"}].forEach(d=>{const p=document.createElement("option");p.value=d.value,p.textContent=d.label,n.appendChild(p)}),n.value=N,n.addEventListener("change",()=>{N=n.value});const o=document.createElement("button");o.id="pp-enhance-btn",o.type="button",o.title="Enhance prompt",o.setAttribute("aria-label","Enhance prompt"),o.style.cssText=`
      width: 36px;
      height: 36px;
      border-radius: 999px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,o.innerHTML=Y,o.addEventListener("click",d=>{d.stopPropagation(),J()});const r=document.createElement("button");r.id="pp-save-btn",r.type="button",r.title="Save prompt",r.setAttribute("aria-label","Save prompt"),r.textContent="Save",r.style.cssText=`
      height: 32px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      font-family: ${k.light.font};
    `,r.addEventListener("click",d=>{d.stopPropagation(),V()});const l=document.createElement("span");l.id="pp-enhance-status",l.style.cssText=`
      display: none;
      font-size: 11px;
      opacity: 0.8;
      margin-left: 4px;
      color: ${k.light.text};
      font-family: ${k.light.font};
    `,e.appendChild(n),e.appendChild(o),e.appendChild(r),e.appendChild(l),document.body.appendChild(e)}return X(w),_(M),e}function he(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="s"||e.repeat)return;const t=T();t&&(C=t);const n=e.target;n&&(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.isContentEditable)&&(!t||n!==t&&!t.contains(n))||(e.preventDefault(),e.stopPropagation(),V())})}function ge(){document.addEventListener("keydown",e=>{if(!e.altKey||!e.shiftKey||e.key.toLowerCase()!=="e"||e.repeat)return;const t=T();t&&(C=t);const n=e.target;n&&(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.isContentEditable)&&(!t||n!==t&&!t.contains(n))||(e.preventDefault(),e.stopPropagation(),J())})}function xe(){const e=["structured","clarity","concise","strict"];document.addEventListener("keydown",t=>{if(!t.altKey||t.shiftKey||t.ctrlKey||t.metaKey||t.repeat)return;const n=parseInt(t.key,10);if(n<1||n>4)return;const s=T();if(!s)return;const o=t.target;if(o&&(o.tagName==="INPUT"||o.tagName==="TEXTAREA"||o.isContentEditable)&&o!==s&&!s.contains(o))return;t.preventDefault(),t.stopPropagation();const r=e[n-1];N=r;const l=document.getElementById("pp-enhance-mode");l&&(l.value=r),f(`Mode: ${r.charAt(0).toUpperCase()+r.slice(1)}`,"success")})}function be(){const e=['button[aria-label*="Stop"]','button[aria-label*="stop"]','button[title*="Stop"]','button[title*="stop"]'];for(const t of e){const n=document.querySelector(t);if(n&&P(n))return!0}return!1}function ve(e){const t=document.createElement("button");t.className="pp-bubble-save-icon",t.type="button",t.setAttribute("aria-label","Save prompt to PromptPack"),t.title="Save to PromptPack",t.__promptText=e,t.style.cssText=`
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
  `,t.addEventListener("mouseenter",()=>{t.style.background=w==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.05)",t.style.opacity="1"}),t.addEventListener("mouseleave",()=>{t.style.background="transparent",t.style.opacity="0.5"});const n=chrome.runtime.getURL("img/icon-16.png");return t.innerHTML=`<img src="${n}" width="16" height="16" alt="Save">`,t.addEventListener("click",async s=>{s.stopPropagation(),s.preventDefault();const o=s.currentTarget.__promptText;if(!o){f("No prompt to save","error");return}const r=await F({text:o,source:"claude",url:location.href});r.ok?(t.style.opacity="1",f(`Saved! (${r.count}/${r.max})`,"success")):r.reason==="limit"?f("Limit reached","error"):r.reason==="empty"&&f("Nothing to save","error")}),t}function Ee(){document.querySelectorAll('div[data-testid="user-message"]').forEach(t=>{if(K.has(t))return;const s=t.querySelector("p.whitespace-pre-wrap")?.textContent?.trim()||"";if(!s||s.length<2)return;let o=t.parentElement,r=null,l=0;for(;o&&l<5;){const m=o.querySelectorAll("button");for(const i of m)if(i.querySelector('svg path[d*="M12.5 3C13.3284"]')){const h=i.closest("[data-testid]");if((!h||h.getAttribute("data-testid")!=="user-message")&&o.querySelector('div[data-testid="user-message"]')===t){r=i;break}}if(r)break;o=o.parentElement,l++}if(!r)return;const d=r.parentElement;if(!d||d.querySelector(".pp-bubble-save-icon"))return;K.add(t);const p=ve(s);r.nextSibling?d.insertBefore(p,r.nextSibling):d.appendChild(p);const y=()=>{p.style.opacity="1"},x=()=>{p.style.opacity="0"};d.addEventListener("mouseenter",y),d.addEventListener("mouseleave",x),t.addEventListener("mouseenter",y),t.addEventListener("mouseleave",x),p.__cleanup=()=>{d.removeEventListener("mouseenter",y),d.removeEventListener("mouseleave",x),t.removeEventListener("mouseenter",y),t.removeEventListener("mouseleave",x)}})}function S(){R||(R=!0,requestAnimationFrame(()=>{R=!1,H()}))}function H(){if(location.href!==D){D=location.href;const o=document.getElementById("pp-enhance-wrap");o&&o.remove(),K.clear()}Ee();const e=T();if(C=e,!e){const o=G();o.style.display="none";return}const t=j(e).trim(),n=G();if(_(t.length>0),be()){n.style.display="none";return}n.style.display="flex",de(n)}function we(){te({onChange:o=>{w=o,X(w)},persistToStorage:!0}),H();let e=0;const t=setInterval(()=>{H(),e++,e>=10&&clearInterval(t)},200);U=new MutationObserver(S),U.observe(document.documentElement,{childList:!0,subtree:!0}),window.addEventListener("resize",S),window.addEventListener("scroll",S,{passive:!0}),he(),ge(),xe();const n=history.pushState.bind(history),s=history.replaceState.bind(history);history.pushState=function(...o){n(...o),S()},history.replaceState=function(...o){s(...o),S()},window.addEventListener("popstate",S),Le()}let g=null;function ke(){const e=document.createElement("div");return e.id="pp-context-menu",e.style.cssText=`
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
  `,document.body.appendChild(e),e}function A(){g&&(g.style.display="none")}async function Ce(e,t){g||(g=ke());const n=await ne("claude"),s=n.reduce((p,y)=>p+y.prompts.length,0),o=w==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",hover:"#3d3d3d",secondary:"#999"}:{bg:"#ffffff",border:"#ddd",text:"#333",hover:"#f5f5f5",secondary:"#666"};if(g.style.background=o.bg,g.style.borderColor=o.border,g.style.color=o.text,s===0)g.innerHTML=`
      <div style="padding: 12px 16px; color: ${o.secondary}; text-align: center;">
        No saved Claude prompts yet
      </div>
    `;else{const p=n.map((m,i)=>({group:m,index:i})).filter(({group:m})=>m.prompts.length>0);g.innerHTML=`
      <div style="padding: 8px 12px; font-weight: 600; border-bottom: 1px solid ${o.border}; display: flex; align-items: center; gap: 8px;">
        <img src="${chrome.runtime.getURL("img/icon-16.png")}" width="16" height="16">
        PromptPack
      </div>
      ${p.map(({group:m,index:i},E)=>{const c=E===p.length-1?"none":`1px solid ${o.border}`;return`
          <div class="pp-group" data-group-index="${i}">
            <div class="pp-group-header" data-group-index="${i}" style="
              padding: 8px 12px;
              cursor: pointer;
              border-bottom: ${c};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span class="pp-arrow" style="transition: transform 0.2s;">▶</span>
              ${m.displayName} (${m.prompts.length})
            </div>
            <div class="pp-group-items" data-group-index="${i}" style="display: none;">
              ${m.prompts.map((u,b)=>{const v=u.header?u.header:u.text.length>50?u.text.substring(0,50)+"...":u.text;return`
                <div class="pp-menu-item" data-group-index="${i}" data-prompt-index="${b}" style="
                  padding: 8px 12px 8px 28px;
                  cursor: pointer;
                  border-bottom: ${b<m.prompts.length-1?`1px solid ${o.border}`:"none"};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                " title="${u.text.replace(/"/g,"&quot;")}">
                  ${v}
                </div>
              `}).join("")}
            </div>
          </div>
        `}).join("")}
    `,g.querySelectorAll(".pp-group-header").forEach(m=>{const i=m;i.addEventListener("mouseenter",()=>{i.style.background=o.hover}),i.addEventListener("mouseleave",()=>{i.style.background="transparent"}),i.addEventListener("click",()=>{const E=i.dataset.groupIndex,h=g.querySelector(`.pp-group-items[data-group-index="${E}"]`),c=i.querySelector(".pp-arrow");if(h){const u=h.style.display!=="none";h.style.display=u?"none":"block",c&&(c.style.transform=u?"rotate(0deg)":"rotate(90deg)")}})}),g.querySelectorAll(".pp-menu-item").forEach(m=>{const i=m,E=parseInt(i.dataset.groupIndex||"0",10),h=parseInt(i.dataset.promptIndex||"0",10);i.addEventListener("mouseenter",()=>{i.style.background=o.hover}),i.addEventListener("mouseleave",()=>{i.style.background="transparent"}),i.addEventListener("click",()=>{const c=n[E];if(c&&c.prompts[h]){const u=c.prompts[h].text;A();const b=re(u);b.length>0?Te(b,v=>{const $=se(u,v);W($)}):W(u)}})})}const r={width:250,height:300};let l=e,d=t;l+r.width>window.innerWidth&&(l=window.innerWidth-r.width-10),d+r.height>window.innerHeight&&(d=window.innerHeight-r.height-10),g.style.left=`${l}px`,g.style.top=`${d}px`,g.style.display="block"}function W(e){const t=T();t&&(t instanceof HTMLTextAreaElement?(t.value=e,t.dispatchEvent(new Event("input",{bubbles:!0}))):t.isContentEditable&&(t.innerText=e,t.dispatchEvent(new Event("input",{bubbles:!0}))),t.focus())}function Te(e,t,n){const s=document.getElementById("pp-template-dialog");s&&s.remove();const o=w==="dark"?{bg:"#2d2d2d",border:"#444",text:"#e5e5e5",secondary:"#999",inputBg:"#1e1e1e"}:{bg:"#ffffff",border:"#ddd",text:"#333",secondary:"#666",inputBg:"#fff"},r=document.createElement("div");r.id="pp-template-dialog",r.style.cssText=`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;const l=document.createElement("div");l.style.cssText=`
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
  `,l.appendChild(d);const p=[];e.forEach(c=>{const u=document.createElement("div");u.style.cssText="margin-bottom: 10px;";const b=document.createElement("label");b.textContent=c,b.style.cssText=`
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
    `,v.addEventListener("focus",()=>{v.style.borderColor="#007bff"}),v.addEventListener("blur",()=>{v.style.borderColor=o.border}),u.appendChild(b),u.appendChild(v),l.appendChild(u),p.push(v)});const y=document.createElement("div");y.style.cssText=`
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
  `;const m=document.createElement("button");m.textContent="Insert",m.style.cssText=`
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background: #007bff;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  `;const i=()=>r.remove(),E=()=>{const c={};e.forEach((u,b)=>{c[u]=p[b].value}),i(),t(c)};x.addEventListener("click",()=>{i()}),m.addEventListener("click",E);const h=c=>{c.key==="Enter"?(c.preventDefault(),E()):c.key==="Escape"&&(c.preventDefault(),i())};r.addEventListener("keydown",h),r.addEventListener("click",c=>{c.target===r&&i()}),y.appendChild(x),y.appendChild(m),l.appendChild(y),r.appendChild(l),document.body.appendChild(r),p[0]&&p[0].focus()}function Le(){document.addEventListener("contextmenu",e=>{const t=e.target,n=T();n&&(t===n||n.contains(t))&&(e.preventDefault(),Ce(e.clientX,e.clientY))}),document.addEventListener("click",e=>{g&&!g.contains(e.target)&&A()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&A()}),document.addEventListener("scroll",A,{passive:!0})}we();
