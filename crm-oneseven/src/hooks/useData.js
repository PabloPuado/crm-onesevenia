import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Generic hook factory - always re-fetches after mutations to avoid RLS select issues
function makeHook(table, selectQuery = '*', orderCol = 'created_at') {
  return function useTable(filterId = null, filterCol = null) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
      setLoading(true)
      let q = supabase.from(table).select(selectQuery).order(orderCol, { ascending: false })
      if (filterId && filterCol) q = q.eq(filterCol, filterId)
      const { data, error } = await q
      if (!error) setRows(data || [])
      setLoading(false)
    }, [filterId])

    useEffect(() => { fetch() }, [fetch])

    const crear = async (payload) => {
      const { error } = await supabase.from(table).insert([sanitize(payload)])
      if (error) return { error }
      await fetch() // always re-fetch
      return { error: null }
    }

    const actualizar = async (id, updates) => {
      const { error } = await supabase.from(table).update(sanitize(updates)).eq('id', id)
      if (error) return { error }
      await fetch()
      return { error: null }
    }

    const eliminar = async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) return { error }
      await fetch()
      return { error: null }
    }

    return { rows, loading, fetch, crear, actualizar, eliminar }
  }
}


// Sanitize payload — converts empty strings to null to prevent Supabase uuid/type errors
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' || v === undefined ? null : v])
  )
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('clientes').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const actualizar = async (id, updates) => {
    const { error } = await supabase.from('clientes').update(sanitize(updates)).eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { clientes, loading, fetch, crear, actualizar, eliminar }
}

// ─── Tareas ───────────────────────────────────────────────────────────────────
export function useTareas(clienteId = null) {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('tareas').select('*, clientes(nombre, empresa)').order('fecha_vencimiento', { ascending: true })
    if (clienteId) q = q.eq('cliente_id', clienteId)
    const { data } = await q
    setTareas(data || [])
    setLoading(false)
  }, [clienteId])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('tareas').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const actualizar = async (id, updates) => {
    const { error } = await supabase.from('tareas').update(sanitize(updates)).eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { tareas, loading, fetch, crear, actualizar, eliminar }
}

// ─── Ingresos ─────────────────────────────────────────────────────────────────
export function useIngresos() {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('ingresos').select('*, clientes(nombre, empresa)').order('fecha', { ascending: false })
    setIngresos(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('ingresos').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const actualizar = async (id, updates) => {
    const { error } = await supabase.from('ingresos').update(sanitize(updates)).eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('ingresos').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { ingresos, loading, fetch, crear, actualizar, eliminar }
}

// ─── Documentos ───────────────────────────────────────────────────────────────
export function useDocumentos() {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('documentos').select('*').order('created_at', { ascending: false })
    setDocumentos(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const subir = async (file, categoria) => {
    const path = `${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('documentos').upload(path, file)
    if (uploadError) return { error: uploadError }
    const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path)
    const { error } = await supabase.from('documentos').insert([{ nombre: file.name, categoria, url: publicUrl, storage_path: path, tamano: file.size }])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id, storagePath) => {
    if (storagePath) await supabase.storage.from('documentos').remove([storagePath])
    const { error } = await supabase.from('documentos').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { documentos, loading, fetch, subir, eliminar }
}

// ─── Actividad ────────────────────────────────────────────────────────────────
export function useActividad(clienteId = null) {
  const [actividad, setActividad] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('actividad').select('*').order('fecha', { ascending: false })
    if (clienteId) q = q.eq('cliente_id', clienteId)
    const { data } = await q
    setActividad(data || [])
    setLoading(false)
  }, [clienteId])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('actividad').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('actividad').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { actividad, loading, fetch, crear, eliminar }
}

// ─── Propuestas ───────────────────────────────────────────────────────────────
export function usePropuestas() {
  const [propuestas, setPropuestas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('propuestas').select('*, clientes(nombre, empresa, email, telefono)').order('created_at', { ascending: false })
    setPropuestas(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('propuestas').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const actualizar = async (id, updates) => {
    const { error } = await supabase.from('propuestas').update(sanitize(updates)).eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('propuestas').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { propuestas, loading, fetch, crear, actualizar, eliminar }
}

// ─── Presupuestos ─────────────────────────────────────────────────────────────
export function usePresupuestos() {
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('presupuestos').select('*, clientes(nombre, empresa, email, telefono)').order('created_at', { ascending: false })
    setPresupuestos(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('presupuestos').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const actualizar = async (id, updates) => {
    const { error } = await supabase.from('presupuestos').update(sanitize(updates)).eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('presupuestos').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { presupuestos, loading, fetch, crear, actualizar, eliminar }
}

// ─── Gastos ───────────────────────────────────────────────────────────────────
export function useGastos() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('gastos').select('*').order('created_at', { ascending: false })
    setGastos(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('gastos').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const actualizar = async (id, updates) => {
    const { error } = await supabase.from('gastos').update(sanitize(updates)).eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { gastos, loading, fetch, crear, actualizar, eliminar }
}

// ─── Empresa Config ───────────────────────────────────────────────────────────
export function useEmpresaConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('empresa_config').select('*').limit(1).maybeSingle()
    setConfig(data || {})
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const guardar = async (updates) => {
    if (config?.id) {
      const { error } = await supabase.from('empresa_config').update(sanitize(updates)).eq('id', config.id)
      if (error) return { error }
    } else {
      const { error } = await supabase.from('empresa_config').insert([sanitize(updates)])
      if (error) return { error }
    }
    await fetch()
    return { error: null }
  }
  return { config, loading, guardar }
}

// ─── Subcontrataciones ────────────────────────────────────────────────────────
export function useSubcontrataciones() {
  const [subcontrataciones, setSubcontrataciones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('subcontrataciones').select('*').order('created_at', { ascending: false })
    setSubcontrataciones(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { fetch() }, [fetch])

  const crear = async (payload) => {
    const { error } = await supabase.from('subcontrataciones').insert([sanitize(payload)])
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const actualizar = async (id, updates) => {
    const { error } = await supabase.from('subcontrataciones').update(sanitize(updates)).eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  const eliminar = async (id) => {
    const { error } = await supabase.from('subcontrataciones').delete().eq('id', id)
    if (error) return { error }
    await fetch()
    return { error: null }
  }
  return { subcontrataciones, loading, fetch, crear, actualizar, eliminar }
}
