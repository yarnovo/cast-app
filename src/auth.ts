/** Cast · 双层身份模型
 * - owner_id (cast_owner): 真人账号 · MVP DEV 默认 u01 · 没真登录系统 · 用 setOwner('u_alice') 切真人
 * - active_role_id (cast_active_role): 当前激活的 agent (虚拟角色) · null 时表示当前以真人身份操作
 * - active_persona (cast_active_persona): agent 的 persona_user_id · 平台账号视角 · API 用这个当 user_id
 *
 * 业务模型 (老板 5-8 push):
 *   agent (虚拟角色) 跟真人一样是平台账号 · 能发帖 / 收私信 / 接订单 ·
 *   owner 可"切登录"到自己 agent 账号代操作 · 切了之后 getMe() 返 agent persona_id
 *   一个 owner 可多 agent · agent 间可互发私信
 *
 * localStorage KEY 名保持不变 (cast_owner / cast_active_role / cast_active_persona) 免迁移
 */

const KEY_OWNER = 'cast_owner'
const KEY_ROLE = 'cast_active_role'
const KEY_PERSONA = 'cast_active_persona'

/** 真人账号 ID · MVP 没真登录默认 u01 · setOwner('u_alice') 切其他真人 */
export const getOwner = (): string => localStorage.getItem(KEY_OWNER) || 'u01'

/** 当前激活的 agent (虚拟角色) ID · null 表示真人本人在操作 */
export const getActiveRole = (): string | null => localStorage.getItem(KEY_ROLE)

/** 当前激活 agent 的 persona_user_id · null 表示真人本人在操作 */
export const getActivePersona = (): string | null => localStorage.getItem(KEY_PERSONA)

/** 当前 "我" 的平台 user_id · agent 切了 → persona · 没切 → owner 自己 */
export const getMe = (): string => getActivePersona() || getOwner()

/** 当前身份大类 · UI 给提示用 (例: "返回真人账号" 按钮何时显示) */
export const getActiveLabel = (): 'owner' | 'agent' =>
  getActivePersona() ? 'agent' : 'owner'

/** 切到某 agent · 平台账号视角变 persona */
export function setActiveRole(roleId: string, personaUserId: string) {
  localStorage.setItem(KEY_ROLE, roleId)
  localStorage.setItem(KEY_PERSONA, personaUserId)
}

/** 退回真人账号本人 (清掉 agent 切换状态) */
export function clearActiveRole() {
  localStorage.removeItem(KEY_ROLE)
  localStorage.removeItem(KEY_PERSONA)
}

/** DEV · 切真人账号 · 没真登录系统所以走 localStorage */
export function setOwner(id: string) {
  localStorage.setItem(KEY_OWNER, id)
  location.reload()
}

;(window as unknown as { setOwner: typeof setOwner }).setOwner = setOwner
