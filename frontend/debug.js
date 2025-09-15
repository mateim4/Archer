await page.locator("*").all().then(els => console.log(els.length, "elements found"));
