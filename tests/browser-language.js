// Playwright CLI run-code; start the test server on PORT=4180.
async(page)=>{
 const errors=[],checks=[];await page.emulateMedia({reducedMotion:'reduce'});
 const audit=async context=>{
  const result=await page.evaluate(()=>{
   const untranslated=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode()))if(!node.parentElement?.closest('script,style,noscript,[data-no-translate]')&&/[가-힣]/.test(node.nodeValue))untranslated.push(node.nodeValue);
   for(const n of document.querySelectorAll('[aria-label]'))if(/[가-힣]/.test(n.getAttribute('aria-label')))untranslated.push(n.getAttribute('aria-label'));
   const clipped=[];
   if(!document.querySelector('dialog[open]'))for(const n of document.querySelectorAll('.repo-heading h2,.main-badge,.pr-card,.remote-branch,.local-conflict,.file-open,[data-action],#language-select')){
    const r=n.getBoundingClientRect();if(!r.width||!r.height)continue;const b=n.closest('.repo')?.getBoundingClientRect();
    if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5||(b&&r.bottom>b.bottom+.5))clipped.push(n.textContent);
   }
   return {untranslated,clipped,scroll:[scrollX,scrollY],error:document.querySelector('#error-message:not([hidden])')?.textContent};
  });
  if(result.untranslated.length||result.clipped.length||result.scroll.some(Boolean)||result.error)errors.push({context,...result});
 };
 for(const size of [{width:1280,height:720},{width:320,height:568}]){
  await page.setViewportSize(size);
  for(const mode of ['mission','coordination','combined']){
   await page.goto(`http://127.0.0.1:4180/lab.html?lang=en&mode=${mode}`);await page.locator('[data-action]').waitFor();
   await page.locator('#help-button').click();await audit('help');await page.locator('#info-close').click();
   let actions=0;
   while(true){
    const step=await page.locator('#workshop').getAttribute('data-step');await audit(`${size.width}/${mode}/${step}`);
    if(['push-resolution','done'].includes(step))await page.screenshot({path:`output/playwright/english-${size.width}-${mode}-${step}.png`});
    if(step==='push-resolution'){
     const before=await page.locator('#workshop').innerText();
     await page.locator('#language-select').selectOption('ko');
     if(await page.locator('#workshop').getAttribute('data-step')!==step)throw Error('Language change reset progress');
     if(!(await page.locator('#workshop').innerText()).includes('지수'))throw Error('Korean not restored');
     await page.locator('#language-select').selectOption('en');
     if(await page.locator('#workshop').innerText()!==before)throw Error('Language round trip changed the view');
     await page.locator('#step-back').click();await page.locator('#step-forward').click();
     if(await page.locator('#workshop').innerText()!==before)throw Error('History changed after language switch');
    }
    if(step==='done'){
     for(const selector of ['[data-pr]','[data-issue]','.history-button','.file-open','[data-record]']){
      const count=await page.locator(selector).count();
      for(let i=0;i<count;i++){
       const item=page.locator(selector).nth(i);if(!await item.isVisible())continue;
       await item.click();await audit(`details/${selector}/${i}`);
       await page.locator('dialog[open] .close').click();
      }
     }
     break;
    }
    if(++actions>50)throw Error('Unexpected loop');
    await page.locator('[data-action]').click();
    if(await page.locator('#file-dialog').evaluate(n=>n.open)){await audit(`editor/${step}`);await page.locator('#file-save').click();}
    await page.waitForFunction(old=>document.querySelector('#workshop').dataset.step!==old,step);
   }
   checks.push({size,mode,actions});
  }
 }
 await page.goto('http://127.0.0.1:4180/lab.html?lang=ko');await page.locator('[data-action]').waitFor();
 await page.locator('#language-select').selectOption('en');await page.goto('http://127.0.0.1:4180/lab.html');await page.locator('[data-action]').waitFor();
 if(await page.locator('html').getAttribute('lang')!=='en')throw Error('Preference not retained');
 await audit('saved language');
 return {errorCount:errors.length,errors:[...new Map(errors.map(e=>[JSON.stringify([e.untranslated,e.clipped,e.error]),e])).values()],checks};
}
