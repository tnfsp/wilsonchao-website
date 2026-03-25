/**
 * Echo Video Map — Maps pathology states to LITFL ultrasound MP4 paths
 *
 * Source: LITFL (Life in the Fast Lane) | Dr James Rippey
 * License: CC-BY-NC-SA 4.0
 */

import type { POCUSViewType } from "@/lib/simulator/types";

interface EchoVideoEntry {
  path: string;
  description: string;
  litflCase?: string;
}

type EchoVideoMap = Partial<Record<POCUSViewType, EchoVideoEntry>>;

const echoVideos: Record<string, EchoVideoMap> = {
  cardiac_tamponade: {
    a4c: {
      path: "/assets/echo/cardiac-tamponade/a4c.mp4",
      description: "Pericardial effusion with RA/RV diastolic collapse",
      litflCase: "Case 005",
    },
    subcostal: {
      path: "/assets/echo/cardiac-tamponade/subcostal.mp4",
      description: "Subcostal view — pericardial effusion",
      litflCase: "Case 005",
    },
    ivc: {
      path: "/assets/echo/cardiac-tamponade/ivc.mp4",
      description: "Distended IVC, no respiratory variation",
      litflCase: "Case 005",
    },
    plax: {
      path: "/assets/echo/cardiac-tamponade/plax.mp4",
      description: "PLAX — pericardial effusion, RV collapse",
      litflCase: "Case 005",
    },
    psax: {
      path: "/assets/echo/cardiac-tamponade/psax.mp4",
      description: "PSAX — circumferential effusion",
      litflCase: "Case 005",
    },
  },
  pericardial_effusion: {
    a4c: {
      path: "/assets/echo/pericardial-effusion/a4c.mp4",
      description: "Large pericardial effusion, echogenic",
      litflCase: "Case 006",
    },
  },
  hypovolemia: {
    ivc: {
      path: "/assets/echo/hypovolemia/ivc-long.mp4",
      description: "Flat IVC with complete inspiratory collapse",
      litflCase: "Case 015",
    },
  },
  rv_dilation: {
    psax: {
      path: "/assets/echo/rv-dilation/psax-d-sign.mp4",
      description: "D-shaped septum — RV pressure/volume overload",
      litflCase: "Case 079",
    },
    a4c: {
      path: "/assets/echo/rv-dilation/a4c-mcconnell.mp4",
      description: "McConnell's sign — RV free wall akinesis, apical sparing",
      litflCase: "Case 079",
    },
  },
  takotsubo: {
    plax: {
      path: "/assets/echo/takotsubo/plax.mp4",
      description: "Apical ballooning, basal hyperkinesis",
      litflCase: "Case 091",
    },
    psax: {
      path: "/assets/echo/takotsubo/psax-1.mp4",
      description: "PSAX — regional wall motion abnormality",
      litflCase: "Case 091",
    },
    a4c: {
      path: "/assets/echo/takotsubo/a4c.mp4",
      description: "A4C — apical akinesis",
      litflCase: "Case 091",
    },
  },
  low_ef: {
    // Reuse takotsubo as closest available match for severe LV dysfunction
    plax: {
      path: "/assets/echo/takotsubo/plax.mp4",
      description: "Severely reduced LV function (proxy: takotsubo)",
      litflCase: "Case 091",
    },
    a4c: {
      path: "/assets/echo/takotsubo/a4c.mp4",
      description: "Dilated LV, global hypokinesis (proxy: takotsubo)",
      litflCase: "Case 091",
    },
  },
  pulmonary_edema: {
    lung: {
      path: "/assets/echo/lung-b-lines/b-lines.mp4",
      description: "Multiple B-lines — pulmonary oedema",
    },
  },
  pulmonary_edema_severe: {
    lung: {
      path: "/assets/echo/lung-b-lines/confluent-b-lines.mp4",
      description: "Confluent B-lines — severe pulmonary oedema",
    },
  },
  pneumothorax: {
    lung: {
      path: "/assets/echo/lung-pneumothorax/absent-sliding.mp4",
      description: "Absent lung sliding — pneumothorax",
    },
  },
};

/**
 * Get the echo video path for a given pathology and POCUS view.
 * Returns null if no video is available for this combination.
 */
export function getEchoVideo(
  pathology: string,
  view: POCUSViewType
): EchoVideoEntry | null {
  const map = echoVideos[pathology];
  if (!map) return null;
  return map[view] ?? null;
}

/**
 * Get all available views for a pathology.
 */
export function getAvailableViews(
  pathology: string
): { view: POCUSViewType; entry: EchoVideoEntry }[] {
  const map = echoVideos[pathology];
  if (!map) return [];
  return Object.entries(map).map(([view, entry]) => ({
    view: view as POCUSViewType,
    entry: entry as EchoVideoEntry,
  }));
}

export const ECHO_ATTRIBUTION = {
  source: "LITFL (Life in the Fast Lane)",
  author: "Dr James Rippey",
  license: "CC-BY-NC-SA 4.0",
  url: "https://litfl.com",
};
