# SANSAN-KINTONE連携

　SANSANの名刺データをKintoneに放り込みます。

# 導入チャート
- gitって何 -> 知らない -> プラグイン使ってください
- nodeJSって何(YES/NO) -> 知らない -> プラグイン使ってください
- KintoneのAPI TOKENやフィールドコード -> わからない -> プラグイン使ってください
- SHELLとかバッチ -> わからない -> プラグイン使ってください
- ボタンをポチポチするの面倒 -> 導入！

# 実行環境
- node.js 10+ kintone-rest-api-clientがサポートするバージョン
- npm
- OS nodeJSが動く環境(Linux,Windows,MAC...)

# 使い方

　ファイルをダウンロードし、適当なフォルダに全ファイルを放り込みます。追加パッケージをインストールします。


```
% npm install
```

 設定をconfig.jsに記述します（SansanのAPIのフィールド名とKintoneのフィールド名を対応させます。Kintoneのフィールドタイプに注意）
 
 .envに以下の情報を設定します

```
KINTONE_DOMAIN=https://yourdomain.cybozu.com
APP_ID=xx
KINTONE_TOKEN=<FORM KINTONE APP CONFIG>
SANSAN_APIKEY=<FROM SANSAN SETTING>
```

KINTONE_DOMAIN 接続するKintoneのドメイン
APP_ID KintoneのアプリID
KINTONE_TOKEN Kintoneのアプリ用Token(要、参照・作成・更新権限)
SANSAN_APIKEY SANSANから取得したAPIKEY

```
% node kintone 
```

- 動作を確認してください(SANSANのデータがKintoneに読み込まれているか)
- あとはcrontabなどで自動実行してください


## ヘルプ
```
% node kintone --help
```

## オプション

　config.jsの値を一時的に変更したい場合に使用します。デフォルトのconfig.jsは日付差分でデータを取るので、最初の一回は、--from 2000-1-1あたりを指定して全データ取り込んだ方が良いでしょう。

```
Options:
  -t, --to <s>       To date 
  -f, --from <s>     From date
  -a, --token <s>    SANSAN API key 
  -k, --kintone <s>  Kintone API key   
  -d, --domain <s>   Kintone domain name
  -n, --app <s>      Kintone app no.
  -h, --help         output usage information
```


# 準備するもの

- SANSANのAPI TOKEN
- 連携するKintoneのAPP番号Y
- 同 App API TOKEN(書き込み権限付き)
- 同 Kintoneのアプリのフィールドコードのリスト
- config.js

# 制限事項
- メールアドレスは簡易チェックでイリーガルなものは弾いています
- 日本語URLなどは弾いています（Kintoneのリンクフィールド - Webサイトのアドレスが日本語URLを受け付けないため)
- この制限は、フィールドを文字列にすれば回避出来ると思います（テストはしていない）

# 補足
　sansanlib.jsのsansanApiのverisonを変えるとAPIのバージョンを変更出来ます。
　2.5 - 3.2まででこのアプリの動作に影響する大きな変更はないはずです(V1.x系はページネーションの仕様が違い、サポートは終了しています)

  config.jsに指定したキャッシュファイル(デフォルトはsansanid.json)にレコード番号と名詞idとのペアを出力しています。高速化の為のギミックです（このファイルは、なくても動作します） 