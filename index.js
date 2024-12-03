import puppeteer from "puppeteer";
import { json2csv } from "json-2-csv";
import fs from "fs/promises";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto("https://eservicesredp.rega.gov.sa/auth/queries/Brokerage");
  await page.setViewport({ width: 1024, height: 768 });

  await page.waitForSelector(".block-from-group");

  await page.click(
    ".block-from-group .input-group:nth-child(1) .dgaui_dropdownContainer"
  );
  await page.waitForSelector(
    ".block-from-group .input-group:nth-child(1) .dgaui_dropdownItem"
  );
  await page.click(
    ".block-from-group .input-group:nth-child(1) .dgaui_dropdownItem:nth-child(1)"
  );

  await page.click(
    ".block-from-group .input-group:nth-child(2) .dgaui_dropdownContainer"
  );
  await page.waitForSelector(
    ".block-from-group .input-group:nth-child(2) .dgaui_dropdownItem"
  );
  await page.click(
    ".block-from-group .input-group:nth-child(2) .dgaui_dropdownItem:nth-child(1)"
  );

  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  const getLinksData = async () => {
    await page.waitForNetworkIdle();

    await page.waitForSelector(".blockForm.clickable");

    const data = await page.$$eval(".blockForm.clickable", (links) => {
      return links.map((link) => {
        const items = link.querySelectorAll(
          ".dataForm.bordered .groupItemShow"
        );
        const entry = {};
        items.forEach((item) => {
          const key = item.querySelector(".lableShow").innerText;
          const value = item.querySelector(".showData").innerText;
          entry[key] = value;
        });
        return entry;
      });
    });

    const csv = await json2csv(data, { prependHeader: false });
    const fileExists = await fs
      .access("data.csv")
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      const header = await json2csv(data, { prependHeader: true });
      await fs.writeFile("data.csv", header);
    } else {
      await fs.appendFile("data.csv", csv);
    }
  };

  const getLinks = async () => {
    await page.waitForNetworkIdle();

    await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

    const lastPage = await page.evaluate(() => {
      const lastPage = document.querySelector(
        ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(2)"
      ).innerText;

      return parseInt(lastPage);
    });

    const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

    for (let i = 1; i <= lastPage; i++) {
      console.log(`Page ${i} Start`);
      await page.click(
        ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
      );
      await waitFor(1000);
      await getLinksData();
      console.log("Page Done");
    }
  };

  console.log("First broker Start");

  await getLinks();

  console.log("First broker Done");

  // // Change the second input's option to the second option
  await page.click(
    ".block-from-group .input-group:nth-child(2) .dgaui_dropdownContainer"
  );
  await page.waitForSelector(
    ".block-from-group .input-group:nth-child(2) .dgaui_dropdownItem"
  );
  await page.click(
    ".block-from-group .input-group:nth-child(2) .dgaui_dropdownItem:nth-child(2)"
  );

  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  console.log("Second broker Start");
  await getLinks();
  console.log("Second broker Done");

  await browser.close();
})();
