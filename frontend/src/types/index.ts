// 类型定义

export interface Location {
  longitude: number
  latitude: number
}

export interface Attraction {
  name: string
  address: string
  location: Location
  visit_duration: number
  description: string
  category?: string
  rating?: number
  image_url?: string
  ticket_price?: number
  recommended_time?: string      // 推荐游览时段
  notes?: string                 // 攻略避坑提示
  source_guide_index?: number    // 来源攻略索引
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  address?: string
  location?: Location
  description?: string
  estimated_cost?: number
}

export interface Hotel {
  name: string
  address: string
  location?: Location
  price_range: string
  rating: string
  distance: string
  type: string
  estimated_cost?: number
}


// 跨城交通信息
export interface InterCityTransport {
  from_city: string
  to_city: string
  mode: string          // 高铁/飞机/自驾/大巴/动车
  duration: string      // 例如 "约4.5小时"
  estimated_cost: number
  description: string
}


export interface Budget {
  total_attractions: number
  total_hotels: number
  total_meals: number
  total_transportation: number
  total_inter_city_transport: number
  total: number
}

export interface DayPlan {
  date: string
  day_index: number
  city: string         // 当天所在城市
  description: string
  transportation: string
  accommodation: string
  hotel?: Hotel
  attractions: Attraction[]
  meals: Meal[]
}

export interface WeatherInfo {
  date: string
  day_weather: string
  night_weather: string
  day_temp: number
  night_temp: number
  wind_direction: string
  wind_power: string
}

export interface TripPlan {
  departure_city: string
  cities: string[]
  start_date: string
  end_date: string
  days: DayPlan[]
  weather_info: WeatherInfo[]
  overall_suggestions: string
  budget?: Budget
  inter_city_transport: InterCityTransport[]
}

export interface TripFormData {
  departure_city: string
  cities: string[]
  start_date: string
  end_date: string
  travel_days: number
  transportation: string
  accommodation: string
  preferences: string[]
  free_text_input: string
  reference_guides?: string[]     // 参考攻略文本列表
}

export interface TripPlanResponse {
  success: boolean
  message: string
  data?: TripPlan
}

// ============ 攻略提取相关类型 ============

/** 攻略中提取的单景点骨架 */
export interface GuideAttractionSkeleton {
  name: string
  day_index: number
  visit_duration: number
  recommended_time?: string
  notes?: string
  category?: string
  source_guide_index?: number
  selected: boolean               // 用户是否勾选
}

/** 攻略中提取的单日骨架 */
export interface GuideDaySkeleton {
  day_index: number
  city: string
  description: string
  transportation?: string
  accommodation?: string
  attractions: GuideAttractionSkeleton[]
  meal_suggestions: string[]
  estimated_cost: number
}

/** 攻略提取完整结果 */
export interface GuideExtractionResult {
  total_days: number
  cities: string[]
  days: GuideDaySkeleton[]
  overall_tags: string[]
  overall_notes?: string
  source_count: number
}

export interface GuideExtractionRequest {
  guide_texts: string[]
  cities: string[]
  travel_days?: number
}

export interface GuideExtractionResponse {
  success: boolean
  message: string
  data?: GuideExtractionResult
}

/** 骨架确认请求 —— 用户勾选后提交 */
export interface GuideConfirmRequest {
  skeleton: GuideExtractionResult
  trip_params: TripFormData
}

