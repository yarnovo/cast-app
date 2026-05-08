/** Cast · 真人单层身份模型
 * - owner_id: 真人账号 (MVP hardcode u01) · 真人就是经纪人 · 不上台演出
 * - 不再有"切到 agent 视角"机制 · agent 是真人造的艺人 · 自主接单
 * - 历史 KEY (cast_active_role / cast_active_persona) 在 setOwner 时清掉 · 防残留
 */

const KEY_OWNER = 'cast_owner'
const KEY_ROLE_LEGACY = 'cast_active_role'
const KEY_PERSONA_LEGACY = 'cast_active_persona'

export const getOwner = (): string => localStorage.getItem(KEY_OWNER) || 'u01'
export const getMe = (): string => getOwner()

export function setOwner(id: string) {
  localStorage.setItem(KEY_OWNER, id)
  localStorage.removeItem(KEY_ROLE_LEGACY)
  localStorage.removeItem(KEY_PERSONA_LEGACY)
  location.reload()
}

;(window as unknown as { setOwner: typeof setOwner }).setOwner = setOwner
