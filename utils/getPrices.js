import fs from "fs";
// import httpRequest from "./httpRequest.js";
import axios from "axios";

export default async (currencies) => {
  try {
    const result = {};

    // Делаем асинхронные запросы для каждой валюты
    for (const symbol of currencies) {
      const { data } = await axios.get(
        `http://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
      );
      // Добавляем данные в результат
      result[symbol.toLowerCase()] = Number(data.price);
    }

    // Запись в файл
    fs.writeFileSync("resources/price.json", JSON.stringify(result), "utf-8");
  } catch (error) {
    console.error("Get prices error: ", error);
  }
};
