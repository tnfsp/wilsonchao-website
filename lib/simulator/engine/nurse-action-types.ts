// ICU 模擬器 — 護理師 AI Action 型別定義

export interface NurseAction {
  type: 'place_order' | 'confirm_order'; // place = 直接開, confirm = 問劑量
  medicationId: string;                  // 對應 medications.ts / labs.ts / transfusions.ts 裡的 id
  dose?: string;                         // place_order 時必填
  frequency?: string;                    // 預設 "Continuous" for drips, "Once" for bolus
}

export interface NurseChatResponse {
  reply: string;          // 護理師的對話文字
  actions: NurseAction[]; // 空陣列 = 純對話
}
