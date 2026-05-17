import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// localStorage fallback when Supabase not configured
const STORAGE_KEY_PREFIX = 'eckapp_'
const stores = {}
function persist(name) {
  try { localStorage.setItem(STORAGE_KEY_PREFIX + name, JSON.stringify([...stores[name].entries()])); } catch (e) {}
}
function getStore(name) {
  if (stores[name]) return stores[name]
  stores[name] = new Map()
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + name)
    if (saved) {
      const entries = JSON.parse(saved)
      entries.forEach(([k, v]) => stores[name].set(k, v))
    }
  } catch (e) {}
  return stores[name]
}

function makeEntity(data, id) {
  const now = new Date().toISOString()
  return { id, ...data, created_date: now, updated_date: now }
}

const handler = {
  get(_, name) {
    if (supabase) {
      return {
        list: async (sort, limit) => {
          let query = supabase.from(name).select('*')
          if (sort) {
            const desc = sort.startsWith('-')
            const field = desc ? sort.slice(1) : sort
            query = query.order(field, { ascending: !desc })
          }
          if (limit) query = query.limit(limit)
          const { data, error } = await query
          if (error) throw error
          return data || []
        },
        get: async (id) => {
          const { data, error } = await supabase.from(name).select('*').eq('id', id).maybeSingle()
          if (error) throw error
          return data
        },
        create: async (data) => {
          const now = new Date().toISOString()
          const { data: result, error } = await supabase
            .from(name)
            .insert({ ...data, created_date: now, updated_date: now })
            .select()
            .single()
          if (error) throw error
          return result
        },
        update: async (id, data) => {
          const { data: result, error } = await supabase
            .from(name)
            .update({ ...data, updated_date: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
          if (error) throw error
          return result
        },
        delete: async (id) => {
          const { error } = await supabase.from(name).delete().eq('id', id)
          if (error) throw error
          return { success: true }
        },
      }
    }

    // Fallback localStorage
    const store = getStore(name)
    return {
      list: async (sort, limit) => {
        let items = [...store.values()]
        if (sort) {
          const desc = sort.startsWith('-')
          const field = desc ? sort.slice(1) : sort
          items.sort((a, b) => {
            const va = a[field] || ''
            const vb = b[field] || ''
            return desc ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb))
          })
        }
        if (limit) items = items.slice(0, limit)
        return items
      },
      get: async (id) => store.get(id) || null,
      create: async (data) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
        const entity = makeEntity(data, id)
        store.set(id, entity)
        persist(name)
        return entity
      },
      update: async (id, data) => {
        const existing = store.get(id)
        if (!existing) return null
        const updated = { ...existing, ...data, updated_date: new Date().toISOString() }
        store.set(id, updated)
        persist(name)
        return updated
      },
      delete: async (id) => { store.delete(id); persist(name); return { success: true } },
    }
  },
}

const db = {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, handler),
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } },
}

globalThis.__B44_DB__ = db

export { db }
export default db
