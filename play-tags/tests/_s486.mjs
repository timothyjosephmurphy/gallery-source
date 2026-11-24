import { chromium } from 'playwright-core'; const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await (await b.newContext({viewport:{width:960,height:600}})).newPage();
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 240000 }); await p.waitForTimeout(8000);
await p.screenshot({path:process.argv[3]}); await b.close();
