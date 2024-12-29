import fs from "fs/promises";
import puppeteer from "puppeteer";

const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

const cities = ["الرياض", "القصيم", "جدة", "الشرقية", "المدينة المنورة"];

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto("https://eservicesredp.rega.gov.sa/auth/queries/Brokerage");
  await page.setViewport({ width: 1024, height: 768 });

  await page.waitForSelector(".block-from-group");

  const selectDropdownOption = async (groupIndex, itemIndex) => {
    await page.click(
      `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownContainer`
    );
    await page.waitForSelector(
      `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem`
    );
    await page.click(
      `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem:nth-child(${itemIndex})`
    );
  };

  await selectDropdownOption(1, 1);
  await selectDropdownOption(2, 1);

  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  const getLinksHref = async () => {
    await page.waitForNetworkIdle();

    const links = await page.$$eval(".blockForm.clickable", (links) => {
      return links.map((link) => {
        const href = link.getAttribute("href");
        return "https://eservicesredp.rega.gov.sa" + href;
      });
    });

    console.log(links);

    const data = links.flatMap((link) => link);

    try {
      const existingData = JSON.parse(
        await fs.readFile("newLinks.json", "utf8")
      );
      const updatedData = [...existingData, ...data];
      await fs.writeFile("newLinks.json", JSON.stringify(updatedData, null, 2));
    } catch (error) {
      if (error.code === "ENOENT") {
        await fs.writeFile("newLinks.json", JSON.stringify(data, null, 2));
      } else {
        throw error;
      }
    }
  };

  console.log("First broker Start");
  await page.waitForNetworkIdle();

  await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

  const lastPageSecondBroker = await page.evaluate(() => {
    const lastPage = document.querySelector(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(2)"
    ).innerText;

    return parseInt(lastPage);
  });

  for (let i = 1; i <= lastPageSecondBroker; i++) {
    console.log(`Page ${i} Start`);
    await waitFor(1000);

    const nextButtonExists = await page.$(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );

    if (!nextButtonExists) {
      console.log("Next button does not exist. Stopping.");
      break;
    }

    await page.click(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );
    await getLinksHref();
    console.log("Page Done");
  }
  console.log("First broker Done");

  await selectDropdownOption(2, 2);

  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  console.log("Second broker Start");
  await page.waitForNetworkIdle();

  await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

  const lastPage = await page.evaluate(() => {
    const lastPage = document.querySelector(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(2)"
    ).innerText;

    return parseInt(lastPage);
  });

  for (let i = 1; i <= lastPage; i++) {
    console.log(`Page ${i} Start`);
    await waitFor(1000);

    const nextButtonExists = await page.$(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );

    if (!nextButtonExists) {
      console.log("Next button does not exist. Stopping.");
      break;
    }

    await page.click(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );
    await getLinksHref();
    console.log("Page Done");
  }
  console.log("Second broker Done");

  // await browser.close();
})();