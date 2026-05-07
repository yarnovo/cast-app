/** Cast · 双层身份模型
 * - owner_id: 真人账号 (MVP hardcode u01)
 * - active_role_id: 当前激活的数字角色 ("我"页面看到的就是这个角色)
 * - active_persona: 角色 xhs_user_id · API 调用时身份
 */

const KEY_OWNER = 'cast_owner'
const KEY_ROLE = 'cast_active_role'
const KEY_PERSONA = 'cast_active_persona'

export const getOwner = (): string => localStorage.getItem(KEY_OWNER) || 'u01'
export const getActiveRole = (): string | null => localStorage.getItem(KEY_ROLE)
export const getActivePersona = (): string | null => localStorage.getItem(KEY_PERSONA)
export const getMe = (): string => getActivePersona() || getOwner()

export function setActiveRole(roleId: string, personaUserId: string) {
  localStorage.setItem(KEY_ROLE, roleId)
  localStorage.setItem(KEY_PERSONA, personaUserId)
}

export function setOwner(id: string) {
  localStorage.setItem(KEY_OWNER, id)
  location.reload()
}

;(window as unknown as { setOwner: typeof setOwner }).setOwner = setOwner
