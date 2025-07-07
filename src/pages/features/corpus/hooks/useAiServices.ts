import { useState, useCallback } from "react";
import { message } from "antd";
import { vivoAigcSDK } from "../../../../api/vivoAigc";

// AI服务返回的结果类型
export interface AiGenerationResult {
  content: string;
  title?: string;
  category?: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

// AI格式化选项
export interface AiFormatOptions {
  maxLineLength?: number;
  preserveStyle?: boolean;
  addPunctuation?: boolean;
  difficulty?: "basic" | "intermediate" | "advanced";
  trainingType?: "pronunciation" | "rhythm" | "articulation";
}

// AI生成选项
export interface AiGenerationOptions {
  topic?: string;
  length?: "short" | "medium" | "long";
  trainingType?: "pronunciation" | "rhythm" | "articulation" | "comprehensive";
  difficultyLevel?: "basic" | "intermediate" | "advanced";
  targetPhonemes?: string[]; // 目标音素训练
}

export const useAiServices = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * AI文本格式化
   */
  const formatTextWithAI = useCallback(
    async (
      text: string,
      options: AiFormatOptions = {},
    ): Promise<AiGenerationResult> => {
      if (!text.trim()) {
        throw new Error("文本内容不能为空");
      }

      setLoading(true);
      setError(null);

      try {
        const prompt = `请将以下文本格式化为适合发音障碍康复训练的格式：

格式化要求：
1. 每行控制在${options.maxLineLength || 15}个字符以内
2. 保持语义完整性，不要断句断词
3. 适当断句和换行，便于发音训练
4. ${options.addPunctuation ? "规范化标点符号" : "保持原有标点"}
5. 根据${options.difficulty || "intermediate"}难度级别调整用词
6. 针对${options.trainingType || "pronunciation"}训练类型优化内容
7. 每个段落间空一行

${options.preserveStyle ? "注意：尽量保持原文的文学风格和表达方式" : ""}

原文：
${text}

请直接输出格式化后的文本，不要添加其他说明：`;

        const result = await vivoAigcSDK.chat.chat(prompt, {
          model: "vivo-BlueLM-TB-Pro",
          systemPrompt:
            "你是一个专业的言语康复训练助手，擅长将文本格式化为适合发音障碍患者康复训练的格式。",
          temperature: 0.3, // 较低的温度以确保格式化的一致性
          maxTokens: 2048,
        });

        return {
          content: result.trim(),
          metadata: {
            originalLength: text.length,
            formattedLength: result.length,
            options,
          },
        };
      } catch (err: any) {
        const errorMessage = `AI格式化失败: ${err.message}`;
        setError(errorMessage);
        message.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * AI标题生成
   */
  const generateTitleWithAI = useCallback(
    async (content: string, count: number = 3): Promise<string[]> => {
      if (!content.trim()) {
        throw new Error("内容不能为空");
      }

      setLoading(true);
      setError(null);

      try {
        const prompt = `请为以下语料内容生成${count}个适合发音康复训练的标题：

标题要求：
1. 长度控制在5-10个字
2. 要体现发音训练的重点
3. 要体现内容的核心主题
4. 要有专业性和指导性
5. 语言准确规范
6. 适合医学康复训练场景

内容：
${content}

请按以下格式输出，每行一个标题：
1. 标题一
2. 标题二  
3. 标题三`;

        const result = await vivoAigcSDK.chat.chat(prompt, {
          model: "vivo-BlueLM-TB-Pro",
          systemPrompt:
            "你是一个专业的言语康复训练助手，擅长为发音障碍康复训练内容创作专业的标题。",
          temperature: 0.8, // 较高的温度以增加创意性
          maxTokens: 1024,
        });

        // 解析生成的标题
        const titles = result
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => line.replace(/^\d+\.\s*/, "")) // 移除编号
          .filter((title) => title.length > 0 && title.length <= 20);

        if (titles.length === 0) {
          throw new Error("未能生成有效的标题");
        }

        return titles;
      } catch (err: any) {
        const errorMessage = `AI标题生成失败: ${err.message}`;
        setError(errorMessage);
        message.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * AI语料生成 - 优化版本，返回结构化数据并自动分类
   */
  const generateCorpusWithAI = useCallback(
    async (options: AiGenerationOptions): Promise<AiGenerationResult> => {
      if (!options.topic?.trim()) {
        throw new Error("请提供生成主题");
      }

      setLoading(true);
      setError(null);

      try {
        const lengthMap = {
          short: "50-100字",
          medium: "100-200字",
          long: "200-300字",
        };

        const trainingTypeMap = {
          pronunciation: "发音训练材料，注重音素准确性",
          rhythm: "语调节奏训练，注重语音韵律",
          articulation: "构音训练材料，注重口型练习",
          comprehensive: "综合训练材料，全面提升发音能力",
        };

        const prompt = `请根据以下要求生成适合发音障碍康复训练的语料，并返回结构化JSON格式：

主题：${options.topic}
长度：${lengthMap[options.length || "medium"]}
训练类型：${trainingTypeMap[options.trainingType || "comprehensive"]}
难度级别：${options.difficultyLevel || "intermediate"}

内容要求：
1. 每行控制在10-15个字符
2. 语言规范标准，适合发音训练
3. 内容具有专业性和指导性
4. 有利于发音障碍康复训练
5. 适当使用标点符号，便于朗读
6. 段落间空一行

请严格按照以下JSON格式返回，不要添加任何其他文字说明：
{
  "title": "为语料内容生成的标题(5-10个字)",
  "content": "生成的语料内容",
  "category": "自动判断的分类，只能是：prose、ancient-poem、modern-poetry、other中的一个",
  "trainingFocus": "训练重点描述",
  "difficultyLevel": "实际难度级别",
  "wordCount": "实际字数",
  "suggestions": ["使用建议1", "使用建议2", "使用建议3"]
}`;

        const result = await vivoAigcSDK.chat.chat(prompt, {
          model: "vivo-BlueLM-TB-Pro",
          systemPrompt:
            "你是一个专业的言语康复训练助手，擅长创作适合发音障碍康复训练的专业语料。请严格按照JSON格式返回结果，不要添加任何其他内容。",
          temperature: 0.7,
          maxTokens: 1024,
        });

        // 解析JSON结果
        let parsedResult;
        try {
          // 尝试直接解析JSON
          parsedResult = JSON.parse(result.trim());
        } catch (parseError) {
          // 如果解析失败，尝试提取JSON部分
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("AI返回的格式不正确，无法解析JSON");
          }
        }

        // 验证返回的数据结构
        if (!parsedResult.content || !parsedResult.title) {
          throw new Error("AI返回的数据缺少必要字段");
        }

        // 验证分类是否正确
        const validCategories = [
          "prose",
          "ancient-poem",
          "modern-poetry",
          "other",
        ];
        if (!validCategories.includes(parsedResult.category)) {
          parsedResult.category = "other";
        }

        return {
          content: parsedResult.content,
          title: parsedResult.title,
          category: parsedResult.category,
          suggestions: parsedResult.suggestions || [],
          metadata: {
            topic: options.topic,
            length: options.length,
            trainingType: options.trainingType,
            difficultyLevel: options.difficultyLevel,
            trainingFocus: parsedResult.trainingFocus,
            wordCount: parsedResult.wordCount,
            generatedAt: new Date().toISOString(),
          },
        };
      } catch (err: any) {
        const errorMessage = `AI语料生成失败: ${err.message}`;
        setError(errorMessage);
        message.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * AI内容质量检查
   */
  const checkContentQuality = useCallback(
    async (
      content: string,
    ): Promise<{
      score: number;
      level: "easy" | "medium" | "hard";
      suggestions: string[];
    }> => {
      if (!content.trim()) {
        throw new Error("内容不能为空");
      }

      setLoading(true);
      setError(null);

      try {
        const prompt = `请分析以下发音康复训练语料的质量，并给出改进建议：

内容：
${content}

请从以下几个方面进行评估：
1. 发音训练适用性（是否适合发音障碍康复）
2. 语言规范性（是否标准普通话）
3. 训练价值（是否有利于康复训练）
4. 格式规范性（是否便于朗读练习）
5. 专业性（是否符合康复医学要求）

请按以下格式输出（严格按照格式）：
难度级别：easy/medium/hard
评分：0-100分
建议：
- 建议1
- 建议2
- 建议3`;

        const result = await vivoAigcSDK.chat.chat(prompt, {
          model: "vivo-BlueLM-TB-Pro",
          systemPrompt:
            "你是一个专业的言语康复训练质量评估专家，能够客观评估康复训练语料质量并给出改进建议。",
          temperature: 0.2, // 低温度确保评估的客观性
          maxTokens: 1024,
        });

        // 解析结果
        const lines = result
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);

        let level: "easy" | "medium" | "hard" = "medium";
        let score = 70;
        const suggestions: string[] = [];

        for (const line of lines) {
          if (line.startsWith("难度级别：")) {
            const levelStr = line.replace("难度级别：", "").trim();
            if (["easy", "medium", "hard"].includes(levelStr)) {
              level = levelStr as "easy" | "medium" | "hard";
            }
          } else if (line.startsWith("评分：")) {
            const scoreStr = line
              .replace("评分：", "")
              .replace("分", "")
              .trim();
            const parsedScore = parseInt(scoreStr);
            if (!isNaN(parsedScore)) {
              score = Math.max(0, Math.min(100, parsedScore));
            }
          } else if (line.startsWith("- ")) {
            suggestions.push(line.replace("- ", "").trim());
          }
        }

        return { score, level, suggestions };
      } catch (err: any) {
        const errorMessage = `内容质量检查失败: ${err.message}`;
        setError(errorMessage);
        message.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    formatTextWithAI,
    generateTitleWithAI,
    generateCorpusWithAI,
    checkContentQuality,
  };
};
