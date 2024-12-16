import fs from "fs/promises";
import { parse } from "csv-parse";
import { json2csv } from "json-2-csv";

(async () => {
  const csv = await fs.readFile("data.csv");
  const records = await new Promise((resolve, reject) => {
    parse(csv, { columns: true }, (err, records) => {
      if (err) {
        reject(err);
      } else {
        resolve(records);
      }
    });
  });

  // remove the ones with undefined values
  const cleanedRecords = records.filter((record) => {
    return Object.values(record).every(
      (value) => value !== undefined && value !== "undefined"
    );
  });

  const cleanedCsv = json2csv(cleanedRecords);

  await fs.writeFile("cleanedData.csv", cleanedCsv);
})();
