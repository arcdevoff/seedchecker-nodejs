import fs from "fs";

export default () => {
  const data = fs.readFileSync("./resources/proxy.txt", "utf8");
  const array = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (array.length === 0) {
    return false;
  }

  const randomValue = array[Math.floor(Math.random() * array.length)];

  // Регулярное выражение для HTTP, HTTPS и SOCKS5
  const regex = /^(http|https|socks5):\/\/([^:]+):([^@]+)@([^:]+):(\d+)$/;
  const match = randomValue.match(regex);

  if (match) {
    return {
      protocol: match[1], // http, https, или socks5
      host: match[4], // IP-адрес или домен
      port: Number(match[5]), // Порт
      auth: {
        username: match[2], // Имя пользователя
        password: match[3], // Пароль
      },
    };
  }
};
