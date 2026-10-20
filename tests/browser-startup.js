// Run with Playwright CLI run-code against PORT=4174 node server.mjs.
async (page) => {
 const url='http://127.0.0.1:4174/lab.html?lang=ko',checks=[];
 await page.emulateMedia({reducedMotion:'reduce'});
 async function ready(){
  await page.getByRole('button',{name:'내 컴퓨터에 저장소 복제하기',exact:true}).waitFor({timeout:10000});
  if(await page.locator('#error-message').isVisible())throw Error('Unexpected startup error');
  if(await page.locator('#load-status').count())throw Error('Loading state was not removed');
 }
 await page.goto(url);await ready();checks.push('cold load');
 // Explicitly delay CSS beyond the inline module so WebKit's load ordering is exercised.
 await page.route('**/lab.css*',async route=>{await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();});
 await page.reload({waitUntil:'domcontentloaded'});await ready();checks.push('delayed stylesheet');
 await page.unroute('**/lab.css*');
 for(const asset of ['lab.css','lab.js','workshop-model.mjs']){
  const pattern=`**/${asset}*`;
  await page.route(pattern,route=>route.abort());
  await page.reload();
  await page.getByRole('button',{name:'다시 불러오기',exact:true}).waitFor({timeout:10000});
  if((await page.locator('#error-message').innerText()).includes('미리보기 서버'))throw Error('Local-only message shown on public page');
  await page.unroute(pattern);
  await page.getByRole('button',{name:'다시 불러오기',exact:true}).click();await ready();
  checks.push(`failed ${asset} and retry`);
 }
 await page.getByRole('button',{name:'내 컴퓨터에 저장소 복제하기',exact:true}).click();
 await page.getByRole('button',{name:'이야기 작업 공간 만들기',exact:true}).waitFor();
 for(const name of ['이슈와 충돌','종합 실습','협업 기초'])await page.getByRole('tab',{name,exact:true}).click();
 if(await page.locator('#workshop').getAttribute('data-step')!=='branch-story')throw Error('Progress lost');
 checks.push('clone and tab switching');
 return {checks,viewport:page.viewportSize()};
}
