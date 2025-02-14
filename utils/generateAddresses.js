import TronWeb from "tronweb"; // tronweb@5.1
import bitcoin, { payments } from "bitcoinjs-lib";
import { HDNodeWallet, Mnemonic } from "ethers";
import { stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { derivePath } from "ed25519-hd-key";
import { Keypair as Solana } from "@solana/web3.js";
import bip32 from "bip32"; // bip32@2.0.6
import { crypto } from "@binance-chain/javascript-sdk";
import bip39 from "bip39";
import nacl from "tweetnacl";
import { deriveAddress } from "ripple-keypairs";
import { Keypair as Stellar } from "stellar-sdk";
import { parentPort } from "worker_threads";

export default async (mnemonic) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  // Определение сетей для разных криптовалют
  const litecoinNetwork = {
    messagePrefix: "\x19Litecoin Signed Message:\n",
    bech32: "ltc",
    bip32: {
      public: 0x019da462,
      private: 0x019d9cfe,
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
  };

  const dogecoinNetwork = {
    messagePrefix: "\x19Dogecoin Signed Message:\n",
    bech32: "dogecoin",
    bip32: {
      public: 0x02fac398,
      private: 0x02fac398,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  };

  const bitcoinNetwork = bitcoin.networks.bitcoin;

  const addresses = await Promise.all([
    // TRX
    (async () => {
      const node = bip32.fromSeed(seed);

      const path = "m/44'/195'/0'/0/0";
      const child = node.derivePath(path);
      const privateKey = child.privateKey.toString("hex");
      const tronWeb = new TronWeb({
        fullHost: "https://api.trongrid.io",
        privateKey: privateKey,
      });

      parentPort.postMessage({
        type: "currentChecked",
        address: tronWeb.defaultAddress.base58,
      });
      return { trx: { address: tronWeb.defaultAddress.base58 } };
    })(),

    // LTC
    (async () => {
      let addres = payments.p2pkh({
        pubkey: Buffer.from(
          bip32.fromSeed(seed, litecoinNetwork).derivePath("m/44'/2'/0'/0/0")
            .publicKey
        ),
        network: litecoinNetwork,
      }).address;

      parentPort.postMessage({
        type: "currentChecked",
        address: addres,
      });
      return { ltc: { address: addres } };
    })(),

    // XLM
    (async () => {
      // Путь для Stellar (m/44'/148'/0')
      const path = "m/44'/148'/0'";
      const derivedSeed = derivePath(path, seed);

      // Получение приватного ключа
      const rawSeed = derivedSeed.key;

      // Генерация пары ключей Stellar
      const keypair = Stellar.fromRawEd25519Seed(rawSeed);

      // Получение публичного адреса и секретного ключа
      const xlmAddress = keypair.publicKey(); // Публичный адрес
      const secretSeed = keypair.secret(); // Приватный ключ

      parentPort.postMessage({
        type: "currentChecked",
        address: xlmAddress,
      });
      return { xlm: { address: xlmAddress } };
    })(),

    // ETH
    (async () => {
      let addres = HDNodeWallet.fromMnemonic(
        Mnemonic.fromPhrase(mnemonic),
        `m/44'/60'/0'/0/0`
      ).address;

      parentPort.postMessage({
        type: "currentChecked",
        address: addres,
      });
      return { eth: { address: addres } };
    })(),

    // BTC
    (async () => {
      const root = bip32.fromSeed(seed, bitcoinNetwork);

      // Получаем BIP84 ключ из BIP32 master key
      const account = root.derivePath("m/84'/0'/0'/0/0");

      // Получаем публичный адрес из BIP84 ключа
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: account.publicKey,
        bitcoinNetwork,
      });

      parentPort.postMessage({
        type: "currentChecked",
        address: address,
      });
      return { btc: { address } };
    })(),

    // DOGE
    (async () => {
      let addres = payments.p2pkh({
        pubkey: Buffer.from(
          bip32.fromSeed(seed, dogecoinNetwork).derivePath("m/44'/3'/0'/0/0")
            .publicKey
        ),
        network: dogecoinNetwork,
      }).address;

      parentPort.postMessage({
        type: "currentChecked",
        address: addres,
      });
      return { doge: { address: addres } };
    })(),

    // XRP
    (async () => {
      // Создание master key
      const root = bip32.fromSeed(seed);

      // Определение пути для XRP (m/44'/144'/0'/0/0)
      const path = "m/44'/144'/0'/0/0";
      const child = root.derivePath(path);

      // Приватный ключ в формате hex
      // const privateKey = child.privateKey.toString('hex');

      // Получение публичного ключа
      const publicKey = child.publicKey.toString("hex");

      // Получение XRP-адреса
      const xrpAddress = deriveAddress(publicKey);

      parentPort.postMessage({
        type: "currentChecked",
        address: xrpAddress,
      });
      return { xrp: { address: xrpAddress } };
    })(),

    // ATOM
    (async () => {
      const atomWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
      });
      const [account] = await atomWallet.getAccounts();

      parentPort.postMessage({
        type: "currentChecked",
        address: account.address,
      });
      return { atom: { address: account.address } };
    })(),

    // SOL
    (async () => {
      // Производное seed по указанному пути
      const path = `m/44'/501'/0'`; // Пример пути для получения ключа (подставьте свой путь)
      const { key } = derivePath(path, seed);

      // Создание ключевой пары на основе seed
      const secretKey = nacl.sign.keyPair.fromSeed(key).secretKey;
      const keypair = Solana.fromSecretKey(secretKey);

      // Получение адреса кошелька из ключевой пары
      const solanaAddress = keypair.publicKey.toBase58();

      parentPort.postMessage({
        type: "currentChecked",
        address: solanaAddress,
      });
      return { sol: { address: solanaAddress } };
    })(),

    // BNB
    (async () => {
      let addres = crypto.getAddressFromPublicKey(
        crypto.getPublicKeyFromPrivateKey(
          crypto.getPrivateKeyFromMnemonic(mnemonic)
        ),
        "bnb"
      );

      parentPort.postMessage({ type: "currentChecked", address: addres });
      return { bnb: { address: addres } };
    })(),
  ]);

  // Объединяем все адреса в один объект
  // const result = addresses.reduce(
  //   (acc, current) => ({ ...acc, ...current }),
  //   {}
  // );

  let result = {
    trx: { address: "TVgmLnekExPiQgkJK6JGAQ8YxUSDPR5MJj", balance: null },
    ltc: { address: "LaYPLuQEanVCYM9TztR9FuT3ZbTJM6wHEZ", balance: null },
    eth: {
      address: "0x1FD74cEa74b547E33a72Bd795AEDd1fC83117Fc1",
      balance: null,
    },
    xlm: {
      address: "GB5IH7DSX2KG6WX53XLCECZMQRZNSED7RSFVTU3WS4UZSIE7JE5NQDM2",
      balance: null,
    },
    btc: {
      address: "bc1qa74flzttl9k0rsnmgtcw5dj35hsx40lf2wt4ka",
      balance: null,
    },
    doge: { address: "DTZSTXecLmSXpRGSfht4tAMyqra1wsL7xb", balance: null },
    xrp: { address: "r3qXYzmCXCJzH3FfdgvuYacSfTChfofunB", balance: null },
    atom: {
      address: "cosmos1f8g4xwwj3emdr0semcgdda3vssj0cnuu0ee4u2",
      balance: null,
    },
    sol: {
      address: "2dfgsiSaZ51QYPsECMYMG247PXxyKdwkV9wTHoQb8YEC",
      balance: null,
    },
    bnb: {
      address: "bnb18uvqe272qu0ymmd2g98hnqslmjm53w8crshr9t",
      balance: null,
    },
  };

  return result;
};
