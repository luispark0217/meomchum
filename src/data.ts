// 배달 1회 기준 추정치. 치킨은 후라이드 한 마리(약 1kg, 약 2,250kcal) 기준.
export type FoodKey = '치킨' | '피자' | '떡볶이' | '마라탕' | '족발' | '디저트'

export type Food = {
  key: FoodKey
  menu: string
  kcal: number
  price: number // 메뉴 가격
  tip: number // 배달팁
  tint: string // 메뉴 타일 색
}

export const FOODS: Food[] = [
  { key: '치킨', menu: '후라이드 치킨 한 마리', kcal: 2250, price: 23000, tip: 3000, tint: '#E9B872' },
  { key: '피자', menu: '콤비네이션 피자 L', kcal: 1800, price: 24000, tip: 3000, tint: '#E38B5B' },
  { key: '떡볶이', menu: '떡볶이 + 튀김 세트', kcal: 1200, price: 14000, tip: 3000, tint: '#D9634C' },
  { key: '마라탕', menu: '마라탕 2단계 + 꿔바로우', kcal: 1500, price: 19000, tip: 3000, tint: '#C8503A' },
  { key: '족발', menu: '족발 중 + 막국수', kcal: 1900, price: 33000, tip: 3000, tint: '#9C6B4E' },
  { key: '디저트', menu: '조각 케이크 2 + 라떼', kcal: 900, price: 12000, tip: 2000, tint: '#D7A6B3' },
]

export const food = (k: FoodKey) => FOODS.find((f) => f.key === k)!
export const total = (f: Food) => f.price + f.tip

export const KCAL_PER_KG = 7700
export const toKg = (kcal: number) => kcal / KCAL_PER_KG

export const PLUS_PRICE = 9900

// 참았을 때 받는 보상 (브랜드가 비용을 내는 구조 · 프로토타입 예시)
export const REWARDS = [
  { item: '그릭요거트 1개', brand: '제휴 브랜드 A', note: '내일 아침 편의점에서' },
  { item: '단백질 바 1개', brand: '제휴 브랜드 B', note: '출근길 편의점에서' },
  { item: '제로 탄산 1캔', brand: '제휴 브랜드 C', note: '내일 오후 입가심으로' },
]

export const TARGETS = ['야식', '배달', '단 음식', '폭식'] as const
export type Target = (typeof TARGETS)[number]

export const PLEDGES = ['물 한 잔 마시고 양치하기', '10분만 미루기', '샤워하고 바로 눕기', '산책 10분 다녀오기']

export const WHY = ['배고픔', '심심함', '피곤함', '스트레스'] as const
export const WHERE = ['입', '배', '머리', '가슴(답답함)'] as const

export const won = (n: number) => n.toLocaleString('ko-KR') + '원'
export const num = (n: number) => n.toLocaleString('ko-KR')

// 받침에 따라 조사 고르기: josa('치킨','이','가') → 치킨이
export const josa = (w: string, a: string, b: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00
  return w + (c >= 0 && c <= 11171 && c % 28 ? a : b)
}
