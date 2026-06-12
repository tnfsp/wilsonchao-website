/**
 * Shared ACTION_PATTERNS — used by both scoring and hint system
 */

export const ACTION_PATTERNS: Record<string, RegExp> = {
  // ── Sepsis / General scenarios ──
  "act-blood-culture": /order:lab:.*blood.?culture|lab:.*blood.?culture/i,
  "act-antibiotics": /order:medication:.*(?:vancomycin|piptazo|ceftriaxone|pip.*tazo|meropenem|cefepime)/i,
  "act-fluid-resuscitation": /order:fluid:.*(?:ns|lr|normal.?saline|lactated|albumin)|order:transfusion|mtp:activated/i,
  "act-lactate": /order:lab:.*(?:lactate|abg|blood.?gas)/i,
  "act-vasopressor": /order:medication:.*(?:norepinephrine|levophed|epinephrine|vasopressin)/i,
  "act-call-senior": /consult:.*senior|consult:.*vs|call_senior|call_vs|message:.*叫學長|message:.*通知/i,
  "act-wound-culture": /order:lab:.*wound.?culture|order:lab:.*swab/i,
  "act-foley": /order:procedure:.*foley|order:procedure:.*catheter/i,
  "act-central-line": /order:procedure:.*central.?line|order:procedure:.*cvc/i,
  "act-abg": /order:lab:.*abg|order:lab:.*blood.?gas/i,
  "act-check-ct": /pocus:.*|order:imaging:.*cxr|order:lab:.*cbc/i,
  "act-protamine": /order:.*protamine/i,
  "act-txa": /order:.*txa|order:.*tranexamic/i,
  "act-mtp": /mtp:activated/i,
  "act-pericardiocentesis": /order:procedure:.*pericardio/i,
  "act-echo": /pocus:cardiac/i,
  "act-vent-fio2-increase": /vent:.*fio2=/i,
  "act-vent-peep-increase": /vent:.*peep=/i,
  "act-vent-fio2-adjust": /vent:.*fio2=/i,
  "act-vent-peep-adjust": /vent:.*peep=/i,
  "act-vent-maintain": /vent:/i,

  // ── Bleeding-to-Tamponade (Phase 1) ──
  "act-cbc-stat": /order:lab:.*(?:cbc|complete.?blood)/i,
  "act-coag-panel": /order:lab:.*(?:coag|pt.*inr|aptt|fibrinogen)/i,
  "act-type-screen": /order:lab:.*(?:type.*screen|crossmatch|備血|配血)/i,
  "act-volume-resuscitation": /order:fluid:.*(?:ns|lr|normal.?saline|lactated|albumin)|order:transfusion|mtp:activated/i,
  "act-abg-lactate": /order:lab:.*(?:abg|blood.?gas|lactate)/i,

  // ── Bleeding-to-Tamponade (Phase 2) ──
  "act-strip-milk-ct-p2": /procedure:.*(?:chest.?tube.?milk|strip|milk)|milk.*ct/i,
  "act-cardiac-pocus-p2": /pocus:cardiac/i,
  // Phase 2 recall: match recall_senior action 或「再」叫學長
  // Fallback: 若 Phase 1 未叫過學長，Phase 2 首次 call_senior 也算
  "act-recall-senior": /recall_senior|message:.*再.*叫.*學長|message:.*再.*通知.*學長|message:.*學長.*回來|call_senior/i,
  "act-volume-challenge-p2": /order:fluid:.*(?:ns|lr|normal.?saline|lactated|albumin)|order:transfusion/i,
  "act-notify-anesthesia": /message:.*(?:麻醉|anesthesia|anesthesiology|麻科)|order:consult:.*(?:麻醉|anesthesia)/i,
  "act-prepare-sternal-tray": /message:.*(?:開胸包|開胸器械|sternal.*(?:tray|wire.*cutter)|retractor|器械包)|order:procedure:.*(?:sternal.*tray|開胸包)/i,
  "act-prepare-resternotomy": /senior_call_correct_plan|message:.*(?:tamponade|心包填塞|pericardial|resternotomy|re.?sternotomy|開刀房|準備.*手術|送手術|通知.*OR|notify.*OR)|order:procedure:.*resternotomy/i,
  "act-abg-lactate-p2": /order:lab:.*(?:abg|blood.?gas|lactate)/i,
  "act-vent-fio2": /vent:.*fio2=/i,

  // ── Cardiac Tamponade (standalone) ──
  "act-volume-challenge": /order:fluid:.*(?:ns|lr|normal.?saline|lactated|albumin)|order:transfusion/i,
};
