import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const crear = async (cliente) => {
    const { data, error } = await supabase.from('clientes').insert([cliente]).select().single()
    if (!error) setClientes(prev => [data, ...prev])
    return { data, error }
  }

  const actualizar = async (id, updates) => {
    const { data, error } = await supabase.from('clientes').update(updates).eq('id', id).select().single()
    if (!error) setClientes(prev => prev.map(c => c.id === id ? data : c))
    return { data, error }
  }

  const eliminar = async (id) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (!error) setClientes(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { clientes, loading, fetch, crear, actualizar, eliminar }
}

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

  const crear = async (tarea) => {
    const { data, error } = await supabase.from('tareas').insert([tarea]).select('*, clientes(nombre, empresa)').single()
    if (!error) setTareas(prev => [...prev, data])
    return { data, error }
  }

  const actualizar = async (id, updates) => {
    const { data, error } = await supabase.from('tareas').update(updates).eq('id', id).select('*, clientes(nombre, empresa)').single()
    if (!error) setTareas(prev => prev.map(t => t.id === id ? data : t))
    return { data, error }
  }

  const eliminar = async (id) => {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (!error) setTareas(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  return { tareas, loading, fetch, crear, actualizar, eliminar }
}

export function useIngresos() {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ingresos')
      .select('*, clientes(nombre, empresa)')
      .order('fecha', { ascending: false })
    setIngresos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const crear = async (ingreso) => {
    const { data, error } = await supabase.from('ingresos').insert([ingreso]).select('*, clientes(nombre, empresa)').single()
    if (!error) setIngresos(prev => [data, ...prev])
    return { data, error }
  }

  const actualizar = async (id, updates) => {
    const { data, error } = await supabase.from('ingresos').update(updates).eq('id', id).select('*, clientes(nombre, empresa)').single()
    if (!error) setIngresos(prev => prev.map(i => i.id === id ? data : i))
    return { data, error }
  }

  const eliminar = async (id) => {
    const { error } = await supabase.from('ingresos').delete().eq('id', id)
    if (!error) setIngresos(prev => prev.filter(i => i.id !== id))
    return { error }
  }

  return { ingresos, loading, fetch, crear, actualizar, eliminar }
}

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
    const { data, error } = await supabase.from('documentos').insert([{
      nombre: file.name,
      categoria,
      url: publicUrl,
      storage_path: path,
      tamano: file.size,
    }]).select().single()
    if (!error) setDocumentos(prev => [data, ...prev])
    return { data, error }
  }

  const eliminar = async (id, storagePath) => {
    if (storagePath) await supabase.storage.from('documentos').remove([storagePath])
    const { error } = await supabase.from('documentos').delete().eq('id', id)
    if (!error) setDocumentos(prev => prev.filter(d => d.id !== id))
    return { error }
  }

  return { documentos, loading, fetch, subir, eliminar }
}
