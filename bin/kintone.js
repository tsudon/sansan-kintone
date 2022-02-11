/*
 * 04 Nov,2019 version 0.6.0 Created
 * 09 Nov,2019 version 0.6.1 expanded config.js
 * 20 Aug,2020 version 0.8.0 change Middle Ware
 *   KintoneJSSDK -> Kintone/rest-api-client
 * 26 Nov,2020 version 0.8.1 Format Google Eslint
 * 08 Mar,2021 version 0.8.2 Config use .env/API update v3.2
 * reuqire : node/npm/commander/KintoneJSSDK/dotenv
 * COPYRIGHT (C) 2019-2021 tsudon
 * Released under the MIT License
 * https://opensource.org/licenses/MIT
 */

const fs = require('fs');
const {KintoneRestAPIClient} = require('@kintone/rest-api-client');
const sansan = require('./sansanlib');
const program = require('commander');

const config = require('./config');

const jsonname = config.jsonname;
const label = config.label;
const $id = config.$id;
const updateKey = config.updateKey;

const options = {
  token: config.options.kintoneToken,
  domain: config.options.domain,
  app: config.options.app,
  fields: [$id, updateKey],
  query: `order by ${$id} asc`,
};


let json = [];
if (fs.existsSync(jsonname)) {
  json = JSON.parse(fs.readFileSync(jsonname, 'utf8'));
  const max = Math.max(...json.map((v) => {
    return v[$id];
  }));
  options.query = `${$id} > ${max} ${options.query}`;
}

/**
 * write JSON log for update check
 * @param {json} records
 * @return {json}
 */
function writeRecords(records) {
  try {
    const fields = options.fields;
    for (let i=0; i<records.length; i++) {
      const record = records[i];
      json[i] = {};
      for (let j=0; j<fields.length; j++) {
        json[i][fields[j]] = record[fields[j]].value;
      }
    }
    const buffer = JSON.stringify(json, null, 2);
    fs.writeFile(jsonname, buffer, (err)=>{
      if (err) {
        console.log(`Write error ${err.message}`);
      } else {
        console.log('ID list Update Compeleted');
      }
    });
    return json;
  } catch (e) {
    console.log(e);
  }
}

/**
 * getRecordAsync GetKintoneRecords for Match
 * レコード番号と名刺IDのペアをKintoneから引っ張てくる
 * (ペアはローカルファイルに保存し、次回からは差分だけとる)
 * @return {json}
 */
async function getRecordAsync() {
  return new Promise((resolve, reject) => {
    try {
      options.token = args.kintone;
      options.domain = args.domain;
      options.app = args.app;
      const client = new KintoneRestAPIClient({
        baseUrl: options.domain,
        auth: {
          apiToken: options.token,
        },
      });

      client.record.getAllRecordsWithCursor({
        app: options.app,
        fields: options.fields,
        query: options.query,
      }).then((resp) => {
        const json = writeRecords(resp);
        resolve(json);
      }).catch((error) => {
        console.error(error);
        reject(error);
      });
      //
    } catch (error) {
      // The promise function always reject with KintoneAPIExeption
      console.error(error);
      reject(error);
    }
  });
}

/**
 * sansanChekcer illigal SANSAN data check and normalize for Kintone
 * sansanが良く変な値 ● とかを返すので、それをはねる。KintoneにはJSON型がないのでTAGを1行に変換
 * @param {json} data
 * @return {json} - checked data
 */
function sansanCheker(data) {
  // check duplicate Person ID
  const hash = {};
  for (d of data) {
    if (hash[d.personId] ) {
      // eslint-disable-next-line max-len
      console.log(`Duplicate Person ID:${d.personId} |${d.companyName} | ${d.lastName} ${d.firstName} `);
    }
    hash[d.personId] = d;
  }
  data = [];
  let i =0;
  // eslint-disable-next-line guard-for-in
  for (const key in hash) {
    data[i++] = hash[key];
  }
  // Check illigal format EMAIL and URL
  for (d of data) {
    if (d.email) {
      // eslint-disable-next-line max-len
      if (d.email.match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)==null) {
        // eslint-disable-next-line max-len
        console.log(`Illigal email on Kintone:${d.companyName} | ${d.lastName} ${d.firstName} | ${d.email} | ${d.url}`);
        d.email = null;
      }
    }
    if (d.url) {
      // eslint-disable-next-line max-len
      if (d.url.match(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/)==null) {
        // eslint-disable-next-line max-len
        console.log(`Illigal URL on Kintone:${d.companyName} | ${d.lastName} ${d.firstName} | ${d.email} | ${d.url}`);
        d.url = null;
      }
    }

    // CHANGE TAGS ALLAY to SCALAR

    d.tags = d.tags.map((v) => {
      return v.name;
    }).join(',');
    for (f in d) {
      if (d[f] == null) d[f] = '';
    }
  }
  return data;
}

/**
 * change format for Kintone REST API
 * @param {json} data - sansan data
 * @param {string} updateKey - updateKey for Kintone
 * @return {json} - kintone record for update
 */
function createRecord(data, updateKey) {
  const record ={};
  data['name'] = data.firstName !='' ?
    data.lastName + ' ' + data.firstName :data.lastName;
  data['nameReading'] = (data.firstNameReading)?
    data.lastNameReading + ' ' + data.firstNameReading :data.lastNameReading;
  let updateField = null;
  if (updateKey) {
    updateField = updateKey.field;
  }

  for (const key in data) {
    if (label[key] && label[key] !== updateField) {
      record[label[key]] = {value: data[key]};
    }
  }
  if (updateKey) {
    const updateRecord = {};
    updateRecord['updateKey'] = updateKey;
    updateRecord['record'] = record;
    return updateRecord;
  } else {
    return record;
  }
}

/**
 * Update / Insert selector
 * kintone-rest-api-clinetにはupsertが実装されているが1レコードしかできない
 * @param {*} data inpudata
 * @param {*} index index
 * @return {json}
 */
function upsertSeparator(data, index) {
  const update = [];
  const insert = [];
  const hash = {};
  for (const d of index) {
    hash[d] = true;
  }
  for (const d of data) {
    if (hash[d.personId] ) {
      update.push(createRecord(d, {field: updateKey, value: d.personId}));
    } else {
      insert.push(createRecord(d));
    }
  }
  return {insert: insert, update: update};
}

/**
 * Data update on Kintone from sansan
 * @param {*} records
 *
 */
async function updates(records) {
  const client = new KintoneRestAPIClient({
    baseUrl: options.domain,
    auth: {
      apiToken: options.token,
    },
  });

  client.record.updateAllRecords({
    app: options.app,
    records: records,
  }).then((resp) => {
    console.log('Update Success!');
  }).catch((error) => {
    console.log('Update Error!');
    const no = error.results.findIndex(
        (v) => (v['KintoneAPIException']!==null));
    const errordata = error.results[no].errorRaw.response.data;
    console.error(`Error line ${no}`);
    console.error('code:' + errordata.code);
    console.error('id:' + errordata.id);
    console.error('message:' + errordata.message);
    console.error(error.results[no].errorRaw.response.data.errors);
  });
}

/**
 * Data insert on Kintone from sansan
 * @param {*} records
 *
 */
async function inserts(records) {
  console.log(JSON.stringify(records[0]));
  const client = new KintoneRestAPIClient({
    baseUrl: options.domain,
    auth: {
      apiToken: options.token,
    },
  });
  client.record.addAllRecords({
    app: options.app,
    records: records,
  }).then((resp) => {
    console.log('Insert Success!');
    // console.log(resp);
  }).catch((error) => {
    console.log('Insert Error!');
    const no = error.results.findIndex(
        (v) => (v['KintoneAPIException']!==null));
    const errordata = error.results[no].errorRaw.response.data;
    console.error(`Error line ${no}`);
    console.error('code:' + errordata.code);
    console.error('id:' + errordata.id);
    console.error('message:' + errordata.message);
  });
}

/**
 * main
 * 1. SANSANからデータをとってくる
 * 2. 変なデータをはねる
 * 3. Kintoneのデータと照合（すでにデータがあるかチェック）
 * 3. kintoneのデータを更新する
 */
async function main() {
  const options = {
    range: 'all',
    updatedFrom: args.from,
    updatedTo: args.to,
    includeTags: 'true',
    limit: 300,
    apikey: args.token,
  };
  let data = await sansan.getCards(options);
  data = sansanCheker(data);
  const records = await getRecordAsync();
  const upsertData = upsertSeparator(data, records.map((v) =>{
    return v['人物ID'];
  }));
  if (upsertData.insert.length>0) {
    inserts(upsertData.insert);
    console.log(`追加:${upsertData.insert.length}`);
  }
  if (upsertData.update.length>0) {
    updates(upsertData.update);
    console.log(`更新:${upsertData.update.length}`);
  }
}

/**
 * getArgs get command line arguments
 * @return {json} - configs
 */
function getArgs() {
  program
  //   .option("-T, --tag <s>","Tag Filename","tags.json")
  //   .option("-o, --output <s>","Output Filename","data.csv")
      .option('-t, --to <s>', 'To date', config.options.to)
      .option('-f, --from <s>', 'From date', config.options.from)
      .option('-a, --token <s>', 'SANSAN API key', config.options.sansanApikey)
      .option('-k, --kintone <s>',
          'Kintone API key', config.options.kintoneToken)
      .option('-d, --domain <s>', 'Kintone domain name', config.options.domain)
      .option('-n, --app <s>', 'Kintone app no.', config.options.app)
      .parse(process.argv);
  program.from = new Date(program.from).toISOString().replace(/\.[0-9]{3}/, '');
  program.to = new Date(program.to).toISOString().replace(/\.[0-9]{3}/, '');
  return program;
}
const args = getArgs();
main();
