"""攻略解析服务 - 从自由文本中提取结构化行程骨架

架构设计（方案A前置预留）：
- 本模块只接收纯文本输入 → 输出结构化骨架
- 后续加URL功能时，只需新增「URL→正文文本」转换层，解析逻辑100%复用
- 不依赖任何特定平台（小红书/马蜂窝等），通用文本提取
"""

import json
import re
import logging
from typing import Optional, List, Tuple

from hello_agents import SimpleAgent

from ..models.schemas import (
    GuideExtractionRequest,
    GuideExtractionResult,
    GuideDaySkeleton,
    GuideAttractionSkeleton,
)
from ..services.llm_service import get_llm

logger = logging.getLogger(__name__)

# ============================================================
# 文本预处理
# ============================================================

# 广告话术关键词（模糊匹配）
AD_KEYWORDS = [
    "关注我", "点赞收藏", "私信", "加微信", "报名", "跟团", "定制游",
    "点击链接", "下载APP", "扫码", "公众号", "小红书号", "抖音号",
    "店铺", "购买", "下单", "优惠券", "限时折扣", "超值套餐",
]

# 纯干扰符号（保留有意义的标点和换行）
NOISE_PATTERNS = [
    re.compile(r"@{1,2}\S+"),           # @账号名
    re.compile(r"#\S+#"),               # #话题标签#（无空格纯标签）
    re.compile(r"[\U0001F300-\U0001FAFF]+"),  # emoji 范围
    re.compile(r"[☀-➿]+"),    # 杂项符号（含部分emoji）
    re.compile(r"[︀-﻿]+"),    # 变体选择器
    re.compile(r"[‍]+"),           # 零宽连接符（emoji组合用）
    re.compile(r"！{2,}"),              # 连续感叹号（水印特征）
]


def clean_guide_text(text: str) -> str:
    """清洗攻略文本：移除广告、emoji、水印、无效格式

    Args:
        text: 原始攻略文本

    Returns:
        清洗后的纯文本
    """
    if not text or len(text.strip()) < 20:
        return text

    # 1. 移除广告行（包含广告关键词的整行）
    lines = text.split("\n")
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        # 跳过纯符号行、过短行
        if len(stripped) < 3:
            clean_lines.append("")
            continue
        # 跳过广告行
        if any(kw in stripped for kw in AD_KEYWORDS):
            continue
        clean_lines.append(line)

    text = "\n".join(clean_lines)

    # 2. 移除噪音符号
    for pattern in NOISE_PATTERNS:
        text = pattern.sub("", text)

    # 3. 压缩连续空行（最多保留1个连续空行）
    text = re.sub(r"\n{3,}", "\n\n", text)

    # 4. 清理行首行尾空白
    text = text.strip()

    return text


def truncate_long_text(text: str, max_chars: int = 3000) -> str:
    """长文截断：超过 max_chars 的文本截取前 max_chars 字符

    注意：此方法做简单截断。对于极长攻略（>8000字），
    调用方应先走 LLM「摘要」流程再传入，避免 token 爆炸。

    Args:
        text: 待截断文本
        max_chars: 最大字符数

    Returns:
        截断后的文本
    """
    if len(text) <= max_chars:
        return text
    # 在最近的句子边界截断
    cut_point = text.rfind("。", 0, max_chars)
    if cut_point == -1:
        cut_point = text.rfind("\n", 0, max_chars)
    if cut_point == -1 or cut_point < max_chars // 2:
        cut_point = max_chars
    return text[:cut_point] + "…（因内容较长，已截断）"


def should_summarize_first(texts: List[str], max_total_chars: int = 5000) -> bool:
    """判断是否需要先LLM摘要再提取"""
    total = sum(len(t) for t in texts)
    return total > max_total_chars


# ============================================================
# Few-shot 提取 Prompt（核心）
# ============================================================

GUIDE_EXTRACTION_SYSTEM_PROMPT = """你是一个专业的旅行攻略结构化提取助手。你的任务是从用户提供的旅行攻略文本中，提取出标准化的行程骨架数据。

## 提取规则

1. **景点识别**: 每天提取 2-4 个核心景点，忽略途中经过的次要地点
2. **时间分配**: 如果攻略提到了游览时长，直接采用；如果没提，根据景点知名度合理估算（博物馆3h、公园1-2h、商圈2h）
3. **时段建议**: 如果攻略提到了"建议早上去"、"傍晚看日落"等，记录到 recommended_time
4. **避坑提示**: 如果攻略有"注意xxx"、"不要xxx"、"xxx坑"等，记录到 notes
5. **多攻略融合**:
   - 同一个景点在多篇攻略中出现 → 只保留一条，频次越高越优先
   - 不同攻略的互补信息合并到同一天的同一景点 notes 中
   - 景点按出现频次排序（高频优先）
6. **餐饮推荐**: 按天分组，汇总每篇攻略中提到的餐厅/小吃
7. **标签提取**: 从攻略语气和内容中提取标签，如"网红打卡"、"亲子"、"穷游"、"深度文化"、"美食之旅"
8. **坐标处理**: 如果攻略没提具体坐标，填默认值 {"longitude": 0, "latitude": 0}，后续由地图搜索补全

## 输出格式

必须严格返回以下JSON结构，不要输出任何其他内容：

```json
{
  "total_days": 3,
  "cities": ["北京"],
  "days": [
    {
      "day_index": 0,
      "city": "北京",
      "description": "第1天：故宫+景山+南锣鼓巷，经典中轴线",
      "transportation": "地铁+步行",
      "accommodation": "建议住南锣鼓巷/鼓楼附近",
      "attractions": [
        {
          "name": "故宫博物院",
          "day_index": 0,
          "visit_duration": 180,
          "recommended_time": "上午",
          "notes": "周一闭馆！提前7天预约，珍宝馆值得加钱",
          "category": "历史文化",
          "source_guide_index": 0,
          "selected": true
        }
      ],
      "meal_suggestions": ["早餐：护国寺小吃（豌豆黄、豆汁）", "午餐：故宫内餐厅或自带干粮"],
      "estimated_cost": 200
    }
  ],
  "overall_tags": ["历史文化", "网红打卡"],
  "overall_notes": "整体建议：北京景点间距大，地铁是最佳选择",
  "source_count": 2
}
```

## Few-shot 示例

以下是完整示例，请参照此格式提取：

**输入攻略文本：**
```
北京3天2晚超详细攻略！Day1：上午天安门广场看升旗（免费，要早起！4点半到）→故宫（门票60，至少逛3h，珍宝馆必去）→ 中午出来去景山公园（门票2元，爬到万春亭拍故宫全景超绝）→ 下午去南锣鼓巷逛逛吃吃。晚上住鼓楼附近。Day2：早上颐和园（门票30，太大了逛半天）→下午圆明园（挨着的，西洋楼遗址要去）→晚上三里屯吃饭。Day3：八达岭长城（在德胜门坐877路，别被黑车骗了！门票40）→回来早的话去798艺术区拍照。美食推荐：四季民福烤鸭、姚记炒肝、方砖厂69号炸酱面。
```

**输出JSON：**
```json
{
  "total_days": 3,
  "cities": ["北京"],
  "days": [
    {
      "day_index": 0,
      "city": "北京",
      "description": "天安门→故宫→景山→南锣鼓巷，中轴线经典路线",
      "transportation": "地铁+步行",
      "accommodation": "鼓楼/南锣鼓巷附近",
      "attractions": [
        {
          "name": "天安门广场",
          "day_index": 0,
          "visit_duration": 60,
          "recommended_time": "清晨",
          "notes": "看升旗需4:30前到达",
          "category": "历史文化",
          "source_guide_index": 0,
          "selected": true
        },
        {
          "name": "故宫博物院",
          "day_index": 0,
          "visit_duration": 180,
          "recommended_time": "上午",
          "notes": "门票60元，珍宝馆必去",
          "category": "历史文化",
          "source_guide_index": 0,
          "selected": true
        },
        {
          "name": "景山公园",
          "day_index": 0,
          "visit_duration": 60,
          "recommended_time": "中午",
          "notes": "门票2元，万春亭拍故宫全景绝佳",
          "category": "自然风光",
          "source_guide_index": 0,
          "selected": true
        },
        {
          "name": "南锣鼓巷",
          "day_index": 0,
          "visit_duration": 120,
          "recommended_time": "下午",
          "notes": "逛吃逛吃，老北京胡同文化",
          "category": "休闲",
          "source_guide_index": 0,
          "selected": true
        }
      ],
      "meal_suggestions": ["晚餐：姚记炒肝、方砖厂69号炸酱面"],
      "estimated_cost": 180
    },
    {
      "day_index": 1,
      "city": "北京",
      "description": "颐和园→圆明园→三里屯，皇家园林+现代夜生活",
      "transportation": "地铁+公交",
      "accommodation": "鼓楼/南锣鼓巷附近",
      "attractions": [
        {
          "name": "颐和园",
          "day_index": 1,
          "visit_duration": 240,
          "recommended_time": "上午",
          "notes": "门票30元，园区很大至少半天",
          "category": "历史文化",
          "source_guide_index": 0,
          "selected": true
        },
        {
          "name": "圆明园",
          "day_index": 1,
          "visit_duration": 150,
          "recommended_time": "下午",
          "notes": "与颐和园挨着，西洋楼遗址必去",
          "category": "历史文化",
          "source_guide_index": 0,
          "selected": true
        },
        {
          "name": "三里屯",
          "day_index": 1,
          "visit_duration": 120,
          "recommended_time": "晚上",
          "notes": "北京最潮商圈，适合晚餐+逛街",
          "category": "购物",
          "source_guide_index": 0,
          "selected": true
        }
      ],
      "meal_suggestions": ["午餐：颐和园附近", "晚餐：三里屯（四季民福烤鸭）"],
      "estimated_cost": 230
    },
    {
      "day_index": 2,
      "city": "北京",
      "description": "八达岭长城→798艺术区，登长城+文艺收尾",
      "transportation": "公交+地铁",
      "accommodation": "返程或续住鼓楼",
      "attractions": [
        {
          "name": "八达岭长城",
          "day_index": 2,
          "visit_duration": 300,
          "recommended_time": "上午",
          "notes": "德胜门坐877路直达，别信路边黑车！门票40元",
          "category": "历史文化",
          "source_guide_index": 0,
          "selected": true
        },
        {
          "name": "798艺术区",
          "day_index": 2,
          "visit_duration": 150,
          "recommended_time": "下午",
          "notes": "从长城回来早的话去，适合拍照",
          "category": "艺术",
          "source_guide_index": 0,
          "selected": true
        }
      ],
      "meal_suggestions": ["午餐：长城脚下农家院或自带干粮"],
      "estimated_cost": 120
    }
  ],
  "overall_tags": ["历史文化", "网红打卡", "经典路线"],
  "overall_notes": "北京景点间距大，地铁优先。故宫/长城旺季需提前预约。",
  "source_count": 1
}
```

请严格按照以上格式从用户提供的攻略文本中提取信息。只输出JSON，不要任何解释文字。"""


# ============================================================
# 格式校验 + 自动重试
# ============================================================

def _validate_skeleton_structure(data: dict) -> Tuple[bool, str]:
    """校验提取结果的 JSON 结构是否合法

    Returns:
        (是否合法, 错误描述)
    """
    required_top = ["total_days", "days"]
    for key in required_top:
        if key not in data:
            return False, f"缺少顶级字段: {key}"

    if not isinstance(data["days"], list) or len(data["days"]) == 0:
        return False, "days 字段为空或不是列表"

    for day in data["days"]:
        if "day_index" not in day:
            return False, "某天缺少 day_index 字段"
        if "attractions" not in day or not isinstance(day["attractions"], list):
            return False, f"第{day.get('day_index', '?')}天缺少 attractions 列表"

        for attr in day["attractions"]:
            if "name" not in attr or not attr["name"]:
                return False, f"第{day.get('day_index', '?')}天的某个景点缺少 name"

    # 校验天数一致性
    if data["total_days"] != len(data["days"]):
        logger.warning(
            f"total_days({data['total_days']}) 与 days 数量({len(data['days'])}) 不一致，以 days 为准"
        )

    return True, ""


def _parse_json_from_response(response: str) -> dict:
    """从LLM响应中提取JSON对象（容错处理）"""
    # 尝试多种JSON提取策略
    strategies = [
        # 策略1: 标准代码块
        (lambda s: (
            s.find("```json"),
            s.find("```", s.find("```json") + 7)
        ), "json代码块"),
        # 策略2: 任意代码块
        (lambda s: (
            s.find("```"),
            s.find("```", s.find("```") + 3)
        ), "通用代码块"),
        # 策略3: 直接花括号匹配
        (lambda s: (s.find("{"), s.rfind("}") + 1), "花括号匹配"),
    ]

    for strategy_fn, strategy_name in strategies:
        try:
            start, end = strategy_fn(response)
            if start != -1 and end > start:
                json_str = response[start:end].strip()
                # 去掉 ```json 和 ``` 标记
                json_str = json_str.replace("```json", "").replace("```", "").strip()
                data = json.loads(json_str)
                if "days" in data:
                    logger.info(f"JSON解析成功（策略: {strategy_name}）")
                    return data
        except (json.JSONDecodeError, ValueError) as e:
            logger.debug(f"策略 {strategy_name} 失败: {e}")
            continue

    raise ValueError("无法从响应中提取有效的JSON数据")


# ============================================================
# 核心解析服务类
# ============================================================

class GuideParserService:
    """攻略解析服务

    对外接口：只接收纯文本 → 返回结构化 GuideExtractionResult
    后续加 URL 输入时，只需在调用方新增「URL→文本」转换，解析逻辑不变。

    使用方式:
        service = GuideParserService()
        result = service.extract(GuideExtractionRequest(
            guide_texts=["攻略1文本", "攻略2文本"],
            cities=["北京"],
        ))
    """

    MAX_RETRIES = 2  # 解析失败最多重试2次

    def __init__(self):
        self.llm = get_llm()
        # 创建专用SimpleAgent（不带工具，只做文本解析）
        self._agent = SimpleAgent(
            name="攻略解析助手",
            llm=self.llm,
            system_prompt=GUIDE_EXTRACTION_SYSTEM_PROMPT,
        )

    def extract(self, request: GuideExtractionRequest) -> GuideExtractionResult:
        """主入口：从攻略文本提取行程骨架

        Args:
            request: 包含攻略文本列表和辅助信息

        Returns:
            GuideExtractionResult 结构化骨架

        Raises:
            ValueError: 解析失败（已重试后仍失败）
        """
        # 1. 预处理：清洗每篇攻略
        cleaned_texts = []
        for i, text in enumerate(request.guide_texts):
            cleaned = clean_guide_text(text)
            if cleaned:
                cleaned_texts.append(cleaned)
                logger.info(f"攻略[{i}] 清洗完成: {len(text)} → {len(cleaned)} 字符")
            else:
                logger.warning(f"攻略[{i}] 清洗后为空，跳过")

        if not cleaned_texts:
            raise ValueError("所有攻略文本清洗后均为空，请检查输入内容")

        # 2. 长文处理
        if should_summarize_first(cleaned_texts):
            logger.info("攻略总长度超过阈值，先摘要再提取")
            cleaned_texts = self._summarize_guides(cleaned_texts)

        # 3. 合并多篇攻略文本（带索引标记）
        merged_text = self._merge_guides_with_index(cleaned_texts)

        # 4. 构建Prompt
        cities_str = "、".join(request.cities) if request.cities else "未知"
        days_hint = f"，预计{cities_str}{request.travel_days}天" if request.travel_days else ""
        user_prompt = f"请从以下攻略文本中提取结构化行程信息{days_hint}：\n\n{merged_text}"

        # 5. LLM提取（带重试）
        last_error = None
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                logger.info(f"LLM提取尝试 {attempt + 1}/{self.MAX_RETRIES + 1}")
                response = self._agent.run(user_prompt)

                # 解析JSON
                data = _parse_json_from_response(response)

                # 校验结构
                valid, error_msg = _validate_skeleton_structure(data)
                if not valid:
                    if attempt < self.MAX_RETRIES:
                        logger.warning(f"格式校验失败: {error_msg}，重试中...")
                        user_prompt = (
                            f"上次输出的JSON格式有问题: {error_msg}\n"
                            f"请修正后重新输出，确保字段完整且符合格式要求。\n\n"
                            f"原始攻略:\n{merged_text}"
                        )
                        continue
                    raise ValueError(f"格式校验多次失败: {error_msg}")

                # 6. 规范化为 Pydantic 模型
                return self._normalize(data)

            except (json.JSONDecodeError, ValueError) as e:
                last_error = e
                if attempt < self.MAX_RETRIES:
                    logger.warning(f"JSON解析失败: {e}，重试中...")
                    user_prompt = (
                        f"上次输出无法解析为JSON。请确保只输出纯JSON，不要任何解释文字。\n\n"
                        f"原始攻略:\n{merged_text}"
                    )
                    continue

        raise ValueError(f"解析失败（已重试{self.MAX_RETRIES}次）: {last_error}")

    def _merge_guides_with_index(self, texts: List[str]) -> str:
        """合并多篇攻略并标注来源索引

        格式:
        攻略来源 #1:
        文本内容...
        ---
        攻略来源 #2:
        文本内容...
        """
        if len(texts) == 1:
            return f"攻略来源 #1:\n{texts[0]}"

        parts = []
        for i, text in enumerate(texts):
            parts.append(f"攻略来源 #{i + 1}:\n{text}")
        return "\n\n---\n\n".join(parts)

    def _summarize_guides(self, texts: List[str]) -> List[str]:
        """对超长攻略先做LLM摘要，再提取

        每篇单独摘要，保留行程核心信息（景点名、时间、餐饮、交通）
        """
        summary_prompt = (
            "你是旅行攻略摘要助手。请将以下旅行攻略文本压缩为行程信息摘要，只保留：\n"
            "1. 每天去了哪些景点（名称+顺序）\n"
            "2. 每个景点的建议游览时长和时段\n"
            "3. 交通方式\n"
            "4. 推荐的餐厅/美食\n"
            "5. 注意事项/避坑提示\n"
            "去掉所有形容词、感叹、广告、无关评论。控制在300字以内。"
        )

        summaries = []
        for i, text in enumerate(texts):
            if len(text) <= 3000:
                summaries.append(text)
                continue
            try:
                logger.info(f"摘要攻略[{i}]：{len(text)}字符 → 压缩中")
                summary_agent = SimpleAgent(
                    name="攻略摘要助手",
                    llm=self.llm,
                    system_prompt=summary_prompt,
                )
                result = summary_agent.run(text[:6000])
                summaries.append(result.strip())
                logger.info(f"攻略[{i}] 摘要完成：{len(result)} 字符")
            except Exception as e:
                logger.error(f"攻略[{i}] 摘要失败: {e}，使用截断版本")
                summaries.append(truncate_long_text(text, 3000))

        return summaries

    def _normalize(self, raw_data: dict) -> GuideExtractionResult:
        """将LLM输出的原始dict规范化为Pydantic模型

        处理：
        - 缺失字段补默认值
        - source_guide_index 从1-based转为0-based
        - selected默认True
        """
        # 修正 source_count
        raw_data.setdefault("source_count", raw_data.get("source_count", 1))

        # 修正天数
        raw_data["total_days"] = len(raw_data.get("days", []))

        # 处理每天
        normalized_days = []
        for day in raw_data.get("days", []):
            normalized_attrs = []
            for attr in day.get("attractions", []):
                # source_guide_index: LLM输出的是1-based，转为0-based
                if attr.get("source_guide_index") is not None:
                    attr["source_guide_index"] = max(0, attr["source_guide_index"] - 1)

                normalized_attrs.append(GuideAttractionSkeleton(
                    name=attr.get("name", "未命名景点"),
                    day_index=day.get("day_index", attr.get("day_index", 0)),
                    visit_duration=attr.get("visit_duration", 120),
                    recommended_time=attr.get("recommended_time"),
                    notes=attr.get("notes"),
                    category=attr.get("category", "景点"),
                    source_guide_index=attr.get("source_guide_index"),
                    selected=True,
                ))

            normalized_days.append(GuideDaySkeleton(
                day_index=day.get("day_index", 0),
                city=day.get("city", ""),
                description=day.get("description", ""),
                transportation=day.get("transportation"),
                accommodation=day.get("accommodation"),
                attractions=normalized_attrs,
                meal_suggestions=day.get("meal_suggestions", []),
                estimated_cost=day.get("estimated_cost", 0),
            ))

        # 按 day_index 排序
        normalized_days.sort(key=lambda d: d.day_index)

        return GuideExtractionResult(
            total_days=len(normalized_days),
            cities=raw_data.get("cities", []),
            days=normalized_days,
            overall_tags=raw_data.get("overall_tags", []),
            overall_notes=raw_data.get("overall_notes"),
            source_count=raw_data.get("source_count", 1),
        )


# ============================================================
# 单例（服务启动时预热）
# ============================================================

_guide_parser_instance: Optional[GuideParserService] = None


def get_guide_parser() -> GuideParserService:
    """获取攻略解析服务单例"""
    global _guide_parser_instance
    if _guide_parser_instance is None:
        _guide_parser_instance = GuideParserService()
    return _guide_parser_instance
