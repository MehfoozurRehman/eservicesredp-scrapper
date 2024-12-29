import fs from "fs/promises";
import puppeteer from "puppeteer";

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const selectDropdownOption = async (
  page,
  groupIndex,
  itemIndex1,
  itemIndex2,
  itemIndex3
) => {
  const dropdownSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownContainer`;

  const selectItem = async (itemIndex) => {
    const dropdownItemSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem:nth-child(${itemIndex})`;
    await page.waitForSelector(dropdownSelector);
    await page.click(dropdownSelector);
    await page.waitForSelector(dropdownItemSelector);
    await page.click(dropdownItemSelector);
  };

  await selectItem(itemIndex1);
  await selectItem(itemIndex2);
  await selectItem(itemIndex3);
};

const processBrokerPages = async (page) => {
  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  await page.waitForNetworkIdle();

  await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

  const lastPageNumber = await page.evaluate(() => {
    const lastPageButton = document.querySelector(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(2)"
    );
    return lastPageButton ? parseInt(lastPageButton.innerText) : 0;
  });

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
      await selectDropdownOption(page, 1, brokerType, city);
      await processBrokerPages(page);
    }
  }

  // await browser.close();
})();
