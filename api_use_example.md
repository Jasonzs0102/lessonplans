# 阿里云QWQ API调用说明

本系统采用OpenAI兼容的调用机制集成阿里云QWQ API。调用时需要提供以下三个关键参数：URL、model和api_key。


## 集成参数
## 1.1 QWQ的三个参数
1. api_key：sk-fe52c273f73741ebb9c61b8e919cde4c
2. model：qwq-plus
3. URL：https://dashscope.aliyuncs.com/compatible-mode/v1

## 1.2 调用方法参考
### 1.2.1 参考的调用指南1——Node.js
```javascript
import OpenAI from "openai";
import process from 'process';

// 初始化 openai 客户端
const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY, // 从环境变量读取
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

let reasoningContent = '';
let answerContent = '';
let isAnswering = false;

async function main() {
    try {
        const stream = await openai.chat.completions.create({
            model: 'qwq-32b',
            messages: [{ role: 'user', content: '9.9和9.11谁大' }],
            // QwQ 模型仅支持流式输出方式调用
            stream: true
        });

        console.log('\n' + '='.repeat(20) + '思考过程' + '='.repeat(20) + '\n');

        for await (const chunk of stream) {
            if (!chunk.choices?.length) {
                console.log('\nUsage:');
                console.log(chunk.usage);
                continue;
            }

            const delta = chunk.choices[0].delta;
            
            // 处理思考过程
            if (delta.reasoning_content) {
                process.stdout.write(delta.reasoning_content);
                reasoningContent += delta.reasoning_content;
            } 
            // 处理正式回复
            else if (delta.content) {
                if (!isAnswering) {
                    console.log('\n' + '='.repeat(20) + '完整回复' + '='.repeat(20) + '\n');
                    isAnswering = true;
                }
                process.stdout.write(delta.content);
                answerContent += delta.content;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
```
### 1.2.2 参考的调用指南2——Python SDK
```python
from openai import OpenAI
import os

# 初始化OpenAI客户端
client = OpenAI(
    # 如果没有配置环境变量，请用百炼API Key替换：api_key="sk-xxx"
    api_key = os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

reasoning_content = ""  # 定义完整思考过程
answer_content = ""     # 定义完整回复
is_answering = False   # 判断是否结束思考过程并开始回复

# 创建聊天完成请求
completion = client.chat.completions.create(
    model="qwq-32b",  # 此处以 qwq-32b 为例，可按需更换模型名称
    messages=[
        {"role": "user", "content": "9.9和9.11谁大"}
    ],
    # QwQ 模型仅支持流式输出方式调用
    stream=True,
    # 解除以下注释会在最后一个chunk返回Token使用量
    # stream_options={
    #     "include_usage": True
    # }
)

print("\n" + "=" * 20 + "思考过程" + "=" * 20 + "\n")

for chunk in completion:
    # 如果chunk.choices为空，则打印usage
    if not chunk.choices:
        print("\nUsage:")
        print(chunk.usage)
    else:
        delta = chunk.choices[0].delta
        # 打印思考过程
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content != None:
            print(delta.reasoning_content, end='', flush=True)
            reasoning_content += delta.reasoning_content
        else:
            # 开始回复
            if delta.content != "" and is_answering is False:
                print("\n" + "=" * 20 + "完整回复" + "=" * 20 + "\n")
                is_answering = True
            # 打印回复过程
            print(delta.content, end='', flush=True)
            answer_content += delta.content

# print("=" * 20 + "完整思考过程" + "=" * 20 + "\n")
# print(reasoning_content)
# print("=" * 20 + "完整回复" + "=" * 20 + "\n")
# print(answer_content)
```


## 集成注意事项

1. QwQ模型**仅支持流式输出**方式调用，设置`stream: true`是必需的
2. API请求超时建议设置为60秒或更高
3. 温度参数等设置不会生效，即使没有错误提示
4. 为达到模型最佳推理效果，不建议设置System Message
5. 在生产环境中应创建一个Node.js后端服务器处理API请求，以解决CORS问题并保护API密钥
6. 不支持的功能：结构化输出（JSON Mode）、前缀续写（Partial Mode）、上下文缓存（Context Cache）
7. 不支持的参数：temperature、top_p、presence_penalty、frequency_penalty、logprobs、top_logprobs。设置这些参数都不会生效，即使没有输出错误提示。
8. 为了达到模型的最佳推理效果，不建议设置 System Message。