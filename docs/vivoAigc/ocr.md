通用OCR

更新时间：2025-03-07 09:17:41

## 服务简介

识别用户向服务请求的某张图中的所有文字，并返回文字在图片中的位置信息，方便用户进行文字排版的二次处理参考。

## 接口说明

访问地址：http://api-ai.vivo.com.cn/ocr/general_recognition

访问方式：POST

## 请求参数

### **Header**

| 参数                        | 类型   | 是否必须 | 值                                                                                       |
| --------------------------- | ------ | -------- | ---------------------------------------------------------------------------------------- |
| Content-Type                | string | 是       | application/x-www-form-urlencoded                                                        |
| X-AI-GATEWAY-APP-ID         | string | 是       | AIGC官网给审核通过的队伍分配的app_id（见官网右上角`个人资料-参赛平台-应用赛道参赛资源`） |
| X-AI-GATEWAY-TIMESTAMP      | string | 是       | 请求时的Unix时间戳，以秒为单位                                                           |
| X-AI-GATEWAY-NONCE          | string | 是       | 8位的随机字符串                                                                          |
| X-AI-GATEWAY-SIGNED-HEADERS | string | 是       | 填写 “x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce”                     |
| X-AI-GATEWAY-SIGNATURE      | string | 是       | 填写签名字符串 ，计算方式见`鉴权方式`文档`签名计算`部分                                  |

### **Body**

| **参数名称** | **类型**   | **是否必须** | **说明**                                                                                                                                |
| ------------ | ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| image        | string     | 是           | 图像数据，base64编码（目前只支持识别jpg、png、bmp格式的图片）                                                                           |
| pos          | string/int | 是           | 可取值为0、1、2。0代表只需要文字信息；1代表提供文字信息和坐标信息（坐标绝对值）；2代表将0和1的信息同时提供（坐标为相对值），建议取pos=2 |
| businessid   | string     | 是           | “aigc”+appid                                                                                                                            |
| sessid       | string     | 否           | 使用uuid，前端传递                                                                                                                      |

**businessid补充说明：**

- 1990173156ceb8a09eee80c293135279，支持旋转图像、非正向文字识别
- 8bf312e702043779ad0f2760b37a0806，只支持正向文字识别，耗时比1990小

## 响应结果

| **参数**   | **类型** | **说明**                                                                                                             |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| error_code | int      | 0: 成功，1: ocr识别失败，2: 图像错误                                                                                 |
| error_msg  | string   | succ：成功，ocr fail：识别失败，no parameter image：未上传图片                                                       |
| result     | json     | 请求参数pos为0结果提供文字信息，pos为1结果提供文字信息和坐标信息（绝对值），pos为2结果提供0和1的信息（坐标为相对值） |
| version    | string   | ocr_VUG_v2.1.0_20200715                                                                                              |
| support    | string   | VIVO识图提供技术支持                                                                                                 |

result示例

请求参数pos为0

```
# angle可选的值为0/90/180/270
{
    "result": {
        "words": [
            {"words": "取消"},
            {"words": "编辑"}
        ],
        "angle": 0
    }
}
```

请求参数pos为1

```
# angle可选的值为0/90/180/270，top_left：左上，top_right：右上，down_left：左下，down_right：右下，x、y：像素百分比
{
    "result": {
        "OCR": [
            {
                "words": "取消",
                "location": {
                    "top_left": {"x": 658.0, "y": 1130.0},
                    "top_right": {"x": 893.0, "y": 1130.0},
                    "down_left": {"x": 658.0, "y": 1174.0},
                    "down_right": {"x": 893.0, "y": 1174.0}
                }
            },
            {
                "words": "编辑",
                "location": {
                    "top_left": {"x": 398.0, "y": 825.0},
                    "top_right": {"x": 1912.0, "y": 825.0},
                    "down_left": {"x": 398.0, "y": 1004.0},
                    "down_right": {"x": 1912.0, "y": 1004.0}
                }
            }
        ],
        "angle": 0
    }
}
```

## 调用示例

python示例

备注：auth_uitl源码见[鉴权方式-代码实现示例](https://aigc.vivo.com/#/document/index?id=1677)

```
#!/usr/bin/env python
# encoding: utf-8

import requests
import base64
from auth_util import gen_sign_headers

# 请注意替换APP_ID、APP_KEY、PIC_FILE
APP_ID = 'your_app_id'
APP_KEY = 'your_app_key'
DOMAIN = 'api-ai.vivo.com.cn'
URI = '/ocr/general_recognition'
METHOD = 'POST'
PIC_FILE = './test.jpg'


def ocr_test():
    picture = PIC_FILE
    with open(picture, "rb") as f:
        b_image = f.read()
    image = base64.b64encode(b_image).decode("utf-8")
    post_data = {"image": image, "pos": 2, "businessid": "aigc"+APP_ID}
    params = {}
    headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)

    url = 'http://{}{}'.format(DOMAIN, URI)
    response = requests.post(url, data=post_data, headers=headers)
    if response.status_code == 200:
        print(response.json())
    else:
        print(response.status_code, response.text)


if __name__ == '__main__':
    ocr_test()
```

**Java示例**

```
public String ocrTest() {
	//你的appID
	private String APP_ID;
	//你的appKey
	private String APP_KEY;
        final String DOMAIN = "api-ai.vivo.com.cn";
        final String URI = "/ocr/general_recognition";
        final String METHOD = "POST";
        final String PIC_FILE = "./test.jpg";
        byte[] fileContent;
        try {
            // 加载资源目录下的文件
            InputStream inputStream = getClass().getResourceAsStream("/test.jpg");
            // 将输入流转换为字节数组
            fileContent = inputStream.readAllBytes();
            String encodedImage = new String(Base64.getEncoder().encode(fileContent), "UTF-8");
            //构建请求体
            Map<String, String> postParams = new HashMap<>();
            postParams.put("image", encodedImage);
            postParams.put("pos", "2");
            postParams.put("businessid", "aigc"+APP_ID);
            //请求参数
            Map<String, String> map = new HashMap<>();
            String queryStr = ToQueryString(map);
            //构建请求头
            HttpHeaders headers = VivoAuth.generateAuthHeaders(APP_ID, APP_KEY, METHOD, URI, queryStr);
            headers.add("Content-Type", "application/x-www-form-urlencoded");
            String url = "http://" + DOMAIN + URI;
            String jsonString = ToQueryString(postParams);
            RestTemplate template = new RestTemplate();
            HttpEntity<String> httpEntity = new HttpEntity<>(jsonString, headers);
            ResponseEntity<String> response1 = template.exchange(url, HttpMethod.POST, httpEntity, String.class);
            String responseBody = response1.getBody();
            if (responseBody != null) {
                String unescapeJava = StringEscapeUtils.unescapeJava(responseBody);
                return unescapeJava;
            }
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

  public static String ToQueryString(Map<String, String> map) throws UnsupportedEncodingException {
        if (map == null || map.isEmpty()) {
            return ""; // 返回空字符串
        }

        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : map.entrySet()) {
            if (sb.length() > 0) {
                sb.append("&");
            }
            sb.append(URLEncoder.encode(entry.getKey(), "UTF-8"))
                    .append("=")
                    .append(URLEncoder.encode(entry.getValue(), "UTF-8"));
        }
        return sb.toString();
    }
```
