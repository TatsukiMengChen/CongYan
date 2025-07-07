接入流程

更新时间：2024-05-16 09:06:04

## 说明

本文档主要介绍调用AIGC创新赛接口的鉴权方式

## 鉴权字段

当调用AIGC创新赛提供的api接口时，平台会对每个请求进行身份认证，调用方需要在每个请求的**请求头**中添加用于鉴权的**请求头字段**，需添加的请求头字段如下表：

| 字段                        | 值                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| X-AI-GATEWAY-APP-ID         | AIGC官网给审核通过的队伍分配的app_id（见官网右上角`个人资料-参赛平台-应用赛道参赛资源`） |
| X-AI-GATEWAY-TIMESTAMP      | 请求时的Unix时间戳，以秒为单位（注意是当前时间的时间戳）                                 |
| X-AI-GATEWAY-NONCE          | 8位随机字符串                                                                            |
| X-AI-GATEWAY-SIGNED-HEADERS | 填写 “x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce” 字符串              |
| X-AI-GATEWAY-SIGNATURE      | 签名字符串 ，计算方法参见下方`签名计算`部分                                              |

## 签名计算

### 签名计算过程

签名串的计算公式如下：

```
signature = base64_encode(HMAC-SHA256-HEX(app_key, signing_string))
```

其中，signing_string 为：

```
signing_string = HTTP Method + "\n" + HTTP URI + "\n" + canonical_query_string + "\n" + app_id + "\n" + timestamp + "\n" + signed_headers_string
```

signing_string中需要拼接的各个字段解释如下：

- `HTTP Method`：指 HTTP 协议中定义的 POST 请求方法，必须使用全大写的形式。
- `HTTP URI`：要求必须以“/”开头，不以“/”开头的需要补充上，空路径为“/”。
- `timestamp`：请求时间（UTC时间），放在 `X-AI-GATEWAY-TIMESTAMP` 中。
- `canonical_query_string`：是对于 URL 中的 query（ query 即 URL 中 ? 后面的 key1=valve1&key2=valve2 字符串）进行编码后的结果。
- `app_id`：应用标识, 放在 `X-AI-GATEWAY-APP-ID` 中。
- `signed_headers_string`：是从请求头中获取客户端指定的字段，并按顺序拼接字符串的结果。具体见下面描述

`canonical_query_string` 的生成步骤如下：

- 如果URL没有query项，则canonical_query_string为空字符串，无需计算query项。
- 如果URL有query项，提取 URL 中的 query 项，即 URL 中 ? 后面的 key1=valve1&key2=valve2 字符串。
- 将 query 根据&分隔符拆开成若干项，每一项是 key=value 或者只有 key 的形式。
- 对拆开后的每一项进行编码处理，分以下两种情况:
  - 1.当该项只有 key 时，转换公式为 url_encode(key) + “=” 的形式。
  - 2.当该项是 key=value 的形式时，转换公式为 url_encode(key) + “=” + url_encode(value) 的形式。这里 value 可以是空字符串。
- - 将每一项转换后，以 key 按照字典顺序（ ASCII 码由小到大）排序，并使用 & 符号连接起来，生成相应的 canonical_query_string 。

signed_headers_string为：

```
signed_headers_string = "x-ai-gateway-app-id" + ":" + app_id + "\n" + "x-ai-gateway-timestamp" + ":" + timestamp + "\n" + "x-ai-gateway-nonce" + ":" + nonce
```

### 签名计算示例

#### 示例一 GET请求

地理编码(POI搜索)能力的curl命令请求格式如下：

```
curl -XGET "http://api-ai.vivo.com.cn/search/geo" --data-urlencode "keywords=上梅林" --data-urlencode "city=深圳" --data "page_num=1" --data "page_size=3"
```

某个队伍准备调用该能力，该队伍的app_id为`1080389454`，app_key为`XpurLJTrKSuAGoIq`， 生成随机字符串nonce为`le1qqjex`

第一步，先确定 signing_string 中的各个字段：

```
app_id: 1080389454
app_key: XpurLJTrKSuAGoIq
http method：GET
http uri：/search/geo
canonical_query_string: city=%E6%B7%B1%E5%9C%B3&keywords=%E4%B8%8A%E6%A2%85%E6%9E%97&page_num=1&page_size=3
timestamp: 1629255133
nonce: le1qqjex
signed_headers_string: x-ai-gateway-app-id:1080389454\nx-ai-gateway-timestamp:1629255133\nx-ai-gateway-nonce:le1qqjex
```

第二步，拼接出 signing_string：

```
GET\n/search/geo\ncity=%E6%B7%B1%E5%9C%B3&keywords=%E4%B8%8A%E6%A2%85%E6%9E%97&page_num=1&page_size=3\n1080389454\n1629255133\nx-ai-gateway-app-id:1080389454\nx-ai-gateway-timestamp:1629255133\nx-ai-gateway-nonce:le1qqjex
```

第三步，计算出signature:

```
qnlDMv2pKZpdxGJGGj8jZdLScFs2liS9bEaVlDsGgYI=
```

最后，生成http headers, 发送http请求时将headers带上：

```
headers = {
  "X-AI-GATEWAY-APP-ID": "1080389454",
  "X-AI-GATEWAY-TIMESTAMP": "1629255133",
  "X-AI-GATEWAY-NONCE": "le1qqjex",
  "X-AI-GATEWAY-SIGNED-HEADERS": "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce",
  "X-AI-GATEWAY-SIGNATURE": "qnlDMv2pKZpdxGJGGj8jZdLScFs2liS9bEaVlDsGgYI="
}
```

#### 示例二 POST请求

调用蓝心大模型-70B能力的curl命令请求格式如下（省略body部分内容）：

```
curl -XPOST "http://api-ai.vivo.com.cn/vivogpt/completions?requestId=1e344557-8e8b-43e3-a36e-94e7f36616e0" ......
```

某个队伍准备调用该能力，它的app_id为`1080389454`，app_key为`XpurLJTrKSuAGoIq`， 生成随机字符串nonce为`le1qqjex`

第一步，先确定 signing_string 中的各个字段：

```
app_id: 1080389454
app_key: XpurLJTrKSuAGoIq
http method： POST
http uri：/vivogpt/completions
canonical_query_string: requestId=1e344557-8e8b-43e3-a36e-94e7f36616e0
timestamp: 1629255133
nonce: le1qqjex
signed_headers_string: x-ai-gateway-app-id:1080389454\nx-ai-gateway-timestamp:1629255133\nx-ai-gateway-nonce:le1qqjex
```

第二步，拼接出 signing_string：

```
POST\n/vivogpt/completions\nrequestId=1e344557-8e8b-43e3-a36e-94e7f36616e0\n1080389454\n1629255133\nx-ai-gateway-app-id:1080389454\nx-ai-gateway-timestamp:1629255133\nx-ai-gateway-nonce:le1qqjex
```

第三步，计算出signature:

```
a04ya7p0A/15iFbQmArwPaGZKCjWkL4e37/2Ou/kdsQ=
```

最后，生成http headers，发送http请求时将headers带上：

```
headers = {
  "Content-Type": "application/json",
  "X-AI-GATEWAY-APP-ID": "1080389454",
  "X-AI-GATEWAY-TIMESTAMP": "1629255133",
  "X-AI-GATEWAY-NONCE": "le1qqjex",
  "X-AI-GATEWAY-SIGNED-HEADERS": "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce",
  "X-AI-GATEWAY-SIGNATURE": "a04ya7p0A/15iFbQmArwPaGZKCjWkL4e37/2Ou/kdsQ="
}
```

备注：`POST`请求需要在请求头加上对应的`Content-Type`

#### 示例三 POST请求-无URL参数

调用通用OCR能力的curl命令请求格式如下（省略body部分内容）：

```
curl -XPOST "http://api-ai.vivo.com.cn/ocr/general_recognition" ......
```

某个队伍准备调用该能力，它的app_id为`1080389454`，app_key为`XpurLJTrKSuAGoIq`， 生成随机字符串nonce为`le1qqjex`

第一步，先确定 signing_string 中的各个字段：

```
app_id: 1080389454
app_key: XpurLJTrKSuAGoIq
http method： POST
http uri：/ocr/general_recognition
canonical_query_string:
timestamp: 1629255133
nonce: le1qqjex
signed_headers_string: x-ai-gateway-app-id:1080389454\nx-ai-gateway-timestamp:1629255133\nx-ai-gateway-nonce:le1qqjex
```

第二步，拼接出 signing_string：

```
POST\n/ocr/general_recognition\n\n1080389454\n1629255133\nx-ai-gateway-app-id:1080389454\nx-ai-gateway-timestamp:1629255133\nx-ai-gateway-nonce:le1qqjex
```

第三步，计算出signature:

```
C2B2/E0Wwjf90v4+6n8tAGNgPv3SsEFb4j5Yi90kykQ=
```

最后，生成http headers，发送http请求时将headers带上：

```
headers = {
  "Content-Type": "application/x-www-form-urlencoded",
  "X-AI-GATEWAY-APP-ID": "1080389454",
  "X-AI-GATEWAY-TIMESTAMP": "1629255133",
  "X-AI-GATEWAY-NONCE": "le1qqjex",
  "X-AI-GATEWAY-SIGNED-HEADERS": "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce",
  "X-AI-GATEWAY-SIGNATURE": "C2B2/E0Wwjf90v4+6n8tAGNgPv3SsEFb4j5Yi90kykQ="
}
```

备注：`POST`请求需要在请求头加上对应的`Content-Type`

## 错误响应

### 限流错误

如果遇到响应的HTTP状态码为429，响应体内容为`429 Too Many Requests`，则表示遇到对应用的限流，如果遇到限流问题，请降低请求频率。

### 鉴权错误

当请求出现鉴权失败时，响应的HTTP状态码为401，响应体内容为相应的错误提示。

| 响应体内容                                    | 说明                                | 解决方法                                                                |
| :-------------------------------------------- | :---------------------------------- | ----------------------------------------------------------------------- |
| {“message”:“access key or signature missing”} | 请求头中未包含必须的签名字段        | 请检查请求头中是否有`X-AI-GATEWAY-APP-ID`和`X-AI-GATEWAY-SIGNATURE`字段 |
| {“message”:“Invalid access key”}              | 该app_id无效                        | 请检查请求头中的`X-AI-GATEWAY-APP-ID`的值否正确                         |
| {“message”:“Invalid signed header xxx”}       | 无效的`X-AI-GATEWAY-SIGNED-HEADERS` | 请检查请求头中的`X-AI-GATEWAY-SIGNED-HEADERS`的值否正确                 |
| {“message”: “Invalid signature”}              | 签名计算错误                        | 请检查请求头中计算的签名，错误原因排查可参考下方的`签名计算`的注意点    |
| {“message”: “Clock skew exceeded”}            | 请求超时                            | 请检查请求头中的`X-AI-GATEWAY-TIMESTAMP`的值是否是当前时间的时间戳      |

### 签名错误注意点

- 签名计算的中HTTP METHOD与实际请求是否一致，如实际请求的请求方法为POST，则加入签名计算的请求方法也应该为POST
- 签名计算中的URI和实际请求是否一致，注意不是请求的URL，而是URI（例如`/vivogpt/completions`)
- URL中参数必须要加入签名计算，比如说URL为`"/vivogpt/completions?requestId=1e344557-8e8b-43e3-a36e-94e7f36616e0`，后面的`requestId=xxx`也需要接入签名计算
- URL的请求参数加入签名计算时，需要进行编码处理和按照字典顺序（ ASCII 码由小到大）排序，具体处理逻辑见前面的`签名计算`介绍
- Unix时间戳的单位是秒，不是毫秒，且需要是当前的时间戳，不能用固定的一个时间戳

## Python代码实现示例

auth_util.py源码（python语言）

```py
#!/usr/bin/env python
# encoding: utf-8


import random
import string
import time
import hashlib
import hmac
import base64
import urllib.parse

__all__ = ['gen_sign_headers']


# 随机字符串
def gen_nonce(length=8):
    chars = string.ascii_lowercase + string.digits
    return ''.join([random.choice(chars) for _ in range(length)])


# 如果query项只有key没有value时，转换成params[key] = ''传入
def gen_canonical_query_string(params):
    if params:
        escape_uri = urllib.parse.quote
        raw = []
        for k in sorted(params.keys()):
            tmp_tuple = (escape_uri(k), escape_uri(str(params[k])))
            raw.append(tmp_tuple)
        s = "&".join("=".join(kv) for kv in raw)
        return s
    else:
        return ''


def gen_signature(app_secret, signing_string):
    bytes_secret = app_secret.encode('utf-8')
    hash_obj = hmac.new(bytes_secret, signing_string, hashlib.sha256)
    bytes_sig = base64.b64encode(hash_obj.digest())
    signature = str(bytes_sig, encoding='utf-8')
    return signature


def gen_sign_headers(app_id, app_key, method, uri, query):
    method = str(method).upper()
    uri = uri
    timestamp = str(int(time.time()))
    app_id = app_id
    app_key = app_key
    nonce = gen_nonce()
    canonical_query_string = gen_canonical_query_string(query)
    signed_headers_string = 'x-ai-gateway-app-id:{}\nx-ai-gateway-timestamp:{}\n' \
                            'x-ai-gateway-nonce:{}'.format(app_id, timestamp, nonce)
    signing_string = '{}\n{}\n{}\n{}\n{}\n{}'.format(method,
                                                     uri,
                                                     canonical_query_string,
                                                     app_id,
                                                     timestamp,
                                                     signed_headers_string)
    signing_string = signing_string.encode('utf-8')
    signature = gen_signature(app_key, signing_string)
    return {
        'X-AI-GATEWAY-APP-ID': app_id,
        'X-AI-GATEWAY-TIMESTAMP': timestamp,
        'X-AI-GATEWAY-NONCE': nonce,
        'X-AI-GATEWAY-SIGNED-HEADERS': "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce",
        'X-AI-GATEWAY-SIGNATURE': signature
    }
```
