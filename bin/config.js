// .env 読み込み API Keyなどは.envで指定する
require('dotenv').config();
const env =process.env;

// レコードID(Kintone)
const $id = '人物IDコード';

// 更新キー(Kintone) 更新キーはユニークにすること
const updateKey = '人物ID';

// コマンドラインでAPIKEYを指定するのはセキュリティホールなので隠ぺい

// 差分だけ取る（デフォルトは5日) 全フィールド読み込む場合、検索開始日を最古の更新日より前にする

const daysAgo = new Date();
daysAgo.setDate(daysAgo.getDate() - 5); // 5 day


const options = {
  app: env.APP_ID, // Kintone App No
  kintoneToken: env.KINTONE_TOKEN, // Kintone API Token
  domain: env.KINTONE_DOMAIN, // Kintone Domain
  from: daysAgo.toString(), // 検索 開始日(SANSAN)
  to: new Date().toString(), // 検索 終了日(SANSAN)
  sansanApikey: env.SANSAN_APIKEY, // SANSAN APK KEY
};

// SANSAN - Kintone Field Code対応　Kintone側に対応するフィールドを作成しておくこと。
const label = {
  companyName: 'Company',
  departmentName: '部署名',
  title: '役職',
  name: 'Customer',
  nameReading: '氏名_カナ',
  lastName: '氏名_姓',
  firstName: '氏名_名',
  lastNameReading: '氏名_カナ_姓',
  firstNameReading: '氏名_カナ_名',
  postalCode: '郵便番号',
  address: '住所_全て',
  prefecture: '住所_都道府県',
  city: '住所_市区町村',
  street: '住所_番地',
  building: '住所_ビル名',
  tel: 'TEL_1',
  secondTel: 'TEL_2',
  fax: 'FAX',
  mobile: '携帯電話',
  email: 'e_mail',
  url: 'URL',
  registeredTime: '登録日',
  exchangeDate: '名刺交換日',
  updatedTime: '名刺更新日時',
  memo: 'メモ',
  owner: {
    id: '名刺所有者ユーザID',
    name: '名刺所有者名',
    //  email:
  },
  id: '名刺ID',
  personId: '人物ID',
  companyId: '会社ID',
  tags: 'タグ', // -> tag.name + ","
};

// キャッシュ用JSON Kintone側のデータ取得数を減らすギミック
const jsonname = './sansanid.json';

/* 設定ここまで */

const config = {
  jsonname: jsonname,
  label: label,
  $id: $id,
  updateKey: updateKey,
  options: options,
};

module.exports=config;
