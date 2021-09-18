const puppeteer = require('puppeteer');

let html = `
<h1 fontsize=20 checked fontface="Ariel">Hello<br />Goodbye</h1>
Extra Text
<h3>Three</h3>
Four<font size="26pt">Five</font>Six
`;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(`
        <div style="height: 600px; width: 800px; position: absolute; top: 0; bottom: 0">
            <div style="position: relative; left: 100px; top: 100px; width: 300px; height: 300px; border: 1px solid black; font-size: 10pt">
${html}        
            </div>
        </div>
    `);
    await page.screenshot({ path: 'example.png' });

    await browser.close();
})();