/*
 * 22 Aug,2019 version 0.1.0 Created
 * 26 Aug,2019 version 0.2.0 add illigal format url and email check
 * 02 Nov,2019 version 0.3.0 add duplicate PersonID Check
 * 02 Nov,2019 version 0.4.0 add command line parser
 * 03 Nov,2019 version 0.5.0 change fucntions method and sepalate fucntions
 * 26 Nov,2020 version 0.5.1 Format Google Eslint
 * COPYRIGHT (C) 2019-2021 tsudon
 * Relcesed under the MIT License
 * https://opensource.org/licenses/MIT
 *
 */

const https = require('https');

const sansalib = {};
// Setting Sansan API

const sansanApi = {
  url: 'https://api.sansan.com/', // SANSAN API BASE URL
  verion: 'v3.2', // Using SANSAN API Version
};

// Query Update date

// const fromDate = '2019-08-28T12:02:00+09:00'
// const toDate = '2019-09-30T23:59:59+09:00'


/**
 * Get BizCard through SANSAN API
 * @param {sttring} api - sanan api
 * @param {json} options - api otion
 * @param {string} apikey - sansan api key
 */
async function getJSON(api, options, apikey) {
  return new Promise((resolve, reject) => {
    let query = '';
    // eslint-disable-next-line guard-for-in
    for (key in options) {
      if ({}.hasOwnProperty.call(options, key)) {
        const option = encodeURIComponent(key) +
        '=' + encodeURIComponent(options[key]);
        if (query != '') {
          query += '&';
        }
        query += option;
      }
    }
    if (query != '') {
      query = '?' + query;
    }

    const headers = {
      headers: {
        'X-Sansan-Api-Key': apikey,
        'Content-Type': 'application/json',
      },
    };
    https.get(api+query, headers, (res) => {
      let data = '';
      res.on('data', (chunck) => {
        data += chunck;
      });

      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.statusCode === 400 ) {
          console.log(`error ${data}`);
          reject(JSON.parse(data));
        }
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      console.log(`Error ${err.message}`);
      reject(err);
    });
  });
}

// All BizCard by Query from SANSAN

sansalib.getCards = async function getCards(options) {
  const url = sansanApi.url + sansanApi.verion + '/bizCards';
  if (!options['range']) {
    options['range'] = 'all';
  }
  if (!options['limit']) {
    options['limit'] = 300;
  }
  if (options['includeTags'] == null) {
    options['includeTags'] = 'true';
  }
  const apikey = options['apikey'];
  delete options['apikey'];

  let nextData = await getJSON(url, options, apikey);
  if (nextData.data) {
    data = nextData.data;
    while (nextData.hasMore) {
      options.nextPageToken = nextData.nextPageToken;
      nextData = await getJSON(url, options, apikey);
      data = data.concat(nextData.data);
      console.log(data.length);
    };
    return data;
  }
  return null;
};

// SANSAN All Shared Tag Gettter

sansalib.getTags = async function getTags(options) {
  const url = sansanApi.url + sansanApi.verion + '/tags';
  if (!options['range']) {
    options['range'] = 'all';
  }
  if (!options['limit']) {
    options['limit'] = 300;
  }
  const apikey = options['apikey'];
  delete options['apikey'];

  let nextData = await getJSON(url, options, apikey);
  if (nextData.data) {
    data = nextData.data;
    while (nextData.hasMore) {
      options.nextPageToken = nextData.nextPageToken;
      nextData = await getJSON(url, options, apikey);
      data = data.concat(nextData.data);
      console.log(data.length);
    };
    return data;
  }
  return null;
};


module.exports = sansalib;
