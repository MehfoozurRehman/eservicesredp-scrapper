import fs from "fs/promises";
import puppeteer from "puppeteer";

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const selectDropdownOption = async (page, groupIndex, itemIndex) => {
  const dropdownSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownContainer`;
  const dropdownItemSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem`;

  await page.waitForSelector(dropdownSelector);
  await page.click(dropdownSelector);
  await page.waitForSelector(dropdownItemSelector);

  const items = await page.$$(dropdownItemSelector);
  if (items.length >= itemIndex) {
    await items[itemIndex - 1].click();
  } else {
    throw new Error(`Dropdown item at index ${itemIndex} not found`);
  }
};

const processBrokerPages = async (page) => {
  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  await page.waitForNetworkIdle();

  await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

  const lastPageNumber = await page.evaluate(() => {
    const lastPageButton = document.querySelector(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(2)"
    );
    return lastPageButton ? parseInt(lastPageButton.textContent) : null;
  });

  console.log("Last page number:", lastPageNumber);

  if (!lastPageNumber) {
    throw new Error("Last page number not found");
  }

  for (let pageNumber = 1; pageNumber <= lastPageNumber; pageNumber++) {
    await waitFor(1000);

    const nextButtonExists = await page.$(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );

    if (!nextButtonExists) break;

    await page.click(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );

    await page.waitForNetworkIdle();

    const links = await page.$$eval(".blockForm.clickable", (links) =>
      links.map(
        (link) =>
          "https://eservicesredp.rega.gov.sa" + link.getAttribute("href")
      )
    );

    try {
      const existingData = JSON.parse(
        await fs.readFile("newLinks.json", "utf8")
      );
      const updatedData = [...existingData, ...links];
      await fs.writeFile("newLinks.json", JSON.stringify(updatedData, null, 2));
    } catch (error) {
      if (error.code === "ENOENT") {
        await fs.writeFile("newLinks.json", JSON.stringify(links, null, 2));
      } else {
        throw error;
      }
    }
  }
};

const cities = [1, 5, 6, 7];

const brokerTypes = [1, 2];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://eservicesredp.rega.gov.sa/auth/queries/Brokerage");
  await page.setViewport({ width: 1024, height: 768 });
  await page.waitForSelector(".block-from-group");

  for (const city of cities) {
    for (const brokerType of brokerTypes) {
      await selectDropdownOption(page, 1, 1);
      await selectDropdownOption(page, 2, brokerType);
      await selectDropdownOption(page, 4, city);
      await processBrokerPages(page);
    }
  }

  await browser.close();
})();
