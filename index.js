import fs from "fs/promises";
import puppeteer from "puppeteer";

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const selectDropdownOption = async (page, groupIndex, itemIndex) => {
  const dropdownSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownContainer`;
  const dropdownItemSelector = `.block-from-group .input-group:nth-child(${groupIndex}) .dgaui_dropdownItem:nth-child(${itemIndex})`;

  await page.click(dropdownSelector);
  await page.waitForSelector(dropdownItemSelector);
  await page.click(dropdownItemSelector);
};

const saveLinksToFile = async (page) => {
  await page.waitForNetworkIdle();

  const links = await page.$$eval(".blockForm.clickable", (links) =>
    links.map(
      (link) => "https://eservicesredp.rega.gov.sa" + link.getAttribute("href")
    )
  );

  try {
    const existingData = JSON.parse(await fs.readFile("newLinks.json", "utf8"));
    const updatedData = [...existingData, ...links];
    await fs.writeFile("newLinks.json", JSON.stringify(updatedData, null, 2));
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile("newLinks.json", JSON.stringify(links, null, 2));
    } else {
      throw error;
    }
  }
};

const getLastPageNumber = async (page) => {
  return await page.evaluate(() => {
    const lastPageButton = document.querySelector(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(2)"
    );
    return lastPageButton ? parseInt(lastPageButton.innerText) : 0;
  });
};

const processPages = async (page, lastPageNumber) => {
  for (let pageNumber = 1; pageNumber <= lastPageNumber; pageNumber++) {
    await waitFor(1000);

    const nextButtonExists = await page.$(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );

    if (!nextButtonExists) break;

    await page.click(
      ".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination button:nth-last-child(1)"
    );
    await saveLinksToFile(page);
  }
};

const processBrokerPages = async (page, groupIndex, itemIndex) => {
  await selectDropdownOption(page, groupIndex, itemIndex);
  await page.click(".sc-knesRu.JDvEH.dgaui.dgaui_button.buttonMw160");

  await page.waitForNetworkIdle();
  await page.waitForSelector(".sc-dJDBYC.ecwOXH.dgaui.dgaui_pagination");

  const lastPageNumber = await getLastPageNumber(page);
  if (lastPageNumber > 0) {
    await processPages(page, lastPageNumber);
  }
};

const cities = [
  { text: "منطقة الرياض", index: 4 },
  { text: "منطقة القصيم", index: 5 },
  { text: "منطقة المدينة المنورة", index: 6 },
  { text: "الشرقية", index: 0 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://eservicesredp.rega.gov.sa/auth/queries/Brokerage");
  await page.setViewport({ width: 1024, height: 768 });
  await page.waitForSelector(".block-from-group");

  await processBrokerPages(page, 1, 1);
  await processBrokerPages(page, 2, 2);

  await browser.close();
})();
