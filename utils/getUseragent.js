import fs from "fs";

export default () => {
  const data = fs.readFileSync("./resources/useragent.txt", "utf8");
  const array = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (array.length === 0) {
    return false;
  }

  const randomValue = array[Math.floor(Math.random() * array.length)];

  return randomValue;
};
