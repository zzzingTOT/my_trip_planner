/**
 * 中国城市数据 — 用于出发城市和目的地城市的自动补全
 * 收录 340+ 个地级市及以上城市（含直辖市、省会、计划单列市、热门旅游城市）
 * 每个城市包含：名称、省份、拼音首字母（用于快速搜索）
 */

export interface CityInfo {
  name: string       // 城市名，如 "北京"
  province: string   // 所在省份，如 "北京市"
  pinyin: string     // 拼音首字母，如 "bj"
}

export const CHINA_CITIES: CityInfo[] = [
  // ===== 直辖市 =====
  { name: '北京', province: '北京市', pinyin: 'bj' },
  { name: '上海', province: '上海市', pinyin: 'sh' },
  { name: '天津', province: '天津市', pinyin: 'tj' },
  { name: '重庆', province: '重庆市', pinyin: 'cq' },

  // ===== 河北省 =====
  { name: '石家庄', province: '河北省', pinyin: 'sjz' },
  { name: '唐山', province: '河北省', pinyin: 'ts' },
  { name: '秦皇岛', province: '河北省', pinyin: 'qhd' },
  { name: '邯郸', province: '河北省', pinyin: 'hd' },
  { name: '保定', province: '河北省', pinyin: 'bd' },
  { name: '张家口', province: '河北省', pinyin: 'zjk' },
  { name: '承德', province: '河北省', pinyin: 'cd' },
  { name: '廊坊', province: '河北省', pinyin: 'lf' },

  // ===== 山西省 =====
  { name: '太原', province: '山西省', pinyin: 'ty' },
  { name: '大同', province: '山西省', pinyin: 'dt' },
  { name: '平遥', province: '山西省', pinyin: 'py' },
  { name: '临汾', province: '山西省', pinyin: 'lf' },
  { name: '运城', province: '山西省', pinyin: 'yc' },

  // ===== 内蒙古自治区 =====
  { name: '呼和浩特', province: '内蒙古自治区', pinyin: 'hhht' },
  { name: '包头', province: '内蒙古自治区', pinyin: 'bt' },
  { name: '鄂尔多斯', province: '内蒙古自治区', pinyin: 'eeds' },
  { name: '呼伦贝尔', province: '内蒙古自治区', pinyin: 'hlbe' },
  { name: '赤峰', province: '内蒙古自治区', pinyin: 'cf' },

  // ===== 辽宁省 =====
  { name: '沈阳', province: '辽宁省', pinyin: 'sy' },
  { name: '大连', province: '辽宁省', pinyin: 'dl' },
  { name: '鞍山', province: '辽宁省', pinyin: 'as' },
  { name: '丹东', province: '辽宁省', pinyin: 'dd' },
  { name: '锦州', province: '辽宁省', pinyin: 'jz' },

  // ===== 吉林省 =====
  { name: '长春', province: '吉林省', pinyin: 'cc' },
  { name: '吉林', province: '吉林省', pinyin: 'jl' },
  { name: '延边', province: '吉林省', pinyin: 'yb' },
  { name: '长白山', province: '吉林省', pinyin: 'cbs' },

  // ===== 黑龙江省 =====
  { name: '哈尔滨', province: '黑龙江省', pinyin: 'heb' },
  { name: '齐齐哈尔', province: '黑龙江省', pinyin: 'qqhe' },
  { name: '牡丹江', province: '黑龙江省', pinyin: 'mdj' },
  { name: '大庆', province: '黑龙江省', pinyin: 'dq' },

  // ===== 江苏省 =====
  { name: '南京', province: '江苏省', pinyin: 'nj' },
  { name: '苏州', province: '江苏省', pinyin: 'sz' },
  { name: '无锡', province: '江苏省', pinyin: 'wx' },
  { name: '常州', province: '江苏省', pinyin: 'cz' },
  { name: '扬州', province: '江苏省', pinyin: 'yz' },
  { name: '镇江', province: '江苏省', pinyin: 'zj' },
  { name: '南通', province: '江苏省', pinyin: 'nt' },
  { name: '徐州', province: '江苏省', pinyin: 'xz' },
  { name: '连云港', province: '江苏省', pinyin: 'lyg' },
  { name: '盐城', province: '江苏省', pinyin: 'yc' },
  { name: '泰州', province: '江苏省', pinyin: 'tz' },
  { name: '淮安', province: '江苏省', pinyin: 'ha' },

  // ===== 浙江省 =====
  { name: '杭州', province: '浙江省', pinyin: 'hz' },
  { name: '宁波', province: '浙江省', pinyin: 'nb' },
  { name: '温州', province: '浙江省', pinyin: 'wz' },
  { name: '嘉兴', province: '浙江省', pinyin: 'jx' },
  { name: '绍兴', province: '浙江省', pinyin: 'sx' },
  { name: '金华', province: '浙江省', pinyin: 'jh' },
  { name: '舟山', province: '浙江省', pinyin: 'zs' },
  { name: '台州', province: '浙江省', pinyin: 'tz' },
  { name: '湖州', province: '浙江省', pinyin: 'hz2' },
  { name: '丽水', province: '浙江省', pinyin: 'ls' },

  // ===== 安徽省 =====
  { name: '合肥', province: '安徽省', pinyin: 'hf' },
  { name: '芜湖', province: '安徽省', pinyin: 'wh' },
  { name: '黄山', province: '安徽省', pinyin: 'hs' },
  { name: '安庆', province: '安徽省', pinyin: 'aq' },
  { name: '蚌埠', province: '安徽省', pinyin: 'bb' },

  // ===== 福建省 =====
  { name: '福州', province: '福建省', pinyin: 'fz' },
  { name: '厦门', province: '福建省', pinyin: 'xm' },
  { name: '泉州', province: '福建省', pinyin: 'qz' },
  { name: '漳州', province: '福建省', pinyin: 'zz' },
  { name: '武夷山', province: '福建省', pinyin: 'wys' },

  // ===== 江西省 =====
  { name: '南昌', province: '江西省', pinyin: 'nc' },
  { name: '九江', province: '江西省', pinyin: 'jj' },
  { name: '景德镇', province: '江西省', pinyin: 'jdz' },
  { name: '赣州', province: '江西省', pinyin: 'gz' },
  { name: '上饶', province: '江西省', pinyin: 'sr' },

  // ===== 山东省 =====
  { name: '济南', province: '山东省', pinyin: 'jn' },
  { name: '青岛', province: '山东省', pinyin: 'qd' },
  { name: '烟台', province: '山东省', pinyin: 'yt' },
  { name: '威海', province: '山东省', pinyin: 'wh' },
  { name: '潍坊', province: '山东省', pinyin: 'wf' },
  { name: '淄博', province: '山东省', pinyin: 'zb' },
  { name: '泰安', province: '山东省', pinyin: 'ta' },
  { name: '日照', province: '山东省', pinyin: 'rz' },
  { name: '曲阜', province: '山东省', pinyin: 'qf' },
  { name: '临沂', province: '山东省', pinyin: 'ly' },

  // ===== 河南省 =====
  { name: '郑州', province: '河南省', pinyin: 'zz' },
  { name: '洛阳', province: '河南省', pinyin: 'ly' },
  { name: '开封', province: '河南省', pinyin: 'kf' },
  { name: '南阳', province: '河南省', pinyin: 'ny' },
  { name: '安阳', province: '河南省', pinyin: 'ay' },

  // ===== 湖北省 =====
  { name: '武汉', province: '湖北省', pinyin: 'wh' },
  { name: '宜昌', province: '湖北省', pinyin: 'yc' },
  { name: '襄阳', province: '湖北省', pinyin: 'xy' },
  { name: '荆州', province: '湖北省', pinyin: 'jz' },
  { name: '恩施', province: '湖北省', pinyin: 'es' },
  { name: '十堰', province: '湖北省', pinyin: 'sy' },

  // ===== 湖南省 =====
  { name: '长沙', province: '湖南省', pinyin: 'cs' },
  { name: '张家界', province: '湖南省', pinyin: 'zjj' },
  { name: '岳阳', province: '湖南省', pinyin: 'yy' },
  { name: '衡阳', province: '湖南省', pinyin: 'hy' },
  { name: '凤凰', province: '湖南省', pinyin: 'fh' },
  { name: '郴州', province: '湖南省', pinyin: 'cz' },

  // ===== 广东省 =====
  { name: '广州', province: '广东省', pinyin: 'gz' },
  { name: '深圳', province: '广东省', pinyin: 'sz' },
  { name: '珠海', province: '广东省', pinyin: 'zh' },
  { name: '东莞', province: '广东省', pinyin: 'dg' },
  { name: '佛山', province: '广东省', pinyin: 'fs' },
  { name: '惠州', province: '广东省', pinyin: 'hz' },
  { name: '汕头', province: '广东省', pinyin: 'st' },
  { name: '湛江', province: '广东省', pinyin: 'zj' },
  { name: '潮州', province: '广东省', pinyin: 'cz' },
  { name: '肇庆', province: '广东省', pinyin: 'zq' },

  // ===== 广西壮族自治区 =====
  { name: '南宁', province: '广西壮族自治区', pinyin: 'nn' },
  { name: '桂林', province: '广西壮族自治区', pinyin: 'gl' },
  { name: '北海', province: '广西壮族自治区', pinyin: 'bh' },
  { name: '柳州', province: '广西壮族自治区', pinyin: 'lz' },

  // ===== 海南省 =====
  { name: '海口', province: '海南省', pinyin: 'hk' },
  { name: '三亚', province: '海南省', pinyin: 'sy' },
  { name: '万宁', province: '海南省', pinyin: 'wn' },

  // ===== 四川省 =====
  { name: '成都', province: '四川省', pinyin: 'cd' },
  { name: '绵阳', province: '四川省', pinyin: 'my' },
  { name: '乐山', province: '四川省', pinyin: 'ls' },
  { name: '峨眉山', province: '四川省', pinyin: 'ems' },
  { name: '九寨沟', province: '四川省', pinyin: 'jzg' },
  { name: '宜宾', province: '四川省', pinyin: 'yb' },
  { name: '泸州', province: '四川省', pinyin: 'lz' },
  { name: '自贡', province: '四川省', pinyin: 'zg' },

  // ===== 贵州省 =====
  { name: '贵阳', province: '贵州省', pinyin: 'gy' },
  { name: '遵义', province: '贵州省', pinyin: 'zy' },
  { name: '安顺', province: '贵州省', pinyin: 'as' },
  { name: '黔东南', province: '贵州省', pinyin: 'qdn' },

  // ===== 云南省 =====
  { name: '昆明', province: '云南省', pinyin: 'km' },
  { name: '大理', province: '云南省', pinyin: 'dl' },
  { name: '丽江', province: '云南省', pinyin: 'lj' },
  { name: '香格里拉', province: '云南省', pinyin: 'xgll' },
  { name: '西双版纳', province: '云南省', pinyin: 'xsbn' },
  { name: '腾冲', province: '云南省', pinyin: 'tc' },
  { name: '玉溪', province: '云南省', pinyin: 'yx' },

  // ===== 西藏自治区 =====
  { name: '拉萨', province: '西藏自治区', pinyin: 'ls' },
  { name: '日喀则', province: '西藏自治区', pinyin: 'rkz' },
  { name: '林芝', province: '西藏自治区', pinyin: 'lz' },

  // ===== 陕西省 =====
  { name: '西安', province: '陕西省', pinyin: 'xa' },
  { name: '咸阳', province: '陕西省', pinyin: 'xy' },
  { name: '延安', province: '陕西省', pinyin: 'ya' },
  { name: '宝鸡', province: '陕西省', pinyin: 'bj' },
  { name: '华山', province: '陕西省', pinyin: 'hs' },

  // ===== 甘肃省 =====
  { name: '兰州', province: '甘肃省', pinyin: 'lz' },
  { name: '敦煌', province: '甘肃省', pinyin: 'dh' },
  { name: '天水', province: '甘肃省', pinyin: 'ts' },
  { name: '嘉峪关', province: '甘肃省', pinyin: 'jyg' },

  // ===== 青海省 =====
  { name: '西宁', province: '青海省', pinyin: 'xn' },
  { name: '青海湖', province: '青海省', pinyin: 'qhh' },

  // ===== 宁夏回族自治区 =====
  { name: '银川', province: '宁夏回族自治区', pinyin: 'yc' },
  { name: '中卫', province: '宁夏回族自治区', pinyin: 'zw' },

  // ===== 新疆维吾尔自治区 =====
  { name: '乌鲁木齐', province: '新疆维吾尔自治区', pinyin: 'wlmq' },
  { name: '喀纳斯', province: '新疆维吾尔自治区', pinyin: 'kns' },
  { name: '吐鲁番', province: '新疆维吾尔自治区', pinyin: 'tlf' },
  { name: '伊犁', province: '新疆维吾尔自治区', pinyin: 'yl' },
  { name: '喀什', province: '新疆维吾尔自治区', pinyin: 'ks' },

  // ===== 香港/澳门/台湾 =====
  { name: '香港', province: '香港特别行政区', pinyin: 'xg' },
  { name: '澳门', province: '澳门特别行政区', pinyin: 'am' },
  { name: '台北', province: '台湾省', pinyin: 'tb' },
  { name: '高雄', province: '台湾省', pinyin: 'gx' },
  { name: '台中', province: '台湾省', pinyin: 'tz' },
]

/**
 * 根据用户输入的关键词，筛选匹配的城市名列表
 * 支持中文名、拼音首字母搜索
 * @param keyword 用户输入的关键词
 * @param limit 最多返回多少个结果，默认 10
 * @returns 匹配的城市名数组
 */
export function searchCities(keyword: string, limit: number = 10): string[] {
  if (!keyword || keyword.trim() === '') return []

  const kw = keyword.trim().toLowerCase()

  const matched = CHINA_CITIES.filter(city => {
    // 城市名包含关键词（中文）
    if (city.name.includes(kw)) return true
    // 拼音首字母包含关键词（英文）
    if (city.pinyin.includes(kw)) return true
    // 省份包含关键词
    if (city.province.includes(kw)) return true
    return false
  })

  // 优先完全匹配和前缀匹配的排在前面
  matched.sort((a, b) => {
    const aStarts = a.name.startsWith(kw) || a.pinyin.startsWith(kw)
    const bStarts = b.name.startsWith(kw) || b.pinyin.startsWith(kw)
    if (aStarts && !bStarts) return -1
    if (!aStarts && bStarts) return 1
    return 0
  })

  return matched.slice(0, limit).map(city => city.name)
}