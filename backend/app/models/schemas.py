"""数据模型定义"""

from typing import List, Optional, Union
from pydantic import BaseModel, Field, field_validator
from datetime import date


# ============ 请求模型 ============

class TripRequest(BaseModel):
    """旅行规划请求"""
    departure_city: str = Field(..., description="出发城市", example="武汉")
    cities: List[str] = Field(..., description="目的地城市列表", example="呼和浩特")
    start_date: str = Field(..., description="开始日期 YYYY-MM-DD", example="2025-06-01")
    end_date: str = Field(..., description="结束日期 YYYY-MM-DD", example="2025-06-03")
    travel_days: int = Field(..., description="旅行天数", ge=1, le=30, example=3)
    transportation: str = Field(..., description="交通方式", example="公共交通")
    accommodation: str = Field(..., description="住宿偏好", example="经济型酒店")
    preferences: List[str] = Field(default=[], description="旅行偏好标签", example=["历史文化", "美食"])
    free_text_input: Optional[str] = Field(default="", description="额外要求", example="希望多安排一些博物馆")
    reference_guides: Optional[List[str]] = Field(default=None, description="参考攻略文本列表（每篇一个字符串）")

    class Config:
        json_schema_extra = {
            "example": {
                "departure_city": "武汉",
                "cities": ["呼和浩特"],
                "start_date": "2025-08-01",
                "end_date": "2025-08-07",
                "travel_days": 7,
                "transportation": "公共交通",
                "accommodation": "经济型酒店",
                "preferences": ["历史文化", "美食"],
                "free_text_input": "希望多安排一些博物馆"
            }
        }


class POISearchRequest(BaseModel):
    """POI搜索请求"""
    keywords: str = Field(..., description="搜索关键词", example="故宫")
    city: str = Field(..., description="城市", example="北京")
    citylimit: bool = Field(default=True, description="是否限制在城市范围内")


class RouteRequest(BaseModel):
    """路线规划请求"""
    origin_address: str = Field(..., description="起点地址", example="北京市朝阳区阜通东大街6号")
    destination_address: str = Field(..., description="终点地址", example="北京市海淀区上地十街10号")
    origin_city: Optional[str] = Field(default=None, description="起点城市")
    destination_city: Optional[str] = Field(default=None, description="终点城市")
    route_type: str = Field(default="walking", description="路线类型: walking/driving/transit")


# ============ 响应模型 ============

class Location(BaseModel):
    """地理位置"""
    longitude: float = Field(..., description="经度")
    latitude: float = Field(..., description="纬度")


class Attraction(BaseModel):
    """景点信息"""
    name: str = Field(..., description="景点名称")
    address: str = Field(..., description="地址")
    location: Location = Field(..., description="经纬度坐标")
    visit_duration: int = Field(..., description="建议游览时间(分钟)")
    description: str = Field(..., description="景点描述")
    category: Optional[str] = Field(default="景点", description="景点类别")
    rating: Optional[float] = Field(default=None, description="评分")
    photos: Optional[List[str]] = Field(default_factory=list, description="景点图片URL列表")
    poi_id: Optional[str] = Field(default="", description="POI ID")
    image_url: Optional[str] = Field(default=None, description="图片URL")
    ticket_price: int = Field(default=0, description="门票价格(元)")
    recommended_time: Optional[str] = Field(default=None, description="推荐游览时段")
    notes: Optional[str] = Field(default=None, description="注意事项（来自攻略的避坑提示）")
    source_guide_index: Optional[int] = Field(default=None, description="来源攻略索引 0-based")


class Meal(BaseModel):
    """餐饮信息"""
    type: str = Field(..., description="餐饮类型: breakfast/lunch/dinner/snack")
    name: str = Field(..., description="餐饮名称")
    address: Optional[str] = Field(default=None, description="地址")
    location: Optional[Location] = Field(default=None, description="经纬度坐标")
    description: Optional[str] = Field(default=None, description="描述")
    estimated_cost: int = Field(default=0, description="预估费用(元)")


class Hotel(BaseModel):
    """酒店信息"""
    name: str = Field(..., description="酒店名称")
    address: str = Field(default="", description="酒店地址")
    location: Optional[Location] = Field(default=None, description="酒店位置")
    price_range: str = Field(default="", description="价格范围")
    rating: str = Field(default="", description="评分")
    distance: str = Field(default="", description="距离景点距离")
    type: str = Field(default="", description="酒店类型")
    estimated_cost: int = Field(default=0, description="预估费用(元/晚)")


class DayPlan(BaseModel):
    """单日行程"""
    date: str = Field(..., description="日期 YYYY-MM-DD")
    day_index: int = Field(..., description="第几天(从0开始)")
    city: str = Field(default="", description="当天所在城市")
    description: str = Field(..., description="当日行程描述")
    transportation: str = Field(..., description="交通方式")
    accommodation: str = Field(..., description="住宿")
    hotel: Optional[Hotel] = Field(default=None, description="推荐酒店")
    attractions: List[Attraction] = Field(default=[], description="景点列表")
    meals: List[Meal] = Field(default=[], description="餐饮列表")


class WeatherInfo(BaseModel):
    """天气信息"""
    date: str = Field(..., description="日期 YYYY-MM-DD")
    day_weather: str = Field(default="", description="白天天气")
    night_weather: str = Field(default="", description="夜间天气")
    day_temp: Union[int, str] = Field(default=0, description="白天温度")
    night_temp: Union[int, str] = Field(default=0, description="夜间温度")
    wind_direction: str = Field(default="", description="风向")
    wind_power: str = Field(default="", description="风力")

    @field_validator('day_temp', 'night_temp', mode='before')
    @classmethod
    def parse_temperature(cls, v):
        """解析温度,移除degC等单位"""
        if isinstance(v, str):
            v = v.replace('degC', '').replace('℃', '').replace('deg', '').strip()
            try:
                return int(v)
            except ValueError:
                return 0
        return v


class InterCityTransport(BaseModel):
    """跨城交通信息"""
    from_city: str = Field(..., description="出发城市")
    to_city: str = Field(..., description="到达城市")
    mode: str = Field(..., description="交通方式: 高铁/飞机/自驾/大巴/动车", example="高铁")
    duration: str = Field(..., description="预计耗时", example="约4.5小时")
    estimated_cost: int = Field(default=0, description="预估费用(元)", example=550)
    description: str = Field(default="", description="补充说明", example="建议乘坐G字头高铁")


class Budget(BaseModel):
    """预算信息"""
    total_attractions: int = Field(default=0, description="景点门票总费用")
    total_hotels: int = Field(default=0, description="酒店总费用")
    total_meals: int = Field(default=0, description="餐饮总费用")
    total_transportation: int = Field(default=0, description="交通总费用")
    total_inter_city_transport: int = Field(default=0, description="跨城交通总费用")
    total: int = Field(default=0, description="总费用")


class TripPlan(BaseModel):
    """旅行计划"""
    departure_city: str = Field(..., description="出发城市")
    cities: List[str] = Field(..., description="目的地城市列表")
    start_date: str = Field(..., description="开始日期")
    end_date: str = Field(..., description="结束日期")
    days: List[DayPlan] = Field(..., description="每日行程")
    weather_info: List[WeatherInfo] = Field(default=[], description="天气信息")
    overall_suggestions: str = Field(..., description="总体建议")
    budget: Optional[Budget] = Field(default=None, description="预算信息")
    inter_city_transport: List[InterCityTransport] = Field(default=[], description="跨城交通方案")


class TripPlanResponse(BaseModel):
    """旅行计划响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(default="", description="消息")
    data: Optional[TripPlan] = Field(default=None, description="旅行计划数据")


class POIInfo(BaseModel):
    """POI信息"""
    id: str = Field(..., description="POI ID")
    name: str = Field(..., description="名称")
    type: str = Field(..., description="类型")
    address: str = Field(..., description="地址")
    location: Location = Field(..., description="经纬度坐标")
    tel: Optional[str] = Field(default=None, description="电话")


class POISearchResponse(BaseModel):
    """POI搜索响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(default="", description="消息")
    data: List[POIInfo] = Field(default=[], description="POI列表")


class RouteInfo(BaseModel):
    """路线信息"""
    distance: float = Field(..., description="距离(米)")
    duration: int = Field(..., description="时间(秒)")
    route_type: str = Field(..., description="路线类型")
    description: str = Field(..., description="路线描述")


class RouteResponse(BaseModel):
    """路线规划响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(default="", description="消息")
    data: Optional[RouteInfo] = Field(default=None, description="路线信息")


class WeatherResponse(BaseModel):
    """天气查询响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(default="", description="消息")
    data: List[WeatherInfo] = Field(default=[], description="天气信息")


# ============ 错误响应 ============

class ErrorResponse(BaseModel):
    """错误响应"""
    success: bool = Field(default=False, description="是否成功")
    message: str = Field(..., description="错误消息")
    error_code: Optional[str] = Field(default=None, description="错误代码")


# ============ 攻略提取模型 ============

class GuideAttractionSkeleton(BaseModel):
    """攻略中提取的景点骨架（精简版，供前端预览确认）"""
    name: str = Field(..., description="景点名称")
    day_index: int = Field(..., description="第几天（从0开始）")
    visit_duration: int = Field(default=120, description="建议游览时间(分钟)")
    recommended_time: Optional[str] = Field(default=None, description="推荐时段")
    notes: Optional[str] = Field(default=None, description="注意事项/避坑提示")
    category: Optional[str] = Field(default="景点", description="景点类别")
    source_guide_index: Optional[int] = Field(default=None, description="来源攻略索引")
    selected: bool = Field(default=True, description="用户是否勾选此景点")


class GuideDaySkeleton(BaseModel):
    """攻略中提取的单日行程骨架"""
    day_index: int = Field(..., description="第几天（从0开始）")
    city: str = Field(default="", description="当天所在城市")
    description: str = Field(default="", description="当日行程概述")
    transportation: Optional[str] = Field(default=None, description="市内交通方式建议")
    accommodation: Optional[str] = Field(default=None, description="住宿区域建议")
    attractions: List[GuideAttractionSkeleton] = Field(default=[], description="当日景点列表")
    meal_suggestions: List[str] = Field(default=[], description="餐饮推荐（自由文本）")
    estimated_cost: int = Field(default=0, description="当日预估花费(元)")


class GuideExtractionResult(BaseModel):
    """攻略提取完整结果（前端骨架预览用）"""
    total_days: int = Field(..., description="攻略中提到的总天数")
    cities: List[str] = Field(default=[], description="涉及的目的地城市")
    days: List[GuideDaySkeleton] = Field(default=[], description="每日行程骨架")
    overall_tags: List[str] = Field(default=[], description="攻略标签")
    overall_notes: Optional[str] = Field(default=None, description="整体注意事项")
    source_count: int = Field(default=1, description="被解析的攻略篇数")


class GuideExtractionRequest(BaseModel):
    """攻略提取请求"""
    guide_texts: List[str] = Field(..., description="攻略文本列表（每篇一个字符串）", min_length=1)
    cities: List[str] = Field(default=[], description="目的地城市（帮助LLM过滤无关内容）")
    travel_days: Optional[int] = Field(default=None, description="已知的旅行天数（帮助校验）")


class GuideExtractionResponse(BaseModel):
    """攻略提取响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(default="", description="消息")
    data: Optional[GuideExtractionResult] = Field(default=None, description="提取结果")


class GuideConfirmRequest(BaseModel):
    """骨架确认请求"""
    skeleton: GuideExtractionResult = Field(..., description="用户确认后的行程骨架")
    trip_params: TripRequest = Field(..., description="原始行程请求参数")
