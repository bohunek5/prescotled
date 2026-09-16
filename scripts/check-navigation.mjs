import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import {routes} from './site-layout.mjs';
const base=new URL(process.env.BASE_URL||'http://127.0.0.1:4188/');
const output=process.env.QA_DIR||'/private/tmp/prescotled-navigation-qa';
await mkdir(output,{recursive:true});
const results=[];
const jobs=process.env.TEST_WIDTH?[{engine:process.env.TEST_ENGINE||'chromium',width:+process.env.TEST_WIDTH}]:[320,390,768,1024,1440].map(width=>({engine:'chromium',width})).concat({engine:'webkit',width:390});
for(const {engine,width} of jobs){
 const browser=await ({chromium,webkit}[engine]).launch();
 const page=await browser.newPage({viewport:{width,height:900},isMobile:width<641,hasTouch:width<641});
 const errors=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base.href))failures.push(`${r.status()} ${r.url()}`);});
 const layout=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
 try{
  for(const [route] of routes){
   const response=await page.goto(new URL(route+'/',base).href);
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>document.body.dataset.ready==='true');
   assert.equal(await page.locator('h1').count(),1);
   await layout();
   assert.ok(await page.locator(`[aria-current="page"][href="../${route}/"]`).count());
   if(route==='zasilacze'||route==='sterowniki'){
    await page.waitForFunction(()=>window.componentsDebug);
    const expected=route==='sterowniki'?'controller':'power';
    assert.equal(await page.evaluate(()=>window.componentsDebug.inspect().type),expected);
    await page.waitForFunction(()=>document.getElementById('component-viewer').dataset.state==='ready',null,{timeout:60000});
    assert.equal(await page.locator('#component-viewer canvas').count(),1);
    assert.equal(await page.locator('#component-models button').count(),expected==='controller'?5:6);
    assert.ok((await page.locator('#component-source').getAttribute('href')).startsWith(new URL('assets/',base).href));
   }
   if(route==='dystrybucja'){
    await page.locator('.brand-tile').first().click();
    await page.waitForURL(new URL('dystrybucja/#klus',base).href);
    assert.equal(await page.locator('#klus h2').isVisible(),true);
   }
   if(route==='do-pobrania')assert.equal(await page.locator('a[href$=".pdf"]').count(),14);
   if(route==='konfigurator'){
    await page.waitForFunction(()=>document.querySelector('iframe').src.startsWith('https://bohunek5.github.io/prescotpl/konfigurator/'));
   }
   if((width===390&&engine==='webkit')||width===1440)await page.screenshot({path:`${output}/${engine}-${width}-${route}.png`});
  }
  await page.goto(new URL('tasmy-led/',base).href);
  await page.locator('#series-search').fill('rgbw');
  assert.equal(await page.locator('.series-card:visible').count(),1);
  await page.locator('.series-card:visible a').click();
  await page.waitForURL(new URL('serie/premium-rgbw/',base).href);
  await page.goBack();
  await page.waitForFunction(()=>document.querySelector('#series-search')?.value==='rgbw');
  assert.equal(await page.locator('.series-card:visible').count(),1);
  await page.locator('.series-card:visible a').click();
  await page.locator('.detail-hero .button').click();
  await page.waitForURL(url=>url.pathname.endsWith('/konfigurator/'));
  const state=JSON.parse(decodeURIComponent(new URL(page.url()).hash.slice(8)));
  assert.equal(state.strip,'premium-rgbw');
  await page.waitForFunction(()=>document.querySelector('iframe').src.includes('#config='));
  const source=await page.locator('iframe').getAttribute('src');
  assert.equal(JSON.parse(decodeURIComponent(new URL(source).hash.slice(8))).strip,'premium-rgbw');
  await page.locator('.configurator-toolbar a').click();
  await page.waitForURL(new URL('tasmy-led/',base).href);
  if(width<=960){
   await page.locator('.menu-toggle').click();
   const group=page.locator('#site-nav details').first();
   if(!await group.getAttribute('open')){if(!await group.evaluate(el=>el.open))await group.locator('summary').click();}
   await page.keyboard.press('Escape');
   assert.equal(await group.evaluate(el=>el.open),false);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
   assert.equal(await page.evaluate(()=>document.activeElement.className),'menu-toggle');
  }else{
   await page.locator('#site-nav summary').first().focus();
   await page.keyboard.press('Enter');
   assert.equal(await page.locator('#site-nav details').first().evaluate(el=>el.open),true);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#site-nav details').first().evaluate(el=>el.open),false);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  results.push({engine,width,status:'pass',routes:routes.length,checks:'direct routes, active navigation, product defaults and 3D, PDF links, brand anchors, filter restoration, selected tape inside local configurator, return, keyboard/Escape, layout'});
  console.log(`${engine} ${width}: PASS`);
 }catch(error){results.push({engine,width,status:'fail',error:error.message,errors,failures});console.error(`${engine} ${width}: FAIL ${error.message}`);process.exitCode=1;await page.screenshot({path:`${output}/${engine}-${width}-navigation-failure.png`});}
 finally{await browser.close();await writeFile(`${output}/navigation-report.json`,JSON.stringify({base:base.href,results},null,2));}
}
