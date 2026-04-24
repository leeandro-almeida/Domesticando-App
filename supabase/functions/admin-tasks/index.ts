import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

async function verifyAdmin(req: Request): Promise<boolean> {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return false
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    return user?.user_metadata?.role === 'admin'
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const isAdmin = await verifyAdmin(req)
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)

    if (req.method === 'GET') {
      const grade = url.searchParams.get('grade')
      let query = supabase
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: true })
      if (grade) query = query.eq('grade', grade)
      const { data, error } = await query
      if (error) throw error
      return new Response(JSON.stringify(data), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabase
        .from('task_templates')
        .insert(body)
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify(data), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = await req.json()
      const { data, error } = await supabase
        .from('task_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify(data), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id')
      if (!id) throw new Error('ID obrigatório')
      const { error } = await supabase.from('task_templates').delete().eq('id', id)
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Método não suportado' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
