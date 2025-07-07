AI绘画

更新时间：2025-03-06 07:16:08

## 服务简介

可通过文本描述（文生图）或一张图片作为参考图（图生图）生成彩漫、游戏人物CG、二次元、赛博朋克等多风格多尺寸的高质量图片

**注意**： 因为绘画任务是排队处理的，只请求一次不一定能够获取到结果，建议在等待一段时间后再执行查询绘画任务，根据画面的复杂度等待的时间有所不同。

## 公共参数

### **Header**

header部分公共参数用于服务对请求进行鉴权，本文档中所有接口在请求时都需要在header加上下面的鉴权字段

| 参数                        | 类型   | 值                                                                                       |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| X-AI-GATEWAY-APP-ID         | string | AIGC官网给审核通过的队伍分配的app_id（见官网右上角`个人资料-参赛平台-应用赛道参赛资源`） |
| X-AI-GATEWAY-TIMESTAMP      | string | 请求时的Unix时间戳，以秒为单位                                                           |
| X-AI-GATEWAY-NONCE          | string | 8位的随机字符串                                                                          |
| X-AI-GATEWAY-SIGNED-HEADERS | string | 填写 “x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce”                     |
| X-AI-GATEWAY-SIGNATURE      | string | 填写签名字符串 ，计算方式见`鉴权方式`文档`签名计算`部分                                  |

## 提交作画任务

### 接口说明

公网访问地址：https://api-ai.vivo.com.cn/api/v1/task_submit

请求方式：POST

### 请求参数

#### Header

| 字段         | 值               |
| ------------ | ---------------- |
| Content-Type | application/json |

其它参数见公共参数部分

#### Body

| 字段              | 类型   | 说明           | 是否必选 | 默认值                             | 备注                                                                                                                                                                                                                                                          |
| :---------------- | :----- | :------------- | :------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| dataId            | string | 请求唯一ID     | 是       |                                    | 32位字符串                                                                                                                                                                                                                                                    |
| businessCode      | string | 请求业务码     | 是       | pc                                 | 与管理员联系配置                                                                                                                                                                                                                                              |
| userAccount       | string | 用户唯一标识   | 是       | “”                                 | vaid、openid等用户唯一标识                                                                                                                                                                                                                                    |
| prompt            | string | 图片描述       | 否       | “”                                 |                                                                                                                                                                                                                                                               |
| initImages        | string | 初始化图片     | 否       | “”                                 | imageType为0，格式如下： "data:image/png;base64,xxxxxbase64stringxxxxx" imageType为1，格式如下： "https://xxxx.jpg" 图片最大分辨率为2048\*2048                                                                                                                |
| imageType         | int    | 初始化图片类型 | 否       | 1                                  | 0：image base64数据 1：image url                                                                                                                                                                                                                              |
| styleConfig       | string | 风格模板ID     | 是       | “4cbc9165bc615ea0815301116e7925a3” | 通用v6.0：4cbc9165bc615ea0815301116e7925a3 （通用6.0同时支持文生图和图生图） 图生图： 梦幻动漫 85ae2641576f5c409b273e0f490f15c0 唯美写实 85062a504de85d719df43f268199c308 绯红烈焰 b3aacd62d38c5dbfb3f3491c00ba62f0 彩绘日漫 897c280803be513fa947f914508f3134 |
| height            | int    | 生成图高       | 是       | 1024                               | 8的倍数，[400, 1200]                                                                                                                                                                                                                                          |
| width             | int    | 生成图宽       | 是       | 1024                               | 8的倍数，[400, 1200]                                                                                                                                                                                                                                          |
| seed              | int    | 随机种子       | 否       | -1                                 |                                                                                                                                                                                                                                                               |
| cfgScale          | float  | 文本相关度     | 否       | 7                                  | [3, 15]                                                                                                                                                                                                                                                       |
| denoisingStrength | float  | 图片相关度     | 否       | 0.1                                | [0, 1]                                                                                                                                                                                                                                                        |
| ctrlNetStrength   | float  | 控制强度       | 否       | 0.5                                | [0, 1]                                                                                                                                                                                                                                                        |
| steps             | int    | 采样步数       | 否       | 20                                 | [20, 50]                                                                                                                                                                                                                                                      |
| negativePrompt    | string | 反向关键词     | 否       |                                    |                                                                                                                                                                                                                                                               |

### 响应结果

| 字段   | 类型   | 说明       | 备注                                                                                |
| :----- | :----- | :--------- | :---------------------------------------------------------------------------------- |
| code   | string | 响应状态码 | 200 正常，其它见错误码列表                                                          |
| msg    | string | 错误描述   | 审核拦截状态码参考：1：色情，2：广告，3：暴恐，4：违禁，5：涉政，其他值为敏感词拦截 |
| result | dict   | 结果       | TASK_RESULT                                                                         |

TASK_RESULT 描述如下：

| 字段        | 类型   | 说明           | 备注                          |
| :---------- | :----- | :------------- | :---------------------------- |
| task_id     | string | 作画任务ID     |                               |
| task_type   | string | 作画类型       | img2img 图生图 txt2img 文生图 |
| task_params | string | 作画配置       |                               |
| model       | string | 使用的模型版本 |                               |

### 调用示例

python

备注：auth_uitl源码见[鉴权方式-代码实现示例](https://aigc.vivo.com/#/document/index?id=1677)

```
#!/usr/bin/env python
# encoding: utf-8

import requests
import base64
import json
from auth_util import gen_sign_headers

# 请注意替换APP_ID、APP_KEY
APP_ID = 'your_app_id'
APP_KEY = 'your_app_key'
URI = '/api/v1/task_submit'
DOMAIN = 'api-ai.vivo.com.cn'
METHOD = 'POST'

def submit():
   params = {}
   data = {
    'height': 1024,
    'width': 768,
    'prompt': '一只梵高画的猫',
    'styleConfig': '7a0079b5571d5087825e52e26fc3518b',
    'userAccount': 'thisistestuseraccount'
   }

   headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)
   headers['Content-Type'] = 'application/json'

   url = 'http://{}{}'.format(DOMAIN, URI)
   response = requests.post(url, data=json.dumps(data), headers=headers)
   if response.status_code == 200:
       print(response.json())
   else:
       print(response.status_code, response.text)

if __name__ == '__main__':
   submit()
```

**java示例**

```
 public String task_submit() throws UnsupportedEncodingException {
        final String APP_ID = "your_app_id";
        final String APP_KEY = "your_app_key";
        final String METHOD = "POST";
        final String URI = "/api/v1/task_submit";
        final String DOMAIN = "api-ai.vivo.com.cn";

        // 定义请求体数据
        Map<String, Object> data = new HashMap<>();
        data.put("height", 768);
        data.put("width", 576);
        data.put("prompt", "一个穿着破旧的衣服的农民工正在大热天搬砖已经汗流浃背");
        data.put("styleConfig", "55c682d5eeca50d4806fd1cba3628781");
        // 将请求体数据转换为 JSON 格式
        String requestBody = JSON.toJSONString(data);
        // 请求参数
        Map<String, Object> query = new HashMap<>();
        String queryString = mapToQueryString(query);
        HttpHeaders headers = VivoAuth.generateAuthHeaders(APP_ID, APP_KEY, METHOD, URI, queryString);
        headers.add("Content-Type", "application/json");
        String url = String.format("http://%s%s", DOMAIN, URI);
        RestTemplate restTemplate = new RestTemplate();
        HttpEntity<String> requestEntity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
        if (response.getStatusCode() == HttpStatus.OK) {
            System.out.println("Response body: " + response.getBody());
        } else {
            System.out.println("Error response: " + response.getStatusCode());
        }
        return response.getBody();
    }


    public static String mapToQueryString(Map<String, Object> map) {
        if (map.isEmpty()) {
            return "";
        }
        StringBuilder queryStringBuilder = new StringBuilder();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (queryStringBuilder.length() > 0) {
                queryStringBuilder.append("&");
            }
            queryStringBuilder.append(entry.getKey());
            queryStringBuilder.append("=");
            queryStringBuilder.append(entry.getValue());
        }
        return queryStringBuilder.toString();
    }
```

结果

```
{
  "code": 200,
  "msg": "successful",
  "result": {
    "model": "通用 v3.0",
    "task_id": "8cd2aa70d71b5d53a72f5cd6dc0e69dd",
    "task_params": {
      "audit_mode": "low",
      "batch_size": 1,
      "cfg_scale": 7.5,
      "ctrl_net_strength": 0.3,
      "default_prompt": "{}",
      "denoising_strength": 0.7,
      "enable_ctrl_net": true,
      "enable_hr": false,
      "height": 768,
      "image_format": "PNG",
      "image_type": 2,
      "model_name": "lexica",
      "n_iter": 1,
      "negative_prompts": "",
      "prompt": "A cat painted by Van Gogh",
      "raw_prompt": "一只梵高画的猫",
      "repair_mode": null,
      "restore_faces": false,
      "seed": 3292067703,
      "seed_resize_from_h": -1,
      "seed_resize_from_w": -1,
      "steps": 25,
      "style_code": "common",
      "subseed_strength": 0,
      "task_id": "8cd2aa70d71b5d53a72f5cd6dc0e69dd",
      "width": 576
    },
    "task_type": "txt2img"
  }
}
```

## 查询作画任务

### 接口说明

公网访问地址：https://api-ai.vivo.com.cn/api/v1/task_progress

请求方式：GET

### 请求参数

#### Header

见公共参数部分

URI参数

| 参数名称 | 类型   | 说明                                |
| -------- | ------ | ----------------------------------- |
| task_id  | string | 任务id，提交任务后服务端返回task_id |

#### Body

暂无

### 响应结果

| 字段   | 类型   | 说明       | 备注                       |
| :----- | :----- | :--------- | :------------------------- |
| code   | string | 响应状态码 | 200 正常，其它见错误码列表 |
| msg    | string | 错误描述   |                            |
| result | dict   | 结果       | TASK_QUERY_RESULT          |

TASK_QUERY_RESULT 描述如下：

| 字段                | 类型          | 说明               | 备注                                                                                         |
| :------------------ | :------------ | :----------------- | :------------------------------------------------------------------------------------------- |
| task_id             | string        | 作画任务ID         |                                                                                              |
| task_type           | string        | 作画任务类型       | img2img 图生图 txt2img 文生图                                                                |
| status              | int           | 作画任务状态       | 0：队列中，等待处理1：正在处理2：处理完成3：处理失败4：已取消                                |
| model               | string        | 模型版本           | “通用 v6.0”                                                                                  |
| finished            | bool          | 任务是否已完成     | false                                                                                        |
| images_url          | array[string] | 生成图URL列表      | [“image_url1”, “image_url2”]                                                                 |
| image_gaia_key      | array[string] | 生成图Key列表      | [“xxxxxxxx-0.jpg”, “xxxxxxx-1.jpg”]                                                          |
| queue_ahead         | int           | 等待人数           | 3                                                                                            |
| task_eta            | int           | 预计等待耗时       | 15                                                                                           |
| images_audit        | array[string] | 生成图审核状态说明 | [ “正常”, “违禁”]，仅配置了审核的业务才会返回该字段                                          |
| images_audit_status | array[string] | 生成图审核状态     | [ 0 ]，仅配置了审核的业务才会返回该字段，除0外其他均为审核不通过，其余审核状态见AUDIT_STATUS |

AUDIT_STATUS 描述如下：

| 审核结果码 | 审核结果类型 |
| ---------- | ------------ |
| 0          | 正常         |
| 1          | 色情         |
| 2          | 广告         |
| 3          | 暴恐         |
| 4          | 违禁         |
| 5          | 涉政         |
| 6          | 谩骂         |
| 7          | 灌水         |
| 8          | 二维码       |
| 9          | 性感         |

### 调用示例

python示例

auth_uitl源码见[鉴权方式-代码实现示例](https://aigc.vivo.com/#/document/index?id=1677)

```
#!/usr/bin/env python
# encoding: utf-8

import requests
import base64
import json
from auth_util import gen_sign_headers

# 请注意替换APP_ID、APP_KEY
APP_ID = 'your_app_id'
APP_KEY = 'your_app_key'
URI = '/api/v1/task_progress'
DOMAIN = 'api-ai.vivo.com.cn'
METHOD = 'GET'

def progress():
   params = {
       # 注意替换为提交作画任务时返回的task_id
       'task_id': 'd98dea86bf3258799fd33f0e776e9868'
   }
   headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)

   uri_params = ''
   for key, value in params.items():
       uri_params = uri_params + key + '=' + value + '&'
   uri_params = uri_params[:-1]

   url = 'http://{}{}?{}'.format(DOMAIN, URI, uri_params)
   print('url:', url)
   response = requests.get(url, headers=headers)
   if response.status_code == 200:
       print(response.json())
   else:
       print(response.status_code, response.text)

if __name__ == '__main__':
   progress()
```

**java 示例**

```
public String taskProgress() throws UnsupportedEncodingException {
        final String APP_ID = "your_app_id";
        final String APP_KEY = "your_app_key";
        final String METHOD = "GET";
        final String URI = "/api/v1/task_progress";
        final String DOMAIN = "api-ai.vivo.com.cn";

        //请求url参数
        Map<String, Object> data = new HashMap<>();
        data.put("task_id","fb16d23843175f7f8c676ec14b502867");
        String queryString = mapToQueryString(data);
        HttpHeaders headers = VivoAuth.generateAuthHeaders(APP_ID, APP_KEY, METHOD, URI, queryString);
        String url = String.format("http://%s%s?%s", DOMAIN, URI,queryString);
        headers.add("Content-Type", "application/json");
        RestTemplate restTemplate = new RestTemplate();
        HttpEntity requestEntity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class);
        if (response.getStatusCode() == HttpStatus.OK) {
            System.out.println("Response body: " + response.getBody());
        } else {
            System.out.println("Error response: " + response.getStatusCode());
        }
        return response.getBody();
    }


    public static String mapToQueryString(Map<String, Object> map) {
        if (map.isEmpty()) {
            return "";
        }
        StringBuilder queryStringBuilder = new StringBuilder();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (queryStringBuilder.length() > 0) {
                queryStringBuilder.append("&");
            }
            queryStringBuilder.append(entry.getKey());
            queryStringBuilder.append("=");
            queryStringBuilder.append(entry.getValue());
        }
        return queryStringBuilder.toString();
    }
```

结果

```
{
  'code': 200,
  'msg': 'successful',
  'result': {
    'finished': True,
    'images_gaia_key': [
      'prd-074f65f8845e5967a4e05871f9884934-0.jpg'
    ],
    'images_info': {
      'prompt': '一只梵高画的猫'
    },
    'images_url': [
      'https://ai-painting-image.vivo.com.cn/ai-painting/prd-074f65f8845e5967a4e05871f9884934-0.jpg'
    ],
    'queue_ahead': 0,
    'status': 2,
    'task_eta': 0
  }
}
```

## 取消作画任务

### 接口说明

公网访问地址：https://api-ai.vivo.com.cn/api/v1/task_cancel

请求方式：POST

### 请求参数

#### Header

| 字段         | 值               |
| ------------ | ---------------- |
| Content-Type | application/json |

其余参数见公共参数部分

#### Body

| 字段         | 类型   | 说明       | 是否必选 | 默认值 |
| :----------- | :----- | :--------- | :------- | :----- |
| dataId       | string | 请求唯一ID | 是       |        |
| businessCode | string | 业务code   | 是       | “pc”   |
| task_id      | string | 绘画任务ID | 是       |        |

### 响应结果

| 字段   | 类型   | 说明       | 备注                       |
| :----- | :----- | :--------- | :------------------------- |
| code   | string | 响应状态码 | 200 正常，其它见错误码列表 |
| msg    | string | 错误描述   |                            |
| result | dict   | 结果       | TASK_CANCEL_INFO           |

TASK_CANCEL_INFO 描述如下：

| 字段    | 类型   | 说明       | 备注 |
| :------ | :----- | :--------- | :--- |
| task_id | string | 作画任务ID |      |

### 调用示例

python

备注：auth_uitl源码见[鉴权方式-代码实现示例](https://aigc.vivo.com/#/document/index?id=1677)

```
import requests
import base64
import json
import uuid
from auth_util import gen_sign_headers

# 请注意替换APP_ID、APP_KEY
APP_ID = 'your_app_id'
APP_KEY = 'your_app_key'
URI = '/api/v1/task_cancel'
DOMAIN = 'api-ai.vivo.com.cn'
METHOD = 'POST'

def cancel():
   params = {}
   data = {
    'dataId': str(uuid.uuid4()),
    'businessCode': 'pc',
    # 注意替换为提交作画任务时返回的task_id
    'task_id': '555f7f94287857589fa2bb48f19e8b5a'
   }

   headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)
   headers['Content-Type'] = 'application/json'

   url = 'http://{}{}'.format(DOMAIN, URI)
   response = requests.post(url, data=json.dumps(data), headers=headers)
   if response.status_code == 200:
       print(response.json())
   else:
       print(response.status_code, response.text)

if __name__ == '__main__':
   cancel()
```

**java示例**

```
public String taskCancel() throws UnsupportedEncodingException {
        final String APP_ID = "your_app_id";
        final String APP_KEY = "your_app_key";
        final String METHOD = "POST";
        final String URI = "/api/v1/task_cancel";
        final String DOMAIN = "api-ai.vivo.com.cn";

        //请求url参数
        Map<String, Object> queryData = new HashMap<>();
        String queryString = mapToQueryString(queryData);

        //请求体
        String requestId = UUID.randomUUID().toString();
        Map<String, Object> data = new HashMap<>();
        data.put("task_id", "fb16d23843175f7f8c676ec14b502867");
        data.put("businessCode", "pc");
        data.put("dataId", requestId);
        //将请求体转为JSON
        String string = JSON.toJSONString(data);

        HttpHeaders headers = VivoAuth.generateAuthHeaders(APP_ID, APP_KEY, METHOD, URI, queryString);
        String url = String.format("http://%s%s", DOMAIN, URI,queryString);
        headers.add("Content-Type", "application/json");
        RestTemplate restTemplate = new RestTemplate();
        HttpEntity<String> requestEntity = new HttpEntity<>(string,headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
        if (response.getStatusCode() == HttpStatus.OK) {
            System.out.println("Response body: " + response.getBody());
        } else {
            System.out.println("Error response: " + response.getStatusCode());
        }
        return response.getBody();
    }


    public static String mapToQueryString(Map<String, Object> map) {
        if (map.isEmpty()) {
            return "";
        }
        StringBuilder queryStringBuilder = new StringBuilder();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (queryStringBuilder.length() > 0) {
                queryStringBuilder.append("&");
            }
            queryStringBuilder.append(entry.getKey());
            queryStringBuilder.append("=");
            queryStringBuilder.append(entry.getValue());
        }
        return queryStringBuilder.toString();
    }
```

结果

```
{
    "code": 200,
    "msg": "task completed",
    "result": {
        "task_id": "cee2fa2e4d8750299c949d7dba9fadfb"
    }
}
```

## 获取风格列表

### 接口说明

内网访问地址：http://api-ai.vivo.com.cn/api/v1/styles

请求方式：GET

### 请求参数

#### Header

见公共参数部分

URI参数

| 字段         | 类型   | 说明       | 是否必选 | 默认值    | 备注                          |
| :----------- | :----- | :--------- | :------- | :-------- | :---------------------------- |
| businessCode | string | 业务code   | 是       | “pc”      |                               |
| dataId       | string | 请求唯一ID | 是       |           | 32位字符串                    |
| styleType    | string | 作画类型   | 否       | “txt2img” | txt2img 文生图 img2img 图生图 |

#### Body

暂无

### 响应结果

| 字段   | 类型              | 说明       | 备注                       |
| :----- | :---------------- | :--------- | :------------------------- |
| code   | string            | 响应状态码 | 200 正常，其它见错误码列表 |
| msg    | string            | 错误描述   |                            |
| result | array[STYLE_INFO] | 结果       | STYLE_INFO                 |

STYLE_INFO 描述如下：

| 字段               | 类型   | 说明       | 备注                 |
| :----------------- | :----- | :--------- | :------------------- |
| style_name         | string | 风格名称   |                      |
| style_id           | string | 风格ID     |                      |
| cfg_scale          | int    | 文本相关度 |                      |
| denoising_strength | float  | 图片相关度 |                      |
| ctrl_net_strength  | float  | 控制强度   | 如该风格涉及，则返回 |
| steps              | int    | 采样步数   |                      |

（实际支持风格请参考接口返回结果）

## 获取文生图推荐词列表

### 接口说明

内网访问地址：https://api-ai.vivo.com.cn/api/v1/prompts

请求方式：GET

### 请求参数

#### URI参数

| 字段         | 类型   | 说明       | 是否必选 | 默认值 | 备注       |
| :----------- | :----- | :--------- | :------- | :----- | :--------- |
| businessCode | string | 业务code   | 是       | “pc”   |            |
| dataId       | string | 请求唯一ID | 是       |        | 32位字符串 |

### 响应结果

| 字段   | 类型                     | 说明       | 备注                       |
| :----- | :----------------------- | :--------- | :------------------------- |
| code   | string                   | 响应状态码 | 200 正常，其它见错误码列表 |
| msg    | string                   | 错误描述   |                            |
| result | array[STYLE_PROMPT_INFO] | 结果       | STYLE_PROMPT_INFO          |

STYLE_PROMPT_INFO描述如下：

| 字段       | 类型   | 说明       | 备注 |
| :--------- | :----- | :--------- | :--- |
| long_text  | string | 推荐词     |      |
| short_text | string | 简略推荐词 |      |

### 调用示例

python示例

auth_util工具下载见[鉴权方式–开发包](https://developers-ai.vivo.com.cn/documents?id=624)

```
#!/usr/bin/env python
# encoding: utf-8
import uuid

import requests
import base64
import json
from auth_util import gen_sign_headers

# 请注意替换APP_ID、APP_KEY
APP_ID = 'your_app_id'
APP_KEY = 'your_app_key'
URI = '/api/v1/prompts'
DOMAIN = 'api-ai.vivo.com.cn'
METHOD = 'GET'


def popular_prompts():
    params = {
        'businessCode': 'pc',
        'dataId': str(uuid.uuid4())
    }
    headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)
    url = 'http://{}{}'.format(DOMAIN, URI)
    response = requests.get(url, headers=headers,params=params)
    if response.status_code == 200:
        print(response.json())
    else:
        print(response.status_code, response.text)


if __name__ == '__main__':
    popular_prompts()
```

## 提交图片外扩任务

### 接口说明

内网访问地址：http://api-ai.vivo.com.cn/api/v1/outpaint_task_submit

请求方式：POST

### 请求参数

#### Header

| 字段         | 值               |
| ------------ | ---------------- |
| Content-Type | application/json |

其它参数见公共参数部分

#### Body

| 字段         | 类型   | 说明           | 是否必选 | 默认值                             | 备注                                                                                                                                           |
| :----------- | :----- | :------------- | :------- | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| dataId       | string | 请求唯一ID     | 是       |                                    | 32位字符串                                                                                                                                     |
| businessCode | string | 请求业务码     | 是       | ‘pc’                               | 与管理员联系配置                                                                                                                               |
| initImages   | string | 初始化图片     | 否       | “”                                 | imageType为0，格式如下： "data:image/png;base64,xxxxxbase64stringxxxxx" imageType为1，格式如下： "https://xxxx.jpg" 图片最大分辨率为2048\*2048 |
| imageType    | int    | 初始化图片类型 | 否       | 1                                  | 0：image base64数据 1：image url                                                                                                               |
| styleConfig  | string | 风格模板ID     | 是       | “dd72470d24fd59bc9df42046c4b27bae” |                                                                                                                                                |
| outpaintMode | int    | 外扩模式       | 是       | 1                                  | 1：外扩倍数扩充 2：按比例扩充 3：按像素扩充                                                                                                    |
| seed         | int    | 随机种子       | 否       | -1                                 |                                                                                                                                                |
| padFactor    | int    | 外扩倍数       | 否       | 2                                  |                                                                                                                                                |
| padRatio     | string | 外扩比例       | 否       | “1:1”                              | 仅支持以下比例 “4:3”、“3:4”、“1:1”、“16:9”、“9:16”                                                                                             |
| padPixel     | dict   | 外扩像素       | 否       |                                    | 见PAD_PIXEL_CONFIG                                                                                                                             |
| imageFormat  | string | 生成图的格式   | 是       | JPEG                               | PNG、JPEG                                                                                                                                      |

PAD_PIXEL_CONFIG 描述如下：

| 字段      | 类型 | 说明             | 是否必选 | 默认值 | 备注                                                                     |
| :-------- | :--- | :--------------- | :------- | :----- | :----------------------------------------------------------------------- |
| pad_up    | int  | 上边缘扩充像素   | 否       | 0      | 大于等于0，小于等于2048                                                  |
| pad_down  | int  | 下边缘扩充像素   | 否       | 0      | 大于等于0，小于等于2048                                                  |
| pad_left  | int  | 左边缘扩充像素   | 否       | 0      | 大于等于0，小于等于2048                                                  |
| pad_right | int  | 右边缘扩充像素   | 否       | 0      | 大于等于0，小于等于2048                                                  |
| pad_all   | int  | 全部边缘扩充像素 | 否       | 0      | 该值存在且不为0时，pad_up\pad_down\pad_left\pad_right 失效，均以该值为准 |

### 响应结果

| 字段   | 类型   | 说明       | 备注                       |
| :----- | :----- | :--------- | :------------------------- |
| code   | string | 响应状态码 | 200 正常，其它见错误码列表 |
| msg    | string | 错误描述   |                            |
| result | dict   | 结果       | TASK_RESULT                |

TASK_RESULT 描述如下：

| 字段        | 类型   | 说明           | 备注 |
| :---------- | :----- | :------------- | :--- |
| task_id     | string | 作画任务ID     |      |
| task_type   | string | 作画类型       |      |
| task_params | string | 作画配置       |      |
| model       | string | 使用的模型版本 |      |

### 调用示例

python

auth_util工具下载见[鉴权方式–开发包](https://developers-ai.vivo.com.cn/documents?id=624)

```
#!/usr/bin/env python
# encoding: utf-8

import requests
import base64
import json
from auth_util import gen_sign_headers

# 请注意替换APP_ID、APP_KEY
APP_ID = '你的APP_ID'
APP_KEY = '你的APP_KEY'
URI = '/api/v1/task_submit'
DOMAIN = 'api-ai.vivo.com.cn'
METHOD = 'POST'

def submit():
   params = {}
   data = {
    'initImages': 'https://xxx.jpg',
    'imageType': 1,
    'outpaintMode': 1,
    'padFactor': 2
    'styleConfig': 'dd72470d24fd59bc9df42046c4b27bae'
   }

   headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)
   headers['Content-Type'] = 'application/json'

   url = 'http://{}{}'.format(DOMAIN, URI)
   response = requests.post(url, data=json.dumps(data), headers=headers)
   if response.status_code == 200:
       print(response.json())
   else:
       print(response.status_code, response.text)

if __name__ == '__main__':
   submit()
```

结果

```
{'code': 200,
 'msg': 'successful',
 'result': {'model': '图像外扩 v1.0',
            'task_id': 'xxxxtask_idxxxx',
            'task_params': {'audit_mode': 'low',
                            'height': 1536,
                            'image_type': 2,
                            'init_images': ['xxxx-upload-image.jpg'],
                            'model_name': 'outpaint',
                            'outpaint_mode': 1,
                            'pad_factor': 2,
                            'pad_ratio': None,
                            'raw_prompt': '',
                            'seed': 12580,
                            'style_code': 'outpaint',
                            'task_id': 'xxxxtask_idxxxx',
                            'width': 1536},
            'task_type': 'img2img'}}
```

## 业务错误码列表

| 错误码 | 含义             | 备注                      |
| :----- | :--------------- | :------------------------ |
| 200    | 成功             |                           |
| 201    | 服务内部组件错误 | 比如redis任务队列请求异常 |
| 202    | 服务调用异常     |                           |
| 203    | 参数校验失败     |                           |
| 204    | 任务不存在       |                           |
| 429    | 触发限流         | 服务繁忙，请降低请求频率  |
